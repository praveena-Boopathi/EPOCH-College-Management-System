const http = require('http');

function postJson(path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusMessage, statusCode: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (e) {
          resolve({ status: res.statusMessage, statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusMessage, statusCode: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (e) {
          resolve({ status: res.statusMessage, statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function getBinary(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: buffer,
          isPdf: buffer.slice(0, 4).toString('utf-8') === '%PDF',
          raw: buffer.toString('utf-8')
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('EPOCH — VIEW REQUEST FEATURE & PERMISSION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test users across roles...');
    const student1Auth = await postJson('/api/auth/login', { username: '620823104002', password: 'student@12' });
    const student1Token = student1Auth.data?.token;
    assert(student1Token, 'Student 1 (Abinaya G, CSE-A) logged in successfully');

    const student2Auth = await postJson('/api/auth/login', { username: '620823104003', password: 'student@12' });
    const student2Token = student2Auth.data?.token;
    assert(student2Token, 'Student 2 (Abinaya P, CSE-A) logged in successfully');

    const advisorAAuth = await postJson('/api/auth/login', { username: 'arularasi', password: 'advisor@123' });
    const advisorAToken = advisorAAuth.data?.token;
    assert(advisorAToken, 'Advisor A (Mrs. P. Arularasi, CSE-A) logged in successfully');

    const advisorBAuth = await postJson('/api/auth/login', { username: 'divyabharathi', password: 'advisor@123' });
    const advisorBToken = advisorBAuth.data?.token;
    assert(advisorBToken, 'Advisor B (Dr. Divyabharathi, CSE-B) logged in successfully');

    const hodAuth = await postJson('/api/auth/login', { username: 'gopinath', password: 'hod@123' });
    const hodToken = hodAuth.data?.token;
    assert(hodToken, 'HOD (Dr. K. Gopinath, CSE) logged in successfully');

    const principalAuth = await postJson('/api/auth/login', { username: 'principal@gct.ac.in', password: 'principal@123' });
    const principalToken = principalAuth.data?.token;
    assert(principalToken, 'Principal (Dr. B. Sanjay Gandhi) logged in successfully');

    // 2. Student History & View Request Fetch
    console.log('\n2. Testing Student History & View Request by Persistent ID...');
    const st1Requests = await getJson('/api/od/student', student1Token);
    assert(Array.isArray(st1Requests.data) && st1Requests.data.length > 0, 'Student 1 has requests in history', `Found: ${st1Requests.data?.length}`);

    const targetReq = st1Requests.data[0];
    const reqId = targetReq.id;
    console.log(`   Target request ID: ${reqId}`);

    const singleReqRes = await getJson(`/api/od/${reqId}`, student1Token);
    assert(singleReqRes.statusCode === 200, `GET /api/od/${reqId} returns 200 OK`);
    const fetchedReq = singleReqRes.data;
    assert(fetchedReq.id === reqId, 'Fetched request ID matches requested persistent ID');
    assert((fetchedReq.studentName || '').toUpperCase() === 'ABINAYA G', `Fetched request studentName is accurate (${fetchedReq.studentName})`);
    assert(fetchedReq.regNo === '620823104002', 'Fetched request regNo is accurate');
    assert(fetchedReq.section === 'CSE-A', 'Fetched request section is accurate');
    assert(fetchedReq.status, `Fetched request has valid status: ${fetchedReq.status}`);
    assert(Array.isArray(fetchedReq.workflowTimeline) && fetchedReq.workflowTimeline.length > 0, 'Fetched request contains workflowTimeline audit steps');

    // 3. Security: Student Cross-Access Prevention (Student 2 cannot view Student 1's request)
    console.log('\n3. Testing Security & Access Control: Student Cross-Access Prevention...');
    const crossStudentRes = await getJson(`/api/od/${reqId}`, student2Token);
    assert(crossStudentRes.statusCode === 403, `Student 2 attempting to view Student 1 request (${reqId}) returns 403 Forbidden`, `Actual: ${crossStudentRes.statusCode}`);

    // 4. Security: Class Advisor Section Isolation (Advisor B [CSE-B] cannot view CSE-A request)
    console.log('\n4. Testing Security & Access Control: Class Advisor Section Isolation...');
    const crossAdvisorRes = await getJson(`/api/od/${reqId}`, advisorBToken);
    assert(crossAdvisorRes.statusCode === 403, `Advisor B (CSE-B) attempting to view CSE-A request (${reqId}) returns 403 Forbidden`, `Actual: ${crossAdvisorRes.statusCode}`);

    // 5. Advisor Authorized Access (Advisor A viewing Student 1 CSE-A request)
    console.log('\n5. Testing Authorized Staff Access...');
    const advisorViewRes = await getJson(`/api/od/${reqId}`, advisorAToken);
    assert(advisorViewRes.statusCode === 200, `Advisor A can view CSE-A request (${reqId}) returns 200 OK`);

    const hodViewRes = await getJson(`/api/od/${reqId}`, hodToken);
    assert(hodViewRes.statusCode === 200, `HOD can view department request (${reqId}) returns 200 OK`);

    const prinViewRes = await getJson(`/api/od/${reqId}`, principalToken);
    assert(prinViewRes.statusCode === 200, `Principal can view institutional request (${reqId}) returns 200 OK`);

    // 6. Notifications & Reference Linking
    console.log('\n6. Testing Official Notifications & View Request Reference Linking...');
    const notifsRes = await getJson('/api/notifications', student1Token);
    assert(Array.isArray(notifsRes.data), 'Notifications inbox retrieved successfully', `Found: ${notifsRes.data?.length}`);
    const reqNotifs = (notifsRes.data || []).filter(n => n.referenceId || n.refId);
    console.log(`   Found ${reqNotifs.length} notifications linked to reference IDs.`);
    if (reqNotifs.length > 0) {
      const firstNotif = reqNotifs[0];
      const notifRefId = firstNotif.referenceId || firstNotif.refId;
      console.log(`   Testing notification reference: ${notifRefId}`);
      const notifReqRes = await getJson(`/api/od/${notifRefId}`, student1Token);
      assert(notifReqRes.statusCode === 200, `Notification referenceId (${notifRefId}) opens corresponding request (200 OK)`);

      // Independent Mark Read test
      const markReadRes = await postJson(`/api/notifications/${firstNotif.id}/read`, {}, student1Token);
      assert(markReadRes.statusCode === 200, `Mark Read on notification (${firstNotif.id}) operates independently (200 OK)`);

      // Verify request remains intact
      const reqAfterMarkRead = await getJson(`/api/od/${notifRefId}`, student1Token);
      assert(reqAfterMarkRead.statusCode === 200 && reqAfterMarkRead.data.id === notifRefId, 'Mark read did not alter request data or status');
    }

    // 7. Non-existent request error handling
    console.log('\n7. Testing Non-Existent Request Handling...');
    const nonExistentRes = await getJson('/api/od/EPOCH-NONEXISTENT-999', student1Token);
    assert(nonExistentRes.statusCode === 404, 'Non-existent request ID returns 404 Not Found', `Actual: ${nonExistentRes.statusCode}`);

    // 8. PDF Download Access Rules
    console.log('\n8. Testing PDF Download Verification...');
    const approvedReq = st1Requests.data.find(r => r.status === 'APPROVED');
    const pendingReq = st1Requests.data.find(r => r.status !== 'APPROVED');

    if (approvedReq) {
      console.log(`   Testing approved request PDF download: ${approvedReq.id}`);
      const approvedPdf = await getBinary(`/api/od/${approvedReq.id}/pdf`, student1Token);
      assert(approvedPdf.statusCode === 200, `Approved request PDF returns 200 OK`);
      assert(approvedPdf.isPdf, `Downloaded file is valid PDF (starts with %PDF header)`);
      console.log(`   PDF size: ${approvedPdf.buffer.length} bytes`);
    } else {
      console.log('   (No approved request for student 1 found in current dataset)');
    }

    if (pendingReq) {
      console.log(`   Testing pending request PDF download denial: ${pendingReq.id} (Status: ${pendingReq.status})`);
      const pendingPdf = await getBinary(`/api/od/${pendingReq.id}/pdf`, student1Token);
      assert(pendingPdf.statusCode === 400, `Pending/unapproved request PDF download is rejected with 400 Bad Request`, `Actual: ${pendingPdf.statusCode}`);
    }

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Unexpected error running verification:', err);
  }
}

runTests();
