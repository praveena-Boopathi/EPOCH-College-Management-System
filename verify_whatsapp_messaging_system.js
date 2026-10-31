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
  console.log('===============================================================');
  console.log('EPOCH — WhatsApp-Style Messaging & Directory Verification Test');
  console.log('===============================================================\n');

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
    // 1. Authenticate multi-role accounts
    console.log('--- Step 1: Multi-Role Authentication ---');
    const stuA = await login('620823104002', 'student@12'); // Abinaya G (CSE-A)
    assert(stuA && stuA.identifier === '620823104002', 'Student A authenticated (CSE-A)');

    const stuB = await login('620823104111', 'student@12'); // Navasri S (CSE-B)
    assert(stuB && stuB.identifier === '620823104111', 'Student B authenticated (CSE-B)');

    const stuC = await login('620823104133', 'student@12'); // Praveena B (CSE-C)
    assert(stuC && stuC.identifier === '620823104133', 'Student C authenticated (CSE-C)');

    const advA = await login('arularasi', 'advisor@123'); // Mrs. P. Arularasi (CSE-A)
    assert(advA && advA.identifier === 'arularasi', 'Advisor CSE-A authenticated (arularasi)');

    const advB = await login('divyabharathi', 'advisor@123'); // Dr. Divyabharathi (CSE-B)
    assert(advB && advB.identifier === 'divyabharathi', 'Advisor CSE-B authenticated (divyabharathi)');

    const hod = await login('gopinath', 'hod@123'); // Dr. K. Gopinath
    assert(hod && hod.identifier === 'gopinath', 'HOD authenticated (gopinath)');

    const prin = await login('principal@gct.ac.in', 'principal@123'); // Dr. B. Sanjay Gandhi
    assert(prin && prin.role === 'PRINCIPAL', 'Principal authenticated (bsanjaygandhi)');

    // 2. User Directory Search Tests
    console.log('\n--- Step 2: Unified User Directory Search API ---');
    
    // 2a. Student A searches without query
    const allUsersRes = await get(`${BASE_URL}/api/chat/users/search`, stuA.token);
    assert(allUsersRes.status === 200 && Array.isArray(allUsersRes.data), 'Directory search returns 200 array');
    assert(allUsersRes.data.length > 0, `Directory search returns users (count: ${allUsersRes.data.length})`);
    
    // Verify self is excluded
    const selfFound = allUsersRes.data.some(u => u.identifier.toLowerCase() === stuA.identifier.toLowerCase());
    assert(!selfFound, 'Current user is excluded from their own search results');

    // Verify sanitized public fields, NO sensitive fields
    const firstUser = allUsersRes.data[0];
    const hasSensitive = ('password' in firstUser) || ('contact' in firstUser) || ('phone' in firstUser);
    assert(!hasSensitive, 'No sensitive fields (password, phone) exposed in directory search');
    assert('identifier' in firstUser && 'name' in firstUser && 'role' in firstUser && 'department' in firstUser && 'section' in firstUser, 'Search results display identifier, name, role, department, section');

    // 2b. Search by student name
    const nameSearchRes = await get(`${BASE_URL}/api/chat/users/search?query=Navasri`, stuA.token);
    assert(nameSearchRes.status === 200, 'Search by student name returns 200');
    const navasri = (nameSearchRes.data || []).find(u => u.identifier === '620823104111');
    assert(!!navasri, 'Search by student name finds Navasri S (620823104111)');

    // 2c. Search by student register number
    const regSearchRes = await get(`${BASE_URL}/api/chat/users/search?query=620823104133`, stuA.token);
    assert(regSearchRes.status === 200, 'Search by student regNo returns 200');
    const praveena = (regSearchRes.data || []).find(u => u.identifier === '620823104133');
    assert(!!praveena && praveena.section === 'CSE-C', 'Search by student regNo finds Praveena B in CSE-C');

    // 2d. Search by staff ID
    const staffIdSearch = await get(`${BASE_URL}/api/chat/users/search?query=arularasi`, stuA.token);
    assert(staffIdSearch.status === 200, 'Search by staff ID returns 200');
    const arul = (staffIdSearch.data || []).find(u => u.identifier === 'arularasi');
    assert(!!arul && arul.role === 'ADVISOR', 'Search by staff ID finds Mrs. P. Arularasi (ADVISOR)');

    // 2e. Search by staff name
    const staffNameSearch = await get(`${BASE_URL}/api/chat/users/search?query=Gopinath`, stuA.token);
    assert(staffNameSearch.status === 200, 'Search by staff name returns 200');
    const gopi = (staffNameSearch.data || []).find(u => u.identifier === 'gopinath');
    assert(!!gopi && gopi.role === 'HOD', 'Search by staff name finds Dr. K. Gopinath (HOD)');

    // 2f. Search Principal
    const prinSearch = await get(`${BASE_URL}/api/chat/users/search?query=Sanjay`, stuA.token);
    assert(prinSearch.status === 200, 'Search by Principal name returns 200');
    const sanjay = (prinSearch.data || []).find(u => u.identifier === 'bsanjaygandhi');
    assert(!!sanjay && sanjay.role === 'PRINCIPAL', 'Search finds Dr. B. Sanjay Gandhi (PRINCIPAL)');

    // 2g. Role filter: STUDENTS only
    const stuOnlySearch = await get(`${BASE_URL}/api/chat/users/search?role=STUDENT&limit=15`, stuA.token);
    assert(stuOnlySearch.status === 200 && stuOnlySearch.data.every(u => u.role === 'STUDENT'), 'Role filter STUDENT returns only students');

    // 2h. Role filter: STAFF only
    const staffOnlySearch = await get(`${BASE_URL}/api/chat/users/search?role=STAFF`, stuA.token);
    assert(staffOnlySearch.status === 200 && staffOnlySearch.data.every(u => u.role !== 'STUDENT'), 'Role filter STAFF returns only faculty / advisors / HOD / Principal');

    // 2i. Pagination test
    const page0 = await get(`${BASE_URL}/api/chat/users/search?page=0&limit=5`, stuA.token);
    const page1 = await get(`${BASE_URL}/api/chat/users/search?page=1&limit=5`, stuA.token);
    assert(page0.data.length <= 5 && page1.data.length <= 5, 'Pagination limit respected');
    assert(page0.data[0].identifier !== page1.data[0].identifier, 'Pagination page offsets distinct users');

    // 3. Direct Messaging Between Students
    console.log('\n--- Step 3: Direct Messaging (Student A -> Student B) ---');
    const directConvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: '620823104111' }, stuA.token);
    assert(directConvRes.status === 200 && directConvRes.data.id, `Direct conversation opened/created: ${directConvRes.data && directConvRes.data.id}`);
    const convId = directConvRes.data.id;
    assert(convId === 'conv_620823104002_620823104111', `Canonical conversation ID verified: ${convId}`);

    // Verify idempotency (calling again returns the exact same conversation)
    const secondCall = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: '620823104111' }, stuA.token);
    assert(secondCall.data.id === convId, 'Idempotent conversation check: same conversation returned, no duplicates');

    // Student A sends message to Student B
    const uniqueTextA = `Direct WhatsApp-style test message ${Date.now()}`;
    const sendResA = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: uniqueTextA }, stuA.token);
    assert(sendResA.status === 200 && sendResA.data.id, 'Student A sends message successfully (HTTP 200)');
    assert(sendResA.data.delivered === true && sendResA.data.status === 'DELIVERED', 'Message delivery status is DELIVERED');

    // Student B fetches conversations list
    const convsB = await get(`${BASE_URL}/api/chat/conversations`, stuB.token);
    assert(convsB.status === 200, 'Student B fetches conversations list (HTTP 200)');
    const convForB = (convsB.data || []).find(c => c.id === convId);
    assert(!!convForB, 'Student B automatically sees the conversation in chat list');
    assert(convForB && convForB.lastMessage === uniqueTextA, 'Student B sees latest message preview in chat list');

    // Student B fetches messages in conversation
    const msgsB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, stuB.token);
    assert(msgsB.status === 200 && Array.isArray(msgsB.data), 'Student B loads conversation messages');
    const receivedMsg = (msgsB.data || []).find(m => m.id === sendResA.data.id);
    assert(!!receivedMsg && receivedMsg.content === uniqueTextA, 'Student B receives Student A message immediately');

    // Student B replies to Student A
    const replyTextB = `Student B instant reply ${Date.now()}`;
    const sendResB = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: replyTextB }, stuB.token);
    assert(sendResB.status === 200 && sendResB.data.id, 'Student B replies successfully (HTTP 200)');

    // Student A loads messages and sees Student B reply
    const msgsA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, stuA.token);
    const replyMsg = (msgsA.data || []).find(m => m.id === sendResB.data.id);
    assert(!!replyMsg && replyMsg.content === replyTextB, 'Student A receives Student B reply immediately');

    // 4. Multi-Role Direct Messaging: Student to Assigned Advisor, HOD, Principal
    console.log('\n--- Step 4: Multi-Role Direct Messaging ---');
    // Student A (CSE-A) to Advisor CSE-A (arularasi)
    const stuToAdvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'arularasi' }, stuA.token);
    assert(stuToAdvRes.status === 200 && stuToAdvRes.data.id, 'Student A initiates conversation with Section Advisor (arularasi)');
    const advConvId = stuToAdvRes.data.id;

    const advMsg = await post(`${BASE_URL}/api/chat/conversations/${advConvId}/messages`, { content: 'Good morning Ma\'am, submitting my OD form.' }, stuA.token);
    assert(advMsg.status === 200, 'Student A sends message to Section Advisor');

    const advConvs = await get(`${BASE_URL}/api/chat/conversations`, advA.token);
    const foundAdvConv = (advConvs.data || []).find(c => c.id === advConvId);
    assert(!!foundAdvConv, 'Advisor CSE-A sees the conversation in chat list');

    // Student A (CSE-A) initiating with Advisor CSE-B (unauthorized cross-section student-advisor initiation)
    const crossAdvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'divyabharathi' }, stuA.token);
    assert(crossAdvRes.status === 403, 'Cross-section advisor initiation properly blocked by institutional policy (HTTP 403)');

    // Staff to Staff: Advisor CSE-A (arularasi) with HOD (gopinath)
    const staffStaffRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'gopinath' }, advA.token);
    assert(staffStaffRes.status === 200 && staffStaffRes.data.id, 'Advisor creates direct conversation with HOD');
    assert(staffStaffRes.data.type === 'STAFF_STAFF', 'Staff to staff conversation type is STAFF_STAFF');

    // Student A to HOD (gopinath)
    const stuHodRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'gopinath' }, stuA.token);
    assert(stuHodRes.status === 200 && stuHodRes.data.id, 'Student A initiates direct conversation with HOD');

    // Student A to Principal (bsanjaygandhi)
    const stuPrinRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'bsanjaygandhi' }, stuA.token);
    assert(stuPrinRes.status === 200 && stuPrinRes.data.id, 'Student A initiates direct conversation with Principal');

    // 5. Cold Logout and Fresh Login History Persistence
    console.log('\n--- Step 5: Cold Logout and Fresh Login Persistence ---');
    // Fresh login for Student A
    const freshStuA = await login('620823104002', 'student@12');
    const freshConvsA = await get(`${BASE_URL}/api/chat/conversations`, freshStuA.token);
    assert(freshConvsA.status === 200, 'Student A cold login retrieves conversations (HTTP 200)');
    const freshConvA = (freshConvsA.data || []).find(c => c.id === convId);
    assert(!!freshConvA, 'Conversation persists in Student A chat list after cold relogin');

    const freshMsgsA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, freshStuA.token);
    assert(freshMsgsA.status === 200 && freshMsgsA.data.length >= 2, `All messages persist for Student A after cold relogin (count: ${freshMsgsA.data.length})`);

    // Fresh login for Student B
    const freshStuB = await login('620823104111', 'student@12');
    const freshConvsB = await get(`${BASE_URL}/api/chat/conversations`, freshStuB.token);
    assert(freshConvsB.status === 200, 'Student B cold login retrieves conversations (HTTP 200)');
    const freshConvB = (freshConvsB.data || []).find(c => c.id === convId);
    assert(!!freshConvB, 'Conversation persists in Student B chat list after cold relogin');

    const freshMsgsB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, freshStuB.token);
    assert(freshMsgsB.status === 200 && freshMsgsB.data.length >= 2, `All messages persist for Student B after cold relogin (count: ${freshMsgsB.data.length})`);

    // Verify search endpoint reflects hasExistingConversation = true
    const searchReflect = await get(`${BASE_URL}/api/chat/users/search?query=Navasri`, freshStuA.token);
    const navasriReflect = (searchReflect.data || []).find(u => u.identifier === '620823104111');
    assert(navasriReflect && navasriReflect.hasExistingConversation === true, 'Directory search correctly reflects hasExistingConversation: true for established contacts');

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
