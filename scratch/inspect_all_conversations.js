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

async function testAll() {
  const students = [
    '620823104002',
    '620823104003',
    '620823104004',
    '620823104005',
    '620823104015'
  ];

  console.log('Testing conversations and requests across students...\n');

  for (const sId of students) {
    const login = await post('http://localhost:8080/api/auth/login', { username: sId, password: 'student@12' });
    if (login.status !== 200) {
      console.log(`Failed login for ${sId}`);
      continue;
    }
    const token = login.data.token;
    console.log(`Student ${sId} (${login.data.name}):`);

    const convs = await get('http://localhost:8080/api/chat/conversations', token);
    console.log(`  Conversations count: ${Array.isArray(convs.data) ? convs.data.length : 'ERR'}`);
    if (Array.isArray(convs.data)) {
      convs.data.forEach(c => {
        console.log(`    - ID: ${c.id}, participants: ${JSON.stringify(c.participants)}, studentRegNo: ${c.studentRegNo}, staffUsername: ${c.staffUsername}, studentName: ${c.studentName}, staffName: ${c.staffName}`);
      });
    }

    // Now try to send request to each other student and see what happens
    for (const other of students) {
      if (other === sId) continue;
      const sendReq = await post('http://localhost:8080/api/chat/requests', {
        recipientId: other,
        introMessage: 'Diagnostic test'
      }, token);

      if (sendReq.status !== 201) {
        console.log(`  -> Send to ${other}: status=${sendReq.status}, error=${JSON.stringify(sendReq.data.error)}`);
      }
    }
    console.log('');
  }
}

testAll().catch(console.error);
