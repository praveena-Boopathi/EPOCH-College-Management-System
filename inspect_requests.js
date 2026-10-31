const http = require('http');

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

function post(url, data) {
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
        'Content-Length': Buffer.byteLength(postData)
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

async function check() {
  // Login as student A: 620823104002
  const loginA = await post('http://localhost:8080/api/auth/login', { username: '620823104002', password: 'student@12' });
  console.log('Login A status:', loginA.status, loginA.data ? loginA.data.name : '');
  
  if (loginA.data && loginA.data.token) {
    const recA = await get('http://localhost:8080/api/chat/requests/received', loginA.data.token);
    console.log('Received for 620823104002:', JSON.stringify(recA.data, null, 2));
    const sentA = await get('http://localhost:8080/api/chat/requests/sent', loginA.data.token);
    console.log('Sent for 620823104002:', JSON.stringify(sentA.data, null, 2));
  }

  // Also check student 620823104003, 620823104133 (Praveena B), etc.
  const loginB = await post('http://localhost:8080/api/auth/login', { username: '620823104003', password: 'student@12' });
  if (loginB.data && loginB.data.token) {
    const recB = await get('http://localhost:8080/api/chat/requests/received', loginB.data.token);
    console.log('Received for 620823104003:', JSON.stringify(recB.data, null, 2));
  }
}

check().catch(console.error);
