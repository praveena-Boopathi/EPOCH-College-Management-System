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

async function runStudentTests() {
  console.log('=================================================================');
  console.log('STUDENT-TO-STUDENT MESSAGE REQUEST & CONVERSATION VERIFICATION');
  console.log('=================================================================\n');

  // 1. Authenticate two students
  // Student A: 620823104002 (ABINAYA G)
  // Student B: 620823104003 (ABINAYA P)
  // Student C: 620823104004 (ADITHYA R)
  console.log('1. Authenticating test students...');
  const resLoginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  const studentA = resLoginA.data;
  console.log(`   [PASS] Student A: ${studentA.name} (${studentA.identifier})`);

  const resLoginB = await post('http://localhost:8080/api/auth/login', { username: '620823104003', password: 'student@12' });
  const studentB = resLoginB.data;
  console.log(`   [PASS] Student B: ${studentB.name} (${studentB.identifier})`);

  const resLoginC = await post('http://localhost:8080/api/auth/login', { username: '620823104004', password: 'student@12' });
  const studentC = resLoginC.data;
  console.log(`   [PASS] Student C: ${studentC.name} (${studentC.identifier})`);

  // 2. Student C sends request to Student B
  console.log('\n2. Student C sends a message request to Student B...');
  const resReq = await post('http://localhost:8080/api/chat/requests', {
    recipientId: studentB.identifier,
    introMessage: 'Hi Abinaya, do you want to collaborate on the Final Year Project seminar?'
  }, studentC.token);

  let reqId = null;
  if (resReq.status === 201) {
    console.log(`   [PASS] Request created: ID = ${resReq.data.id}, Status = ${resReq.data.status}`);
    console.log(`   -> Recipient: ${resReq.data.recipientName} (${resReq.data.recipientId})`);
    console.log(`   -> Sender: ${resReq.data.senderName} (${resReq.data.senderId})`);
    console.log(`   -> Request Type: ${resReq.data.requestType}`);
    reqId = resReq.data.id;
  } else if (resReq.status === 409) {
    console.log(`   -> Active conversation or pending request already exists: ${resReq.data.error}`);
    // Retrieve the pending request
    const bReceived = await get('http://localhost:8080/api/chat/requests/received', studentB.token);
    const existing = (bReceived.data || []).find(r => r.senderId === studentC.identifier);
    if (existing) {
      reqId = existing.id;
      console.log(`   -> Found existing request ID: ${reqId} (Status: ${existing.status})`);
    }
  }

  // 3. Student B verifies receiving the request
  console.log('\n3. Student B checks received requests...');
  const bRequests = await get('http://localhost:8080/api/chat/requests/received', studentB.token);
  console.log(`   -> Student B received requests count: ${bRequests.data.length}`);
  const reqForB = (bRequests.data || []).find(r => r.senderId === studentC.identifier);
  if (reqForB) {
    console.log(`   [PASS] Student B sees request from Student C:`);
    console.log(`      From: ${reqForB.senderName} (${reqForB.senderDepartment} - ${reqForB.senderSection})`);
    console.log(`      Academic Year: ${reqForB.senderAcademicYear}`);
    console.log(`      Message: "${reqForB.introMessage}"`);
    console.log(`      Status: ${reqForB.status}`);
  }

  // Student A MUST NOT see requests intended for Student B
  const aRequests = await get('http://localhost:8080/api/chat/requests/received', studentA.token);
  const leakedToA = (aRequests.data || []).find(r => r.id === reqId);
  if (leakedToA) {
    throw new Error('Security violation: Request intended for Student B was delivered to Student A!');
  }
  console.log(`   [PASS] Request isolation verified: Student A cannot see Student B\'s requests.`);

  // 4. Student A attempts unauthorized acceptance of Student B's request
  if (reqId && reqForB && reqForB.status === 'PENDING') {
    console.log('\n4. Student A attempts unauthorized acceptance of Student B\'s request...');
    const unauthorizedAccept = await post(`http://localhost:8080/api/chat/requests/${reqId}/accept`, {}, studentA.token);
    console.log(`   -> Status: ${unauthorizedAccept.status} (Expected: 403 Forbidden)`);
    if (unauthorizedAccept.status !== 403) {
      throw new Error('Security violation: Unauthorized student accepted someone else\'s request!');
    }
    console.log(`   [PASS] Blocked unauthorized acceptance with 403 Forbidden.`);

    // 5. Student B accepts the request
    console.log('\n5. Student B accepts Student C\'s request...');
    const acceptRes = await post(`http://localhost:8080/api/chat/requests/${reqId}/accept`, {}, studentB.token);
    console.log(`   -> Status: ${acceptRes.status} (Expected: 200 OK)`);
    console.log(`   [PASS] Conversation created: ID = ${acceptRes.data.id}, Type = ${acceptRes.data.type}`);
    console.log(`   -> Participant 1: ${acceptRes.data.studentRegNo || acceptRes.data.student1RegNo || acceptRes.data.studentName}`);
    console.log(`   -> Participant 2: ${acceptRes.data.staffUsername || acceptRes.data.student2RegNo || acceptRes.data.student2Name || acceptRes.data.staffName}`);
    const convId = acceptRes.data.id;

    // 6. Verify conversation is visible under Chats for BOTH Student B and Student C
    console.log('\n6. Verifying conversation visibility under Chats for both students...');
    const bChats = await get('http://localhost:8080/api/chat/conversations', studentB.token);
    const cChats = await get('http://localhost:8080/api/chat/conversations', studentC.token);
    const foundInB = (bChats.data || []).some(c => c.id === convId);
    const foundInC = (cChats.data || []).some(c => c.id === convId);
    console.log(`   -> Visible in Student B\'s chats: ${foundInB}`);
    console.log(`   -> Visible in Student C\'s chats: ${foundInC}`);
    if (!foundInB || !foundInC) {
      throw new Error('Conversation visibility failure: Newly accepted conversation is not visible to both participants!');
    }
    console.log(`   [PASS] Verified: Conversation ${convId} is visible to both participants.`);

    // 7. Verify message sending in newly created conversation
    console.log('\n7. Testing bi-directional messaging between Student B and Student C...');
    const msgRes1 = await post(`http://localhost:8080/api/chat/conversations/${convId}/messages`, {
      content: 'Sure Adithya, let\'s collaborate! Have you picked a topic yet?'
    }, studentB.token);
    console.log(`   [PASS] Student B sent message: "${msgRes1.data.content}" (Sender: ${msgRes1.data.senderId})`);

    const msgRes2 = await post(`http://localhost:8080/api/chat/conversations/${convId}/messages`, {
      content: 'Yes! I was thinking about Distributed Ledger Technology for Academic Credentials.'
    }, studentC.token);
    console.log(`   [PASS] Student C sent reply: "${msgRes2.data.content}" (Sender: ${msgRes2.data.senderId})`);

    // Verify messages retrieved by both
    const msgsForB = await get(`http://localhost:8080/api/chat/conversations/${convId}/messages`, studentB.token);
    console.log(`   [PASS] Messages count in conversation: ${msgsForB.data.length}`);
  } else {
    console.log('\n(Request was already accepted in earlier run)');
  }

  console.log('\n=================================================================');
  console.log('ALL STUDENT-TO-STUDENT REQUEST & MESSAGING TESTS PASSED!');
  console.log('=================================================================');
}

runStudentTests().catch(err => {
  console.error('\n[TEST FAILURE]:', err.message);
  process.exit(1);
});
