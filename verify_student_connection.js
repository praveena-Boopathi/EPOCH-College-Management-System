const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    process.exit(1);
  } else {
    console.log('✅ PASS:', message);
  }
}

async function run() {
  console.log('====================================================');
  console.log('EPOCH Student Backend & Firestore Connection Test');
  console.log('====================================================\n');

  // Test 1: Static assets and student UI
  console.log('--- Test Suite 1: Frontend Static Assets & Security UI ---');
  const indexRes = await request({ hostname: '127.0.0.1', port: 8080, path: '/', method: 'GET' });
  assert(indexRes.status === 200, 'Frontend index.html loads successfully (200 OK)');
  assert(indexRes.body.includes('id="loginIdentifier"'), 'Student registration number input present');
  assert(indexRes.body.includes('placeholder="Enter your registration number"'), 'Clean registration number placeholder (no hardcoded demo credentials)');
  assert(indexRes.body.includes('id="loginPassword"'), 'Student password input present');
  assert(indexRes.body.includes('id="togglePasswordBtn"'), 'Show/hide password toggle button present');
  assert(indexRes.body.includes('Sign in with your registered credentials.'), 'Professional guidance message present');

  const authJsRes = await request({ hostname: '127.0.0.1', port: 8080, path: '/js/auth.js', method: 'GET' });
  assert(authJsRes.status === 200, 'auth.js loads successfully');
  assert(authJsRes.body.includes('/api/auth/login'), 'auth.js connects directly to /api/auth/login');
  assert(!authJsRes.body.includes('firebase-service-account'), 'No service-account keys or secrets exposed in frontend JS');

  // Test 2: Real Student Login (Abinaya G - 620823104002)
  console.log('\n--- Test Suite 2: Real Student Authentication (Abinaya G) ---');
  const student1Res = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: '620823104002', password: 'student@12' });

  assert(student1Res.status === 200, 'Student 620823104002 authenticated successfully (200 OK)');
  assert(student1Res.data && !!student1Res.data.token, 'Authoritative JWT token received');
  assert(student1Res.data.role === 'STUDENT', 'User role is verified as STUDENT');
  assert(student1Res.data.identifier === '620823104002', 'Student registration number verified');
  assert(student1Res.data.name === 'ABINAYA G', 'Real student name returned: ABINAYA G');
  assert(student1Res.data.section === 'CSE-A', 'Student section verified: CSE-A');
  assert(student1Res.data.department === 'CSE', 'Student department verified: CSE');
  assert(student1Res.data.password === undefined, 'Plaintext password is NEVER returned in response');
  assert(student1Res.data.passwordHash === undefined, 'Password hash is NEVER exposed in response');

  const token1 = student1Res.data.token;

  // Test 3: Real Student Login (Abinaya P - 620823104003)
  console.log('\n--- Test Suite 3: Second Registered Student (Abinaya P) ---');
  const student2Res = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: '620823104003', password: 'student@12' });

  assert(student2Res.status === 200, 'Student 620823104003 authenticated successfully (200 OK)');
  assert(student2Res.data.name === 'ABINAYA P', 'Individual student identity confirmed (ABINAYA P, not ABINAYA G)');
  assert(student2Res.data.identifier === '620823104003', 'Student registration number verified: 620823104003');

  // Test 4: Real Student Login (Arunachalam M - 620823104015)
  console.log('\n--- Test Suite 4: Third Registered Student (Arunachalam M) ---');
  const student3Res = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: '620823104015', password: 'student@12' });

  assert(student3Res.status === 200, 'Student 620823104015 authenticated successfully (200 OK)');
  assert(student3Res.data.name === 'ARUNACHALAM M', 'Individual student identity confirmed: ARUNACHALAM M');

  // Test 5: Negative Authentication Tests
  console.log('\n--- Test Suite 5: Credential Security & Negative Tests ---');
  const badPassRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: '620823104002', password: 'invalid_password_xyz' });

  assert(badPassRes.status === 401, 'Invalid password rejected with 401 Unauthorized');
  assert(badPassRes.data && badPassRes.data.error === 'Invalid password.', 'Appropriate error message: "Invalid password."');

  const unknownStudentRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: '999999999999', password: 'student@12' });

  assert(unknownStudentRes.status === 401, 'Unregistered registration number rejected with 401 Unauthorized');
  assert(unknownStudentRes.data && unknownStudentRes.data.error === 'Invalid registration number or username.', 'Appropriate error message: "Invalid registration number or username."');

  // Test 6: Authorized API Access with JWT
  console.log('\n--- Test Suite 6: Authorized Student API Access via JWT ---');
  const meRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(meRes.status === 200, '/api/auth/me validates JWT token (200 OK)');
  assert(meRes.data.identifier === '620823104002', '/api/auth/me returns authenticated student registration number');
  assert(meRes.data.name === 'ABINAYA G', '/api/auth/me returns student name: ABINAYA G');

  const odRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/od/student',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(odRes.status === 200, 'Student OD requests endpoint accessible with JWT (200 OK)');
  assert(Array.isArray(odRes.data), 'Returns student OD array');

  const cmpRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/complaints/student',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert(cmpRes.status === 200, 'Student Complaints endpoint accessible with JWT (200 OK)');
  assert(Array.isArray(cmpRes.data), 'Returns student complaints array');

  // Test 7: Unauthorized Access Protection
  console.log('\n--- Test Suite 7: Unauthorized Access Protection ---');
  const noTokenRes = await request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/od/student',
    method: 'GET'
  });
  assert(noTokenRes.status === 401 || noTokenRes.status === 403, 'Unauthenticated request to /api/od/student is rejected (401/403)');

  console.log('\n====================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
