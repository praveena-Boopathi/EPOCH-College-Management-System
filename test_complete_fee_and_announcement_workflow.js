/**
 * Comprehensive Automated Verification Suite for:
 * EPOCH — College Fee Management, UPI QR Payment Gateway, and Announcement System
 */

const http = require('http');

function postJson(path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
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
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function putJson(path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'PUT',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token) {
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
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function getBinary(path, token) {
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
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, buffer: buffer });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 EPOCH Verification: College Fee Management, UPI Gateway, Announcements');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. ADMIN AUTHENTICATION
    console.log('1. Testing Dedicated Admin Login...');
    const adminLogin = await postJson('/api/auth/login', {
      username: 'admin',
      password: 'admin@123'
    });
    console.log('Admin login status:', adminLogin.status, 'body:', adminLogin.body);
    assert(adminLogin.status === 200, 'Admin login endpoint returns 200 OK');
    assert(adminLogin.body.role === 'ADMIN', 'Admin user role is strictly ADMIN');
    const adminToken = adminLogin.body.token;

    // 2. MERCHANT SETTINGS CONFIGURATION
    console.log('\n2. Testing Merchant UPI Gateway Configuration...');
    const settingsGet = await getJson('/api/fees/settings', adminToken);
    assert(settingsGet.status === 200, 'Merchant settings retrieved successfully');
    assert(settingsGet.body.merchantUpiId !== undefined, `Merchant UPI VPA is configured: ${settingsGet.body.merchantUpiId}`);

    // Update settings
    const updatedSettings = await putJson('/api/fees/settings', {
      merchantUpiId: 'gnanamani.treasury@sbi',
      merchantName: 'Gnanamani College of Technology',
      bankName: 'State Bank of India',
      accountNumber: '39201948572',
      ifscCode: 'SBIN0001234'
    }, adminToken);
    assert(updatedSettings.status === 200 || updatedSettings.status === 201, 'Admin updated merchant UPI settings');

    // 3. STUDENT AUTHENTICATION
    console.log('\n3. Testing Student Login...');
    const studentLogin = await postJson('/api/auth/login', {
      username: '620823104002',
      password: 'student@12'
    });
    console.log('Student login status:', studentLogin.status, 'body:', studentLogin.body);
    assert(studentLogin.status === 200, 'Student login returns 200 OK');
    assert(studentLogin.body.role === 'STUDENT', 'User role is strictly STUDENT');
    const studentToken = studentLogin.body.token;

    // 4. ADMIN ASSIGNS FEE TO STUDENT
    console.log('\n4. Testing Admin Fee Assignment (Single Student)...');
    const assignRes = await postJson('/api/fees/assign', {
      studentId: '620823104002',
      category: 'Tuition Fee',
      description: 'Semester VIII Autonomous Tuition Fee',
      totalAmount: 48500.0,
      dueDate: '2026-11-30',
      installmentPlan: '2 Installments'
    }, adminToken);
    assert(assignRes.status === 200 || assignRes.status === 201, 'Admin assigned fee successfully');
    const feeId = assignRes.body.id;
    assert(feeId !== undefined, `Fee assignment ID created: ${feeId}`);
    assert(assignRes.body.totalAmount === 48500.0, 'Assigned fee amount matches 48,500 INR');
    assert(assignRes.body.balance === 48500.0, 'Initial balance matches full amount');

    // 5. STUDENT VIEWS ASSIGNED FEES
    console.log('\n5. Testing Student Fee Retrieval (Strict Role Isolation)...');
    const studentFees = await getJson('/api/fees/my-fees', studentToken);
    assert(studentFees.status === 200, 'Student retrieves their personal fees');
    assert(Array.isArray(studentFees.body) && studentFees.body.length > 0, `Student has ${studentFees.body ? studentFees.body.length : 0} fee assignment(s)`);
    const studentFeeItem = (studentFees.body || []).find(f => f.id === feeId);
    assert(studentFeeItem !== undefined, 'Assigned fee record present in student dashboard');

    // 6. STUDENT SUBMITS UPI QR PAYMENT REFERENCE (UTR)
    console.log('\n6. Testing Student UPI QR Payment Submission (Pending Verification)...');
    const testUtr = '4293810293' + Math.floor(10 + Math.random() * 90);
    const paySubmitRes = await postJson('/api/fees/submit-payment', {
      feeAssignmentId: feeId,
      amount: 24250.0, // Partial payment (Installment 1)
      utrNumber: testUtr,
      screenshotUrl: null
    }, studentToken);
    assert(paySubmitRes.status === 200 || paySubmitRes.status === 201, 'Student submitted UPI payment reference');
    const paymentId = paySubmitRes.body.id;
    assert(paymentId !== undefined, `Payment submission record created: ${paymentId}`);
    assert(paySubmitRes.body.status === 'PENDING_VERIFICATION', 'Payment is strictly marked PENDING_VERIFICATION (no auto-success)');
    assert(paySubmitRes.body.receiptId === null || paySubmitRes.body.receiptId === undefined, 'Official receipt is NOT issued before verification');

    // 7. DUPLICATE UTR PREVENTION
    console.log('\n7. Testing Duplicate UTR Rejection...');
    const dupUtrRes = await postJson('/api/fees/submit-payment', {
      feeAssignmentId: feeId,
      amount: 24250.0,
      utrNumber: testUtr, // Attempt same UTR
      screenshotUrl: null
    }, studentToken);
    assert(dupUtrRes.status === 400 || dupUtrRes.status === 409, `Duplicate UTR strictly rejected with status ${dupUtrRes.status}`);

    // 8. ADMIN VERIFICATION QUEUE
    console.log('\n8. Testing Admin Payment Verification Queue...');
    const pendingQueue = await getJson('/api/fees/payments/pending', adminToken);
    assert(pendingQueue.status === 200, 'Admin successfully retrieved verification queue');
    assert(Array.isArray(pendingQueue.body), 'Verification queue returns array of pending submissions');
    const queueItem = (pendingQueue.body || []).find(p => p.id === paymentId);
    assert(queueItem !== undefined, 'Student submitted payment appears in Admin verification queue');

    // 9. ADMIN VERIFIES PAYMENT & ISSUES RECEIPT
    console.log('\n9. Testing Admin Verify & Confirm Payment (Balance Update & Receipt Generation)...');
    const verifyRes = await postJson(`/api/fees/payments/${paymentId}/verify`, {}, adminToken);
    assert(verifyRes.status === 200, 'Admin verified payment successfully');
    const receiptId = verifyRes.body.id;
    assert(receiptId !== undefined, `Official PDF receipt generated: ${receiptId}`);
    assert(verifyRes.body.amountReceived === 24250.0, 'Receipt amount matches verified payment');
    assert(verifyRes.body.remainingBalance === 24250.0, 'Remaining balance accurately reflects partial payment');

    // 10. OFFICIAL PDF RECEIPT DOWNLOAD
    console.log('\n10. Testing Official PDF Receipt Generation...');
    const pdfRes = await getBinary(`/api/fees/receipts/${receiptId}/pdf`, studentToken);
    assert(pdfRes.status === 200, 'PDF receipt endpoint returns 200 OK');
    assert(pdfRes.headers['content-type'] && pdfRes.headers['content-type'].includes('application/pdf'), 'Content-Type is application/pdf');
    assert(pdfRes.buffer.length > 500, `PDF generated with binary length: ${pdfRes.buffer.length} bytes`);
    const isPdfHeader = pdfRes.buffer.slice(0, 4).toString() === '%PDF';
    assert(isPdfHeader, 'File contains valid %PDF signature');

    // 11. REJECTION WORKFLOW TEST
    console.log('\n11. Testing Payment Rejection Workflow with Mandatory Reason...');
    const testUtr2 = '5293810293' + Math.floor(10 + Math.random() * 90);
    const paySubmitRes2 = await postJson('/api/fees/submit-payment', {
      feeAssignmentId: feeId,
      amount: 10000.0,
      utrNumber: testUtr2,
      screenshotUrl: null
    }, studentToken);
    const paymentId2 = paySubmitRes2.body.id;

    const rejectRes = await postJson(`/api/fees/payments/${paymentId2}/reject`, {
      reason: 'Transaction reference not found in institution bank account statement.'
    }, adminToken);
    assert(rejectRes.status === 200, 'Admin rejected payment with valid reason');
    assert(rejectRes.body.status === 'REJECTED', 'Payment record status is REJECTED');
    assert(rejectRes.body.rejectionReason && rejectRes.body.rejectionReason.includes('bank account statement'), 'Rejection reason recorded in financial history');

    // 12. ANNOUNCEMENTS WORKFLOW
    console.log('\n12. Testing College Announcements & Audience Filtering...');
    const annPost = await postJson('/api/announcements', {
      title: 'Autonomous Semester Examination Fee Submission Deadline',
      message: 'All final year students must clear pending exam fees on or before November 30.',
      priority: 'URGENT',
      audienceType: 'ALL_COLLEGE',
      senderId: 'admin',
      senderName: 'Dr. S. K. Ramesh',
      senderRole: 'ADMIN'
    }, adminToken);
    assert(annPost.status === 200 || annPost.status === 201, 'Urgent announcement published');
    const annId = annPost.body.id;

    // Student fetches announcements
    const studentAnn = await getJson('/api/announcements?role=STUDENT&department=CSE&section=A', studentToken);
    assert(studentAnn.status === 200, 'Student retrieves filtered announcements');
    const foundAnn = (studentAnn.body || []).find(a => a.id === annId);
    assert(foundAnn !== undefined, 'Published announcement received by student audience');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
