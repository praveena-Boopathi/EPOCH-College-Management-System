const http = require('http');

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

async function run() {
  console.log("=== Checking Advisor Profile Details via /api/profile ===");
  const testUsers = [
    { u: 'arularasi', p: 'advisor@123' },
    { u: 'dhivyabharathi', p: 'advisor@123' },
    { u: 'rajavathijayapriya', p: 'advisor@123' }
  ];

  for (const tu of testUsers) {
    const loginRes = await post('http://localhost:8080/api/auth/login', { username: tu.u, password: tu.p });
    if (loginRes.status === 200) {
      const profRes = await get('http://localhost:8080/api/profile', loginRes.data.token);
      console.log(`User ${tu.u}: id=${profRes.data.id}, identifier=${profRes.data.identifier}, name=${profRes.data.name}, section=${profRes.data.section}, email=${profRes.data.email}`);
    } else {
      console.log(`Failed login for ${tu.u}: ${loginRes.status}`);
    }
  }
}

run().catch(console.error);
