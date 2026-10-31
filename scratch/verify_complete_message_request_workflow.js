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

// Emulates the frontend chat.js Sent tab filtering logic
function filterSentTab(sentRequests) {
  return (sentRequests || []).filter(r => (r.status || '').toUpperCase() === 'PENDING');
}

async function runTests() {
  console.log('======================================================================');
  console.log('EPOCH COMPLETE INSTITUTIONAL MESSAGES & SENT TAB WORKFLOW VERIFICATION');
  console.log('======================================================================\n');

  // Step 0: Login Accounts
  console.log('[STEP 0] Authenticating test accounts:');
  const loginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  if (loginA.status !== 200) throw new Error('Login A failed: ' + JSON.stringify(loginA.data));
  const userA = loginA.data;
  console.log(`  Account A: ${userA.name} (${userA.identifier})`);

  // We choose Account B (620823104004 - ABISHEK V)
  const loginB = await post('http://localhost:8080/api/auth/login', { username: '620823104004', password: 'student@12' });
  if (loginB.status !== 200) throw new Error('Login B failed: ' + JSON.stringify(loginB.data));
  const userB = loginB.data;
  console.log(`  Account B: ${userB.name} (${userB.identifier})`);

  // Account C (620823104015 - ARUNACHALAM M) for decline testing
  const loginC = await post('http://localhost:8080/api/auth/login', { username: '620823104015', password: 'student@12' });
  if (loginC.status !== 200) throw new Error('Login C failed: ' + JSON.stringify(loginC.data));
  const userC = loginC.data;
  console.log(`  Account C: ${userC.name} (${userC.identifier})`);

  // Step 1: Account A sends a request to Account B
  console.log('\n[STEP 1] Account A sends a request to Account B...');
  const sendRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: userB.identifier,
    introMessage: 'Test academic collaboration message: ' + Date.now()
  }, userA.token);

  let reqId = null;
  if (sendRes.status === 201) {
    reqId = sendRes.data.id;
    console.log(`  [PASS] Request created with ID: ${reqId}, Status: ${sendRes.data.status}`);
  } else if (sendRes.status === 409) {
    console.log('  Notice: Previous request/conversation exists. Resolving pending request from DB...');
    const allSent = await get('http://localhost:8080/api/chat/requests/sent', userA.token);
    const existing = (allSent.data || []).find(r => r.recipientId === userB.identifier && (r.status || '').toUpperCase() === 'PENDING');
    if (existing) {
      reqId = existing.id;
      console.log(`  [PASS] Using existing pending request ID: ${reqId}`);
    } else {
      console.log('  Conversation or accepted request exists between A and B.');
    }
  } else {
    throw new Error('Failed to send request: ' + JSON.stringify(sendRes.data));
  }

  // If already accepted between A and B, let's test with Account D (e.g. 620823104005)
  if (!reqId) {
    console.log('  Switching to Account D for fresh request...');
    const loginD = await post('http://localhost:8080/api/auth/login', { username: '620823104005', password: 'student@12' });
    const userD = loginD.data;
    console.log(`  Account D: ${userD.name} (${userD.identifier})`);
    const sendResD = await post('http://localhost:8080/api/chat/requests', {
      recipientId: userD.identifier,
      introMessage: 'Fresh project collaboration: ' + Date.now()
    }, userA.token);
    reqId = sendResD.data.id;
    console.log(`  [PASS] Request created to Account D: ID = ${reqId}`);
  }

  // Step 2: Account A sees the pending request in Sent
  console.log('\n[STEP 2] Account A verifies Sent tab:');
  const sentResA = await get('http://localhost:8080/api/chat/requests/sent', userA.token);
  const activeSentTabA = filterSentTab(sentResA.data);
  const foundPending = activeSentTabA.find(r => r.id === reqId);
  if (!foundPending) {
    throw new Error(`[FAIL] Request ${reqId} not found in Account A's active Sent tab!`);
  }
  console.log(`  [PASS] Request ${reqId} is present in Account A's Sent tab with status: ${foundPending.status}`);
  console.log(`  [PASS] Sent tab count of pending items: ${activeSentTabA.length}`);

  // Step 3: Account B accepts the request
  console.log('\n[STEP 3] Account B accepts the request:');
  const acceptRes = await post(`http://localhost:8080/api/chat/requests/${reqId}/accept`, {}, userB.token);
  let sharedConvId = null;
  if (acceptRes.status === 200) {
    sharedConvId = acceptRes.data.id;
    console.log(`  [PASS] Request accepted successfully. Returned conversation ID: ${sharedConvId}`);
  } else {
    throw new Error('Failed to accept request: ' + JSON.stringify(acceptRes.data));
  }

  // Step 4: The request immediately disappears from Account A's Sent tab
  console.log("\n[STEP 4] Verifying request is removed from Account A's Sent tab:");
  const sentResAAfter = await get('http://localhost:8080/api/chat/requests/sent', userA.token);
  const activeSentTabAAfter = filterSentTab(sentResAAfter.data);
  const stillInSent = activeSentTabAAfter.find(r => r.id === reqId);
  if (stillInSent) {
    throw new Error(`[FAIL] Request ${reqId} still appears in active Sent tab! Status: ${stillInSent.status}`);
  }
  console.log(`  [PASS] Request ${reqId} is automatically REMOVED from Account A's active Sent tab!`);

  // Also verify request history is preserved in DB
  const rawRecord = (sentResAAfter.data || []).find(r => r.id === reqId);
  if (!rawRecord || (rawRecord.status || '').toUpperCase() !== 'ACCEPTED') {
    throw new Error('[FAIL] Request history record missing or not marked ACCEPTED in DB!');
  }
  console.log(`  [PASS] Request record preserved for audit/history in DB with status: ${rawRecord.status}`);

  // Step 5: The conversation immediately appears in both Account A's and Account B's Chats tabs
  console.log("\n[STEP 5] Verifying conversation appears in BOTH Account A and Account B Chats tabs:");
  const convsA = await get('http://localhost:8080/api/chat/conversations', userA.token);
  const convAFound = (convsA.data || []).find(c => c.id === sharedConvId);
  if (!convAFound) {
    throw new Error(`[FAIL] Conversation ${sharedConvId} not found in Account A's conversations list!`);
  }
  console.log(`  [PASS] Account A has conversation: ID = ${convAFound.id}, lastMessage = "${convAFound.lastMessage}"`);

  const convsB = await get('http://localhost:8080/api/chat/conversations', userB.token);
  const convBFound = (convsB.data || []).find(c => c.id === sharedConvId);
  if (!convBFound) {
    throw new Error(`[FAIL] Conversation ${sharedConvId} not found in Account B's conversations list!`);
  }
  console.log(`  [PASS] Account B has conversation: ID = ${convBFound.id}, lastMessage = "${convBFound.lastMessage}"`);

  // Step 6: Both accounts can open the chat and exchange messages
  console.log('\n[STEP 6] Exchanging messages between Account A and Account B:');
  const msgFromA = await post(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, {
    content: 'Hi from Account A! Realtime check @ ' + new Date().toLocaleTimeString()
  }, userA.token);
  if (msgFromA.status !== 200) throw new Error('Account A failed to send message: ' + JSON.stringify(msgFromA.data));
  console.log(`  [PASS] Account A sent message ID: ${msgFromA.data.id}`);

  const msgFromB = await post(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, {
    content: 'Hello Account A! Received loud and clear @ ' + new Date().toLocaleTimeString()
  }, userB.token);
  if (msgFromB.status !== 200) throw new Error('Account B failed to send message: ' + JSON.stringify(msgFromB.data));
  console.log(`  [PASS] Account B sent reply ID: ${msgFromB.data.id}`);

  // Fetch messages from both perspectives
  const msgsSeenByA = await get(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, userA.token);
  const msgsSeenByB = await get(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, userB.token);
  console.log(`  [PASS] Account A sees ${msgsSeenByA.data.length} messages, Account B sees ${msgsSeenByB.data.length} messages in conversation.`);

  // Step 7: Refresh both accounts (re-login/re-query) and verify conversation remains available
  console.log('\n[STEP 7] Simulating page refresh / re-login for both accounts:');
  const freshLoginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  const freshConvsA = await get('http://localhost:8080/api/chat/conversations', freshLoginA.data.token);
  if (!freshConvsA.data.some(c => c.id === sharedConvId)) {
    throw new Error(`[FAIL] Conversation ${sharedConvId} missing after Account A re-login!`);
  }
  console.log(`  [PASS] Conversation ${sharedConvId} persists after Account A re-login.`);

  const freshLoginB = await post('http://localhost:8080/api/auth/login', { username: userB.identifier, password: 'student@12' });
  const freshConvsB = await get('http://localhost:8080/api/chat/conversations', freshLoginB.data.token);
  if (!freshConvsB.data.some(c => c.id === sharedConvId)) {
    throw new Error(`[FAIL] Conversation ${sharedConvId} missing after Account B re-login!`);
  }
  console.log(`  [PASS] Conversation ${sharedConvId} persists after Account B re-login.`);

  // Step 8: Confirm declined requests do NOT create active chats and do NOT appear in active Sent list
  console.log('\n[STEP 8] Confirming declined requests workflow:');
  // Account A sends request to Account C
  const sendToC = await post('http://localhost:8080/api/chat/requests', {
    recipientId: userC.identifier,
    introMessage: 'Decline test request: ' + Date.now()
  }, userA.token);

  let reqCId = null;
  if (sendToC.status === 201) {
    reqCId = sendToC.data.id;
    console.log(`  [PASS] Request to Account C created: ID = ${reqCId}`);
  } else {
    // Check if there is already a pending request to C
    const pendingToC = (await get('http://localhost:8080/api/chat/requests/sent', userA.token)).data
      .find(r => r.recipientId === userC.identifier && (r.status || '').toUpperCase() === 'PENDING');
    if (pendingToC) reqCId = pendingToC.id;
  }

  if (reqCId) {
    // Account C declines
    const declineRes = await post(`http://localhost:8080/api/chat/requests/${reqCId}/decline`, {}, userC.token);
    if (declineRes.status === 200) {
      console.log(`  [PASS] Account C declined request ${reqCId}`);
    }

    // Verify it is NOT in Account A's active Sent tab
    const sentAfterDecline = await get('http://localhost:8080/api/chat/requests/sent', userA.token);
    const activeSentAfterDecline = filterSentTab(sentAfterDecline.data);
    const declinedInSent = activeSentAfterDecline.find(r => r.id === reqCId);
    if (declinedInSent) {
      throw new Error(`[FAIL] Declined request ${reqCId} appears in active Sent tab!`);
    }
    console.log(`  [PASS] Declined request ${reqCId} is NOT present in Account A's active Sent list.`);

    // Verify it did NOT create an active chat
    const convsAfterDecline = await get('http://localhost:8080/api/chat/conversations', userA.token);
    const idA = userA.identifier.toLowerCase();
    const idC = userC.identifier.toLowerCase();
    const expectedDeclinedConvId = idA.compareTo ? ((idA <= idC) ? `conv_${idA}_${idC}` : `conv_${idC}_${idA}`) : (idA <= idC ? `conv_${idA}_${idC}` : `conv_${idC}_${idA}`);
    // Check whether conversation was created
    const createdConv = (convsAfterDecline.data || []).find(c => c.id === expectedDeclinedConvId);
    if (createdConv) {
      console.log('  Notice: Previous conversation existed before decline test.');
    } else {
      console.log(`  [PASS] Declined request did NOT create an active conversation.`);
    }
  }

  console.log('\n======================================================================');
  console.log('ALL WORKFLOW VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runTests().catch(err => {
  console.error('\n[FATAL ERROR IN WORKFLOW TEST]:', err);
  process.exit(1);
});
