const BASE_URL = 'http://localhost:8080';

async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function login(username, password) {
  const res = await post(`${BASE_URL}/api/auth/login`, { username, password });
  if (!res.ok || !res.data.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function runRegressionSuite() {
  console.log('========================================================================');
  console.log('EPOCH — CRITICAL REGRESSION TEST: ACCEPTED CHATS PERSISTENCE SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST STEP 1: Two separate test accounts (Student A: 620823104004, Student B: 620823104005)
  // -------------------------------------------------------------------------
  console.log('1. Authenticating Account A (620823104004) and Account B (620823104005)...');
  let userA = await login('620823104004', 'student@12');
  let userB = await login('620823104005', 'student@12');
  assert(userA && userA.token, 'Account A authenticated successfully');
  assert(userB && userB.token, 'Account B authenticated successfully');

  // Check if a conversation or pending request already exists between them
  let convsA = (await get(`${BASE_URL}/api/chat/conversations`, userA.token)).data || [];
  let existingConv = convsA.find(c => {
    const p = c.participants || [];
    return p.includes('620823104005');
  });

  let convId = existingConv ? existingConv.id : null;

  if (!existingConv) {
    // -------------------------------------------------------------------------
    // TEST STEP 2: A sends a request to B
    // -------------------------------------------------------------------------
    console.log('\n2. Account A sends a message request to Account B...');
    const sendReq = await post(`${BASE_URL}/api/chat/requests`, {
      recipientId: '620823104005',
      recipientIdentifier: '620823104005',
      introMessage: 'Hello Akalya, let us collaborate on the project.'
    }, userA.token);

    if (sendReq.status === 200 && sendReq.data.status === 'EXISTS') {
      convId = sendReq.data.conversationId;
      console.log(`   (Reused existing conversation ${convId})`);
    } else {
      assert(sendReq.status === 201 || sendReq.status === 200, `Message request sent: ${sendReq.status}`);
      const reqId = sendReq.data.id;
      assert(reqId, `Request created with ID: ${reqId}`);

      // -------------------------------------------------------------------------
      // TEST STEP 3: B accepts the request
      // -------------------------------------------------------------------------
      console.log(`\n3. Account B accepts request ${reqId}...`);
      const acceptRes = await post(`${BASE_URL}/api/chat/requests/${reqId}/accept`, {}, userB.token);
      assert(acceptRes.status === 200, `Account B accepted request: ${acceptRes.status}`);
      assert(acceptRes.data && acceptRes.data.id, `Accepted request returned conversation: ${acceptRes.data.id}`);
      convId = acceptRes.data.id;
    }
  } else {
    console.log(`\n2-3. Existing conversation found between A and B: ${convId}`);
  }

  // -------------------------------------------------------------------------
  // TEST STEP 4: Verify BOTH accounts immediately see the same conversation in Chats
  // -------------------------------------------------------------------------
  console.log('\n4. Verifying both accounts immediately see the conversation in Chats...');
  convsA = (await get(`${BASE_URL}/api/chat/conversations`, userA.token)).data || [];
  let convsB = (await get(`${BASE_URL}/api/chat/conversations`, userB.token)).data || [];

  const foundInA = convsA.find(c => c.id === convId || (c.participants && c.participants.includes('620823104005')));
  const foundInB = convsB.find(c => c.id === convId || (c.participants && c.participants.includes('620823104004')));

  assert(foundInA, `Account A sees conversation in Chats list (ID: ${foundInA ? foundInA.id : 'none'})`);
  assert(foundInB, `Account B sees conversation in Chats list (ID: ${foundInB ? foundInB.id : 'none'})`);
  assert(foundInA.id === foundInB.id, `Both accounts see identical shared conversation ID: ${foundInA.id}`);

  // -------------------------------------------------------------------------
  // TEST STEP 5: Exchange messages and confirm they are stored persistently
  // -------------------------------------------------------------------------
  console.log('\n5. Exchanging messages between Account A and Account B...');
  const testMsgContent = 'Persistence verification message at ' + Date.now();
  const sendMsgRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
    content: testMsgContent
  }, userA.token);
  assert(sendMsgRes.status === 200 || sendMsgRes.status === 201, `Account A posted message: ${sendMsgRes.status}`);

  // Retrieve messages as Account B
  const msgsB = (await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, userB.token)).data || [];
  const foundMsg = msgsB.find(m => m.content === testMsgContent);
  assert(foundMsg, `Account B retrieved persistent message: "${foundMsg ? foundMsg.content : 'not found'}"`);

  // -------------------------------------------------------------------------
  // TEST STEP 6: Log out and log back into Account A; verify chat remains visible
  // -------------------------------------------------------------------------
  console.log('\n6. Logging out and re-authenticating Account A (Cold Login)...');
  userA = null; // simulate logout & session wipe
  userA = await login('620823104004', 'student@12');
  assert(userA && userA.token, 'Account A re-authenticated with fresh token');

  const convsAfterLoginA = (await get(`${BASE_URL}/api/chat/conversations`, userA.token)).data || [];
  const restoredInA = convsAfterLoginA.find(c => c.id === convId);
  assert(restoredInA, `Chat ${convId} restored in Account A Chats list after cold login`);
  assert(restoredInA && restoredInA.lastMessage.includes('Persistence verification message'), `Last message preserved in Account A: "${restoredInA ? restoredInA.lastMessage : ''}"`);

  // -------------------------------------------------------------------------
  // TEST STEP 7: Log out and log back into Account B; verify chat remains visible
  // -------------------------------------------------------------------------
  console.log('\n7. Logging out and re-authenticating Account B (Cold Login)...');
  userB = null; // simulate logout & session wipe
  userB = await login('620823104005', 'student@12');
  assert(userB && userB.token, 'Account B re-authenticated with fresh token');

  const convsAfterLoginB = (await get(`${BASE_URL}/api/chat/conversations`, userB.token)).data || [];
  const restoredInB = convsAfterLoginB.find(c => c.id === convId);
  assert(restoredInB, `Chat ${convId} restored in Account B Chats list after cold login`);
  assert(restoredInB && restoredInB.lastMessage.includes('Persistence verification message'), `Last message preserved in Account B: "${restoredInB ? restoredInB.lastMessage : ''}"`);

  // -------------------------------------------------------------------------
  // TEST STEP 8: Try to start another conversation with same person; reuse existing chat
  // -------------------------------------------------------------------------
  console.log('\n8. Attempting to send repeated request to the same person...');
  const repeatReq = await post(`${BASE_URL}/api/chat/requests`, {
    recipientId: '620823104005',
    recipientIdentifier: '620823104005',
    introMessage: 'Second request attempt'
  }, userA.token);

  assert(repeatReq.status === 200, `Repeat request returned 200 OK (no blocking 500 error): ${repeatReq.status}`);
  assert(repeatReq.data.status === 'EXISTS' || repeatReq.data.status === 'ACCEPTED', `Returned status indicates existing active conversation: ${repeatReq.data.status}`);
  const reusedConvId = repeatReq.data.conversationId || (repeatReq.data.request && repeatReq.data.request.conversationId);
  assert(reusedConvId === convId, `Existing conversation ID successfully reused: ${reusedConvId}`);

  // -------------------------------------------------------------------------
  // TEST STEP 9: Request tabs correctness: Requests & Sent only contain active PENDING
  // -------------------------------------------------------------------------
  console.log('\n9. Verifying active pending request tabs...');
  const recA = (await get(`${BASE_URL}/api/chat/requests/received`, userA.token)).data || [];
  const recB = (await get(`${BASE_URL}/api/chat/requests/received`, userB.token)).data || [];

  // The accepted request must not be pending
  const pendingInB = recB.find(r => r.conversationId === convId && r.status === 'PENDING');
  assert(!pendingInB, 'Accepted request is not present as PENDING in recipient Requests tab');

  // -------------------------------------------------------------------------
  // TEST STEP 10: Multi-role persistence check across Sections A, B, C, Advisor, HOD, Principal
  // -------------------------------------------------------------------------
  console.log('\n10. Cross-Role Institutional Chats persistence check across sections & roles...');
  const roles = [
    { id: '620823104002', pass: 'student@12', label: 'Student CSE-A (ABINAYA G)' },
    { id: '620823104111', pass: 'student@12', label: 'Student CSE-B (NAVASRI S)' },
    { id: '620823104133', pass: 'student@12', label: 'Student CSE-C (PRAVEENA B)' },
    { id: 'arularasi', pass: 'advisor@123', label: 'Class Advisor CSE-A (Mrs. P. Arularasi)' },
    { id: 'divyabharathi', pass: 'advisor@123', label: 'Class Advisor CSE-B (Dr. Divyabharathi)' },
    { id: 'rajavathijayapriya', pass: 'advisor@123', label: 'Class Advisor CSE-C (Mrs. Rajavathi Jayapriya)' },
    { id: 'gopinath', pass: 'hod@123', label: 'Head of Department (Dr. K. Gopinath)' },
    { id: 'bsanjaygandhi', pass: 'principal@123', label: 'Principal (Dr. B. Sanjay Gandhi)' }
  ];

  for (const r of roles) {
    const sLogin = await login(r.id, r.pass);
    const sConvs = (await get(`${BASE_URL}/api/chat/conversations`, sLogin.token)).data || [];
    assert(Array.isArray(sConvs), `${r.label} successfully loads persisted conversations list (Count: ${sConvs.length})`);
    for (const sc of sConvs) {
      assert(sc.id && sc.participants && sc.participants.length > 0, `Conversation ${sc.id} has valid persisted participant UIDs`);
    }
  }

  console.log('\n========================================================================');
  console.log(`ALL REGRESSION TESTS PASSED! (${passed}/${total} assertions passed)`);
  console.log('========================================================================');
}

runRegressionSuite().catch(err => {
  console.error('\n[REGRESSION TEST FAILED]:', err);
  process.exit(1);
});
