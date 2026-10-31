const BASE_URL = 'http://localhost:8080';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

async function run() {
  const hod = await login('gopinath', 'hod@123');
  const res = await fetch(`${BASE_URL}/api/od/hod`, {
    headers: { 'Authorization': `Bearer ${hod.token}` }
  });
  const data = await res.json();
  const pending = data.filter(r => r.status === 'PENDING_HOD' || r.currentStage === 'HOD');
  console.log("PENDING COUNT:", pending.length);
  console.log(JSON.stringify(pending, null, 2));
}

run().catch(console.error);
