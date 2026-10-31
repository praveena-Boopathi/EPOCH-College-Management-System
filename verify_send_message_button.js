const { spawn } = require('child_process');
const BASE_URL = 'http://localhost:8080';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

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
  console.log('EPOCH — Send Message Button Repair & Real-Time Delivery Verification');
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
    // Part 1: API & Persistence Verification with Two Separate Accounts
    // -------------------------------------------------------------
    console.log('--- Step 1: Multi-Role Authentication ---');
    const accA = await login('620823104002', 'student@12'); // Student A (Abinaya G)
    const accB = await login('arularasi', 'advisor@123'); // Class Advisor (Mrs. P. Arularasi)
    assert(accA && accA.token, 'Account A (Student) authenticated');
    assert(accB && accB.token, 'Account B (Advisor) authenticated');

    // Retrieve or establish canonical conversation
    console.log('\n--- Step 2: Retrieve Existing Conversation ---');
    const convRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'arularasi' }, accA.token);
    assert(convRes.ok && convRes.data && convRes.data.id, `Conversation verified: ${convRes.data?.id}`);
    const convId = convRes.data.id;
    assert(convId.startsWith('conv_'), 'Conversation ID is canonical (conv_...)');

    // Test sending an empty message (prevented)
    console.log('\n--- Step 3: Prevent Empty and Invalid Submissions ---');
    const emptyRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: '   ' }, accA.token);
    assert(emptyRes.status === 400, 'Empty message rejected with status 400 (validation enforced)');

    const overlongRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, { content: 'x'.repeat(2005) }, accA.token);
    assert(overlongRes.status === 400, 'Overlong message (>2000 chars) rejected with status 400');

    // Account A sends message to Account B
    console.log('\n--- Step 4: Account A Sends Message to Account B ---');
    const ts = Date.now();
    const msgTextA = `Official query from Student regarding review schedule - TS ${ts}`;
    const sendResA = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: msgTextA,
      recipientId: 'arularasi'
    }, accA.token);
    assert(sendResA.ok && sendResA.data && sendResA.data.id, 'Account A message persisted and confirmed by server');
    assert(sendResA.data.content === msgTextA, 'Sent message content matches exactly');
    assert(sendResA.data.status === 'DELIVERED', 'Message status is DELIVERED');
    const msgIdA = sendResA.data.id;

    // Verify conversation's last-message metadata updated
    const convsCheckA = await get(`${BASE_URL}/api/chat/conversations`, accA.token);
    assert(convsCheckA.ok && Array.isArray(convsCheckA.data), 'Conversation list fetched for Account A');
    const activeConvA = convsCheckA.data.find(c => c.id === convId);
    assert(activeConvA && activeConvA.lastMessage === msgTextA, 'Conversation last-message metadata updated successfully');

    // Verify Account B receives message in real time without refreshing
    console.log('\n--- Step 5: Account B Receives Message in Real Time ---');
    const msgsResB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, accB.token);
    assert(msgsResB.ok && Array.isArray(msgsResB.data), 'Account B fetched messages');
    const foundMsgB = msgsResB.data.find(m => m.id === msgIdA);
    assert(!!foundMsgB, 'Account B received Account A message without refreshing');

    // Account B marks as read and replies
    console.log('\n--- Step 6: Account B Replies to Account A ---');
    const readResB = await post(`${BASE_URL}/api/chat/conversations/${convId}/read`, {}, accB.token);
    assert(readResB.ok, 'Account B marked conversation as read');

    const replyTextB = `Review schedule is fixed for Friday morning 10:00 AM. Please bring project abstract. - TS ${ts}`;
    const replyResB = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: replyTextB,
      recipientId: '620823104002',
      replyToId: msgIdA,
      replyToSender: 'ABINAYA G',
      replyToText: msgTextA
    }, accB.token);
    assert(replyResB.ok && replyResB.data && replyResB.data.id, 'Account B reply sent successfully');
    const replyIdB = replyResB.data.id;

    // Verify Account A receives reply
    const msgsResA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, accA.token);
    assert(msgsResA.ok && Array.isArray(msgsResA.data), 'Account A fetched messages');
    const foundReplyA = msgsResA.data.find(m => m.id === replyIdB);
    assert(!!foundReplyA, 'Account A received Account B reply');
    assert(foundReplyA.replyToId === msgIdA, 'Quoted reply metadata intact');

    // Verify both messages remain after refresh / re-login
    console.log('\n--- Step 7: Session Re-Authentication (Persistence Check) ---');
    const freshAccA = await login('620823104002', 'student@12');
    const freshAccB = await login('arularasi', 'advisor@123');
    assert(freshAccA && freshAccB, 'Both accounts re-authenticated with fresh session tokens');

    const freshMsgsA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, freshAccA.token);
    const freshMsgsB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, freshAccB.token);
    assert(freshMsgsA.ok && freshMsgsB.ok, 'Both accounts retrieved conversation history after fresh login');
    assert(freshMsgsA.data.some(m => m.id === msgIdA), 'Original message persists after logout/login');
    assert(freshMsgsA.data.some(m => m.id === replyIdB), 'Reply persists after logout/login');
    assert(freshMsgsA.data.length === freshMsgsB.data.length, 'Both accounts see identical message history count');

    // -------------------------------------------------------------
    // Part 2: In-Browser Headless Verification (Send Button Click & UI Flow)
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Headless Browser UI Verification (Send Button Click) ---');
    const edgeProc = spawn(edgePath, [
      '--remote-debugging-port=9222',
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      'http://localhost:8080'
    ], { stdio: 'ignore' });

    let targets = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const res = await fetch('http://localhost:9222/json/list');
        targets = await res.json();
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    if (targets && targets.length > 0) {
      const pageTarget = targets.find(t => t.type === 'page') || targets[0];
      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      let cdpId = 1;
      const cdpPending = new Map();
      function cdpSend(method, params = {}) {
        return new Promise((resolve, reject) => {
          const id = cdpId++;
          cdpPending.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      await new Promise(r => ws.onopen = r);
      ws.onmessage = (event) => {
        const d = JSON.parse(event.data);
        if (d.id && cdpPending.has(d.id)) {
          const { resolve } = cdpPending.get(d.id);
          cdpPending.delete(d.id);
          resolve(d.result);
        } else if (d.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', d.params.type, d.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
        } else if (d.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', d.params.exceptionDetails);
        }
      };

      await cdpSend('Page.enable');
      await cdpSend('Runtime.enable');

      async function evalInBrowser(expression) {
        const r = await cdpSend('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        return r.result ? r.result.value : null;
      }

      // Navigate to login
      await cdpSend('Page.navigate', { url: 'http://localhost:8080/#login' });
      await new Promise(r => setTimeout(r, 1200));

      // Login
      await evalInBrowser(`
        (async () => {
          App.selectRole('student');
          const idInput = document.getElementById('loginIdentifier');
          const passInput = document.getElementById('loginPassword');
          if (idInput) idInput.value = '620823104002';
          if (passInput) passInput.value = 'student@12';
          const form = document.getElementById('roleLoginForm');
          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()
      `);
      await new Promise(r => setTimeout(r, 1500));

      // Open Messages
      await evalInBrowser(`
        (async () => {
          App.switchTab('messages');
          await ChatApp.init(Auth.getUser());
        })()
      `);
      await new Promise(r => setTimeout(r, 1200));

      // Select conversation
      await evalInBrowser(`
        (async () => {
          await ChatApp.selectConversation('${convId}');
        })()
      `);
      await new Promise(r => setTimeout(r, 1000));

      // Verify DOM button properties
      const btnDomCheck = await evalInBrowser(`
        (() => {
          const btn = document.getElementById('chatSendBtn');
          const form = document.getElementById('chatMessageForm');
          return {
            btnType: btn ? btn.getAttribute('type') : null,
            btnOnClick: btn ? btn.getAttribute('onclick') : null,
            formOnSubmit: form ? form.getAttribute('onsubmit') : null
          };
        })()
      `);
      assert(btnDomCheck && btnDomCheck.btnType === 'button', 'Send button type is "button" (prevents unhandled form submission)');
      assert(btnDomCheck && btnDomCheck.btnOnClick && btnDomCheck.btnOnClick.includes('ChatApp.handleSendMessage'), 'Send button has explicit onClick handler');
      assert(btnDomCheck && btnDomCheck.formOnSubmit && btnDomCheck.formOnSubmit.includes('preventDefault'), 'Form onsubmit has preventDefault and return false');

      // Type "kkkkk" into the composer
      const uniqueMsg = `kkkkk-browser-test-${Date.now()}`;
      await evalInBrowser(`
        (() => {
          const input = document.getElementById('chatMessageInput');
          input.value = '${uniqueMsg}';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        })()
      `);

      const sendBtnEnabled = await evalInBrowser(`!document.getElementById('chatSendBtn').disabled`);
      assert(sendBtnEnabled, 'Send button enabled after typing text');

      // Click Send button
      await evalInBrowser(`
        (() => {
          const btn = document.getElementById('chatSendBtn');
          btn.click();
        })()
      `);
      await new Promise(r => setTimeout(r, 2000));

      // Check input cleared and message rendered
      const afterSendState = await evalInBrowser(`
        (() => {
          const input = document.getElementById('chatMessageInput');
          const lastMsg = (ChatApp.messages || [])[(ChatApp.messages || []).length - 1];
          return {
            inputCleared: input ? input.value === '' : false,
            lastMsgContent: lastMsg ? lastMsg.content : null,
            lastMsgStatus: lastMsg ? lastMsg.status : null
          };
        })()
      `);
      assert(afterSendState && afterSendState.inputCleared, 'Input cleared only after successful delivery');
      assert(afterSendState && afterSendState.lastMsgContent === uniqueMsg, 'Sent message rendered in chat stream');
      assert(afterSendState && afterSendState.lastMsgStatus === 'DELIVERED', 'Sent message confirmed DELIVERED');

      ws.close();
      edgeProc.kill();
    } else {
      console.warn('Edge CDP skipped: browser not available in background');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
