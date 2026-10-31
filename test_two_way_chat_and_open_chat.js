const http = require('http');

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
        try { resolve({ s: res.statusCode, d: JSON.parse(b) }); }
        catch (e) { resolve({ s: res.statusCode, d: b }); }
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
        try { resolve({ s: res.statusCode, d: JSON.parse(b) }); }
        catch (e) { resolve({ s: res.statusCode, d: b }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`  [PASS] ${message}`);
}

async function run() {
  console.log('======================================================================');
  console.log('EPOCH TWO-WAY CHAT, OPEN CHAT, AND SYNCHRONIZATION VERIFICATION');
  console.log('======================================================================\n');

  // 1. Authenticate Student A (620823104002 - ABINAYA G) and Student B (620823104003 - ABINAYA P)
  console.log('1. Authenticating Student A and Student B...');
  const lA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  const lB = await post('http://localhost:8080/api/auth/login', { username: '620823104003', password: 'student@12' });
  assert(lA.s === 200, 'Student A authenticated (200 OK)');
  assert(lB.s === 200, 'Student B authenticated (200 OK)');
  const tokenA = lA.d.token;
  const tokenB = lB.d.token;

  // 2. Verify Sent requests for Student A
  console.log('\n2. Verifying Student A Sent Requests...');
  const sentResA = await get('http://localhost:8080/api/chat/requests/sent', tokenA);
  assert(sentResA.s === 200, 'Student A retrieved sent requests');
  const acceptedReqToB = (sentResA.d || []).find(r => r.recipientId === '620823104003' && r.status === 'ACCEPTED');
  assert(!!acceptedReqToB, 'Found accepted request to Student B in Student A Sent tab');
  console.log(`   Accepted Request ID: ${acceptedReqToB.id}`);

  // 3. Test GET /api/chat/requests/{id}/conversation endpoint
  console.log('\n3. Testing Open Chat resolution via /api/chat/requests/{id}/conversation...');
  const reqConvRes = await get(`http://localhost:8080/api/chat/requests/${acceptedReqToB.id}/conversation`, tokenA);
  assert(reqConvRes.s === 200, 'Resolved conversation for accepted request (200 OK)');
  assert(reqConvRes.d && reqConvRes.d.id, `Conversation ID resolved: ${reqConvRes.d.id}`);
  const sharedConvId = reqConvRes.d.id;

  // 4. Verify conversation visibility in both accounts
  console.log('\n4. Verifying conversation membership in both users\' Chats lists...');
  const convsA = await get('http://localhost:8080/api/chat/conversations', tokenA);
  const convsB = await get('http://localhost:8080/api/chat/conversations', tokenB);
  assert(convsA.s === 200, 'Student A retrieved conversations');
  assert(convsB.s === 200, 'Student B retrieved conversations');
  assert(convsA.d.some(c => c.id === sharedConvId), `Conversation visible in Student A Chats list (${sharedConvId})`);
  assert(convsB.d.some(c => c.id === sharedConvId), `Conversation visible in Student B Chats list (${sharedConvId})`);

  // 5. Student A sends a new message to Student B
  console.log('\n5. Student A sending message to Student B...');
  const testMsgContent = 'Sync Test: Epoch direct message from Student A at ' + new Date().toLocaleTimeString();
  const sendRes = await post(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, {
    content: testMsgContent
  }, tokenA);
  assert(sendRes.s === 200, 'Student A sent message successfully (200 OK)');
  const sentMsg = sendRes.d;
  assert(sentMsg.id && sentMsg.id.startsWith('MSG-'), `Message has unique ID: ${sentMsg.id}`);
  assert(sentMsg.conversationId === sharedConvId, `Message matches conversation ID: ${sentMsg.conversationId}`);
  assert(sentMsg.senderId === '620823104002', `Authenticated sender ID verified: ${sentMsg.senderId}`);
  assert(sentMsg.recipientId === '620823104003', `Intended recipient ID verified: ${sentMsg.recipientId}`);
  assert(sentMsg.content === testMsgContent, `Message content matches: "${sentMsg.content}"`);
  assert(!!sentMsg.timestamp, `Server timestamp present: ${sentMsg.timestamp}`);

  // 6. Student B retrieves message history and confirms receiving Student A's message
  console.log('\n6. Student B retrieving message history...');
  const msgsResB = await get(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, tokenB);
  assert(msgsResB.s === 200, 'Student B retrieved messages (200 OK)');
  const receivedMsgByB = msgsResB.d.find(m => m.id === sentMsg.id);
  assert(!!receivedMsgByB, 'Student B successfully received Student A\'s message!');
  assert(receivedMsgByB.content === testMsgContent, 'Received content matches exactly');

  // 7. Student B replies to Student A
  console.log('\n7. Student B sending reply to Student A...');
  const replyContent = 'Reply Test: Acknowledged by Student B at ' + new Date().toLocaleTimeString();
  const replyRes = await post(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, {
    content: replyContent
  }, tokenB);
  assert(replyRes.s === 200, 'Student B sent reply successfully (200 OK)');
  const replyMsg = replyRes.d;
  assert(replyMsg.senderId === '620823104003', `Reply sender verified as Student B: ${replyMsg.senderId}`);
  assert(replyMsg.recipientId === '620823104002', `Reply recipient verified as Student A: ${replyMsg.recipientId}`);

  // 8. Student A retrieves message history and confirms receiving Student B's reply
  console.log('\n8. Student A retrieving message history...');
  const msgsResA = await get(`http://localhost:8080/api/chat/conversations/${sharedConvId}/messages`, tokenA);
  assert(msgsResA.s === 200, 'Student A retrieved messages (200 OK)');
  const receivedReplyByA = msgsResA.d.find(m => m.id === replyMsg.id);
  assert(!!receivedReplyByA, 'Student A successfully received Student B\'s reply!');
  assert(receivedReplyByA.content === replyContent, 'Reply content matches exactly');

  // 9. Verify conversation updated with last message
  console.log('\n9. Verifying conversation last message metadata update...');
  const updatedConvsB = await get('http://localhost:8080/api/chat/conversations', tokenB);
  const targetConv = updatedConvsB.d.find(c => c.id === sharedConvId);
  assert(!!targetConv, 'Target conversation found in updated list');
  assert(targetConv.lastMessage === replyContent, `Last message updated: "${targetConv.lastMessage}"`);
  assert(targetConv.lastMessageSenderId === '620823104003', `Last message sender ID matches Student B`);

  console.log('\n======================================================================');
  console.log('ALL TWO-WAY CHAT, OPEN CHAT, AND SYNCHRONIZATION TESTS PASSED!');
  console.log('======================================================================\n');
}

run().catch(err => {
  console.error('\n[TEST RUN FAILED]:', err.message);
  process.exit(1);
});
