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
  if (!res.ok || !res.data || !res.data.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function runTests() {
  console.log('========================================================================');
  console.log('EPOCH — Complete Messaging System Reliability & Persistence Verification');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Step 1: Multi-Role Authentication
    // -------------------------------------------------------------
    console.log('--- Step 1: Multi-Role Authentication ---');
    const stuA = await login('620823104002', 'student@12'); // Abinaya G (CSE-A)
    assert(stuA && stuA.identifier === '620823104002', 'Student A (CSE-A) authenticated');

    const stuB = await login('620823104111', 'student@12'); // Navasri S (CSE-B)
    assert(stuB && stuB.identifier === '620823104111', 'Student B (CSE-B) authenticated');

    const advA = await login('arularasi', 'advisor@123'); // Mrs. P. Arularasi (CSE-A Advisor)
    assert(advA && advA.identifier === 'arularasi', 'Class Advisor CSE-A (arularasi) authenticated');

    const hod = await login('gopinath', 'hod@123'); // Dr. K. Gopinath (HOD)
    assert(hod && hod.identifier === 'gopinath', 'HOD CSE (gopinath) authenticated');

    const prin = await login('principal@gct.ac.in', 'principal@123'); // Dr. B. Sanjay Gandhi (Principal)
    assert(prin && (prin.identifier === 'bsanjaygandhi' || prin.role === 'PRINCIPAL'), 'Principal authenticated');

    // -------------------------------------------------------------
    // Step 2: Phase 2 - Registered User Search Directory
    // -------------------------------------------------------------
    console.log('\n--- Step 2: User Search Directory (/api/chat/users/search) ---');
    
    // 2.1 Search by advisor name
    const searchAdv = await get(`${BASE_URL}/api/chat/users/search?query=arularasi`, stuA.token);
    assert(searchAdv.ok && Array.isArray(searchAdv.data) && searchAdv.data.length > 0, 'Search by advisor name returns results');
    const foundAdv = searchAdv.data.find(u => u.identifier && u.identifier.toLowerCase() === 'arularasi');
    assert(foundAdv && foundAdv.role === 'ADVISOR' && foundAdv.section === 'CSE-A', 'Advisor CSE-A returned with role and section');
    assert(!foundAdv.password && !foundAdv.fees, 'Sensitive fields omitted from search result');

    // 2.2 Search by student register number
    const searchStu = await get(`${BASE_URL}/api/chat/users/search?query=620823104111`, stuA.token);
    assert(searchStu.ok && Array.isArray(searchStu.data) && searchStu.data.length > 0, 'Search by register number returns results');
    const foundStu = searchStu.data.find(u => u.identifier === '620823104111');
    assert(foundStu && foundStu.name.toUpperCase().includes('NAVASRI') && foundStu.section === 'CSE-B', 'Student B found with name and section');

    // 2.3 Search with role filter
    const searchStaffOnly = await get(`${BASE_URL}/api/chat/users/search?role=STAFF`, stuA.token);
    assert(searchStaffOnly.ok && searchStaffOnly.data.every(u => u.role !== 'STUDENT'), 'Role filter STAFF returns only staff/faculty');

    const searchHod = await get(`${BASE_URL}/api/chat/users/search?query=gopinath`, advA.token);
    assert(searchHod.ok && searchHod.data.some(u => u.identifier === 'gopinath' && u.role === 'HOD'), 'HOD found in directory');

    // -------------------------------------------------------------
    // Step 3: Phase 3 & 4 - Persistent Direct Messaging (Student to Advisor)
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Direct Messaging & Real-Time Delivery ---');

    // 3.1 Student A opens/creates direct conversation with their Section Advisor
    const convRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'arularasi' }, stuA.token);
    assert(convRes.ok && convRes.data && convRes.data.id, 'Student A direct conversation retrieved/created with Advisor', JSON.stringify(convRes.data));
    const convId = convRes.data.id;
    assert(convId.startsWith('conv_'), 'Conversation ID is canonical (conv_...)');

    // 3.2 Send validation checks
    const emptySend = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: '   ' }, stuA.token);
    assert(emptySend.status === 400, 'Empty message rejected with status 400');

    const overlength = 'A'.repeat(2005);
    const overSend = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: overlength }, stuA.token);
    assert(overSend.status === 400, 'Overlong message (>2000 chars) rejected with status 400');

    // 3.3 Student A sends valid official message
    const runTimestamp = Date.now();
    const msgText1 = `Official query regarding internal assessment schedule [TS: ${runTimestamp}]`;
    const sendRes1 = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: msgText1,
      recipientId: 'arularasi'
    }, stuA.token);
    assert(sendRes1.ok && sendRes1.data && sendRes1.data.id, 'Message sent successfully by Student A');
    assert(sendRes1.data.content === msgText1, 'Sent message content matches exactly');
    assert(sendRes1.data.status === 'DELIVERED', 'Message status is DELIVERED upon creation');

    // 3.4 Advisor CSE-A retrieves messages in real-time
    const advMsgsRes = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, advA.token);
    assert(advMsgsRes.ok && Array.isArray(advMsgsRes.data), 'Advisor CSE-A fetched conversation messages');
    const msgFoundInAdv = advMsgsRes.data.find(m => m.content === msgText1);
    assert(!!msgFoundInAdv, 'Student message successfully received by Advisor CSE-A');

    // 3.5 Advisor marks conversation as read
    const readRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/read`, {}, advA.token);
    assert(readRes.ok, 'Advisor marked conversation as read');

    // 3.6 Advisor CSE-A replies to Student A
    const replyText = `Assessment schedule is published on notice board. Please verify with class CR. [TS: ${runTimestamp}]`;
    const advReplyRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: replyText,
      recipientId: '620823104002'
    }, advA.token);
    assert(advReplyRes.ok && advReplyRes.data.id, 'Advisor CSE-A reply sent successfully');

    // 3.7 Student A receives Advisor reply
    const stuMsgsRes = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, stuA.token);
    assert(stuMsgsRes.ok, 'Student A fetched messages');
    const replyFoundInStu = stuMsgsRes.data.find(m => m.content === replyText);
    assert(!!replyFoundInStu, 'Advisor reply received by Student A');

    // -------------------------------------------------------------
    // Step 4: Phase 5 - Chat History Persistence Across Fresh Login / Refresh
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Permanent History & Session Refresh Simulation ---');

    // Simulate fresh login / browser reload for Student A (new session token)
    const freshStuA = await login('620823104002', 'student@12');
    assert(freshStuA && freshStuA.token, 'Student A re-authenticated (simulating browser reload)');

    // Fetch conversation list
    const freshConvs = await get(`${BASE_URL}/api/chat/conversations`, freshStuA.token);
    assert(freshConvs.ok && Array.isArray(freshConvs.data), 'Conversation list retrieved on fresh reload');
    const persistedConv = freshConvs.data.find(c => c.id === convId);
    assert(!!persistedConv, 'Conversation is permanently present in conversation list after reload');
    assert(persistedConv.lastMessage.includes('schedule'), 'Conversation preview shows latest message');

    // Fetch all messages for the conversation
    const freshMsgs = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, freshStuA.token);
    assert(freshMsgs.ok && Array.isArray(freshMsgs.data), 'Complete chat history loaded on fresh reload');
    assert(freshMsgs.data.some(m => m.content === msgText1), 'Original Student message persisted in history');
    assert(freshMsgs.data.some(m => m.content === replyText), 'Advisor reply persisted in history');
    
    // Verify chronological order
    const isChronological = freshMsgs.data.every((m, idx, arr) => idx === 0 || m.createdAt >= arr[idx - 1].createdAt);
    assert(isChronological, 'All messages strictly ordered chronologically');

    // -------------------------------------------------------------
    // Step 5: Student-to-Student Message Request & Acceptance Workflow
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Student-to-Student Request & Direct Chat ---');

    // Student A sends request to Student B
    const introMsg = `Hi Navasri, connecting for academic seminar materials. [TS: ${runTimestamp}]`;
    const reqRes = await post(`${BASE_URL}/api/chat/requests`, {
      recipientId: '620823104111',
      introMessage: introMsg
    }, stuA.token);

    assert(reqRes.ok || reqRes.status === 201 || (reqRes.data && reqRes.data.status === 'EXISTS'), 'Student-to-student request handled cleanly');

    let stuConvId = null;
    if (reqRes.data && reqRes.data.conversationId) {
      stuConvId = reqRes.data.conversationId;
      console.log(`[INFO] Active conversation already exists: ${stuConvId}`);
    } else if (reqRes.data && reqRes.data.id) {
      const requestId = reqRes.data.id;
      // Student B checks received requests
      const recReqs = await get(`${BASE_URL}/api/chat/requests/received`, stuB.token);
      assert(recReqs.ok && Array.isArray(recReqs.data), 'Student B fetched received message requests');
      
      // Student B accepts request
      const acceptRes = await post(`${BASE_URL}/api/chat/requests/${requestId}/accept`, {}, stuB.token);
      assert(acceptRes.ok && acceptRes.data && acceptRes.data.id, 'Student B accepted request; shared conversation established');
      stuConvId = acceptRes.data.id;
    }

    if (stuConvId) {
      // Exchange messages between Student A and Student B
      const s2sMsg = `Shared notes link: https://epoch.edu/notes/cse-${runTimestamp}`;
      const sendS2S = await post(`${BASE_URL}/api/chat/conversations/${stuConvId}/messages`, {
        content: s2sMsg,
        recipientId: '620823104111'
      }, stuA.token);
      assert(sendS2S.ok, 'Student A sent message to Student B in accepted conversation');

      // Student B fetches messages
      const bMsgs = await get(`${BASE_URL}/api/chat/conversations/${stuConvId}/messages`, stuB.token);
      assert(bMsgs.ok && bMsgs.data.some(m => m.content === s2sMsg), 'Student B received Student A message in real-time');
    }

    // -------------------------------------------------------------
    // Step 6: Staff-to-Staff Direct Messaging (Advisor to HOD)
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Staff-to-Staff Direct Messaging (Advisor to HOD) ---');

    const staffConvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'gopinath' }, advA.token);
    assert(staffConvRes.ok && staffConvRes.data && staffConvRes.data.id, 'Staff-to-Staff conversation retrieved/created');
    const staffConvId = staffConvRes.data.id;

    const staffMsgText = `HOD sir, Section CSE-A attendance report uploaded for review. [TS: ${runTimestamp}]`;
    const sendStaffMsg = await post(`${BASE_URL}/api/chat/conversations/${staffConvId}/messages`, {
      content: staffMsgText,
      recipientId: 'gopinath'
    }, advA.token);
    assert(sendStaffMsg.ok, 'Advisor sent message to HOD');

    // HOD fetches messages
    const hodMsgs = await get(`${BASE_URL}/api/chat/conversations/${staffConvId}/messages`, hod.token);
    assert(hodMsgs.ok && hodMsgs.data.some(m => m.content === staffMsgText), 'HOD received Advisor message in real-time');

    // HOD replies to Advisor
    const hodReplyText = `Approved. Please notify the students regarding the minimum 75% cutoff. [TS: ${runTimestamp}]`;
    const sendHodReply = await post(`${BASE_URL}/api/chat/conversations/${staffConvId}/messages`, {
      content: hodReplyText,
      recipientId: 'arularasi'
    }, hod.token);
    assert(sendHodReply.ok, 'HOD replied to Advisor');

    // -------------------------------------------------------------
    // Step 7: Fast Performance Check
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Performance & Latency Check ---');
    // 7.1 Fresh sync with remote Firestore
    const startCold = Date.now();
    const coldConvs = await get(`${BASE_URL}/api/chat/conversations`, stuA.token);
    const coldDuration = Date.now() - startCold;
    assert(coldConvs.ok, 'Conversations loaded successfully from remote Firestore');
    console.log(`[PERF] Remote Firestore conversation fetch: ${coldDuration}ms`);

    // 7.2 Immediate cached fetch (served directly from memory cache in < 200ms)
    const startCached = Date.now();
    const cachedConvs = await get(`${BASE_URL}/api/chat/conversations`, stuA.token);
    const cachedDuration = Date.now() - startCached;
    assert(cachedConvs.ok, 'Conversations loaded successfully from cache');
    assert(cachedDuration < 200, `Memory-accelerated conversation list is fast: ${cachedDuration}ms (< 200ms)`);
    console.log(`[PERF] Memory-accelerated conversation fetch: ${cachedDuration}ms`);

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();

