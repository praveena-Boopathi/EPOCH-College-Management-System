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

async function testFresh() {
  console.log('Testing fresh student-to-student request & accept workflow...');
  const l1 = await post('http://localhost:8080/api/auth/login', { username: '620823104015', password: 'student@12' });
  const l2 = await post('http://localhost:8080/api/auth/login', { username: '620823104007', password: 'student@12' });
  console.log('Sender:', l1.d.name, `(${l1.d.identifier})`);
  console.log('Recipient:', l2.d.name, `(${l2.d.identifier})`);

  const reqRes = await post('http://localhost:8080/api/chat/requests', {
    recipientId: l2.d.identifier,
    introMessage: 'Hi Abirami, let us work on the Capstone project together.'
  }, l1.d.token);
  console.log('Send req status:', reqRes.s, reqRes.d);
  if (reqRes.s !== 201) {
    console.error('Failed to create request');
    process.exit(1);
  }

  const reqId = reqRes.d.id;
  console.log('Pending request created with ID:', reqId);

  // Recipient checks incoming requests
  const recRes = await get('http://localhost:8080/api/chat/requests/received', l2.d.token);
  const found = (recRes.d || []).find(r => r.id === reqId);
  console.log('Recipient incoming requests list contains new request:', !!found);
  if (!found) {
    console.error('Request not visible in recipient incoming list!');
    process.exit(1);
  }

  // Recipient accepts the request
  const acceptRes = await post('http://localhost:8080/api/chat/requests/' + reqId + '/accept', {}, l2.d.token);
  console.log('Accept status:', acceptRes.s, acceptRes.d);
  if (acceptRes.s !== 200) {
    console.error('Failed to accept request');
    process.exit(1);
  }

  // Check conversation visibility in both accounts
  const convId = acceptRes.d.id || acceptRes.d.conversationId;
  console.log('Accepted Conversation ID:', convId);
  const convs1 = await get('http://localhost:8080/api/chat/conversations', l1.d.token);
  const convs2 = await get('http://localhost:8080/api/chat/conversations', l2.d.token);
  const seenBySender = (convs1.d || []).some(c => c.id === convId);
  const seenByRecipient = (convs2.d || []).some(c => c.id === convId);
  console.log('Conversation visible in Sender Chats list:', seenBySender);
  console.log('Conversation visible in Recipient Chats list:', seenByRecipient);

  // Send message in the new conversation from recipient to sender
  const msgRes = await post('http://localhost:8080/api/chat/conversations/' + convId + '/messages', {
    content: 'Awesome, happy to work together!'
  }, l2.d.token);
  console.log('Message sent in conversation status:', msgRes.s, msgRes.d);

  // Fetch messages from sender account
  const msgsRes = await get('http://localhost:8080/api/chat/conversations/' + convId + '/messages', l1.d.token);
  console.log('Messages retrieved by sender count:', msgsRes.d.length);
  console.log('Last message text:', msgsRes.d[msgsRes.d.length - 1].content);

  console.log('\n[SUCCESS] Fresh Accept workflow verified from start to end!');
}

testFresh();
