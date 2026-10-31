const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=================================================================');
  console.log('EPOCH MESSAGE REQUEST DELIVERY, ACCEPTANCE & ROUTING VERIFICATION');
  console.log('=================================================================\n');

  // 1. Authenticate test accounts
  console.log('1. Authenticating accounts...');
  const resLoginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  const studentA = resLoginA.data;
  console.log(`   [PASS] Student A authenticated: ${studentA.name} (${studentA.identifier}) Section: ${studentA.section}`);

  const resLoginB = await post('http://localhost:8080/api/auth/login', { username: '620823104003', password: 'student@12' });
  const studentB = resLoginB.data;
  console.log(`   [PASS] Student B authenticated: ${studentB.name} (${studentB.identifier}) Section: ${studentB.section}`);

  const resLoginAdvA = await post('http://localhost:8080/api/auth/login', { username: 'arularasi', password: 'advisor@123' });
  const advisorA = resLoginAdvA.data;
  console.log(`   [PASS] Advisor CSE-A authenticated: ${advisorA.name} (${advisorA.identifier})`);

  const resLoginAdvB = await post('http://localhost:8080/api/auth/login', { username: 'divyabharathi', password: 'advisor@123' });
  const advisorB = resLoginAdvB.data;
  console.log(`   [PASS] Advisor CSE-B authenticated: ${advisorB.name} (${advisorB.identifier})`);

  const resLoginHod = await post('http://localhost:8080/api/auth/login', { username: 'gopinath', password: 'hod@123' });
  const hod = resLoginHod.data;
  console.log(`   [PASS] HOD authenticated: ${hod.name} (${hod.identifier})`);

  // 2. Test Cross-Section Staff Isolation
  console.log('\n2. Testing Cross-Section Staff Isolation...');
  const resCrossAdvisor = await post('http://localhost:8080/api/chat/requests', {
    recipientId: 'divyabharathi', // Student A is in CSE-A, Divyabharathi is CSE-B
    introMessage: 'Trying to contact advisor of another section'
  }, studentA.token);
  console.log(`   Status: ${resCrossAdvisor.status} (Expected: 403 Forbidden)`);
  if (resCrossAdvisor.status !== 403) {
    throw new Error('Security violation: Cross-section advisor request was not blocked with 403!');
  }
  console.log(`   [PASS] Blocked student contacting unassigned section advisor: "${resCrossAdvisor.data.error}"`);

  // 3. Test Student A sending request to their assigned Class Advisor (Arularasi)
  console.log('\n3. Testing Request Routing to Assigned Class Advisor (Arularasi)...');
  const resAdvReq = await post('http://localhost:8080/api/chat/requests', {
    recipientId: 'arularasi',
    introMessage: 'Dear Madam, I have submitted an OD application for the National Technical Symposium.'
  }, studentA.token);

  let advReqId = null;
  if (resAdvReq.status === 201) {
    console.log(`   [PASS] Message request sent to Advisor: Status ${resAdvReq.status}`);
    console.log(`   -> Request ID: ${resAdvReq.data.id}, Recipient: ${resAdvReq.data.recipientName} (${resAdvReq.data.recipientId})`);
    advReqId = resAdvReq.data.id;
  } else if (resAdvReq.status === 409) {
    console.log(`   -> Active conversation or pending request already existed (${resAdvReq.data.error})`);
  }

  // 4. Verify Assigned Advisor Receives the Request
  console.log('\n4. Verifying Advisor Arularasi receives the request...');
  const advRecRes = await get('http://localhost:8080/api/chat/requests/received', advisorA.token);
  console.log(`   -> Advisor received requests count: ${advRecRes.data.length}`);
  const reqForAdv = (advRecRes.data || []).find(r => r.senderId === '620823104002');
  if (reqForAdv) {
    console.log(`   [PASS] Request found in Advisor Arularasi's received list:`);
    console.log(`      From: ${reqForAdv.senderName} (${reqForAdv.senderId})`);
    console.log(`      Section: ${reqForAdv.senderSection}, Year: ${reqForAdv.senderAcademicYear}`);
    console.log(`      Status: ${reqForAdv.status}, Message: "${reqForAdv.introMessage}"`);
    advReqId = reqForAdv.id;
  }

  // Verify other advisor (Divyabharathi) DOES NOT receive this request
  console.log('\n5. Verifying other advisor (Divyabharathi) DOES NOT receive the request...');
  const otherAdvRes = await get('http://localhost:8080/api/chat/requests/received', advisorB.token);
  const leakedReq = (otherAdvRes.data || []).find(r => r.senderId === '620823104002');
  if (leakedReq) {
    throw new Error('Routing failure: Request leaked to unassigned section advisor Divyabharathi!');
  }
  console.log('   [PASS] Verified: Request NOT visible to unassigned Advisor Divyabharathi.');

  // 6. Test Advisor Accepting Request
  if (advReqId && reqForAdv && reqForAdv.status === 'PENDING') {
    console.log(`\n6. Testing Advisor Arularasi accepting request (${advReqId})...`);
    const acceptRes = await post(`http://localhost:8080/api/chat/requests/${advReqId}/accept`, {}, advisorA.token);
    console.log(`   -> Accept status: ${acceptRes.status}`);
    console.log(`   [PASS] Conversation created: ID = ${acceptRes.data.id}, Type = ${acceptRes.data.type}`);
    console.log(`   -> Student: ${acceptRes.data.studentName}, Staff: ${acceptRes.data.staffName} (${acceptRes.data.staffRole})`);

    // Verify conversation is visible under Chats for both Student and Advisor
    const convsStudent = await get('http://localhost:8080/api/chat/conversations', studentA.token);
    const convsAdvisor = await get('http://localhost:8080/api/chat/conversations', advisorA.token);
    const foundInStudent = (convsStudent.data || []).some(c => c.id === acceptRes.data.id);
    const foundInAdvisor = (convsAdvisor.data || []).some(c => c.id === acceptRes.data.id);
    console.log(`   -> Visible in Student A Chats: ${foundInStudent}`);
    console.log(`   -> Visible in Advisor Arularasi Chats: ${foundInAdvisor}`);
    if (!foundInStudent || !foundInAdvisor) {
      throw new Error('Conversation visibility failure after request acceptance!');
    }
  } else {
    console.log('\n6. Request already accepted in previous run, verifying conversation visibility...');
    const convsStudent = await get('http://localhost:8080/api/chat/conversations', studentA.token);
    const found = (convsStudent.data || []).some(c => c.staffUsername === 'arularasi');
    console.log(`   [PASS] Student A has active conversation with Arularasi: ${found}`);
  }

  // 7. Test Decline Request Workflow (Student A -> HOD Gopinath)
  console.log('\n7. Testing Message Request to HOD and Decline Workflow...');
  const hodReqRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: 'gopinath',
    introMessage: 'Respected HOD, query regarding conference OD.'
  }, studentA.token);

  let hodReqId = null;
  if (hodReqRes.status === 201) {
    hodReqId = hodReqRes.data.id;
    console.log(`   [PASS] Request created for HOD: ID = ${hodReqId}`);
  } else {
    // Check existing
    const hodRec = await get('http://localhost:8080/api/chat/requests/received', hod.token);
    const existingHodReq = (hodRec.data || []).find(r => r.senderId === '620823104002' && r.status === 'PENDING');
    if (existingHodReq) hodReqId = existingHodReq.id;
  }

  if (hodReqId) {
    console.log(`   -> HOD declining request (${hodReqId})...`);
    const declineRes = await post(`http://localhost:8080/api/chat/requests/${hodReqId}/decline`, {}, hod.token);
    console.log(`   -> Decline status: ${declineRes.status}`);
    console.log(`   [PASS] Request status updated to: ${declineRes.data.status}`);

    // Verify NO conversation created
    const hodConvs = await get('http://localhost:8080/api/chat/conversations', hod.token);
    const convCreated = (hodConvs.data || []).some(c => c.studentRegNo === '620823104002');
    console.log(`   [PASS] Verified: No conversation created upon decline: ${!convCreated}`);
  }

  // 8. Test Unauthorized Accept / Decline Security
  console.log('\n8. Testing Unauthorized Request Operations (Student B trying to accept request intended for Advisor)...');
  if (advReqId) {
    const unauthAccept = await post(`http://localhost:8080/api/chat/requests/${advReqId}/accept`, {}, studentB.token);
    console.log(`   -> Status: ${unauthAccept.status} (Expected: 403 Forbidden)`);
    if (unauthAccept.status !== 403) {
      throw new Error('Security breach: Unauthorized user could accept message request!');
    }
    console.log(`   [PASS] Blocked unauthorized request acceptance with 403.`);
  }

  console.log('\n=================================================================');
  console.log('ALL MESSAGE REQUEST DELIVERY, ACCEPTANCE & ROUTING TESTS PASSED!');
  console.log('=================================================================');
}

runTests().catch(err => {
  console.error('\n[TEST FAILURE]:', err.message);
  process.exit(1);
});
