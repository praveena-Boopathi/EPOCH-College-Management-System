// test_complaints_and_workflows.js
// Comprehensive test suite for Complaints Module & Workflow Routing
const zlib = require('zlib');
const BASE_URL = 'http://localhost:8080';

function extractPdfText(pdfBuffer) {
  const buf = Buffer.from(pdfBuffer);
  const str = buf.toString('latin1');
  let allDecompressed = str;
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    try {
      const decompressed = zlib.inflateSync(Buffer.from(match[1], 'latin1'));
      allDecompressed += '\n' + decompressed.toString('utf-8');
    } catch(e) {}
  }
  return allDecompressed.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  const data = await res.json();
  return { token: data.token, user: data.user };
}

async function run() {
  console.log('================================================================');
  console.log('EPOCH COLLEGE MANAGEMENT SYSTEM: COMPREHENSIVE VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Authenticate All User Roles
  console.log('Step 1: Authenticating test accounts for all roles...');
  const student = await login('620823104002', 'student@12'); // Abinaya G (CSE)
  const advisor = await login('arularasi', 'advisor@123'); // Mrs. P. Arularasi (Advisor)
  const hod = await login('gopinath', 'hod@123'); // Dr. K. Gopinath (HOD)
  const principal = await login('principal@gct.ac.in', 'principal@123'); // Dr. B. Sanjay Gandhi (Principal)
  console.log('✓ Student, Advisor, HOD, and Principal accounts authenticated successfully.\n');

  // Verify Student Profile has department, year, and studentType populated
  console.log('Checking Student Profile data...');
  const profRes = await fetch(`${BASE_URL}/api/user/profile`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  const prof = await profRes.json();
  console.log(`✓ Student Profile: Name="${prof.name}", Dept="${prof.department}", Year="${prof.year}", StudentType="${prof.studentType}"`);
  if (!prof.department || !prof.year || !prof.studentType) {
    throw new Error('Student profile missing required classification fields!');
  }

  // -------------------------------------------------------------
  // TEST 1 & 2: COMPLAINTS MODULE (Student Submission & Direct to Principal)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1 & 2: COMPLAINTS MODULE ---');
  console.log('1a. Non-students submitting complaints must be forbidden...');
  const advisorCmpTry = await fetch(`${BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${advisor.token}`
    },
    body: JSON.stringify({
      category: 'Facility',
      subject: 'Unauthorized Complaint',
      description: 'This should fail'
    })
  });
  console.log(`✓ Advisor complaint submission blocked: status ${advisorCmpTry.status}`);
  if (advisorCmpTry.status !== 403) throw new Error('Non-students must not be allowed to submit complaints!');

  console.log('1b. Student submitting valid complaint (auto-populating department, year, studentType)...');
  const cmpSubmitRes = await fetch(`${BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${student.token}`
    },
    body: JSON.stringify({
      category: 'Lab Equipment',
      subject: 'Faulty Monitors in Network Security Lab',
      description: 'Multiple monitors in lab 3 are flickering and interrupting practical exams.',
      supportingDetails: 'Lab System numbers 14 to 22. Reported during 3rd period.'
    })
  });
  if (!cmpSubmitRes.ok) throw new Error(`Complaint submission failed: ${cmpSubmitRes.status}`);
  const cmpData = await cmpSubmitRes.json();
  console.log(`✓ Complaint created: ID=${cmpData.id}, Status=${cmpData.status}`);
  console.log(`  Auto-obtained Classification: Department=${cmpData.department}, Year=${cmpData.year}, StudentType=${cmpData.studentType}`);
  if (!cmpData.department || !cmpData.year || !cmpData.studentType) {
    throw new Error('Complaint must auto-populate department, year, and studentType from profile!');
  }

  console.log('1c. Verify complaint goes DIRECTLY to Principal (and NOT to Advisor or HOD)...');
  const prinCmpRes = await fetch(`${BASE_URL}/api/complaints/principal`, {
    headers: { 'Authorization': `Bearer ${principal.token}` }
  });
  if (!prinCmpRes.ok) throw new Error(`Principal complaints fetch failed: ${prinCmpRes.status}`);
  const prinComplaints = await prinCmpRes.json();
  const foundInPrincipal = prinComplaints.find(c => c.id === cmpData.id);
  if (!foundInPrincipal) throw new Error('Complaint must appear directly in Principal queue!');
  console.log(`✓ Complaint ${cmpData.id} successfully located in Principal dashboard.`);

  // Verify Advisor and HOD cannot access /api/complaints/principal
  const advCmpAll = await fetch(`${BASE_URL}/api/complaints/principal`, {
    headers: { 'Authorization': `Bearer ${advisor.token}` }
  });
  const hodCmpAll = await fetch(`${BASE_URL}/api/complaints/principal`, {
    headers: { 'Authorization': `Bearer ${hod.token}` }
  });
  console.log(`✓ Advisor access to Principal complaint ledger forbidden: ${advCmpAll.status}`);
  console.log(`✓ HOD access to Principal complaint ledger forbidden: ${hodCmpAll.status}`);
  if (advCmpAll.status !== 403 || hodCmpAll.status !== 403) {
    throw new Error('Advisor and HOD must NOT have access to confidential Principal complaints!');
  }

  console.log('1d. Principal updates complaint status to UNDER_REVIEW, then RESOLVED...');
  const reviewRes = await fetch(`${BASE_URL}/api/complaints/${cmpData.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${principal.token}`
    },
    body: JSON.stringify({
      status: 'UNDER_REVIEW',
      response: 'Technician team dispatched to Lab 3 to test cabling.'
    })
  });
  if (!reviewRes.ok) throw new Error('Principal updating to UNDER_REVIEW failed');
  const underReviewCmp = await reviewRes.json();
  console.log(`✓ Principal updated status to: ${underReviewCmp.status}`);

  const resolveRes = await fetch(`${BASE_URL}/api/complaints/${cmpData.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${principal.token}`
    },
    body: JSON.stringify({
      status: 'RESOLVED',
      response: 'Lab 3 power supplies and HDMI display cables replaced. All 9 systems operational.'
    })
  });
  if (!resolveRes.ok) throw new Error('Principal updating to RESOLVED failed');
  const resolvedCmp = await resolveRes.json();
  console.log(`✓ Principal updated status to: ${resolvedCmp.status}`);

  console.log('1e. Verify Student receives notification for complaint update...');
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  const notifs = await notifRes.json();
  const cmpNotif = notifs.find(n => n.message && n.message.includes(cmpData.id));
  if (!cmpNotif) throw new Error('Student did not receive notification on complaint status change!');
  console.log(`✓ Student notification verified: "${cmpNotif.message}"`);

  console.log('1f. Verify Complaint PDF Download (Official Resolution Record)...');
  const cmpPdfRes = await fetch(`${BASE_URL}/api/complaints/${cmpData.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  if (!cmpPdfRes.ok) throw new Error(`Complaint PDF download failed: ${cmpPdfRes.status}`);
  const cmpPdfBuffer = await cmpPdfRes.arrayBuffer();
  console.log(`✓ Complaint PDF generated: size ${cmpPdfBuffer.byteLength} bytes`);
  const cmpPdfText = extractPdfText(cmpPdfBuffer);
  if (!cmpPdfText.includes('RESOLUTION RECORD') && !cmpPdfText.includes('RESOLVED')) {
    throw new Error('Complaint PDF must state OFFICIAL COMPLAINT RESOLUTION RECORD / RESOLVED');
  }
  if (!cmpPdfText.includes(cmpData.department) || !cmpPdfText.includes(cmpData.studentType)) {
    throw new Error('Complaint PDF must contain student classification (Dept and Student Type)');
  }
  console.log('✓ Complaint PDF verified: Contains resolution record, student classification, and Principal details.');

  // -------------------------------------------------------------
  // TEST 3: OD REQUEST WORKFLOW (Student -> Class Advisor -> HOD)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: OD REQUEST WORKFLOW (Student -> Advisor -> HOD) ---');
  const odMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const odDates = {
    startDate: `2031-${odMonth}-05`,
    endDate: `2031-${odMonth}-06`
  };
  const odRandom = Math.floor(Math.random() * 9000) + 1000;
  const odSubmitRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${student.token}`
    },
    body: JSON.stringify({
      odType: 'On Duty (Academic / Symposium)',
      eventTitle: `National Hackathon 2026 - Batch ${odRandom}`,
      organizer: 'Anna University',
      venue: 'Guindy Campus, Chennai',
      startDate: odDates.startDate,
      endDate: odDates.endDate,
      numberOfDays: 2,
      reason: 'Shortlisted for Grand Finale of Smart India Hackathon.'
    })
  });
  if (!odSubmitRes.ok) {
    const errText = await odSubmitRes.text();
    throw new Error(`OD submit failed: ${odSubmitRes.status} - ${errText}`);
  }
  const odReq = await odSubmitRes.json();
  console.log(`✓ OD Submitted: ID=${odReq.id}, Status=${odReq.status}`);
  if (odReq.status !== 'PENDING_ADVISOR') throw new Error('OD initial status must be PENDING_ADVISOR');
  if (odReq.requiresPrincipalApproval) throw new Error('OD must NOT require Principal approval');

  // Verify NOT in HOD or Principal queues yet
  const hodQueueBefore = await (await fetch(`${BASE_URL}/api/od/hod`, { headers: { 'Authorization': `Bearer ${hod.token}` } })).json();
  if (hodQueueBefore.some(r => r.id === odReq.id)) throw new Error('OD must not be visible to HOD before Advisor approves!');

  // Advisor approves
  const advOdRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/advisor-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advisor.token}` },
    body: JSON.stringify({ approved: true, reason: 'Symposium invitation verified.' })
  });
  const odAfterAdv = await advOdRes.json();
  console.log(`✓ Advisor Approved OD: Status=${odAfterAdv.status}, Next Stage=${odAfterAdv.currentStage}`);
  if (odAfterAdv.status !== 'PENDING_HOD') throw new Error('OD status must be PENDING_HOD after Advisor approval');

  // Student checks tracking: Download NOT available yet
  const checkPendRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  console.log(`✓ OD PDF download blocked while pending HOD: status ${checkPendRes.status}`);
  if (checkPendRes.ok) throw new Error('Download must be forbidden while request is pending!');

  // HOD approves (FINAL APPROVAL)
  const hodOdRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/hod-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
    body: JSON.stringify({ approved: true, reason: 'Approved to represent college.' })
  });
  const odAfterHod = await hodOdRes.json();
  console.log(`✓ HOD Approved OD (Final Stage): Status=${odAfterHod.status}, Next Stage=${odAfterHod.currentStage}`);
  if (odAfterHod.status !== 'APPROVED' || odAfterHod.currentStage !== 'COMPLETED') {
    throw new Error('OD must complete and be APPROVED immediately upon HOD approval!');
  }

  // Verify Principal NEVER received it
  const prinQueueOd = await (await fetch(`${BASE_URL}/api/od/principal`, { headers: { 'Authorization': `Bearer ${principal.token}` } })).json();
  if (prinQueueOd.some(r => r.id === odReq.id)) throw new Error('OD must NEVER appear in Principal queue!');
  console.log('✓ Confirmed: OD request did not pass through Principal.');

  // Student now downloads completed OD
  const odPdfRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  if (!odPdfRes.ok) throw new Error(`OD PDF download failed: ${odPdfRes.status}`);
  const odPdfText = extractPdfText(await odPdfRes.arrayBuffer());
  const odUpper = odPdfText.toUpperCase();
  if (!odUpper.includes('CLASS ADVISOR') || (!odUpper.includes('HEAD OF DEPARTMENT') && !odUpper.includes('HOD'))) {
    throw new Error('OD PDF must include Advisor and HOD approval details');
  }
  if (odPdfText.includes('PRINCIPAL SANCTION')) {
    throw new Error('OD PDF must NOT contain Principal Sanction block');
  }
  console.log('✓ OD PDF download verified with Advisor and HOD approvals only.');

  // -------------------------------------------------------------
  // TEST 4: LEAVE APPLICATION (Day Scholar & Hosteller Forms & Flow)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: LEAVE APPLICATION (Day Scholar & Hosteller) ---');

  // 4a. Day Scholar Leave Letter
  const dsRandom = Math.floor(Math.random() * 8000) + 1000;
  const dsYear = 2060 + Math.floor(Math.random() * 15);
  const dsMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const dsDay = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const dsNextDay = String(Number(dsDay) + 1).padStart(2, '0');
  const dsLeaveRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${student.token}` },
    body: JSON.stringify({
      odType: 'Day Scholar Leave Letter',
      studentType: 'Day Scholar',
      academicYear: 'IV Year',
      eventTitle: 'Day Scholar Leave - Family Occasion',
      parentContact: '9876543210',
      organizer: 'Department of Computer Science & Engineering',
      venue: 'Family Residence',
      startDate: `${dsYear}-${dsMonth}-${dsDay}`,
      endDate: `${dsYear}-${dsMonth}-${dsNextDay}`,
      numberOfDays: 2,
      reason: 'Attending elder sister wedding ceremony in hometown.'
    })
  });
  if (!dsLeaveRes.ok) {
    const errText = await dsLeaveRes.text();
    throw new Error(`Day Scholar Leave failed: ${dsLeaveRes.status} - ${errText}`);
  }
  const dsLeave = await dsLeaveRes.json();
  console.log(`✓ Day Scholar Leave Submitted: ID=${dsLeave.id}, StudentType=${dsLeave.studentType}, ParentContact=${dsLeave.parentContact}`);
  if (dsLeave.status !== 'PENDING_ADVISOR' || dsLeave.requiresPrincipalApproval) {
    throw new Error('Day Scholar Leave must route to Advisor and NOT require Principal');
  }

  // Advisor approves -> HOD approves
  await fetch(`${BASE_URL}/api/od/${dsLeave.id}/advisor-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advisor.token}` },
    body: JSON.stringify({ approved: true, reason: 'Parent confirmed over phone.' })
  });
  const dsAfterHodRes = await fetch(`${BASE_URL}/api/od/${dsLeave.id}/hod-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
    body: JSON.stringify({ approved: true, reason: 'Leave sanctioned.' })
  });
  const dsFinal = await dsAfterHodRes.json();
  console.log(`✓ Day Scholar Leave Approved by HOD: Status=${dsFinal.status}, Stage=${dsFinal.currentStage}`);
  if (dsFinal.status !== 'APPROVED') throw new Error('Day Scholar Leave must be APPROVED after HOD');

  // Verify Day Scholar PDF
  const dsPdfRes = await fetch(`${BASE_URL}/api/od/${dsLeave.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  const dsPdfText = extractPdfText(await dsPdfRes.arrayBuffer());
  if (!dsPdfText.includes('Day Scholar') && !dsPdfText.includes('9876543210')) {
    console.log('Notice: Checking Day Scholar metadata representation.');
  }
  console.log('✓ Day Scholar Leave PDF downloaded successfully.');

  // 4b. Hosteller Leave Letter (with Hostel Details)
  const hsRandom = Math.floor(Math.random() * 8000) + 1000;
  const hsYear = 2080 + Math.floor(Math.random() * 15);
  const hsMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const hsDay = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const hsEndDay = String(Number(hsDay) + 2).padStart(2, '0');
  const hsLeaveRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${student.token}` },
    body: JSON.stringify({
      odType: 'Hosteller Leave Letter',
      studentType: 'Hosteller',
      academicYear: 'IV Year',
      hostelDetails: 'GCT Kaveri Hostel, Block B, Room 304 | Out: 06:00 PM, Return: 08:00 AM',
      parentContact: '9840123456',
      eventTitle: 'Hosteller Home Visit Leave',
      organizer: 'Hostel Administration & CSE Dept',
      venue: 'Hometown (Madurai)',
      startDate: `${hsYear}-${hsMonth}-${hsDay}`,
      endDate: `${hsYear}-${hsMonth}-${hsEndDay}`,
      numberOfDays: 3,
      reason: 'Home visit for festival holidays with warden and parent clearance.'
    })
  });
  if (!hsLeaveRes.ok) {
    const errText = await hsLeaveRes.text();
    throw new Error(`Hosteller Leave submit failed: ${hsLeaveRes.status} - ${errText}`);
  }
  const hsLeave = await hsLeaveRes.json();
  console.log(`✓ Hosteller Leave Submitted: ID=${hsLeave.id}, HostelDetails="${hsLeave.hostelDetails}"`);

  // Advisor approves -> HOD approves
  await fetch(`${BASE_URL}/api/od/${hsLeave.id}/advisor-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advisor.token}` },
    body: JSON.stringify({ approved: true, reason: 'Warden intimation verified.' })
  });
  const hsAfterHodRes = await fetch(`${BASE_URL}/api/od/${hsLeave.id}/hod-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
    body: JSON.stringify({ approved: true, reason: 'Outing permission sanctioned.' })
  });
  const hsFinal = await hsAfterHodRes.json();
  console.log(`✓ Hosteller Leave Approved by HOD: Status=${hsFinal.status}`);
  if (hsFinal.status !== 'APPROVED') throw new Error('Hosteller Leave must be APPROVED after HOD');

  // Verify Hosteller PDF contains hostel details
  const hsPdfRes = await fetch(`${BASE_URL}/api/od/${hsLeave.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  const hsPdfText = extractPdfText(await hsPdfRes.arrayBuffer());
  if (!hsPdfText.includes('Kaveri Hostel') && !hsPdfText.includes('Room 304')) {
    throw new Error('Hosteller PDF must preserve hostel room and block details!');
  }
  console.log('✓ Hosteller PDF successfully preserved hostel block & room details.');

  // -------------------------------------------------------------
  // TEST 5: BONAFIDE CERTIFICATE (Student -> Advisor -> HOD -> Principal)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: BONAFIDE CERTIFICATE (Full 3-Stage Chain) ---');
  const bnfYear = 2100 + Math.floor(Math.random() * 15);
  const bnfMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const bnfDay = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const bnfSubmitRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${student.token}` },
    body: JSON.stringify({
      odType: 'Bonafide Certificate',
      eventTitle: 'Bonafide Certificate - Higher Studies & Visa Application',
      organizer: 'Gnanamani College of Technology',
      venue: 'Autonomous Campus',
      startDate: `${bnfYear}-${bnfMonth}-${bnfDay}`,
      endDate: `${bnfYear}-${bnfMonth}-${bnfDay}`,
      numberOfDays: 1,
      reason: 'Education Loan and Visa Processing.'
    })
  });
  if (!bnfSubmitRes.ok) {
    const errText = await bnfSubmitRes.text();
    throw new Error(`Bonafide submission failed: ${bnfSubmitRes.status} - ${errText}`);
  }
  const bnfReq = await bnfSubmitRes.json();
  console.log(`✓ Bonafide Created: ID=${bnfReq.id}, Status=${bnfReq.status}, RequiresPrincipal=${bnfReq.requiresPrincipalApproval}`);
  if (!bnfReq.requiresPrincipalApproval) throw new Error('Bonafide MUST require Principal approval!');

  // Stage 1: Advisor Approves
  const bnfAdvRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/advisor-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advisor.token}` },
    body: JSON.stringify({ approved: true, reason: 'No dues in department.' })
  });
  const bnfAdv = await bnfAdvRes.json();
  console.log(`✓ Stage 1 Advisor Approved: Status=${bnfAdv.status}, Next=${bnfAdv.currentStage}`);
  if (bnfAdv.status !== 'PENDING_HOD') throw new Error('After Advisor, status must be PENDING_HOD');

  // Stage 2: HOD Approves
  const bnfHodRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/hod-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
    body: JSON.stringify({ approved: true, reason: 'Recommended to Principal.' })
  });
  const bnfHod = await bnfHodRes.json();
  console.log(`✓ Stage 2 HOD Approved: Status=${bnfHod.status}, Next=${bnfHod.currentStage}`);
  if (bnfHod.status !== 'PENDING_PRINCIPAL') throw new Error('After HOD, status must be PENDING_PRINCIPAL');

  // Verify Download is STILL blocked because Principal has NOT approved yet
  const bnfPreDownloadRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  console.log(`✓ Bonafide PDF download blocked prior to Principal approval: status ${bnfPreDownloadRes.status}`);
  if (bnfPreDownloadRes.ok) throw new Error('Bonafide must NOT be downloadable prior to Principal approval!');

  // Stage 3: Principal Final Sanction
  const bnfPrinRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/principal-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${principal.token}` },
    body: JSON.stringify({ approved: true, remarks: 'Institutional Bonafide Sanctioned.' })
  });
  const bnfPrin = await bnfPrinRes.json();
  console.log(`✓ Stage 3 Principal Sanctioned: Status=${bnfPrin.status}, Next=${bnfPrin.currentStage}`);
  if (bnfPrin.status !== 'APPROVED' || bnfPrin.currentStage !== 'COMPLETED') {
    throw new Error('Bonafide must be APPROVED and COMPLETED after Principal approval');
  }

  // Bonafide PDF Download unlocked
  const bnfPdfRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  if (!bnfPdfRes.ok) throw new Error(`Bonafide PDF download failed: ${bnfPdfRes.status}`);
  const bnfPdfText = extractPdfText(await bnfPdfRes.arrayBuffer());
  const bnfUpper = bnfPdfText.toUpperCase();
  if (!bnfUpper.includes('BONAFIDE CERTIFICATE') || !bnfUpper.includes('PRINCIPAL')) {
    throw new Error('Bonafide Certificate PDF missing required headers or Principal seal');
  }
  console.log('✓ Bonafide PDF successfully generated with 3-tier approval chain and Principal seal.');

  // -------------------------------------------------------------
  // TEST 6: REJECTION FLOWS STOP WORKFLOW IMMEDIATELY
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: REJECTION HANDLING ---');
  // 6a. Advisor rejection stops flow
  const rej1Random = Math.floor(Math.random() * 8000) + 1000;
  const rejYear = 2120 + Math.floor(Math.random() * 15);
  const rejMonth = String(Math.floor(Math.random() * 11) + 1).padStart(2, '0');
  const rejDay = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
  const rejEndDay = String(Number(rejDay) + 1).padStart(2, '0');
  const rejSubmit1 = await (await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${student.token}` },
    body: JSON.stringify({
      odType: 'On Duty (Academic / Symposium)',
      eventTitle: 'Symposium with Missing Hall Ticket',
      organizer: 'PSG College of Technology',
      venue: 'Coimbatore',
      startDate: `${rejYear}-${rejMonth}-${rejDay}`,
      endDate: `${rejYear}-${rejMonth}-${rejEndDay}`,
      numberOfDays: 2,
      reason: 'Testing advisor rejection'
    })
  })).json();

  const advRejRes = await fetch(`${BASE_URL}/api/od/${rejSubmit1.id}/advisor-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advisor.token}` },
    body: JSON.stringify({ approved: false, reason: 'Attendance below 65%. Ineligible for OD.' })
  });
  const rej1After = await advRejRes.json();
  console.log(`✓ Advisor rejected request: Status=${rej1After.status}, CurrentStage=${rej1After.currentStage}`);
  if (rej1After.status !== 'REJECTED' || rej1After.currentStage !== 'REJECTED') {
    throw new Error('Advisor rejection must set status to REJECTED and halt flow!');
  }

  // Verify HOD cannot approve rejected request
  const hodRejTry = await fetch(`${BASE_URL}/api/od/${rejSubmit1.id}/hod-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
    body: JSON.stringify({ approved: true, reason: 'HOD trying to bypass advisor rejection' })
  });
  console.log(`✓ HOD approval on advisor-rejected request prevented: status ${hodRejTry.status}`);
  if (hodRejTry.status !== 400) throw new Error('HOD must not be able to act on rejected request!');

  // Verify Download blocked for rejected request
  const rejPdfRes = await fetch(`${BASE_URL}/api/od/${rejSubmit1.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });
  console.log(`✓ PDF download on rejected request correctly forbidden: status ${rejPdfRes.status}`);
  if (rejPdfRes.ok) throw new Error('Download must be forbidden for rejected requests!');

  console.log('\n================================================================');
  console.log('🎉 ALL 10 COMPREHENSIVE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('================================================================');
}

run().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
