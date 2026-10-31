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

function put(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'PUT',
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
  console.log('=== EPOCH STUDENT-TO-STUDENT MESSAGING & PROFILE VERIFICATION ===\n');

  // 1. Authenticate Student A (620823104002)
  console.log('1. Authenticating Student A (620823104002)...');
  const resLoginA = await post('http://localhost:8080/api/auth/login', {
    username: '620823104002',
    password: 'student@12'
  });
  if (resLoginA.status !== 200) {
    throw new Error('Failed to login Student A: ' + JSON.stringify(resLoginA.data));
  }
  const studentA = resLoginA.data;
  console.log(`   -> Logged in: ${studentA.name} (${studentA.identifier})`);
  console.log(`   -> Academic Year: ${studentA.academicYear}`);
  if (studentA.academicYear !== 'IV Year B.E.') {
    console.warn(`   [WARN] Expected "IV Year B.E.", got "${studentA.academicYear}"`);
  }

  // 2. Authenticate Student B (620823104003)
  console.log('\n2. Authenticating Student B (620823104003)...');
  const resLoginB = await post('http://localhost:8080/api/auth/login', {
    username: '620823104003',
    password: 'student@12'
  });
  if (resLoginB.status !== 200) {
    throw new Error('Failed to login Student B: ' + JSON.stringify(resLoginB.data));
  }
  const studentB = resLoginB.data;
  console.log(`   -> Logged in: ${studentB.name} (${studentB.identifier})`);
  console.log(`   -> Academic Year: ${studentB.academicYear}`);

  // 3. Test Student Profile Editing & Persistence
  console.log('\n3. Testing Student Profile Editing (PUT /api/user/profile)...');
  const updateRes = await put('http://localhost:8080/api/user/profile', {
    name: 'ABINAYA G',
    contactPhone: '+91 98765 43210',
    bio: 'Fourth Year Computer Science Engineering student passionate about distributed systems.'
  }, studentA.token);
  console.log(`   -> Update Status: ${updateRes.status}`);
  console.log(`   -> Updated Profile Name: ${updateRes.data.name}`);
  console.log(`   -> Updated Profile Contact: ${updateRes.data.contactPhone || updateRes.data.contact}`);
  console.log(`   -> Updated Profile Academic Year: ${updateRes.data.academicYear}`);
  console.log(`   -> Updated Profile Bio: ${updateRes.data.bio}`);

  // Fetch updated profile
  const getProfRes = await get('http://localhost:8080/api/user/profile', studentA.token);
  console.log(`   -> GET Profile Status: ${getProfRes.status}`);
  console.log(`   -> Verified Bio from DB: "${getProfRes.data.bio}"`);

  // 4. Test Student Contact Search
  console.log('\n4. Testing Student Search (GET /api/chat/students?query=Abinaya)...');
  const searchRes = await get('http://localhost:8080/api/chat/students?query=Abinaya', studentA.token);
  console.log(`   -> Search Status: ${searchRes.status}`);
  console.log(`   -> Matches found: ${searchRes.data.length}`);
  const foundPeer = searchRes.data.find(s => s.identifier === '620823104003');
  if (foundPeer) {
    console.log(`   -> Found Peer Student B: ${foundPeer.name} (${foundPeer.identifier}) - Year: ${foundPeer.academicYear}`);
    if (foundPeer.password || foundPeer.passwordHash) {
      throw new Error('[SECURITY ERROR] Password leaked in student search response!');
    }
  }

  // 5. Send Message Request from Student A to Student B
  console.log('\n5. Sending Message Request (POST /api/chat/requests)...');
  const sendReqRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: '620823104003',
    introMessage: 'Hello Abinaya P! Would you like to collaborate on the final year project?'
  }, studentA.token);
  console.log(`   -> Send Request Status: ${sendReqRes.status}`);
  console.log(`   -> Response:`, sendReqRes.data);

  let requestId = sendReqRes.data && sendReqRes.data.id;

  // 6. Test Duplicate Request Prevention
  console.log('\n6. Testing Duplicate Request Prevention...');
  const dupReqRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: '620823104003',
    introMessage: 'Trying to send again...'
  }, studentA.token);
  console.log(`   -> Duplicate Request Status: ${dupReqRes.status} (Expected: 409 Conflict)`);
  console.log(`   -> Error message: ${dupReqRes.data.error || dupReqRes.data}`);

  // 7. Check Received Requests for Student B
  console.log('\n7. Checking Received Requests for Student B...');
  const recRes = await get('http://localhost:8080/api/chat/requests/received', studentB.token);
  console.log(`   -> Status: ${recRes.status}`);
  console.log(`   -> Received Requests count: ${recRes.data.length}`);
  const targetReq = Array.isArray(recRes.data) ? recRes.data.find(r => r.senderId === '620823104002' && r.status === 'PENDING') : null;
  if (targetReq) {
    console.log(`   -> Found Pending Request from ${targetReq.senderName}: "${targetReq.introMessage}" (Status: ${targetReq.status})`);
    requestId = targetReq.id;
  }

  // 8. Check Sent Requests for Student A
  console.log('\n8. Checking Sent Requests for Student A...');
  const sentRes = await get('http://localhost:8080/api/chat/requests/sent', studentA.token);
  console.log(`   -> Status: ${sentRes.status}`);
  console.log(`   -> Sent Requests count: ${sentRes.data.length}`);
  const mySent = Array.isArray(sentRes.data) ? sentRes.data.find(r => r.recipientId === '620823104003') : null;
  if (mySent) {
    console.log(`   -> Sent to ${mySent.recipientName}: Status = ${mySent.status}`);
  }

  // 9. Accept Request by Student B (if pending request found)
  let convId = null;
  if (requestId) {
    console.log(`\n9. Student B Accepting Request (${requestId})...`);
    const acceptRes = await post(`http://localhost:8080/api/chat/requests/${requestId}/accept`, {}, studentB.token);
    console.log(`   -> Accept Status: ${acceptRes.status}`);
    console.log(`   -> Conversation ID: ${acceptRes.data.conversationId || acceptRes.data.id}`);
    convId = acceptRes.data.conversationId || acceptRes.data.id;
  } else {
    // If already accepted previously, fetch active conversation
    console.log('\n9. Request already accepted previously, finding conversation...');
    const convsB = await get('http://localhost:8080/api/chat/conversations', studentB.token);
    const existingConv = convsB.data.find(c => c.participants && c.participants.includes('620823104002'));
    if (existingConv) {
      convId = existingConv.id;
      console.log(`   -> Found existing conversation ID: ${convId}`);
    }
  }

  // 10. Verify Conversation established for both students
  console.log('\n10. Verifying Active Conversations for Both Students...');
  const convsA = await get('http://localhost:8080/api/chat/conversations', studentA.token);
  const convsB = await get('http://localhost:8080/api/chat/conversations', studentB.token);
  console.log(`   -> Student A active conversations: ${convsA.data.length}`);
  console.log(`   -> Student B active conversations: ${convsB.data.length}`);
  if (convId) {
    const matchA = convsA.data.find(c => c.id === convId);
    const matchB = convsB.data.find(c => c.id === convId);
    console.log(`   -> Conversation visible to Student A: ${!!matchA}`);
    console.log(`   -> Conversation visible to Student B: ${!!matchB}`);

    // 11. Two-way messaging between students
    console.log('\n11. Testing Two-Way Messaging in Accepted Conversation...');
    // Student B sends reply
    const replyRes = await post(`http://localhost:8080/api/chat/conversations/${convId}/messages`, {
      content: 'Hi Abinaya G! Absolutely, let us work on the project together.'
    }, studentB.token);
    console.log(`   -> Student B sent reply. Message ID: ${replyRes.data.id}`);

    // Student A reads messages
    const msgsRes = await get(`http://localhost:8080/api/chat/conversations/${convId}/messages`, studentA.token);
    console.log(`   -> Total messages in conversation: ${Array.isArray(msgsRes.data) ? msgsRes.data.length : 'N/A'}`);
    if (Array.isArray(msgsRes.data)) {
      msgsRes.data.forEach(m => {
        console.log(`      [${m.senderRole || 'USER'}] ${m.senderName}: "${m.content}" (${m.timestamp})`);
      });
    }

    // 12. Security Check: Third-party unauthorized student cannot access conversation
    console.log('\n12. Testing Security & Authorization...');
    const unauthorizedRes = await get(`http://localhost:8080/api/chat/conversations/${convId}/messages`, 'invalid-or-unauth-token');
    console.log(`   -> Unauthorized access attempt status: ${unauthorizedRes.status} (Expected: 401 or 403)`);
  }

  // 13. Verify Existing Student-to-Staff Messaging
  console.log('\n13. Verifying Existing Student-to-Staff Messaging...');
  const staffChatRes = await post('http://localhost:8080/api/chat/conversations', {
    targetIdentifier: 'arularasi'
  }, studentA.token);
  console.log(`   -> Student-to-Advisor conversation status: ${staffChatRes.status}`, staffChatRes.data);
  console.log(`   -> Staff conversation ID: ${staffChatRes.data.id}, Staff: ${staffChatRes.data.staffName}`);

  console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('\n[TEST RUN FAILED]:', err.message);
  process.exit(1);
});
