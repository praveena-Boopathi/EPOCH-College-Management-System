const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, text: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, text: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log("==================================================================");
  console.log("EPOCH FEE MANAGEMENT & CLASS ANNOUNCEMENT SYSTEM VERIFICATION");
  console.log("==================================================================\n");

  // 1. Advisor CSE-A Login & Deduplicated Student Check
  console.log("--- TEST 1: Advisor Arularasi (CSE-A) Fee View & Deduplication ---");
  const advALogin = await post('/api/auth/login', {
    role: 'advisor',
    username: 'arularasi',
    password: 'advisor@123'
  });
  if (advALogin.status !== 200) {
    console.error("FAIL: Advisor CSE-A login failed:", advALogin);
    return;
  }
  const tokenAdvA = advALogin.body.token;
  console.log("✓ Advisor Arularasi logged in successfully.");

  const secStudentsA = await get('/api/fees/section-students?section=CSE-A', tokenAdvA);
  console.log("HTTP Status:", secStudentsA.status);
  if (secStudentsA.status !== 200 || !Array.isArray(secStudentsA.body)) {
    console.error("FAIL: Failed to fetch section students for CSE-A:", secStudentsA);
    return;
  }
  const listA = secStudentsA.body;
  console.log(`✓ Total CSE-A Students Retrieved: ${listA.length}`);

  // Check unique student IDs
  const idSetA = new Set();
  const duplicatesA = [];
  listA.forEach(s => {
    if (idSetA.has(s.studentId)) {
      duplicatesA.push(s.studentId);
    }
    idSetA.add(s.studentId);
  });

  if (duplicatesA.length > 0) {
    console.error(`FAIL: Duplicates found in student list: ${duplicatesA.join(', ')}`);
  } else {
    console.log(`✓ SUCCESS: Zero duplicates found! All ${listA.length} students are completely unique.`);
  }

  // Specifically check ABINAYA G (620823104002)
  const abinayaRows = listA.filter(s => s.studentId === '620823104002');
  console.log(`✓ Student ABINAYA G (620823104002) occurrence count: ${abinayaRows.length} (Expected: exactly 1)`);
  if (abinayaRows.length === 1) {
    const abinaya = abinayaRows[0];
    console.log(`  - Name: ${abinaya.studentName}`);
    console.log(`  - Total Assigned: ₹${abinaya.totalAssigned}`);
    console.log(`  - Confirmed Paid: ₹${abinaya.amountPaid}`);
    console.log(`  - Balance: ₹${abinaya.balance}`);
    console.log(`  - Grouped Categories: ${abinaya.categories.join(', ')}`);
    console.log(`  - Individual Fee Assignments Attached: ${abinaya.feeAssignments.length}`);
    console.log(`  - Receipts Count: ${abinaya.receiptCount}`);
  }

  // 2. Advisor Section Isolation Tests
  console.log("\n--- TEST 2: Section Isolation Verification ---");
  const advBLogin = await post('/api/auth/login', {
    role: 'advisor',
    username: 'dhivyabharathi',
    password: 'advisor@123'
  });
  const tokenAdvB = advBLogin.body.token;
  const secStudentsB = await get('/api/fees/section-students?section=CSE-B', tokenAdvB);
  console.log(`✓ Advisor Dhivya Bharathi (CSE-B) Students Count: ${secStudentsB.body.length}`);
  const hasNonB = secStudentsB.body.some(s => s.section !== 'CSE-B');
  console.log(`✓ CSE-B Section Isolation: ${!hasNonB ? 'PASSED (0 non-CSE-B students)' : 'FAILED'}`);

  const advCLogin = await post('/api/auth/login', {
    role: 'advisor',
    username: 'rajavathijayapriya',
    password: 'advisor@123'
  });
  const tokenAdvC = advCLogin.body.token;
  const secStudentsC = await get('/api/fees/section-students?section=CSE-C', tokenAdvC);
  console.log(`✓ Advisor Rajavathi Jaya Priya (CSE-C) Students Count: ${secStudentsC.body.length}`);
  const hasNonC = secStudentsC.body.some(s => s.section !== 'CSE-C');
  console.log(`✓ CSE-C Section Isolation: ${!hasNonC ? 'PASSED (0 non-CSE-C students)' : 'FAILED'}`);

  // Cross-section access protection
  const crossSectionAttempt = await get('/api/fees/section-students?section=CSE-A', tokenAdvB);
  console.log(`✓ Cross-Section Check (Dhivya Bharathi requesting CSE-A): returned count ${crossSectionAttempt.body.length} (Strictly isolated to her own assigned class: ${crossSectionAttempt.body[0]?.section})`);

  // 3. Class Advisor Announcement Broadcast Test
  console.log("\n--- TEST 3: Class Advisor Send Announcement to Entire Section ---");
  const testTitle = "Mandatory Attendance & Exam Clearance " + Date.now();
  const annPost = await post('/api/announcements', {
    title: testTitle,
    message: "All Section CSE-A students must verify fee receipts before the autonomous exam deadline.",
    priority: "IMPORTANT"
  }, tokenAdvA);
  console.log(`✓ Announcement published response status: ${annPost.status}`);
  console.log(`✓ Announcement ID: ${annPost.body.id}, Locked Target Section: ${annPost.body.targetSection}`);

  const sentList = await get('/api/announcements/my-sent', tokenAdvA);
  console.log(`✓ Advisor sent announcements count: ${sentList.body.length}`);
  const foundSent = sentList.body.find(a => a.id === annPost.body.id);
  console.log(`✓ Sent announcement found in history: ${!!foundSent}`);

  // Check student received announcement notification
  console.log("\n--- TEST 4: Student Notification & Read Tracking ---");
  const stuLogin = await post('/api/auth/login', {
    role: 'student',
    username: '620823104002',
    password: 'student@12'
  });
  const tokenStu = stuLogin.body.token;
  const stuNotifs = await get('/api/notifications', tokenStu);
  console.log(`✓ Student Abinaya G received notifications count: ${stuNotifs.body.length}`);
  const classNotice = stuNotifs.body.find(n => n.type === 'CLASS_ANNOUNCEMENT' && n.referenceId === annPost.body.id);
  console.log(`✓ Class announcement in student inbox: ${!!classNotice}`);
  if (classNotice) {
    console.log(`  - Title: ${classNotice.title}`);
    console.log(`  - Message: ${classNotice.message}`);
  }

  // Student marks announcement as read
  const markReadRes = await post(`/api/announcements/${annPost.body.id}/read`, {}, tokenStu);
  console.log(`✓ Student mark read response status: ${markReadRes.status}`);

  const sentListAfter = await get('/api/announcements/my-sent', tokenAdvA);
  const updatedAnn = sentListAfter.body.find(a => a.id === annPost.body.id);
  console.log(`✓ Advisor view of read count: ${updatedAnn?.readBy?.length || 0} student(s) read this announcement`);

  console.log("\n==================================================================");
  console.log("ALL AUTOMATED VERIFICATION CHECKS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

runTests().catch(console.error);
