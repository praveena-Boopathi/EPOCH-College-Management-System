const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:8080';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out: ' + path));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function login(username, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: username, password: password }
  });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${username} (HTTP ${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function waitForServer(maxRetries = 30, delayMs = 1500) {
  console.log('⏳ Waiting for EPOCH server on http://localhost:8080 ...');
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const res = await request('/api/payments/gateway-config');
      if (res.status === 200) {
        console.log(`✅ Server is online! (Attempt ${i})`);
        return true;
      }
    } catch (e) {
      // wait and retry
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error('Server did not become ready in time.');
}

async function runTests() {
  console.log('\n======================================================');
  console.log('EPOCH — REAL-TIME, FEE MANAGEMENT & PAYMENT TEST SUITE');
  console.log('======================================================\n');

  await waitForServer();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate users
  console.log('\n--- 1. Authenticating Roles ---');
  const student = await login('620823104002', 'student@12'); // Abinaya G (CSE-A)
  const studentB = await login('620823104066', 'student@12'); // Jansi G (CSE-B)
  const advisorA = await login('arularasi', 'advisor@123'); // CSE-A Advisor
  const hod = await login('hod', 'hod@123');
  const principal = await login('principal', 'principal@123');
  const admin = await login('admin', 'admin@123');
  assert(student.token && advisorA.token && hod.token && principal.token && admin.token, 'All 5 user roles authenticated successfully');

  // 2. Real-Time State Endpoint (/api/realtime/sync-state)
  console.log('\n--- 2. Testing Real-Time State Synchronization ---');
  for (const [roleName, session] of [
    ['STUDENT', student],
    ['ADVISOR', advisorA],
    ['HOD', hod],
    ['PRINCIPAL', principal],
    ['ADMIN', admin]
  ]) {
    const res = await request('/api/realtime/sync-state', {
      headers: { 'Authorization': 'Bearer ' + session.token }
    });
    assert(res.status === 200, `${roleName} sync-state returned HTTP 200`);
    assert(typeof res.body.unreadNotificationsCount === 'number', `${roleName} unreadNotificationsCount is numeric (${res.body.unreadNotificationsCount})`);
    assert(typeof res.body.pendingRequestsCount === 'number', `${roleName} pendingRequestsCount is numeric (${res.body.pendingRequestsCount})`);
    assert(typeof res.body.pendingPaymentsCount === 'number', `${roleName} pendingPaymentsCount is numeric (${res.body.pendingPaymentsCount})`);
  }

  // 3. Payment Gateway Configuration & Secrets Protection
  console.log('\n--- 3. Testing Payment Gateway Configuration & Zero Secret Exposure ---');
  const gwRes = await request('/api/payments/gateway-config');
  assert(gwRes.status === 200, 'Gateway config returned HTTP 200');
  assert(gwRes.body.isTestMode === true, 'Gateway isTestMode is strictly TRUE');
  assert(gwRes.body.liveModeSupported === false, 'Gateway liveModeSupported is strictly FALSE');
  assert(gwRes.body.secretKey === undefined, 'CRITICAL: secretKey is NOT exposed in API response');
  assert(gwRes.body.webhookSecret === undefined, 'CRITICAL: webhookSecret is NOT exposed in API response');
  assert(gwRes.body.environment === 'TEST_MODE', 'Gateway environment is labeled TEST_MODE');
  assert(gwRes.body.notice.includes('TEST MODE ACTIVE'), 'Gateway notice displays clear TEST MODE warning');

  // 4. Fee Management Access Control & Ownership
  console.log('\n--- 4. Testing Fee Access Control & Tamper Prevention ---');
  // Student A can get their own fees
  const myFeesRes = await request('/api/fees/my-fees', {
    headers: { 'Authorization': 'Bearer ' + student.token }
  });
  assert(myFeesRes.status === 200, 'Student A can access own fees');
  const myFees = Array.isArray(myFeesRes.body) ? myFeesRes.body : [];
  assert(myFees.length > 0, `Student A has ${myFees.length} fee assignments in Firestore`);
  const activeFee = myFees[0];

  // Student A cannot access Student B's fees
  const otherFeeRes = await request(`/api/fees/student/${studentB.identifier}`, {
    headers: { 'Authorization': 'Bearer ' + student.token }
  });
  assert(otherFeeRes.status === 403, 'Student A is forbidden (HTTP 403) from accessing Student B fees');

  // Student cannot modify fee amounts
  const tamperRes = await request('/api/fees/update-fee', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + student.token,
      'Content-Type': 'application/json'
    },
    body: { feeId: activeFee.id, newAmount: 1.0, reason: 'Unauthorized discount' }
  });
  assert(tamperRes.status === 403, 'Student is forbidden (HTTP 403) from modifying fee amounts');

  // Student cannot verify payments
  const fakeVerifyRes = await request('/api/fees/payments/PAY-FAKE-123/verify', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + student.token }
  });
  assert(fakeVerifyRes.status === 403, 'Student is forbidden (HTTP 403) from marking payments as verified');

  // 5. Payment Order Creation (Server-side Test Mode)
  console.log('\n--- 5. Testing Payment Order Creation ---');
  const orderRes = await request('/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + student.token,
      'Content-Type': 'application/json'
    },
    body: {
      feeAssignmentId: activeFee.id,
      amount: 100.0,
      paymentMethod: 'UPI_QR_SANDBOX',
      notes: 'Test Fee Payment'
    }
  });
  assert(orderRes.status === 200, 'Payment order creation returned HTTP 200');
  assert(orderRes.body.orderId && orderRes.body.orderId.startsWith('ORD-TEST-'), `Generated order ID has ORD-TEST- prefix: ${orderRes.body.orderId}`);
  assert(orderRes.body.testMode === true, 'Order explicitly flagged as testMode: true');
  assert(orderRes.body.status === 'CREATED', 'Order status is CREATED');
  assert(orderRes.body.upiUri.includes('ORD-TEST-'), 'UPI URI includes order ID');

  // Student B cannot create order for Student A fee
  const badOrderRes = await request('/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + studentB.token,
      'Content-Type': 'application/json'
    },
    body: {
      feeAssignmentId: activeFee.id,
      amount: 50.0
    }
  });
  assert(badOrderRes.status === 403, 'Student B cannot create order for Student A fee (HTTP 403)');

  // 6. Payment Submission & Duplicate UTR Protection
  console.log('\n--- 6. Testing Payment Submission & Duplicate UTR Prevention ---');
  const uniqueUtr = 'UTRTEST' + Math.floor(10000000 + Math.random() * 90000000);
  const paySubmitRes1 = await request('/api/fees/submit-payment', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + student.token,
      'Content-Type': 'application/json'
    },
    body: {
      feeAssignmentId: activeFee.id,
      amount: 100.0,
      utrNumber: uniqueUtr
    }
  });
  assert(paySubmitRes1.status === 200, `First payment submission with UTR ${uniqueUtr} succeeded`);
  assert(paySubmitRes1.body.status === 'PENDING_VERIFICATION', 'Submitted payment status is strictly PENDING_VERIFICATION');

  // Duplicate submission with same UTR
  const paySubmitRes2 = await request('/api/fees/submit-payment', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + student.token,
      'Content-Type': 'application/json'
    },
    body: {
      feeAssignmentId: activeFee.id,
      amount: 100.0,
      utrNumber: uniqueUtr
    }
  });
  assert(paySubmitRes2.status === 400, 'Duplicate UTR submission is strictly rejected with HTTP 400');
  assert(paySubmitRes2.body.error && paySubmitRes2.body.error.includes('Duplicate references are rejected'), 'Duplicate error message returned properly');

  // 7. HMAC-SHA256 Webhook Verification
  console.log('\n--- 7. Testing Server-Side HMAC-SHA256 Webhook Verification ---');
  const webhookSecret = 'epoch_wh_sec_test_signature_key'; // Configured in application.properties
  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    orderId: orderRes.body.orderId,
    amount: 10000,
    currency: 'INR',
    timestamp: Date.now()
  });

  // Test invalid signature
  const badWebhookRes = await request('/api/payments/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-SHA256': 'invalid_forged_signature_hash_123456789'
    },
    body: webhookPayload
  });
  assert(badWebhookRes.status === 401, 'Forged webhook signature is rejected with HTTP 401 Unauthorized');

  // Test valid signature
  const validSignature = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');
  const goodWebhookRes = await request('/api/payments/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-SHA256': validSignature
    },
    body: webhookPayload
  });
  assert(goodWebhookRes.status === 200, 'Valid HMAC-SHA256 webhook signature is accepted with HTTP 200');
  assert(goodWebhookRes.body.verified === true, 'Webhook response confirms verified: true');

  // Summary
  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
