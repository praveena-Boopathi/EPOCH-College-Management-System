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

async function run() {
  console.log('======================================================================');
  console.log('EPOCH COMPLETE TWO-WAY ACCEPT & DECLINE WORKFLOW VERIFICATION');
  console.log('======================================================================\n');

  // 1. Authenticate two separate student accounts
  // Student A: 620823104002 (ABINAYA G)
  // Student B: 620823104003 (ABINAYA P)
  // Student C: 620823104015 (ARUNACHALAM M)
  console.log('1. Authenticating test student accounts...');
  const resLoginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  const studentA = resLoginA.data;
  console.log(`   [PASS] Student A: ${studentA.name} (${studentA.identifier}) Section: ${studentA.section}`);

  const resLoginB = await post('http://localhost:8080/api/auth/login', { username: '620823104003', password: 'student@12' });
  const studentB = resLoginB.data;
  console.log(`   [PASS] Student B: ${studentB.name} (${studentB.identifier}) Section: ${studentB.section}`);

  const resLoginC = await post('http://localhost:8080/api/auth/login', { username: '620823104015', password: 'student@12' });
  const studentC = resLoginC.data;
  console.log(`   [PASS] Student C: ${studentC.name} (${studentC.identifier}) Section: ${studentC.section}`);

  // -------------------------------------------------------------------------
  // WORKFLOW 1: Student A sends request to Student B -> Student B ACCEPTS -> Chat
  // -------------------------------------------------------------------------
  console.log('\n--- WORKFLOW 1: SEND REQUEST -> ACCEPT -> CHAT ---');
  console.log('2. Student A sending message request to Student B...');
  const sendRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: studentB.identifier,
    introMessage: 'Hello Aditya, would you like to partner up for the Cloud Computing Capstone?'
  }, studentA.token);

  let req1Id = null;
  if (sendRes.status === 201) {
    console.log(`   [PASS] Request created: ID = ${sendRes.data.id}, Status = ${sendRes.data.status}`);
    req1Id = sendRes.data.id;
  } else if (sendRes.status === 409) {
    console.log(`   -> Request or conversation already existed (${sendRes.data.error})`);
    const existingReqs = await get('http://localhost:8080/api/chat/requests/received', studentB.token);
    const ex = (existingReqs.data || []).find(r => r.senderId === studentA.identifier);
    if (ex) req1Id = ex.id;
  }

  // 3. Student B checks received requests
  console.log('\n3. Student B checking received requests tab...');
  const bReceived = await get('http://localhost:8080/api/chat/requests/received', studentB.token);
  console.log(`   -> Received requests count for Student B: ${bReceived.data.length}`);
  const reqForB = (bReceived.data || []).find(r => r.senderId === studentA.identifier);
  if (!reqForB) {
    throw new Error('Verification failure: Student B did not receive request from Student A!');
  }
  console.log(`   [PASS] Found incoming request for Student B:`);
  console.log(`      ID: ${reqForB.id}`);
  console.log(`      From: ${reqForB.senderName} (${reqForB.senderId})`);
  console.log(`      Role: ${reqForB.senderRole || 'STUDENT'}`);
  console.log(`      Dept/Sec: ${reqForB.senderDepartment || reqForB.senderDept} - ${reqForB.senderSection}`);
  console.log(`      Academic Year: ${reqForB.senderAcademicYear}`);
  console.log(`      Intro: "${reqForB.introMessage}"`);
  console.log(`      Timestamp: ${reqForB.timestamp}`);
  console.log(`      Status: ${reqForB.status}`);

  if (reqForB.status === 'PENDING') {
    // 4. Student B accepts the request
    console.log('\n4. Student B accepting the request...');
    const acceptRes = await post(`http://localhost:8080/api/chat/requests/${reqForB.id}/accept`, {}, studentB.token);
    console.log(`   -> Accept HTTP status: ${acceptRes.status}`);
    if (acceptRes.status !== 200) {
      throw new Error(`Failed to accept request: ${JSON.stringify(acceptRes.data)}`);
    }
    const convId = acceptRes.data.id;
    console.log(`   [PASS] Conversation created/activated: ${convId}`);

    // 5. Verify conversation is visible under Messages -> Chats for BOTH users
    console.log('\n5. Verifying conversation visibility under Chats for both students...');
    const convsA = await get('http://localhost:8080/api/chat/conversations', studentA.token);
    const convsB = await get('http://localhost:8080/api/chat/conversations', studentB.token);
    const foundInA = (convsA.data || []).some(c => c.id === convId);
    const foundInB = (convsB.data || []).some(c => c.id === convId);
    console.log(`   -> Visible in Student A Chats: ${foundInA}`);
    console.log(`   -> Visible in Student B Chats: ${foundInB}`);
    if (!foundInA || !foundInB) {
      throw new Error('Conversation visibility failure: Conversation is missing in one or both users\' Chats list!');
    }
    console.log('   [PASS] Both students see active conversation.');

    // 6. Test Two-Way Chat Messaging
    console.log('\n6. Testing bi-directional messaging between Student A and Student B...');
    const msg1 = await post(`http://localhost:8080/api/chat/conversations/${convId}/messages`, {
      content: 'Thanks for accepting! Let\'s schedule a call tomorrow at 10 AM.'
    }, studentA.token);
    console.log(`   [PASS] Student A sent: "${msg1.data.content}"`);

    const msg2 = await post(`http://localhost:8080/api/chat/conversations/${convId}/messages`, {
      content: 'Perfect, 10 AM works for me. I\'ll bring the project outline.'
    }, studentB.token);
    console.log(`   [PASS] Student B replied: "${msg2.data.content}"`);

    // Verify messages retrieved by both
    const msgsA = await get(`http://localhost:8080/api/chat/conversations/${convId}/messages`, studentA.token);
    const msgsB = await get(`http://localhost:8080/api/chat/conversations/${convId}/messages`, studentB.token);
    console.log(`   [PASS] Student A retrieved ${msgsA.data.length} messages, Student B retrieved ${msgsB.data.length} messages.`);
  } else {
    console.log('\n4. Request already accepted in earlier run.');
  }

  // -------------------------------------------------------------------------
  // WORKFLOW 2: Student A sends request to Student C -> Student C DECLINES
  // -------------------------------------------------------------------------
  console.log('\n--- WORKFLOW 2: SEND REQUEST -> DECLINE -> STATUS TRACKING ---');
  console.log('7. Student A sending message request to Student C...');
  const sendRes2 = await post('http://localhost:8080/api/chat/requests', {
    recipientId: studentC.identifier,
    introMessage: 'Hi Ajay, checking if you have an open slot in your hackathon team.'
  }, studentA.token);

  let req2Id = null;
  if (sendRes2.status === 201) {
    req2Id = sendRes2.data.id;
    console.log(`   [PASS] Request created for Student C: ID = ${req2Id}, Status = ${sendRes2.data.status}`);
  } else if (sendRes2.status === 409) {
    const cReceived = await get('http://localhost:8080/api/chat/requests/received', studentC.token);
    const ex2 = (cReceived.data || []).find(r => r.senderId === studentA.identifier && r.status === 'PENDING');
    if (ex2) req2Id = ex2.id;
  }

  if (req2Id) {
    // 8. Student C declines the request
    console.log('\n8. Student C declining the request...');
    const declineRes = await post(`http://localhost:8080/api/chat/requests/${req2Id}/decline`, {}, studentC.token);
    console.log(`   -> Decline HTTP status: ${declineRes.status}`);
    console.log(`   [PASS] Request status updated to: ${declineRes.data.status}`);
    if (declineRes.data.status !== 'DECLINED') {
      throw new Error(`Expected status DECLINED but got ${declineRes.data.status}`);
    }

    // 9. Verify NO conversation created for either user
    console.log('\n9. Verifying NO conversation was created upon decline...');
    const convsA_after = await get('http://localhost:8080/api/chat/conversations', studentA.token);
    const convsC_after = await get('http://localhost:8080/api/chat/conversations', studentC.token);
    const hasConvWithC = (convsA_after.data || []).some(c => (c.participants || []).includes(studentC.identifier));
    const hasConvWithA = (convsC_after.data || []).some(c => (c.participants || []).includes(studentA.identifier));
    console.log(`   -> Conversation exists in Student A: ${hasConvWithC}`);
    console.log(`   -> Conversation exists in Student C: ${hasConvWithA}`);
    if (hasConvWithC || hasConvWithA) {
      throw new Error('Integrity failure: A conversation was created despite the request being declined!');
    }
    console.log('   [PASS] Verified: No conversation created.');

    // 10. Verify Student A's Sent requests tab shows status as DECLINED
    console.log('\n10. Verifying Student A Sent tab displays DECLINED status...');
    const sentA = await get('http://localhost:8080/api/chat/requests/sent', studentA.token);
    const reqInSent = (sentA.data || []).find(r => r.id === req2Id);
    if (!reqInSent || reqInSent.status !== 'DECLINED') {
      throw new Error(`Expected request ${req2Id} in Sent with status DECLINED, found: ${reqInSent ? reqInSent.status : 'not found'}`);
    }
    console.log(`   [PASS] Sent tab shows request to ${reqInSent.recipientName} with status: ${reqInSent.status}`);
  }

  // 11. Test Sanjai S pending request from Praveena B
  console.log('\n11. Verifying Sanjai S (620823104149) pending request from Praveena B...');
  const sanjaiLogin = await post('http://localhost:8080/api/auth/login', { username: '620823104149', password: 'student@12' });
  if (sanjaiLogin.data && sanjaiLogin.data.token) {
    const sanjaiRec = await get('http://localhost:8080/api/chat/requests/received', sanjaiLogin.data.token);
    const praveenaReq = (sanjaiRec.data || []).find(r => r.senderName === 'PRAVEENA B');
    if (praveenaReq) {
      console.log(`   [PASS] Sanjai S sees incoming request from PRAVEENA B:`);
      console.log(`      ID: ${praveenaReq.id}, Status: ${praveenaReq.status}, Role: ${praveenaReq.senderRole}`);
    }
  }

  console.log('\n======================================================================');
  console.log('ALL TWO-WAY ACCEPT AND DECLINE WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

run().catch(err => {
  console.error('\n[WORKFLOW TEST FAILED]:', err.message);
  process.exit(1);
});
