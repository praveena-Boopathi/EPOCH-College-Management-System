const BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`);
  return await res.json();
}

async function run() {
  const hod = await login('gopinath', 'hod@123');
  console.log("HOD Token received. Fetching /api/od/hod...");
  const res = await fetch(`${BASE_URL}/api/od/hod`, {
    headers: { 'Authorization': `Bearer ${hod.token}` }
  });
  const data = await res.json();
  console.log(`Total requests returned to HOD: ${data.length}`);
  data.forEach((r, idx) => {
    console.log(`[${idx+1}] ID: ${r.id} | Status: ${r.status} | Stage: ${r.currentStage} | Reviewer: ${r.assignedReviewerId} (${r.assignedReviewerRole}) | Student: ${r.studentName} (${r.regNo}, ${r.section}) | Type: ${r.odType} | advDecision: ${r.advisorDecision ? r.advisorDecision.status : 'none'} | hodDecision: ${r.hodDecision ? r.hodDecision.status : 'none'}`);
  });
}

run().catch(console.error);
