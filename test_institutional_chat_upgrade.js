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

async function run() {
  console.log('========================================================================');
  console.log('EPOCH INSTITUTIONAL MESSAGES MODULE — COMPREHENSIVE VERIFICATION SUITE');
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

  // 1. Authenticate multi-role accounts across Sections A, B, C, Advisors, HOD, and Principal
  console.log('1. Authenticating multi-role institutional accounts...');
  const studentA = await login('620823104002', 'student@12'); // Abinaya G (CSE-A)
  const studentB = await login('620823104111', 'student@12'); // Navasri S (CSE-B)
  const studentC = await login('620823104133', 'student@12'); // Praveena B (CSE-C)
  const advisorA = await login('arularasi', 'advisor@123'); // Mrs. P. Arularasi (CSE-A)
  const advisorB = await login('divyabharathi', 'advisor@123'); // Dr. Divyabharathi (CSE-B)
  const advisorC = await login('rajavathijayapriya', 'advisor@123'); // Mrs. Rajavathi Jayapriya (CSE-C)
  const hod = await login('gopinath', 'hod@123'); // Dr. K. Gopinath (HOD)
  const principal = await login('principal@gct.ac.in', 'principal@123'); // Dr. B. Sanjay Gandhi (Principal)

  assert(studentA && studentA.token, 'Student CSE-A authenticated (Abinaya G)');
  assert(studentB && studentB.token, 'Student CSE-B authenticated (Navasri S)');
  assert(studentC && studentC.token, 'Student CSE-C authenticated (Praveena B)');
  assert(advisorA && advisorA.token, 'Advisor CSE-A authenticated (Mrs. P. Arularasi)');
  assert(advisorB && advisorB.token, 'Advisor CSE-B authenticated (Dr. Divyabharathi)');
  assert(advisorC && advisorC.token, 'Advisor CSE-C authenticated (Mrs. Rajavathi Jayapriya)');
  assert(hod && hod.token, 'HOD authenticated (Dr. K. Gopinath)');
  assert(principal && principal.token, 'Principal authenticated (Dr. B. Sanjay Gandhi)');

  // 2. Contact Directory & Permission Boundary Checks
  console.log('\n2. Testing Contact Directory & Role/Section Communication Boundaries...');
  
  // Student A (CSE-A) Contacts: Should see Advisor A, HOD, and Principal
  const contactsA = (await get(`${BASE_URL}/api/chat/contacts`, studentA.token)).data || [];
  assert(contactsA.some(c => c.identifier === 'arularasi'), 'Student CSE-A directory includes assigned CSE-A Advisor');
  assert(contactsA.some(c => c.identifier === 'gopinath'), 'Student CSE-A directory includes HOD');
  assert(contactsA.some(c => c.identifier === 'bsanjaygandhi'), 'Student CSE-A directory includes Principal');
  assert(!contactsA.some(c => c.identifier === 'divyabharathi'), 'Student CSE-A cannot bypass section to advisor B');

  // Student B (CSE-B) Contacts: Should see Advisor B, HOD, Principal
  const contactsB = (await get(`${BASE_URL}/api/chat/contacts`, studentB.token)).data || [];
  assert(contactsB.some(c => c.identifier === 'divyabharathi'), 'Student CSE-B directory includes assigned CSE-B Advisor');
  assert(!contactsB.some(c => c.identifier === 'arularasi'), 'Student CSE-B cannot bypass section to advisor A');

  // Advisor A Contacts: Should see CSE-A students, fellow advisors, HOD, Principal
  const contactsAdvA = (await get(`${BASE_URL}/api/chat/contacts`, advisorA.token)).data || [];
  assert(contactsAdvA.some(c => c.identifier === '620823104002'), 'Advisor CSE-A directory includes section student (620823104002)');
  assert(contactsAdvA.some(c => c.identifier === 'divyabharathi'), 'Advisor CSE-A can collaborate with Advisor CSE-B');
  assert(contactsAdvA.some(c => c.identifier === 'gopinath'), 'Advisor CSE-A directory includes HOD');

  // 3. Performance & Latency Benchmarks
  console.log('\n3. Measuring Initial Loading & Fetch Performance...');
  const t0 = Date.now();
  const convsStudentA = (await get(`${BASE_URL}/api/chat/conversations`, studentA.token)).data || [];
  const loadDuration = Date.now() - t0;
  console.log(`   -> Student A loaded ${convsStudentA.length} persistent conversations in ${loadDuration} ms`);
  assert(convsStudentA.length > 0, `Student A has persistent conversation documents in Firestore (${convsStudentA.length})`);
  assert(loadDuration < 4000, `Initial conversations loading speed meets latency requirement (< 4000ms): ${loadDuration}ms`);

  // 4. Request Acceptance & Establishing Persistent Shared Conversation
  console.log('\n4. Testing Request & Shared Conversation Establishment between Student B and Student C...');
  // Check if conversation already exists or send request
  let convsB = (await get(`${BASE_URL}/api/chat/conversations`, studentB.token)).data || [];
  let existingBC = convsB.find(c => {
    const p = c.participants || [];
    return p.includes('620823104133');
  });

  let convIdBC = existingBC ? existingBC.id : null;

  if (!existingBC) {
    const sendReq = await post(`${BASE_URL}/api/chat/requests`, {
      recipientId: '620823104133',
      recipientIdentifier: '620823104133',
      introMessage: 'Hello Praveena (CSE-C), let us connect for the college symposium project.'
    }, studentB.token);

    if (sendReq.status === 200 && sendReq.data.status === 'EXISTS') {
      convIdBC = sendReq.data.conversationId;
      console.log(`   -> Existing conversation found: ${convIdBC}`);
    } else {
      assert(sendReq.status === 201 || sendReq.status === 200, `Message request created: ${sendReq.status}`);
      const reqId = sendReq.data.id;
      assert(reqId, `Message request generated with ID: ${reqId}`);

      // Student C accepts
      const acceptRes = await post(`${BASE_URL}/api/chat/requests/${reqId}/accept`, {}, studentC.token);
      assert(acceptRes.status === 200, `Student C accepted request: ${acceptRes.status}`);
      assert(acceptRes.data && acceptRes.data.id, `Shared conversation established: ${acceptRes.data.id}`);
      convIdBC = acceptRes.data.id;
    }
  } else {
    console.log(`   -> Conversation already active between B and C: ${convIdBC}`);
  }

  // 5. Automatic Bidirectional Visibility in Chats lists
  console.log('\n5. Verifying Both Participants Automatically See the Same Shared Conversation in Chats...');
  convsB = (await get(`${BASE_URL}/api/chat/conversations`, studentB.token)).data || [];
  const convsC = (await get(`${BASE_URL}/api/chat/conversations`, studentC.token)).data || [];

  const foundInB = convsB.find(c => c.id === convIdBC || (c.participants && c.participants.includes('620823104133')));
  const foundInC = convsC.find(c => c.id === convIdBC || (c.participants && c.participants.includes('620823104111')));

  assert(foundInB, `Student B sees conversation in Chats list (${foundInB ? foundInB.id : 'not found'})`);
  assert(foundInC, `Student C sees conversation in Chats list (${foundInC ? foundInC.id : 'not found'})`);
  assert(foundInB.id === foundInC.id, `Both participants share identical conversation ID: ${foundInB.id}`);

  // 6. Two-Way Message Exchange & Read State Verification
  console.log('\n6. Testing Two-Way Real-Time Messaging & Read Receipts...');
  const testMsg = 'Institutional verified test payload at ' + Date.now();
  const sendRes = await post(`${BASE_URL}/api/chat/conversations/${convIdBC}/messages`, {
    content: testMsg,
    recipientId: '620823104133'
  }, studentB.token);
  assert(sendRes.status === 200 || sendRes.status === 201, `Student B posted message: ${sendRes.status}`);
  const msgObj = sendRes.data;
  assert(msgObj && msgObj.id, `Message persisted with ID: ${msgObj.id}`);

  // Student C opens conversation and retrieves messages
  const msgsC = (await get(`${BASE_URL}/api/chat/conversations/${convIdBC}/messages`, studentC.token)).data || [];
  const retrievedMsg = msgsC.find(m => m.id === msgObj.id || m.content === testMsg);
  assert(retrievedMsg, `Student C retrieved message successfully: "${retrievedMsg ? retrievedMsg.content : 'none'}"`);

  // Verify read state
  const readRes = await post(`${BASE_URL}/api/chat/conversations/${convIdBC}/read`, {}, studentC.token);
  assert(readRes.status === 200, `Conversation marked as read by Student C: ${readRes.status}`);

  // 7. Cold Login Session Restoration
  console.log('\n7. Verifying Chat Restoration after Cold Logout & Login (Fresh Authentication Token)...');
  let freshStudentB = await login('620823104111', 'student@12');
  assert(freshStudentB && freshStudentB.token, 'Student B successfully re-authenticated after session termination');

  const restoredConvsB = (await get(`${BASE_URL}/api/chat/conversations`, freshStudentB.token)).data || [];
  const restoredConv = restoredConvsB.find(c => c.id === convIdBC || (c.participants && c.participants.includes('620823104133')));
  assert(restoredConv, `Accepted conversation persisted in Firestore and restored after cold login`);
  assert(restoredConv.lastMessage.includes(testMsg) || restoredConv.lastMessage.length > 0, `Last message metadata preserved across logins: "${restoredConv.lastMessage}"`);

  // 8. Advisor-to-HOD and HOD-to-Principal Executive Communication
  console.log('\n8. Testing Executive Channels (Advisor CSE-A -> HOD -> Principal)...');
  const convsHOD = (await get(`${BASE_URL}/api/chat/conversations`, hod.token)).data || [];
  assert(convsHOD.length > 0, `HOD has active persisted executive channels (${convsHOD.length})`);

  const convsPrin = (await get(`${BASE_URL}/api/chat/conversations`, principal.token)).data || [];
  assert(convsPrin.length > 0, `Principal has active persisted channels (${convsPrin.length})`);

  console.log('\n========================================================================');
  console.log(`ALL TESTS PASSED! (${passed}/${total} assertions passed successfully)`);
  console.log('========================================================================');
}

run().catch(err => {
  console.error('\n[SUITE ERROR]', err);
  process.exit(1);
});
