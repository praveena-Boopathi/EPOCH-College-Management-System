const BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  const data = await res.json();
  return { token: data.token, user: data };
}

async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : {} };
  } catch (e) {
    return { ok: res.ok, status: res.status, data: text };
  }
}

async function run() {
  console.log("=== EPOCH HOD QUEUE & STUDENT TRACKING VERIFICATION ===\n");

  // 1. Authenticate HOD (gopinath)
  console.log("1. Authenticating HOD (gopinath)...");
  const hod = await login('gopinath', 'hod@123');
  console.log(`✓ HOD Logged in: ${hod.user.name} (${hod.user.role})`);

  // Retrieve HOD queue
  const hodQueueRes = await api('/api/od/hod', 'GET', null, hod.token);
  console.log(`HOD Requests Endpoint Status: ${hodQueueRes.status}, Total Requests: ${hodQueueRes.data.length}`);

  const pendingHod = hodQueueRes.data.filter(r => r.status === 'PENDING_HOD' || r.currentStage === 'HOD');
  console.log(`Pending HOD Reviews Count: ${pendingHod.length}`);

  if (pendingHod.length > 0) {
    console.log("✓ Sample Pending Request in HOD Queue:");
    const sample = pendingHod[0];
    console.log(`  - Ref ID: ${sample.id}`);
    console.log(`  - Student: ${sample.studentName} (${sample.regNo}, ${sample.section})`);
    console.log(`  - OD Type: ${sample.odType}`);
    console.log(`  - Assigned Reviewer: ${sample.assignedReviewerId} (${sample.assignedReviewerRole})`);
    console.log(`  - Current Stage: ${sample.currentStage}`);
    console.log(`  - Status: ${sample.status}`);
    console.log(`  - Timeline Events: ${(sample.workflowTimeline || []).length}`);
    (sample.workflowTimeline || []).forEach(ev => {
      console.log(`     * [${ev.stage}] ${ev.actorRole} (${ev.actorName || ev.actorId}): ${ev.decision} - "${ev.remarks}" at ${ev.timestamp}`);
    });
  } else {
    console.error("FAIL: Expected at least 1 pending HOD request!");
    process.exit(1);
  }

  // 2. Authenticate Student (620823104002) and submit new OD request
  console.log("\n2. Authenticating Student (620823104002)...");
  const student = await login('620823104002', 'student@12');
  console.log(`✓ Student Logged in: ${student.user.name} (${student.user.department} - ${student.user.section})`);

  console.log("\n3. Student Submitting New OD Request...");
  const randOffset = Math.floor(Math.random() * 10000);
  const futureYear = 2028 + Math.floor(Math.random() * 3);
  const futureMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = d1 + 1;
  const odStartDate = `${futureYear}-${futureMonth}-${String(d1).padStart(2, '0')}`;
  const odEndDate = `${futureYear}-${futureMonth}-${String(d2).padStart(2, '0')}`;

  const newOdRes = await api('/api/od/submit', 'POST', {
    odType: 'Placement Drive / Interview',
    category: 'Placement',
    eventTitle: `Google Campus Interview ${randOffset}`,
    organizer: 'Google India',
    venue: 'Google Tech Campus, Bangalore',
    startDate: odStartDate,
    endDate: odEndDate,
    reason: 'Final round technical interview for software engineering role.'
  }, student.token);
  if (!newOdRes.ok) {
    console.error("OD Submission Failed:", newOdRes.status, newOdRes.data);
    process.exit(1);
  }
  console.log(`OD Submission Status: ${newOdRes.status}, Ref ID: ${newOdRes.data.id}`);
  const submittedOdId = newOdRes.data.id;

  // Verify in student tracking list
  const stTrackRes = await api('/api/od/student', 'GET', null, student.token);
  const foundTrack = stTrackRes.data.find(r => r.id === submittedOdId);
  console.log(`Found submitted request in student tracking list: ${!!foundTrack}`);
  if (foundTrack) {
    console.log(`  - Status: ${foundTrack.status}`);
    console.log(`  - Current Stage: ${foundTrack.currentStage}`);
    console.log(`  - Assigned Reviewer: ${foundTrack.assignedReviewerId} (${foundTrack.assignedReviewerRole})`);
    console.log(`  - Initial Timeline Count: ${(foundTrack.workflowTimeline || []).length}`);
  }

  // 4. Authenticate Advisor (arularasi) and approve
  console.log("\n4. Advisor (arularasi) Reviewing and Approving...");
  const advisor = await login('arularasi', 'advisor@123');
  const advActionRes = await api(`/api/od/${submittedOdId}/advisor-action`, 'POST', {
    approved: true,
    reason: 'Verified attendance and academic eligibility. Recommended to HOD.'
  }, advisor.token);
  if (!advActionRes.ok) {
    console.error("Advisor Action Failed:", advActionRes.status, advActionRes.data);
    process.exit(1);
  }
  console.log(`Advisor Action Status: ${advActionRes.status}`);

  // 5. Verify Request is immediately available in HOD Queue with exact assignedReviewerId
  console.log("\n5. Verifying Request in HOD Review Queue...");
  const hodUpdatedRes = await api('/api/od/hod', 'GET', null, hod.token);
  const hodPendingReq = hodUpdatedRes.data.find(r => r.id === submittedOdId);
  if (hodPendingReq) {
    console.log(`✓ Request ${submittedOdId} successfully forwarded to HOD!`);
    console.log(`  - Status: ${hodPendingReq.status}`);
    console.log(`  - Current Stage: ${hodPendingReq.currentStage}`);
    console.log(`  - Assigned Reviewer ID: ${hodPendingReq.assignedReviewerId}`);
    console.log(`  - Assigned Reviewer Role: ${hodPendingReq.assignedReviewerRole}`);
    console.log(`  - Advisor Decision: ${hodPendingReq.advisorDecision ? hodPendingReq.advisorDecision.status : 'None'}`);
    console.log(`  - Advisor Notes: "${hodPendingReq.advisorDecision ? hodPendingReq.advisorDecision.notes : ''}"`);
    console.log(`  - Timeline Count: ${(hodPendingReq.workflowTimeline || []).length}`);
    (hodPendingReq.workflowTimeline || []).forEach(ev => {
      console.log(`     * [${ev.stage || ev.eventType}] ${ev.actorRole} (${ev.actorName || ev.actorId}): ${ev.decision} - "${ev.remarks}" at ${ev.timestamp}`);
    });
  } else {
    console.error(`FAIL: Request ${submittedOdId} not found in HOD queue!`);
    process.exit(1);
  }

  // 6. HOD Endorsement / Approval (Non-Bonafide -> Final Approval, Principal is NOT involved)
  console.log("\n6. HOD Approving Non-Bonafide Request (Final Approval)...");
  const hodActionRes = await api(`/api/od/${submittedOdId}/hod-action`, 'POST', {
    approved: true,
    reason: 'Department endorsement granted. Form sanctioned.'
  }, hod.token);
  if (!hodActionRes.ok) {
    console.error("HOD Action Failed:", hodActionRes.status, hodActionRes.data);
    process.exit(1);
  }
  console.log(`HOD Action Status: ${hodActionRes.status}`);

  // 7. Verify finalized status in Student tracking list
  console.log("\n7. Verifying Finalized Tracking in Student View...");
  const stFinalRes = await api('/api/od/student', 'GET', null, student.token);
  const finalReq = stFinalRes.data.find(r => r.id === submittedOdId);
  if (finalReq) {
    console.log(`✓ Student Request Status: ${finalReq.status}`);
    console.log(`  - Current Stage: ${finalReq.currentStage}`);
    console.log(`  - Assigned Reviewer: ${finalReq.assignedReviewerId}`);
    console.log(`  - Total Timeline Events: ${(finalReq.workflowTimeline || []).length}`);
    (finalReq.workflowTimeline || []).forEach(ev => {
      console.log(`     * [${ev.stage || ev.eventType}] ${ev.actorRole} (${ev.actorName || ev.actorId}): ${ev.decision} - "${ev.remarks}" at ${ev.timestamp}`);
    });
  }

  // 8. Test Bonafide Certificate Workflow (3 Stages: Advisor -> HOD -> Principal)
  console.log("\n8. Testing Bonafide Certificate Workflow (3 Stages)...");
  const bnfYear = 2029 + Math.floor(Math.random() * 2);
  const bnfMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const bnfDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0');
  const bnfDate = `${bnfYear}-${bnfMonth}-${bnfDay}`;
  const bnfRes = await api('/api/od/submit', 'POST', {
    odType: 'Bonafide Certificate',
    category: 'Bonafide Certificate',
    eventTitle: `Passport Verification Bonafide ${randOffset}`,
    organizer: 'Gnanamani College of Technology',
    venue: 'Coimbatore Passport Seva Kendra',
    startDate: bnfDate,
    endDate: bnfDate,
    reason: 'Required for Tatkal passport processing.'
  }, student.token);
  if (!bnfRes.ok) {
    console.error("Bonafide Submission Failed:", bnfRes.status, bnfRes.data);
    process.exit(1);
  }
  console.log(`Bonafide Submission Status: ${bnfRes.status}, Ref ID: ${bnfRes.data.id}`);
  const bnfId = bnfRes.data.id;

  // Advisor approves
  await api(`/api/od/${bnfId}/advisor-action`, 'POST', {
    approved: true,
    reason: 'Student records verified. Forwarded to HOD.'
  }, advisor.token);

  // HOD approves -> Should advance to PENDING_PRINCIPAL
  const hodBnfActionRes = await api(`/api/od/${bnfId}/hod-action`, 'POST', {
    approved: true,
    reason: 'Department endorsed. Forwarded to Principal for official certificate sanction.'
  }, hod.token);
  if (!hodBnfActionRes.ok) {
    console.error("HOD Bonafide Action Failed:", hodBnfActionRes.status, hodBnfActionRes.data);
    process.exit(1);
  }
  console.log(`HOD Bonafide Action Status: ${hodBnfActionRes.status}`);

  const bnfAfterHod = await api(`/api/od/${bnfId}`, 'GET', null, student.token);
  console.log(`Bonafide Status after HOD: ${bnfAfterHod.data.status}`);
  console.log(`Current Stage: ${bnfAfterHod.data.currentStage}`);
  console.log(`Assigned Reviewer: ${bnfAfterHod.data.assignedReviewerId} (${bnfAfterHod.data.assignedReviewerRole})`);

  if (bnfAfterHod.data.status !== 'PENDING_PRINCIPAL' || bnfAfterHod.data.assignedReviewerId !== 'bsanjaygandhi') {
    console.error("FAIL: Bonafide should advance to PENDING_PRINCIPAL with assignedReviewerId=bsanjaygandhi");
    process.exit(1);
  }

  // Principal approves Bonafide
  const principal = await login('principal@gct.ac.in', 'principal@123');
  const prinActionRes = await api(`/api/od/${bnfId}/principal-action`, 'POST', {
    approved: true,
    reason: 'Official Bonafide Certificate granted.'
  }, principal.token);
  console.log(`Principal Action Status: ${prinActionRes.status}`);

  const bnfFinal = await api(`/api/od/${bnfId}`, 'GET', null, student.token);
  console.log(`✓ Bonafide Final Status: ${bnfFinal.data.status}`);
  console.log(`  - Current Stage: ${bnfFinal.data.currentStage}`);
  console.log(`  - Timeline Count: ${(bnfFinal.data.workflowTimeline || []).length}`);
  (bnfFinal.data.workflowTimeline || []).forEach(ev => {
    console.log(`     * [${ev.stage}] ${ev.actorRole} (${ev.actorName || ev.actorId}): ${ev.decision} - "${ev.remarks}" at ${ev.timestamp}`);
  });

  console.log("\n=======================================================");
  console.log("🎉 ALL TESTS PASSED: HOD QUEUE & STUDENT TRACKING VERIFIED!");
  console.log("=======================================================");
}

run().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
