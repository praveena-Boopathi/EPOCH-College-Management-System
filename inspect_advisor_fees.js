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
  console.log("=== Testing Class Advisor Logins & Data ===");
  const advisors = [
    { id: 'arularasi', pass: 'advisor@123', expectedSec: 'CSE-A' },
    { id: 'dhivyabharathi', pass: 'advisor@123', expectedSec: 'CSE-B' },
    { id: 'rajavathijayapriya', pass: 'advisor@123', expectedSec: 'CSE-C' }
  ];

  for (const adv of advisors) {
    const loginRes = await post('http://localhost:8080/api/auth/login', {
      username: adv.id,
      password: adv.pass
    });
    console.log(`\nAdvisor: ${adv.id} -> Status: ${loginRes.status}`);
    if (loginRes.status === 200) {
      console.log(`Name: ${loginRes.data.name}, Role: ${loginRes.data.role}, Section: ${loginRes.data.section}`);
      const token = loginRes.data.token;
      
      const contactsRes = await get('http://localhost:8080/api/chat/contacts', token);
      console.log(`Contacts Count: ${Array.isArray(contactsRes.data) ? contactsRes.data.length : 0}`);
      if (Array.isArray(contactsRes.data)) {
        const students = contactsRes.data.filter(c => c.role === 'STUDENT');
        console.log(`Section Students in Chat Contacts (${students.length}):`, students.slice(0, 5).map(s => `${s.identifier} (${s.name})`));
      }

      const feesRes = await get(`http://localhost:8080/api/fees/all?section=${loginRes.data.section}`, token);
      console.log(`Fee Assignments retrieved: ${Array.isArray(feesRes.data) ? feesRes.data.length : 0}`);
      if (Array.isArray(feesRes.data)) {
        feesRes.data.forEach((f, i) => {
          console.log(`  [${i+1}] Student: ${f.studentName} (${f.studentId}) | Category: ${f.category} | Amount: ${f.totalAmount}`);
        });
      }
    }
  }
}

run().catch(console.error);
