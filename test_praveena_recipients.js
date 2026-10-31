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

async function testRecipients() {
  console.log('Testing Sanjai S (620823104149)...');
  const loginSanjai = await post('http://localhost:8080/api/auth/login', { username: '620823104149', password: 'student@12' });
  console.log('Sanjai login status:', loginSanjai.status, loginSanjai.data ? loginSanjai.data.name : loginSanjai.data);
  if (loginSanjai.data && loginSanjai.data.token) {
    console.log('User object in response:', {
      identifier: loginSanjai.data.identifier,
      username: loginSanjai.data.username,
      regNo: loginSanjai.data.regNo,
      id: loginSanjai.data.id,
      name: loginSanjai.data.name,
      section: loginSanjai.data.section,
      role: loginSanjai.data.role
    });
    const rec = await get('http://localhost:8080/api/chat/requests/received', loginSanjai.data.token);
    console.log('Sanjai received requests status:', rec.status, 'Count:', (rec.data || []).length);
    console.log('Received data:', JSON.stringify(rec.data, null, 2));
  }

  console.log('\nTesting Praveena C (620823104134)...');
  const loginPraveenaC = await post('http://localhost:8080/api/auth/login', { username: '620823104134', password: 'student@12' });
  console.log('Praveena C login status:', loginPraveenaC.status, loginPraveenaC.data ? loginPraveenaC.data.name : loginPraveenaC.data);
  if (loginPraveenaC.data && loginPraveenaC.data.token) {
    const rec = await get('http://localhost:8080/api/chat/requests/received', loginPraveenaC.data.token);
    console.log('Praveena C received requests status:', rec.status, 'Count:', (rec.data || []).length);
    console.log('Received data:', JSON.stringify(rec.data, null, 2));
  }
}

testRecipients().catch(console.error);
