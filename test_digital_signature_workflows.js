/**
 * Comprehensive Digital Signature Integration Verification Script for EPOCH
 *
 * Verifies:
 * 1. Signature registration & access control (Advisor, HOD, Principal can upload & retrieve; Students are blocked).
 * 2. On-Duty (OD) request: Advisor approves (captures signature) -> HOD approves (captures signature, final approval, NO Principal required).
 * 3. Leave request: Advisor approves -> HOD approves -> Final approval.
 * 4. Bonafide Certificate request: Advisor approves -> HOD approves -> Principal approves (all 3 signatures captured).
 * 5. Sequential workflow enforcement (HOD cannot approve before Advisor; Principal cannot approve before HOD).
 * 6. Rejection handling (rejection halts workflow, no signature attached, PDF download blocked).
 * 7. PDF download generation for approved requests (valid %PDF binary with digital signatures).
 * 8. Notification delivery to student at each stage.
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';

// Test accounts
const ACCOUNTS = {
  student: { username: '620823104002', password: 'student@12', name: 'Kavitha R', role: 'STUDENT', section: 'CSE-A' },
  advisorA: { username: 'arularasi', password: 'advisor@123', name: 'Mrs. P. Arularasi', role: 'ADVISOR', section: 'CSE-A' },
  advisorB: { username: 'divyabharathi', password: 'advisor@123', name: 'Dr. Divyabharathi', role: 'ADVISOR', section: 'CSE-B' },
  hod: { username: 'gopinath', password: 'hod@123', name: 'Dr. K. Gopinath', role: 'HOD' },
  principal: { username: 'principal@gct.ac.in', password: 'principal@123', name: 'Dr. B. Sanjay Gandhi', role: 'PRINCIPAL' }
};

const TOKENS = {};

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};

    let payload = null;
    if (body !== null) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        const text = rawBuffer.toString('utf8');
        let data = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          buffer: rawBuffer
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function loginUser(key, creds) {
  const res = await request('POST', '/api/auth/login', {
    username: creds.username,
    password: creds.password
  });
  if (res.status === 200 && res.data && res.data.token) {
    TOKENS[key] = res.data.token;
    return true;
  }
  console.error(`Failed to login ${key}:`, res.status, res.data);
  return false;
}

async function run() {
  console.log('================================================================');
  console.log('EPOCH AUTOMATIC DIGITAL SIGNATURE & APPROVAL WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  console.log('--- Step 0: Authenticating Test Accounts ---');
  for (const [key, creds] of Object.entries(ACCOUNTS)) {
    const ok = await loginUser(key, creds);
    assert(ok, `Login successful for ${key} (${creds.username})`);
  }

  console.log('\n--- Step 1: Staff Signature Registration & Security Controls ---');
  // Student should be FORBIDDEN from uploading or reading staff signatures
  const studentUpload = await request('POST', '/api/staff/signature', {
    signatureBase64: 'data:image/png;base64,fakeStudentSignatureData'
  }, TOKENS.student);
  assert(studentUpload.status === 403, 'Student blocked from uploading staff signature (HTTP 403)');

  const studentGet = await request('GET', '/api/staff/signature', null, TOKENS.student);
  assert(studentGet.status === 403, 'Student blocked from reading staff signature endpoint (HTTP 403)');

  // Advisor A uploads a custom signature
  const customAdvisorSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAADklEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const advUpload = await request('POST', '/api/staff/signature', {
    signatureBase64: customAdvisorSig
  }, TOKENS.advisorA);
  assert(advUpload.status === 200 && advUpload.data.success === true, 'Advisor A successfully uploaded custom digital signature');

  const advGet = await request('GET', '/api/staff/signature', null, TOKENS.advisorA);
  assert(advGet.status === 200 && advGet.data.hasSignature === true, 'Advisor A retrieves own registered signature');
  assert(advGet.data.signature.signatureBase64 === customAdvisorSig, 'Advisor A retrieved signature matches uploaded custom data');

  // HOD uploads a custom signature
  const customHodSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAADklEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const hodUpload = await request('POST', '/api/staff/signature', {
    signatureBase64: customHodSig
  }, TOKENS.hod);
  assert(hodUpload.status === 200 && hodUpload.data.success === true, 'HOD successfully uploaded custom digital signature');

  const hodGet = await request('GET', '/api/staff/signature', null, TOKENS.hod);
  assert(hodGet.status === 200 && hodGet.data.hasSignature === true, 'HOD retrieves own registered signature');
  assert(hodGet.data.signature.signatureBase64 === customHodSig, 'HOD retrieved signature matches uploaded custom data');

  // Principal uploads a custom signature
  const customPrinSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAADklEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const prinUpload = await request('POST', '/api/staff/signature', {
    signatureBase64: customPrinSig
  }, TOKENS.principal);
  assert(prinUpload.status === 200 && prinUpload.data.success === true, 'Principal successfully uploaded custom digital signature');

  const prinGet = await request('GET', '/api/staff/signature', null, TOKENS.principal);
  assert(prinGet.status === 200 && prinGet.data.hasSignature === true, 'Principal retrieves own registered signature');
  assert(prinGet.data.signature.signatureBase64 === customPrinSig, 'Principal retrieved signature matches uploaded custom data');

  console.log('\n--- Step 2: On-Duty (OD) Workflow: Student -> Advisor -> HOD (NO Principal) ---');
  // Student submits OD with unique non-overlapping dates
  const runTag = Date.now() % 10000;
  const dDay = (runTag % 15) + 10;
  const odPayload = {
    odType: 'National Level Technical Symposium',
    eventTitle: 'Shaastra 2026',
    organizer: 'IIT Madras',
    venue: 'Chennai',
    startDate: `2027-01-${dDay}`,
    endDate: `2027-01-${dDay + 1}`,
    numberOfDays: 2,
    reason: 'Presenting research paper on Autonomous Systems',
    supportingDetails: 'Shortlisted paper ID #104'
  };
  const odSubRes = await request('POST', '/api/od/submit', odPayload, TOKENS.student);
  assert(odSubRes.status === 200, `OD request submitted successfully: ${odSubRes.data?.id}`);
  const odId = odSubRes.data.id;
  assert(odSubRes.data.status === 'PENDING_ADVISOR', 'OD initial status is PENDING_ADVISOR');
  assert(odSubRes.data.currentStage === 'ADVISOR' || odSubRes.data.currentStage === 'CLASS_ADVISOR', 'OD initial stage is ADVISOR');
  assert(odSubRes.data.requiresPrincipalApproval === false, 'OD requiresPrincipalApproval is false (2-stage workflow)');

  // Pre-condition test: HOD cannot approve before Advisor
  const earlyHodAction = await request('POST', `/api/od/${odId}/hod-action`, {
    approved: true,
    reason: 'Endorsed'
  }, TOKENS.hod);
  assert(earlyHodAction.status === 400, 'HOD cannot approve OD request before Class Advisor approves (HTTP 400)');

  // Advisor approves OD
  const advOdAction = await request('POST', `/api/od/${odId}/advisor-action`, {
    approved: true,
    reason: 'Shortlist verified and academic performance checked.'
  }, TOKENS.advisorA);
  assert(advOdAction.status === 200, 'Advisor successfully approves OD request');
  assert(advOdAction.data.status === 'PENDING_HOD', 'OD status moved to PENDING_HOD');
  assert(advOdAction.data.currentStage === 'HOD', 'OD stage moved to HOD');
  assert(advOdAction.data.advisorDecision != null, 'OD advisorDecision recorded');
  assert(advOdAction.data.advisorDecision.status === 'APPROVED', 'OD advisorDecision status is APPROVED');
  assert(advOdAction.data.advisorDecision.signatureBase64 === customAdvisorSig, 'OD advisorDecision captured Advisor A digital signature');
  assert(advOdAction.data.advisorDecision.signerName && advOdAction.data.advisorDecision.signerName.includes('Arularasi'), 'OD advisorDecision captured Advisor signer name');
  assert(advOdAction.data.advisorDecision.timestamp != null, 'OD advisorDecision captured approval timestamp');

  // Verify timeline event has signature
  const advEvt = advOdAction.data.workflowTimeline?.find(e => e.eventType === 'ADVISOR_APPROVAL');
  assert(advEvt != null && advEvt.signatureSnapshot === customAdvisorSig, 'OD workflowTimeline recorded ADVISOR_APPROVAL with signatureSnapshot');

  // HOD approves OD (final approval)
  const hodOdAction = await request('POST', `/api/od/${odId}/hod-action`, {
    approved: true,
    reason: 'Department sanction granted for national symposium.'
  }, TOKENS.hod);
  assert(hodOdAction.status === 200, 'HOD successfully approves OD request');
  assert(hodOdAction.data.status === 'APPROVED', 'OD request status is final APPROVED');
  assert(hodOdAction.data.currentStage === 'COMPLETED', 'OD request stage is COMPLETED');
  assert(hodOdAction.data.hodDecision != null, 'OD hodDecision recorded');
  assert(hodOdAction.data.hodDecision.status === 'APPROVED', 'OD hodDecision status is APPROVED');
  assert(hodOdAction.data.hodDecision.signatureBase64 === customHodSig, 'OD hodDecision captured HOD custom digital signature');
  assert(hodOdAction.data.hodDecision.signerName && hodOdAction.data.hodDecision.signerName.includes('Gopinath'), 'OD hodDecision captured HOD signer name');
  assert(hodOdAction.data.principalDecision == null, 'OD principalDecision is null (Principal not required for OD)');

  // Verify student can download OD PDF
  const odPdfRes = await request('GET', `/api/od/${odId}/pdf`, null, TOKENS.student);
  assert(odPdfRes.status === 200, 'Student can download approved OD PDF (HTTP 200)');
  assert(odPdfRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
  assert(odPdfRes.buffer.subarray(0, 4).toString() === '%PDF', 'Valid PDF header (%PDF) verified');
  assert(odPdfRes.buffer.length > 1000, `PDF size is valid: ${odPdfRes.buffer.length} bytes`);

  console.log('\n--- Step 3: Leave Request Workflow: Student -> Advisor -> HOD (NO Principal) ---');
  // Student submits Leave (Day Scholar)
  const leavePayload = {
    odType: 'Medical / Leave',
    eventTitle: 'Leave of Absence (Day Scholar)',
    organizer: 'Gnanamani College of Technology',
    venue: 'Home / Clinic',
    startDate: `2027-02-${dDay}`,
    endDate: `2027-02-${dDay + 1}`,
    numberOfDays: 2,
    reason: 'Medical treatment and doctor recommended rest.',
    supportingDetails: 'Medical prescription attached'
  };
  const leaveSub = await request('POST', '/api/od/submit', leavePayload, TOKENS.student);
  assert(leaveSub.status === 200, `Leave request submitted: ${leaveSub.data?.id}`);
  const leaveId = leaveSub.data.id;
  assert(leaveSub.data.status === 'PENDING_ADVISOR', 'Leave initial status is PENDING_ADVISOR');
  assert(leaveSub.data.requiresPrincipalApproval === false, 'Leave requiresPrincipalApproval is false');

  // Advisor approves Leave
  const advLeaveRes = await request('POST', `/api/od/${leaveId}/advisor-action`, {
    approved: true,
    reason: 'Parent informed, medical certificate verified.'
  }, TOKENS.advisorA);
  assert(advLeaveRes.status === 200, 'Advisor approves Leave request');
  assert(advLeaveRes.data.advisorDecision.signatureBase64 === customAdvisorSig, 'Leave captured Advisor signature');

  // HOD approves Leave (final approval)
  const hodLeaveRes = await request('POST', `/api/od/${leaveId}/hod-action`, {
    approved: true,
    reason: 'Leave sanctioned.'
  }, TOKENS.hod);
  assert(hodLeaveRes.status === 200, 'HOD approves Leave request');
  assert(hodLeaveRes.data.status === 'APPROVED', 'Leave status is final APPROVED');
  assert(hodLeaveRes.data.hodDecision.signatureBase64 === customHodSig, 'Leave captured HOD signature');
  assert(hodLeaveRes.data.principalDecision == null, 'Principal approval NOT required for Leave');

  // Verify Leave PDF
  const leavePdf = await request('GET', `/api/od/${leaveId}/pdf`, null, TOKENS.student);
  assert(leavePdf.status === 200 && leavePdf.buffer.subarray(0, 4).toString() === '%PDF', 'Leave PDF downloaded with %PDF header');

  console.log('\n--- Step 4: Bonafide Certificate Workflow: Advisor -> HOD -> Principal ---');
  const bnfPayload = {
    odType: 'Bonafide Certificate',
    eventTitle: 'Bonafide Certificate Request',
    organizer: 'State Bank of India',
    venue: 'Namakkal Branch',
    startDate: '2026-11-20',
    endDate: '2026-11-20',
    numberOfDays: 1,
    reason: 'Applying for Higher Education Scholarship & Bank Account verification',
    supportingDetails: 'SBI Education Loan Application #4492'
  };
  const bnfSub = await request('POST', '/api/od/submit', bnfPayload, TOKENS.student);
  assert(bnfSub.status === 200, `Bonafide certificate request submitted: ${bnfSub.data?.id}`);
  const bnfId = bnfSub.data.id;
  assert(bnfSub.data.requiresPrincipalApproval === true, 'Bonafide requiresPrincipalApproval is TRUE (3-stage workflow)');
  assert(bnfSub.data.status === 'PENDING_ADVISOR', 'Bonafide status is PENDING_ADVISOR');

  // Check sequence: Principal cannot approve yet
  const earlyPrin = await request('POST', `/api/od/${bnfId}/principal-action`, {
    approved: true,
    reason: 'Sanctioned'
  }, TOKENS.principal);
  assert(earlyPrin.status === 400, 'Principal cannot approve Bonafide before Advisor & HOD approve (HTTP 400)');

  // Advisor approves Bonafide
  const advBnf = await request('POST', `/api/od/${bnfId}/advisor-action`, {
    approved: true,
    reason: 'Student attendance is 92%, bonafide enrollment verified.'
  }, TOKENS.advisorA);
  assert(advBnf.status === 200, 'Advisor approves Bonafide request');
  assert(advBnf.data.status === 'PENDING_HOD', 'Bonafide moves to PENDING_HOD');
  assert(advBnf.data.advisorDecision.signatureBase64 === customAdvisorSig, 'Bonafide captured Advisor signature');

  // Principal still cannot approve (HOD has not approved)
  const midPrin = await request('POST', `/api/od/${bnfId}/principal-action`, {
    approved: true,
    reason: 'Sanctioned'
  }, TOKENS.principal);
  assert(midPrin.status === 400, 'Principal cannot approve Bonafide before HOD approves (HTTP 400)');

  // HOD approves Bonafide
  const hodBnf = await request('POST', `/api/od/${bnfId}/hod-action`, {
    approved: true,
    reason: 'Department credentials verified. Recommended for Principal executive sanction.'
  }, TOKENS.hod);
  assert(hodBnf.status === 200, 'HOD approves Bonafide request');
  assert(hodBnf.data.status === 'PENDING_PRINCIPAL', 'Bonafide moves to PENDING_PRINCIPAL');
  assert(hodBnf.data.currentStage === 'PRINCIPAL', 'Bonafide stage moves to PRINCIPAL');
  assert(hodBnf.data.hodDecision.signatureBase64 === customHodSig, 'Bonafide captured HOD signature');

  // Principal approves Bonafide (final approval)
  const prinBnf = await request('POST', `/api/od/${bnfId}/principal-action`, {
    approved: true,
    reason: 'Institutional bonafide certificate issued under official seal.'
  }, TOKENS.principal);
  assert(prinBnf.status === 200, 'Principal approves Bonafide request');
  assert(prinBnf.data.status === 'APPROVED', 'Bonafide status is final APPROVED');
  assert(prinBnf.data.currentStage === 'COMPLETED', 'Bonafide stage is COMPLETED');
  assert(prinBnf.data.principalDecision != null, 'Bonafide principalDecision recorded');
  assert(prinBnf.data.principalDecision.status === 'APPROVED', 'Bonafide principalDecision is APPROVED');
  assert(prinBnf.data.principalDecision.signatureBase64 === customPrinSig, 'Bonafide captured Principal custom digital signature');
  assert(prinBnf.data.principalDecision.signerName === 'Dr. B. Sanjay Gandhi', 'Bonafide captured Principal signer name');

  // Verify all 3 signatures are present in Bonafide record
  const finalBnf = prinBnf.data;
  assert(finalBnf.advisorDecision?.signatureBase64 != null, 'Class Advisor signature present in final Bonafide record');
  assert(finalBnf.hodDecision?.signatureBase64 != null, 'HOD signature present in final Bonafide record');
  assert(finalBnf.principalDecision?.signatureBase64 != null, 'Principal signature present in final Bonafide record');

  // Verify Bonafide PDF download
  const bnfPdf = await request('GET', `/api/od/${bnfId}/pdf`, null, TOKENS.student);
  assert(bnfPdf.status === 200, 'Student can download approved Bonafide Certificate PDF (HTTP 200)');
  assert(bnfPdf.buffer.subarray(0, 4).toString() === '%PDF', 'Bonafide PDF has valid %PDF header');
  assert(bnfPdf.buffer.length > 1000, `Bonafide PDF generated: ${bnfPdf.buffer.length} bytes`);

  console.log('\n--- Step 5: Rejection Workflow & Signature Isolation ---');
  // OD Request rejected by Advisor
  const rejOdSub = await request('POST', '/api/od/submit', {
    odType: 'Extracurricular / Sports',
    eventTitle: 'District Tournament',
    organizer: 'State Sports Authority',
    venue: 'Salem',
    startDate: `2027-04-${dDay}`,
    endDate: `2027-04-${dDay + 1}`,
    numberOfDays: 2,
    reason: 'Football tournament'
  }, TOKENS.student);
  const rejOdId = rejOdSub.data.id;

  const advRejRes = await request('POST', `/api/od/${rejOdId}/advisor-action`, {
    approved: false,
    reason: 'Internal assessment exam scheduled on requested dates.'
  }, TOKENS.advisorA);
  assert(advRejRes.status === 200, 'Advisor successfully records rejection');
  assert(advRejRes.data.status === 'REJECTED', 'Request status is REJECTED');
  assert(advRejRes.data.currentStage === 'REJECTED', 'Request currentStage is REJECTED');
  assert(advRejRes.data.rejectionReason === 'Internal assessment exam scheduled on requested dates.', 'Rejection reason preserved');
  assert(advRejRes.data.advisorDecision?.signatureBase64 == null, 'No signature attached for rejected advisor decision');

  // HOD cannot act on rejected request
  const hodOnRej = await request('POST', `/api/od/${rejOdId}/hod-action`, {
    approved: true,
    reason: 'Endorsed'
  }, TOKENS.hod);
  assert(hodOnRej.status === 400, 'HOD cannot act on request rejected by Advisor (HTTP 400)');

  // Download PDF should be blocked for rejected request
  const rejPdf = await request('GET', `/api/od/${rejOdId}/pdf`, null, TOKENS.student);
  assert(rejPdf.status === 400, 'PDF download blocked for rejected request (HTTP 400)');

  console.log('\n--- Step 6: Student Notifications Verification ---');
  const notifsRes = await request('GET', '/api/notifications', null, TOKENS.student);
  assert(notifsRes.status === 200, 'Student notifications retrieved');
  const notifList = notifsRes.data;
  assert(Array.isArray(notifList) && notifList.length > 0, `Student has ${notifList.length} notifications`);
  const finalApprovedNotif = notifList.find(n => n.type === 'REQUEST_APPROVED_FINAL' || (n.message && n.message.includes('Approved')));
  assert(finalApprovedNotif != null, 'Student received REQUEST_APPROVED_FINAL notification');
  const rejectedNotif = notifList.find(n => n.type === 'REQUEST_REJECTED' || (n.message && n.message.includes('Rejected')));
  assert(rejectedNotif != null, 'Student received REQUEST_REJECTED notification');

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} assertions passed (${Math.round(passedTests / totalTests * 100)}%)`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL DIGITAL SIGNATURE & APPROVAL WORKFLOW TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please inspect logs above.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
