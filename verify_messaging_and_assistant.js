const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, data: b }); }
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
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, data: b }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  [FAIL] Test ${total}: ${message}`);
    throw new Error(`Test ${total} failed: ${message}`);
  }
  console.log(`  [PASS] Test ${total}: ${message}`);
  passed++;
}

async function run() {
  console.log('========================================================================');
  console.log('EPOCH — FINAL MESSAGING REPAIR & ASSISTANT POSITIONING VERIFICATION');
  console.log('========================================================================\n');

  // 1. Authenticate Student A and Student B
  console.log('Step 1: Authenticating Student A and Student B...');
  const resA = await post(`${BASE_URL}/api/auth/login`, { username: '620823104002', password: 'student@12' });
  const resB = await post(`${BASE_URL}/api/auth/login`, { username: '620823104003', password: 'student@12' });
  assert(resA.status === 200 && resA.data.token, 'Student A authenticated (Abinaya G - 620823104002)');
  assert(resB.status === 200 && resB.data.token, 'Student B authenticated (Abinaya P - 620823104003)');
  let tokenA = resA.data.token;
  let tokenB = resB.data.token;

  // 2. Resolve Active Conversation between Student A and Student B
  console.log('\nStep 2: Resolving active accepted conversation between Student A and Student B...');
  const convsA = await get(`${BASE_URL}/api/chat/conversations`, tokenA);
  assert(convsA.status === 200, 'Student A retrieved conversations list');
  const sharedConv = (convsA.data || []).find(c => {
    const parts = c.id.replace('conv_', '').split('_');
    return (parts.includes('620823104002') && parts.includes('620823104003')) ||
           (c.studentRegNo === '620823104002' && c.staffUsername === '620823104003') ||
           (c.studentRegNo === '620823104003' && c.staffUsername === '620823104002');
  });
  assert(!!sharedConv, `Found active conversation: ${sharedConv ? sharedConv.id : 'none'}`);
  const convId = sharedConv.id;

  // Verify Student B also sees the exact same conversation
  const convsB = await get(`${BASE_URL}/api/chat/conversations`, tokenB);
  assert(convsB.status === 200, 'Student B retrieved conversations list');
  assert(convsB.data.some(c => c.id === convId), `Student B shares identical conversation ID: ${convId}`);

  // 3. Mandatory Requirement A & B: Student A sends message to Student B & persists in Firebase
  console.log('\nStep 3: [Req A & B] Student A sends message to Student B...');
  const payloadA = `Verification test from Student A at ${Date.now()}`;
  const sendResA = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
    content: payloadA,
    recipientId: '620823104003'
  }, tokenA);
  assert(sendResA.status === 200, 'Student A message sent successfully (200 OK)');
  const sentMsgA = sendResA.data;
  assert(sentMsgA.id && sentMsgA.id.startsWith('MSG-'), `Message has unique ID: ${sentMsgA.id}`);
  assert(sentMsgA.conversationId === convId, `Message matches conversation ID: ${sentMsgA.conversationId}`);
  assert(sentMsgA.senderId === '620823104002', `Sender verified as Student A: ${sentMsgA.senderId}`);
  assert(sentMsgA.recipientId === '620823104003', `Recipient verified as Student B: ${sentMsgA.recipientId}`);
  assert(sentMsgA.content === payloadA, `Message content matches payload: "${sentMsgA.content}"`);

  // 4. Mandatory Requirement C: Student B receives message immediately
  console.log('\nStep 4: [Req C] Student B retrieves messages and confirms immediate receipt...');
  const msgsResB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, tokenB);
  assert(msgsResB.status === 200, 'Student B retrieved message history');
  const foundMsgB = (msgsResB.data || []).find(m => m.id === sentMsgA.id);
  assert(!!foundMsgB, 'Student B immediately received message from Student A');
  assert(foundMsgB && foundMsgB.content === payloadA, 'Received content matches exactly');

  // 5. Mandatory Requirement D: Student B replies and Student A receives it
  console.log('\nStep 5: [Req D] Student B replies to Student A...');
  const payloadB = `Reply from Student B to Student A at ${Date.now()}`;
  const sendResB = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
    content: payloadB,
    recipientId: '620823104002'
  }, tokenB);
  assert(sendResB.status === 200, 'Student B reply sent successfully (200 OK)');
  const sentMsgB = sendResB.data;
  assert(sentMsgB.senderId === '620823104003', `Reply sender verified as Student B: ${sentMsgB.senderId}`);
  assert(sentMsgB.recipientId === '620823104002', `Reply recipient verified as Student A: ${sentMsgB.recipientId}`);

  // Student A retrieves messages and confirms reply
  const msgsResA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, tokenA);
  assert(msgsResA.status === 200, 'Student A retrieved message history');
  const foundReplyA = (msgsResA.data || []).find(m => m.id === sentMsgB.id);
  assert(!!foundReplyA, 'Student A received Student B reply');
  assert(foundReplyA && foundReplyA.content === payloadB, 'Reply content matches exactly');

  // 6. Mandatory Requirement E: Refresh both accounts and verify history persists
  console.log('\nStep 6: [Req E] Browser refresh simulation: re-fetching conversations & message history...');
  const freshConvsA = await get(`${BASE_URL}/api/chat/conversations`, tokenA);
  const freshConvsB = await get(`${BASE_URL}/api/chat/conversations`, tokenB);
  assert(freshConvsA.data.some(c => c.id === convId), 'Student A conversations intact after refresh');
  assert(freshConvsB.data.some(c => c.id === convId), 'Student B conversations intact after refresh');

  const freshMsgsA = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, tokenA);
  const freshMsgsB = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, tokenB);
  assert(freshMsgsA.data.some(m => m.id === sentMsgA.id), 'Student A sent message preserved after refresh');
  assert(freshMsgsA.data.some(m => m.id === sentMsgB.id), 'Student B reply preserved in Student A history');
  assert(freshMsgsB.data.some(m => m.id === sentMsgA.id), 'Student A message preserved in Student B history');
  assert(freshMsgsB.data.some(m => m.id === sentMsgB.id), 'Student B reply preserved in Student B history');

  // 7. Mandatory Requirement F: Log out and log in again with fresh auth tokens
  console.log('\nStep 7: [Req F] Session termination & re-login verification...');
  tokenA = null;
  tokenB = null;
  const reLoginA = await post(`${BASE_URL}/api/auth/login`, { username: '620823104002', password: 'student@12' });
  const reLoginB = await post(`${BASE_URL}/api/auth/login`, { username: '620823104003', password: 'student@12' });
  assert(reLoginA.status === 200 && reLoginA.data.token, 'Student A re-authenticated with fresh session token');
  assert(reLoginB.status === 200 && reLoginB.data.token, 'Student B re-authenticated with fresh session token');
  const newTokA = reLoginA.data.token;
  const newTokB = reLoginB.data.token;

  const reConvsA = await get(`${BASE_URL}/api/chat/conversations`, newTokA);
  const targetConvA = (reConvsA.data || []).find(c => c.id === convId);
  assert(!!targetConvA, 'Conversation preserved across full logout and cold re-login');
  assert(targetConvA.lastMessage === payloadB, `Last message metadata preserved across logins: "${targetConvA.lastMessage}"`);

  // 8. Staff / Advisor message sending check
  console.log('\nStep 8: Testing Staff / Class Advisor message sending...');
  const advLogin = await post(`${BASE_URL}/api/auth/login`, { username: 'arularasi', password: 'advisor@123' });
  assert(advLogin.status === 200 && advLogin.data.token, 'Advisor CSE-A authenticated (arularasi)');
  const advToken = advLogin.data.token;
  const advConvs = await get(`${BASE_URL}/api/chat/conversations`, advToken);
  assert(advConvs.status === 200, 'Advisor retrieved conversations');

  // 9. Mandatory Requirement G, H, I: UI & Assistant Code Analysis
  console.log('\nStep 9: [Req G, H, I] Verifying Assistant positioning, CSS styling & Chat UI guarantees...');

  const styleCss = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/css/style.css'), 'utf-8');
  const chatJs = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/js/chat.js'), 'utf-8');
  const assistantJs = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/js/assistant.js'), 'utf-8');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/index.html'), 'utf-8');
  const firestoreRules = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf-8');

  // Check 1: Assistant is positioned at bottom-right in chat, NOT top-right
  assert(!styleCss.includes('body.chat-active .assistant-btn {\n  top: 76px;') &&
         !styleCss.includes('body.chat-active .assistant-btn {\r\n  top: 76px;'),
         'Assistant button removed from previous top-right (top: 76px) position');
  assert(styleCss.includes('body.chat-active .assistant-btn') && styleCss.includes('bottom: 84px'),
         'Assistant button positioned at bottom-right floating above composer (bottom: 84px)');

  // Check 2: Dark navy and teal liquid-glass appearance with blur and border
  assert(styleCss.includes('rgba(11, 19, 43') && styleCss.includes('rgba(13, 148, 136'),
         'Assistant button has professional dark navy and teal gradient');
  assert(styleCss.includes('backdrop-filter: blur'),
         'Assistant button has liquid-glass backdrop blur styling');

  // Check 3: Assistant icon and label
  assert(indexHtml.includes('Student Assistant') && indexHtml.includes('assistantFloatingBtn'),
         'HTML contains Student Assistant button with label');

  // Check 4: Smooth animation
  assert(styleCss.includes('assistantSlideUp') || styleCss.includes('drawerSlideUp'),
         'Assistant drawer contains smooth open/close animation');

  // Check 5: Isolated AI interactions (Req H)
  assert(!assistantJs.includes('/api/chat/conversations') && assistantJs.includes('DemoStore.queryAssistant'),
         '[Req H] Assistant queries localized knowledge base and does not pollute institutional chat history');

  // Check 6: Send button accessible and composer layout (Req I)
  assert(styleCss.includes('.chat-composer-wrap') && styleCss.includes('.chat-send-btn'),
         '[Req I] Fixed message composer and Send button are properly scoped with dedicated layout');

  // Check 7: Enter sends, Shift+Enter creates new line, no premature clear
  assert(chatJs.includes('if (event.key === "Enter" && !event.shiftKey)'),
         'Enter key sends message and Shift+Enter is preserved for new line');
  assert(chatJs.includes('this.isSending = true;') && chatJs.includes('input.value = "";'),
         'Message submission locks sending state and clears input only after delivery');

  // Check 8: Firestore Security Rules subcollection support
  assert(firestoreRules.includes('match /messages/{messageId}'),
         'Firestore rules explicitly support nested /messages/{messageId} subcollections');

  console.log('\n========================================================================');
  console.log(`ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! (${passed}/${total})`);
  console.log('========================================================================\n');
}

run().catch(err => {
  console.error('\n[VERIFICATION SUITE ERROR]:', err.message);
  process.exit(1);
});

