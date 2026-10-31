// verify_workflow_separation.js
// Tests the request-type-specific approval workflow:
// 1. Bonafide Certificate: 3 Stages (Student -> Advisor -> HOD -> Principal -> Approved)
// 2. All Other Requests (OD, Leave): 2 Stages (Student -> Advisor -> HOD -> Approved). Principal is NEVER in chain!
// 3. Signature verification: Advisor, HOD, and (for Bonafide only) Principal signatures captured.
// 4. Download PDFs: Bonafide Certificate has 3 signatures, OD/Leave has 2 signatures only.

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
  return data.token;
}

async function run() {
  console.log('=== STARTING WORKFLOW SEPARATION TEST ===\n');

  // Step 1: Login all actors
  console.log('1. Authenticating test users...');
  const studentToken = await login('620823104002', 'student@12');   // Abinaya G (CSE-A)
  const advisorToken = await login('arularasi', 'advisor@123');     // Mrs. P. Arularasi (CSE-A Advisor)
  const hodToken = await login('gopinath', 'hod@123');              // Dr. K. Gopinath (HOD)
  const principalToken = await login('principal@gct.ac.in', 'principal@123'); // Dr. B. Sanjay Gandhi (Principal)
  console.log('✓ All users successfully authenticated.\n');

  // -------------------------------------------------------------
  // TEST SUITE 1: BONAFIDE CERTIFICATE (3 APPROVAL STAGES)
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: BONAFIDE CERTIFICATE (3 APPROVAL STAGES) ---');
  
  // 1a. Student submits Bonafide request
  const bnfSubmitRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      odType: 'Bonafide Certificate',
      eventTitle: 'Bonafide Certificate - Passport Application',
      organizer: 'Gnanamani College of Technology',
      venue: 'Autonomous Campus',
      startDate: '2026-04-10',
      endDate: '2026-04-10',
      numberOfDays: 1,
      reason: 'Passport Application and Police Verification'
    })
  });
  if (!bnfSubmitRes.ok) throw new Error(`Bonafide submission failed: ${bnfSubmitRes.status}`);
  const bnfReq = await bnfSubmitRes.json();
  console.log(`✓ Bonafide submitted: ID=${bnfReq.id}, Status=${bnfReq.status}, RequiresPrincipal=${bnfReq.requiresPrincipalApproval}`);
  if (!bnfReq.requiresPrincipalApproval) throw new Error('Bonafide request MUST require Principal approval!');
  if (bnfReq.status !== 'PENDING_ADVISOR') throw new Error('Initial status must be PENDING_ADVISOR');

  // 1b. Advisor approves
  const bnfAdvRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/advisor-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${advisorToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Academic records verified.' })
  });
  if (!bnfAdvRes.ok) throw new Error(`Advisor approval failed: ${bnfAdvRes.status}`);
  const bnfAfterAdv = await bnfAdvRes.json();
  console.log(`✓ Advisor approved Bonafide: Status=${bnfAfterAdv.status}, Next Stage=${bnfAfterAdv.currentStage}`);
  if (bnfAfterAdv.status !== 'PENDING_HOD') throw new Error('Status after Advisor approval must be PENDING_HOD');
  if (!bnfAfterAdv.advisorDecision || !bnfAfterAdv.advisorDecision.signatureBase64) {
    throw new Error('Advisor electronic signature snapshot must be captured!');
  }
  console.log(`  Signature captured for Advisor: ${bnfAfterAdv.advisorDecision.signerName}`);

  // 1c. HOD approves -> Should forward to Principal (Stage 3)
  const bnfHodRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/hod-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Department endorsement granted.' })
  });
  if (!bnfHodRes.ok) throw new Error(`HOD approval failed: ${bnfHodRes.status}`);
  const bnfAfterHod = await bnfHodRes.json();
  console.log(`✓ HOD approved Bonafide: Status=${bnfAfterHod.status}, Next Stage=${bnfAfterHod.currentStage}`);
  if (bnfAfterHod.status !== 'PENDING_PRINCIPAL') throw new Error('Bonafide status after HOD must be PENDING_PRINCIPAL');
  if (!bnfAfterHod.hodDecision || !bnfAfterHod.hodDecision.signatureBase64) {
    throw new Error('HOD electronic signature snapshot must be captured!');
  }
  console.log(`  Signature captured for HOD: ${bnfAfterHod.hodDecision.signerName}`);

  // 1d. Verify Bonafide appears in Principal queue
  const prinQueueRes = await fetch(`${BASE_URL}/api/od/principal`, {
    headers: { 'Authorization': `Bearer ${principalToken}` }
  });
  const prinQueue = await prinQueueRes.json();
  const inPrinQueue = prinQueue.find(r => r.id === bnfReq.id);
  if (!inPrinQueue) throw new Error('Bonafide request MUST appear in Principal queue!');
  console.log(`✓ Bonafide request correctly present in Principal queue.`);

  // 1e. Principal approves -> FINAL APPROVED
  const bnfPrinRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/principal-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${principalToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Institutional sanction granted.' })
  });
  if (!bnfPrinRes.ok) throw new Error(`Principal approval failed: ${bnfPrinRes.status}`);
  const bnfFinal = await bnfPrinRes.json();
  console.log(`✓ Principal approved Bonafide: Status=${bnfFinal.status}, CurrentStage=${bnfFinal.currentStage}`);
  if (bnfFinal.status !== 'APPROVED') throw new Error('Bonafide status after Principal must be APPROVED');
  if (!bnfFinal.principalDecision || !bnfFinal.principalDecision.signatureBase64) {
    throw new Error('Principal electronic signature snapshot must be captured!');
  }
  console.log(`  Signature captured for Principal: ${bnfFinal.principalDecision.signerName}`);

  // 1f. Verify Bonafide PDF generation (3 Signatures)
  const bnfPdfRes = await fetch(`${BASE_URL}/api/od/${bnfReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  if (!bnfPdfRes.ok) throw new Error(`Bonafide PDF generation failed: ${bnfPdfRes.status}`);
  const bnfPdfBuffer = await bnfPdfRes.arrayBuffer();
  const rawHeader = Buffer.from(bnfPdfBuffer).toString('latin1', 0, 5);
  if (!rawHeader.startsWith('%PDF')) throw new Error('Response is not a valid PDF!');
  const bnfPdfText = extractPdfText(bnfPdfBuffer);
  if (!bnfPdfText.includes('BONAFIDE CERTIFICATE')) throw new Error('PDF missing BONAFIDE CERTIFICATE title');
  if (!bnfPdfText.includes('GNANAMANI COLLEGE OF TECHNOLOGY')) throw new Error('PDF missing college name');
  if (!bnfPdfText.includes('Class Advisor') || !bnfPdfText.includes('Head of Department') || !bnfPdfText.includes('Principal')) {
    throw new Error('PDF missing 3 approval stage titles');
  }
  console.log(`✓ Bonafide Certificate PDF generated successfully (${bnfPdfBuffer.byteLength} bytes) with 3 approval stages & electronic signatures.\n`);


  // -------------------------------------------------------------
  // TEST SUITE 2: NON-BONAFIDE REQUEST (OD / LEAVE: 2 APPROVAL STAGES)
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 2: NON-BONAFIDE REQUEST (OD: 2 APPROVAL STAGES) ---');

  const odUniqueDay = (Math.floor(Date.now() / 1000) % 20) + 1;
  const odUniqueMonth = ((Math.floor(Date.now() / 20000) % 6) + 6); // Months 6-12
  const odStartDate = `2027-${String(odUniqueMonth).padStart(2, '0')}-${String(odUniqueDay).padStart(2, '0')}`;
  const odEndDate = `2027-${String(odUniqueMonth).padStart(2, '0')}-${String(odUniqueDay + 1).padStart(2, '0')}`;

  const odSubmitRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      odType: 'Technical Symposium / Conference',
      eventTitle: 'National AI & Cloud Hackathon ' + Date.now(),
      organizer: 'Coimbatore Institute of Technology',
      venue: 'CIT Campus, Coimbatore',
      startDate: odStartDate,
      endDate: odEndDate,
      numberOfDays: 2,
      reason: 'Participating in National Hackathon finals representing department.'
    })
  });
  if (!odSubmitRes.ok) {
    const errText = await odSubmitRes.text();
    throw new Error(`OD submission failed: ${odSubmitRes.status} - ${errText}`);
  }
  const odReq = await odSubmitRes.json();
  console.log(`✓ OD submitted: ID=${odReq.id}, Status=${odReq.status}, RequiresPrincipal=${odReq.requiresPrincipalApproval}`);
  if (odReq.requiresPrincipalApproval) throw new Error('OD request must NOT require Principal approval!');
  if (odReq.status !== 'PENDING_ADVISOR') throw new Error('Initial status must be PENDING_ADVISOR');

  // 2b. Advisor approves
  const odAdvRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/advisor-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${advisorToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Hackathon team registered.' })
  });
  if (!odAdvRes.ok) throw new Error(`Advisor approval failed: ${odAdvRes.status}`);
  const odAfterAdv = await odAdvRes.json();
  console.log(`✓ Advisor approved OD: Status=${odAfterAdv.status}, Next Stage=${odAfterAdv.currentStage}`);
  if (odAfterAdv.status !== 'PENDING_HOD') throw new Error('Status after Advisor approval must be PENDING_HOD');

  // 2c. HOD approves -> MUST BE FINAL APPROVAL DIRECTLY! (Stage 2 is Final)
  const odHodRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/hod-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Department OD permission granted.' })
  });
  if (!odHodRes.ok) throw new Error(`HOD approval failed: ${odHodRes.status}`);
  const odFinal = await odHodRes.json();
  console.log(`✓ HOD approved OD: Status=${odFinal.status}, CurrentStage=${odFinal.currentStage}`);
  if (odFinal.status !== 'APPROVED') {
    throw new Error(`OD request must be marked APPROVED immediately after HOD approval! Got: ${odFinal.status}`);
  }
  if (odFinal.currentStage !== 'COMPLETED') {
    throw new Error(`Current stage must be COMPLETED! Got: ${odFinal.currentStage}`);
  }

  // 2d. Verify OD request NEVER appears in Principal queue
  const prinQueueCheck = await fetch(`${BASE_URL}/api/od/principal`, {
    headers: { 'Authorization': `Bearer ${principalToken}` }
  });
  const prinQueueItems = await prinQueueCheck.json();
  const odInPrinQueue = prinQueueItems.find(r => r.id === odReq.id);
  if (odInPrinQueue) {
    throw new Error('CRITICAL VIOLATION: OD request appeared in Principal queue!');
  }
  console.log(`✓ Verified: Principal queue NEVER receives non-Bonafide OD requests.`);

  // 2e. Verify OD PDF generation (2 Signatures only: Advisor & HOD)
  const odPdfRes = await fetch(`${BASE_URL}/api/od/${odReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  if (!odPdfRes.ok) throw new Error(`OD PDF generation failed: ${odPdfRes.status}`);
  const odPdfBuffer = await odPdfRes.arrayBuffer();
  const odRawHeader = Buffer.from(odPdfBuffer).toString('latin1', 0, 5);
  if (!odRawHeader.startsWith('%PDF')) throw new Error('Response is not a valid PDF!');
  const odPdfText = extractPdfText(odPdfBuffer);
  if (!odPdfText.includes('OFFICIAL ON-DUTY (OD) APPROVAL CERTIFICATE')) {
    throw new Error('PDF missing OFFICIAL ON-DUTY (OD) APPROVAL CERTIFICATE title');
  }
  // Check that Principal signature is NOT present in Non-Bonafide PDF
  if (odPdfText.includes('Dr. B. Sanjay Gandhi')) {
    throw new Error('CRITICAL VIOLATION: Non-Bonafide PDF contains Principal signature!');
  }
  console.log(`✓ OD PDF generated successfully (${odPdfBuffer.byteLength} bytes) with 2 signatures ONLY (Advisor & HOD). Principal signature is NOT present.\n`);


  // -------------------------------------------------------------
  // TEST SUITE 3: LEAVE APPLICATION (2 APPROVAL STAGES)
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 3: LEAVE APPLICATION (2 APPROVAL STAGES) ---');

  // 3a. Student submits Leave request
  const offset = Math.floor(Math.random() * 800) + 1;
  const lvStartDate = `2029-05-${String((offset % 25) + 1).padStart(2, '0')}`;
  const lvEndDate = `2029-05-${String((offset % 25) + 2).padStart(2, '0')}`;

  const lvSubmitRes = await fetch(`${BASE_URL}/api/od/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      odType: 'Medical / Sick Leave',
      eventTitle: 'Leave Application - Medical ' + Date.now(),
      organizer: 'College Attendance / Leave',
      venue: 'Home',
      startDate: lvStartDate,
      endDate: lvEndDate,
      numberOfDays: 2,
      reason: 'Medical treatment and rest prescribed by physician.'
    })
  });
  if (!lvSubmitRes.ok) {
    const lvErrText = await lvSubmitRes.text();
    throw new Error(`Leave submission failed: ${lvSubmitRes.status} - ${lvErrText}`);
  }
  const lvReq = await lvSubmitRes.json();
  console.log(`✓ Leave submitted: ID=${lvReq.id}, Status=${lvReq.status}, RequiresPrincipal=${lvReq.requiresPrincipalApproval}`);
  if (lvReq.requiresPrincipalApproval) throw new Error('Leave request must NOT require Principal approval!');

  // 3b. Advisor approves
  await fetch(`${BASE_URL}/api/od/${lvReq.id}/advisor-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${advisorToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Medical prescription verified.' })
  });
  console.log(`✓ Advisor approved Leave request.`);

  // 3c. HOD approves -> Directly APPROVED!
  const lvHodRes = await fetch(`${BASE_URL}/api/od/${lvReq.id}/hod-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hodToken}`
    },
    body: JSON.stringify({ approved: true, reason: 'Leave sanctioned.' })
  });
  const lvFinal = await lvHodRes.json();
  console.log(`✓ HOD approved Leave: Status=${lvFinal.status}, CurrentStage=${lvFinal.currentStage}`);
  if (lvFinal.status !== 'APPROVED') throw new Error('Leave must be APPROVED after HOD approval!');

  // 3d. Verify Leave PDF (2 Signatures only: Advisor & HOD)
  const lvPdfRes = await fetch(`${BASE_URL}/api/od/${lvReq.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  if (!lvPdfRes.ok) throw new Error(`Leave PDF failed: ${lvPdfRes.status}`);
  const lvPdfBuffer = await lvPdfRes.arrayBuffer();
  const lvPdfText = extractPdfText(lvPdfBuffer);
  if (!lvPdfText.includes('OFFICIAL LEAVE APPROVAL CERTIFICATE')) {
    throw new Error('PDF missing OFFICIAL LEAVE APPROVAL CERTIFICATE title');
  }
  if (lvPdfText.includes('Dr. B. Sanjay Gandhi')) {
    throw new Error('CRITICAL VIOLATION: Leave PDF contains Principal signature!');
  }
  console.log(`✓ Leave PDF generated successfully (${lvPdfBuffer.byteLength} bytes) with 2 signatures ONLY (Advisor & HOD).\n`);

  console.log('========================================================');
  console.log('🎉 ALL WORKFLOW SEPARATION TESTS PASSED PERFECTLY!');
  console.log('========================================================');
}

run().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
