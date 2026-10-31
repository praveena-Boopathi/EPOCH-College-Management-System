const BASE_URL = 'http://localhost:8080';
const fs = require('fs');
const path = require('path');

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

async function verify() {
  console.log('========================================================================');
  console.log('EPOCH — VERIFICATION FOR THE TWO SPECIFIC CHANGES');
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
  // CHANGE 2 VERIFICATION: Fees & Payments Completely Removed
  // -------------------------------------------------------------------------
  console.log('--- CHANGE 2: VERIFY FEES & PAYMENTS REMOVAL ---');

  // 1. Verify index.html does not contain Fees & Payments elements
  const indexHtmlPath = path.join(__dirname, 'src', 'main', 'resources', 'static', 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  assert(!indexHtml.includes('id="sidebarFeesLink"'), 'index.html does not have sidebarFeesLink');
  assert(!indexHtml.includes('id="nav-fees"'), 'index.html does not have nav-fees link');
  assert(!indexHtml.includes('id="feesView"'), 'index.html does not have feesView section');
  assert(!indexHtml.includes('id="dedicatedFeeContainer"'), 'index.html does not have dedicatedFeeContainer');
  assert(!indexHtml.includes('id="upiPaymentModal"'), 'index.html does not have upiPaymentModal');
  assert(!indexHtml.includes('id="assignFeeModal"'), 'index.html does not have assignFeeModal');
  assert(!indexHtml.includes('id="rejectPaymentModal"'), 'index.html does not have rejectPaymentModal');
  assert(!indexHtml.includes('id="merchantSettingsModal"'), 'index.html does not have merchantSettingsModal');
  assert(!indexHtml.includes('id="studentFeeDetailsModal"'), 'index.html does not have studentFeeDetailsModal');
  assert(!indexHtml.includes('id="adminManageStudentFeeModal"'), 'index.html does not have adminManageStudentFeeModal');
  assert(!indexHtml.includes('src="/js/fees.js"'), 'index.html does not import /js/fees.js');

  // 2. Verify backend fees routes are completely inaccessible (404)
  const student = await login('620823104004', 'student@12');
  const resSettings = await get(`${BASE_URL}/api/fees/settings`, student.token);
  assert(resSettings.status === 404 || resSettings.status === 403, `GET /api/fees/settings is inaccessible (Status: ${resSettings.status})`);

  const resMyFees = await get(`${BASE_URL}/api/fees/my-fees`, student.token);
  assert(resMyFees.status === 404 || resMyFees.status === 403, `GET /api/fees/my-fees is inaccessible (Status: ${resMyFees.status})`);

  const resSubmitPay = await post(`${BASE_URL}/api/fees/submit-payment`, { utr: '123456789012' }, student.token);
  assert(resSubmitPay.status === 404 || resSubmitPay.status === 403, `POST /api/fees/submit-payment is inaccessible (Status: ${resSubmitPay.status})`);

  // -------------------------------------------------------------------------
  // CHANGE 1 VERIFICATION: Accepted Conversations Permanently Restored
  // -------------------------------------------------------------------------
  console.log('\n--- CHANGE 1: VERIFY PERMANENT ACCEPTED CONVERSATIONS RESTORATION ---');

  // Authenticate Student A and Student B
  let userA = await login('620823104004', 'student@12');
  let userB = await login('620823104005', 'student@12');
  assert(userA.token && userB.token, 'Both Student A and Student B authenticated successfully');

  // 1. Check existing shared conversation
  const convsA = (await get(`${BASE_URL}/api/chat/conversations`, userA.token)).data || [];
  const convsB = (await get(`${BASE_URL}/api/chat/conversations`, userB.token)).data || [];

  const convA = convsA.find(c => c.id === 'conv_620823104004_620823104005' || (c.participants && c.participants.includes('620823104005')));
  const convB = convsB.find(c => c.id === 'conv_620823104004_620823104005' || (c.participants && c.participants.includes('620823104004')));

  assert(convA, 'Student A sees accepted conversation in Chats list');
  assert(convB, 'Student B sees accepted conversation in Chats list');
  assert(convA.id === convB.id, `Both students share identical persistent conversation ID: ${convA.id}`);

  // 2. Exchange a message to verify real-time persistence
  const testMsg = 'Test persistence verification message at ' + Date.now();
  const sendMsg = await post(`${BASE_URL}/api/chat/conversations/${convA.id}/messages`, { content: testMsg }, userA.token);
  assert(sendMsg.status === 200 || sendMsg.status === 201, `Student A posted message successfully (Status: ${sendMsg.status})`);

  // 3. Cold login Student A (simulate logout, browser close, cold login)
  userA = null;
  userA = await login('620823104004', 'student@12');
  const convsAfterA = (await get(`${BASE_URL}/api/chat/conversations`, userA.token)).data || [];
  const restoredA = convsAfterA.find(c => c.id === convA.id);
  assert(restoredA, 'Conversation restored for Student A after cold login');
  assert(restoredA.lastMessage && restoredA.lastMessage.includes('Test persistence verification message'), 'Last message preview and content preserved for Student A');

  // 4. Cold login Student B (simulate logout, browser close, cold login)
  userB = null;
  userB = await login('620823104005', 'student@12');
  const convsAfterB = (await get(`${BASE_URL}/api/chat/conversations`, userB.token)).data || [];
  const restoredB = convsAfterB.find(c => c.id === convB.id);
  assert(restoredB, 'Conversation restored for Student B after cold login');
  assert(restoredB.lastMessage && restoredB.lastMessage.includes('Test persistence verification message'), 'Last message preview and content preserved for Student B');

  // 5. Attempt repeat request - verify reuse without error
  const repeatReq = await post(`${BASE_URL}/api/chat/requests`, {
    recipientId: '620823104005',
    recipientIdentifier: '620823104005',
    introMessage: 'Repeat request attempt'
  }, userA.token);
  assert(repeatReq.status === 200, 'Repeat request returns HTTP 200 OK without creating duplicate');
  assert(repeatReq.data.status === 'EXISTS', 'Repeat request status is EXISTS');
  assert(repeatReq.data.conversationId === convA.id, 'Existing conversation ID is reused');

  // 6. Verify pending request tabs are clean (accepted request is not in PENDING)
  const recB = (await get(`${BASE_URL}/api/chat/requests/received`, userB.token)).data || [];
  const pendingB = recB.find(r => r.conversationId === convA.id && r.status === 'PENDING');
  assert(!pendingB, 'Accepted request is not present as PENDING in recipient Requests tab');

  // -------------------------------------------------------------------------
  // OTHER EPOCH MODULES VERIFICATION: Ensure All Remain Functional
  // -------------------------------------------------------------------------
  console.log('\n--- VERIFY ALL OTHER EPOCH MODULES REMAIN FUNCTIONAL ---');

  // 1. Announcements module
  const annRes = await get(`${BASE_URL}/api/announcements`, userA.token);
  assert(annRes.status === 200 && Array.isArray(annRes.data), 'Announcements module functional (HTTP 200)');

  // 2. OD / Leave requests module
  const odRes = await get(`${BASE_URL}/api/od/student`, userA.token);
  assert(odRes.status === 200 && Array.isArray(odRes.data), 'OD / Leave requests module functional (HTTP 200)');

  // 3. User profile module
  const profRes = await get(`${BASE_URL}/api/auth/me`, userA.token);
  assert(profRes.status === 200 && profRes.data.identifier === '620823104004', 'User Profile module functional (HTTP 200)');

  // 4. Notifications module
  const notifRes = await get(`${BASE_URL}/api/notifications`, userA.token);
  assert(notifRes.status === 200 && Array.isArray(notifRes.data), 'Notifications module functional (HTTP 200)');

  // 5. Faculty / Staff login (HOD and Principal)
  const hod = await login('gopinath', 'hod@123');
  assert(hod.role === 'HOD', 'HOD login and role functional');

  const prin = await login('bsanjaygandhi', 'principal@123');
  assert(prin.role === 'PRINCIPAL', 'Principal login and role functional');

  console.log('\n========================================================================');
  console.log(`ALL VERIFICATION TESTS PASSED! (${passed}/${total} assertions passed)`);
  console.log('========================================================================');
}

verify().catch(err => {
  console.error('\n[VERIFICATION FAILED]:', err);
  process.exit(1);
});
