const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

async function waitForServer() {
  console.log("Waiting for Spring Boot to be ready on port 8080...");
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'gopinath', password: 'bad_password' })
      });
      if (res.status === 401 || res.status === 200 || res.status === 400 || res.status === 403) {
        console.log("Spring Boot backend is UP and accepting requests.");
        return true;
      }
    } catch (e) {
      // wait
    }
    await sleep(2000);
  }
  throw new Error("Spring Boot failed to start within timeout.");
}

async function run() {
  console.log("================================================================================");
  console.log("   EPOCH - STUDENT REQUEST APPROVAL & COMPLAINT ROUTING VERIFICATION SUITE       ");
  console.log("================================================================================");

  try {
    await waitForServer();

    // 0. Authenticate Real Institutional Accounts
    console.log("\n--- 0. Authenticating Institutional Test Accounts ---");
    const advA = await login('arularasi', 'advisor@123');
    assert(advA.role === 'ADVISOR' && advA.section === 'CSE-A', "Advisor A (arularasi) authenticated for Section CSE-A");

    const advB = await login('divyabharathi', 'advisor@123');
    assert(advB.role === 'ADVISOR' && advB.section === 'CSE-B', "Advisor B (divyabharathi) authenticated for Section CSE-B");

    const advC = await login('rajavathijayapriya', 'advisor@123');
    assert(advC.role === 'ADVISOR' && advC.section === 'CSE-C', "Advisor C (rajavathijayapriya) authenticated for Section CSE-C");

    const hod = await login('gopinath', 'hod@123');
    assert(hod.role === 'HOD', "HOD (gopinath) authenticated");

    const principal = await login('bsanjaygandhi', 'principal@123');
    assert(principal.role === 'PRINCIPAL', "Principal (bsanjaygandhi) authenticated");

    const studentA = await login('620823104002', 'student@12');
    assert(studentA.role === 'STUDENT' && studentA.section === 'CSE-A', "Student A (620823104002) authenticated for Section CSE-A");

    const studentB = await login('620823104066', 'student@12');
    assert(studentB.role === 'STUDENT' && studentB.section === 'CSE-B', "Student B (620823104066) authenticated for Section CSE-B");

    const studentC = await login('620823104133', 'student@12');
    assert(studentC.role === 'STUDENT' && studentC.section === 'CSE-C', "Student C (620823104133) authenticated for Section CSE-C");

    // 1. Submit Requests from A, B, and C Section Students
    console.log("\n--- 1. Submitting Requests from A, B, and C Section Students ---");
    
    // Student A (CSE-A) submits OD Request
    const now = Date.now();
    const odPayloadA = {
      odType: "Paper Presentation",
      eventTitle: `National Technical Symposium ${now}`,
      organizer: "PSG College of Technology",
      venue: "Coimbatore",
      startDate: "2026-11-10",
      endDate: "2026-11-11",
      numberOfDays: 2,
      reason: "Presenting research paper on Decentralized AI."
    };
    const subResA = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentA.token}` },
      body: JSON.stringify(odPayloadA)
    });
    const reqA = await subResA.json();
    assert(subResA.status === 200 && reqA.id, `Student A (CSE-A) submitted OD request (${reqA.id}) in PENDING_ADVISOR stage`);

    // Student B (CSE-B) submits Leave Request
    const leavePayloadB = {
      odType: "Day Scholar Leave Letter",
      studentType: "Day Scholar",
      eventTitle: `Medical Leave Application ${now}`,
      organizer: "College Attendance / Leave",
      venue: "Home",
      startDate: "2026-11-12",
      endDate: "2026-11-13",
      numberOfDays: 2,
      reason: "Severe viral fever and physician consultation."
    };
    const subResB = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentB.token}` },
      body: JSON.stringify(leavePayloadB)
    });
    const reqB = await subResB.json();
    assert(subResB.status === 200 && reqB.id, `Student B (CSE-B) submitted Leave request (${reqB.id}) in PENDING_ADVISOR stage`);

    // Student C (CSE-C) submits Bonafide Certificate Request
    const bnfPayloadC = {
      odType: "Bonafide Certificate",
      eventTitle: `Bonafide Certificate - Passport Application ${now}`,
      organizer: "Gnanamani College of Technology",
      venue: "Campus",
      startDate: "2026-11-14",
      endDate: "2026-11-14",
      numberOfDays: 1,
      reason: "Bonafide certificate required for Tatkaal passport processing."
    };
    const subResC = await fetch(`${BASE_URL}/api/od/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentC.token}` },
      body: JSON.stringify(bnfPayloadC)
    });
    const reqC = await subResC.json();
    assert(subResC.status === 200 && reqC.id, `Student C (CSE-C) submitted Bonafide request (${reqC.id}) with requiresPrincipalApproval=true`);

    // 2. Stage 1: Section Routing Isolation Check
    console.log("\n--- 2. Section Routing Isolation Verification ---");
    const queueAdvA = await (await fetch(`${BASE_URL}/api/od/advisor`, { headers: { 'Authorization': `Bearer ${advA.token}` } })).json();
    const queueAdvB = await (await fetch(`${BASE_URL}/api/od/advisor`, { headers: { 'Authorization': `Bearer ${advB.token}` } })).json();
    const queueAdvC = await (await fetch(`${BASE_URL}/api/od/advisor`, { headers: { 'Authorization': `Bearer ${advC.token}` } })).json();

    assert(queueAdvA.some(r => r.id === reqA.id), "Student A request reaches Advisor A (Arularasi)");
    assert(!queueAdvB.some(r => r.id === reqA.id), "Student A request does NOT appear in Advisor B queue");
    assert(!queueAdvC.some(r => r.id === reqA.id), "Student A request does NOT appear in Advisor C queue");

    assert(queueAdvB.some(r => r.id === reqB.id), "Student B request reaches Advisor B (Dhivya Bharathi)");
    assert(!queueAdvA.some(r => r.id === reqB.id), "Student B request does NOT appear in Advisor A queue");
    assert(!queueAdvC.some(r => r.id === reqB.id), "Student B request does NOT appear in Advisor C queue");

    assert(queueAdvC.some(r => r.id === reqC.id), "Student C request reaches Advisor C (Rajavathi Jaya Priya)");
    assert(!queueAdvA.some(r => r.id === reqC.id), "Student C request does NOT appear in Advisor A queue");
    assert(!queueAdvB.some(r => r.id === reqC.id), "Student C request does NOT appear in Advisor B queue");

    // Cross-section approval attempt blocked
    const crossAdvAction = await fetch(`${BASE_URL}/api/od/${reqA.id}/advisor-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advB.token}` },
      body: JSON.stringify({ approved: true, reason: "Unauthorized cross-section approval attempt" })
    });
    assert(crossAdvAction.status === 400 || crossAdvAction.status === 403, "Advisor B blocked from acting on Section A request (Security check passed)");

    // Student self-approval attempt blocked
    const studentSelfAction = await fetch(`${BASE_URL}/api/od/${reqA.id}/advisor-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentA.token}` },
      body: JSON.stringify({ approved: true, reason: "Student trying to self-approve" })
    });
    assert(studentSelfAction.status === 403, "Student blocked from approving their own request (HTTP 403 Forbidden)");

    // 3. Stage 1: Advisor A accepts & signs Student A's OD request
    console.log("\n--- 3. Stage 1: Advisor A accepts OD request ---");
    const advApproveA = await fetch(`${BASE_URL}/api/od/${reqA.id}/advisor-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advA.token}` },
      body: JSON.stringify({ approved: true, reason: "Academic standing verified. Recommended for OD." })
    });
    const updatedReqA_Adv = await advApproveA.json();
    assert(advApproveA.status === 200, "Advisor A accepted Student A request (HTTP 200 OK)");
    assert(updatedReqA_Adv.advisorDecision && updatedReqA_Adv.advisorDecision.status === 'APPROVED', "Advisor decision recorded as APPROVED with comment");
    assert(updatedReqA_Adv.advisorDecision.signatureBase64 && updatedReqA_Adv.advisorDecision.signatureBase64.startsWith('data:image'), "Authorized Class Advisor digital signature applied");
    assert(updatedReqA_Adv.status === 'PENDING_HOD', "Request state automatically advanced to PENDING_HOD");

    // 4. Stage 1: Advisor B declines Student B's Leave request (Workflow stops)
    console.log("\n--- 4. Stage 1: Advisor B declines Leave request (Workflow stops) ---");
    const advDeclineB = await fetch(`${BASE_URL}/api/od/${reqB.id}/advisor-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advB.token}` },
      body: JSON.stringify({ approved: false, reason: "Internal assessment test scheduled on requested dates." })
    });
    const updatedReqB_Adv = await advDeclineB.json();
    assert(advDeclineB.status === 200, "Advisor B declined Student B request (HTTP 200 OK)");
    assert(updatedReqB_Adv.status === 'REJECTED', "Request status changed to REJECTED");
    assert(updatedReqB_Adv.rejectionReason.includes("Internal assessment test"), "Rejection reason recorded in audit log");

    // Verify HOD does NOT receive declined request B
    const hodQueueAfterAdv = await (await fetch(`${BASE_URL}/api/od/hod`, { headers: { 'Authorization': `Bearer ${hod.token}` } })).json();
    assert(!hodQueueAfterAdv.some(r => r.id === reqB.id && r.status === 'PENDING_HOD'), "Declined request B did NOT forward to HOD queue");

    // HOD cannot act on declined request B
    const hodIllegalActionB = await fetch(`${BASE_URL}/api/od/${reqB.id}/hod-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
      body: JSON.stringify({ approved: true, reason: "Illegal HOD approval of declined request" })
    });
    assert(hodIllegalActionB.status === 400 || hodIllegalActionB.status === 403, "HOD prevented from approving request declined by Advisor");

    // 5. Stage 2: HOD reviews and accepts Student A's OD request (Ends with HOD)
    console.log("\n--- 5. Stage 2: HOD accepts OD request (2-Stage Completion) ---");
    assert(hodQueueAfterAdv.some(r => r.id === reqA.id), "Advisor-approved request A appears in HOD review queue");

    const hodApproveA = await fetch(`${BASE_URL}/api/od/${reqA.id}/hod-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
      body: JSON.stringify({ approved: true, reason: "Department sanction granted. Good luck on presentation." })
    });
    const updatedReqA_Hod = await hodApproveA.json();
    assert(hodApproveA.status === 200, "HOD approved Student A request (HTTP 200 OK)");
    assert(updatedReqA_Hod.hodDecision && updatedReqA_Hod.hodDecision.status === 'APPROVED', "HOD decision recorded as APPROVED with comment");
    assert(updatedReqA_Hod.hodDecision.signatureBase64 && updatedReqA_Hod.hodDecision.signatureBase64.startsWith('data:image'), "Authorized HOD digital signature applied");
    assert(updatedReqA_Hod.status === 'APPROVED', "OD approval workflow successfully completed at HOD stage (status=APPROVED)");
    assert(updatedReqA_Hod.advisorDecision && updatedReqA_Hod.advisorDecision.signatureBase64, "Prior advisor signature retained in record");

    // Verify official PDF download is now unlocked
    const pdfResA = await fetch(`${BASE_URL}/api/od/${reqA.id}/pdf`, { headers: { 'Authorization': `Bearer ${studentA.token}` } });
    assert(pdfResA.status === 200 && pdfResA.headers.get('content-type') === 'application/pdf', "Final approved official OD document generated and downloadable");

    // 6. Stage 3: Bonafide Certificate Exception (Advisor -> HOD -> Principal)
    console.log("\n--- 6. Stage 3: Bonafide Certificate 3-Stage Workflow ---");
    // Advisor C approves Bonafide request C
    const advApproveC = await fetch(`${BASE_URL}/api/od/${reqC.id}/advisor-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${advC.token}` },
      body: JSON.stringify({ approved: true, reason: "Section records checked. Recommended for Bonafide issue." })
    });
    assert(advApproveC.status === 200, "Advisor C approved Bonafide request C");

    // HOD approves Bonafide request C -> Moves to PENDING_PRINCIPAL
    const hodApproveC = await fetch(`${BASE_URL}/api/od/${reqC.id}/hod-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hod.token}` },
      body: JSON.stringify({ approved: true, reason: "Endorsed for Principal executive sanction." })
    });
    const updatedReqC_Hod = await hodApproveC.json();
    assert(hodApproveC.status === 200, "HOD approved Bonafide request C");
    assert(updatedReqC_Hod.status === 'PENDING_PRINCIPAL', "Bonafide correctly forwarded to Principal stage (status=PENDING_PRINCIPAL)");

    // Principal reviews Bonafide request C
    const prinQueue = await (await fetch(`${BASE_URL}/api/od/principal`, { headers: { 'Authorization': `Bearer ${principal.token}` } })).json();
    assert(prinQueue.some(r => r.id === reqC.id), "Bonafide request C appears in Principal approval queue");

    // Principal sanctions Bonafide request C
    const prinApproveC = await fetch(`${BASE_URL}/api/od/${reqC.id}/principal-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${principal.token}` },
      body: JSON.stringify({ approved: true, reason: "Institutional Bonafide Certificate sanctioned." })
    });
    const updatedReqC_Prin = await prinApproveC.json();
    assert(prinApproveC.status === 200, "Principal sanctioned Bonafide request C (HTTP 200 OK)");
    assert(updatedReqC_Prin.status === 'APPROVED', "Bonafide workflow finished as APPROVED");
    assert(updatedReqC_Prin.principalDecision && updatedReqC_Prin.principalDecision.signatureBase64, "Authorized Principal digital signature applied");
    assert(updatedReqC_Prin.advisorDecision.signatureBase64 && updatedReqC_Prin.hodDecision.signatureBase64, "All 3 signatures (Advisor, HOD, Principal) preserved in record");

    // 7. Confidential Complaints Routing: Student -> Principal exclusively
    console.log("\n--- 7. Confidential Complaints Routing (Direct to Principal) ---");
    const cmpPayload = {
      subject: `Confidential Hostel Facility Issue ${now}`,
      category: "Infrastructure & Amenities",
      description: "Water heater in Block B 3rd floor requires urgent repair.",
      supportingDetails: "Submitted directly for Principal attention."
    };
    const subCmpRes = await fetch(`${BASE_URL}/api/complaints/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentA.token}` },
      body: JSON.stringify(cmpPayload)
    });
    const cmpData = await subCmpRes.json();
    assert(subCmpRes.status === 200 && cmpData.id, `Student A submitted confidential complaint (${cmpData.id}) directly to Principal`);

    // Verify Principal receives it
    const prinComplaints = await (await fetch(`${BASE_URL}/api/complaints/principal`, { headers: { 'Authorization': `Bearer ${principal.token}` } })).json();
    assert(prinComplaints.some(c => c.id === cmpData.id), "Confidential complaint appears in Principal complaint management queue");

    // Verify Advisor and HOD cannot access complaints queue
    const advCmpRes = await fetch(`${BASE_URL}/api/complaints/principal`, { headers: { 'Authorization': `Bearer ${advA.token}` } });
    assert(advCmpRes.status === 403, "Class Advisor blocked from accessing confidential complaints (HTTP 403 Forbidden)");

    const hodCmpRes = await fetch(`${BASE_URL}/api/complaints/principal`, { headers: { 'Authorization': `Bearer ${hod.token}` } });
    assert(hodCmpRes.status === 403, "HOD blocked from accessing confidential complaints (HTTP 403 Forbidden)");

    // Principal responds to student complaint
    const prinRespondRes = await fetch(`${BASE_URL}/api/complaints/${cmpData.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${principal.token}` },
      body: JSON.stringify({
        status: "RESOLVED",
        response: "Estate office has been instructed to replace the heating element today."
      })
    });
    const updatedCmp = await prinRespondRes.json();
    assert(prinRespondRes.status === 200 && updatedCmp.status === 'RESOLVED', "Principal responded to complaint and marked RESOLVED");

    // Student receives resolution and notification
    const studentCmpList = await (await fetch(`${BASE_URL}/api/complaints/student`, { headers: { 'Authorization': `Bearer ${studentA.token}` } })).json();
    const resolvedCmp = studentCmpList.find(c => c.id === cmpData.id);
    assert(resolvedCmp && resolvedCmp.principalResponse.includes("Estate office"), "Student can view Principal response and resolution in their portal");

    // 8. Session Persistence & Re-Login Verification
    console.log("\n--- 8. Session Persistence Across Re-Login ---");
    const reloginStudentA = await login('620823104002', 'student@12');
    const reloginReqList = await (await fetch(`${BASE_URL}/api/od/student`, { headers: { 'Authorization': `Bearer ${reloginStudentA.token}` } })).json();
    const persistedReqA = reloginReqList.find(r => r.id === reqA.id);
    assert(persistedReqA && persistedReqA.status === 'APPROVED', "Student request record and APPROVED status persisted across login sessions");
    assert(persistedReqA.workflowTimeline && persistedReqA.workflowTimeline.length >= 3, "Complete multi-stage timeline events persisted across sessions");

    console.log("\n================================================================================");
    console.log(`   SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)   `);
    console.log("================================================================================");

  } catch (err) {
    console.error("Test Suite Fatal Error:", err);
  }
}

run();

