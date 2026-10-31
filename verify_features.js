/**
 * Automated Verification Script for EPOCH OD Applications & Student-Staff Chat
 */
const http = require('http');

const BASE_URL = 'http://localhost:8080';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};
    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const req = http.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('EPOCH ENHANCED FEATURES - AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Student Authentication (Abinaya G - CSE-A)
    // ----------------------------------------------------
    console.log('--- TEST 1: Student Authentication ---');
    const studentLogin = await request('POST', '/api/auth/login', {
      username: '620823104002',
      password: 'student@12'
    });
    assert(studentLogin.status === 200, `Student login returned status 200 (Got ${studentLogin.status})`);
    assert(studentLogin.data && studentLogin.data.token, `Student token returned`);
    assert(studentLogin.data.identifier === '620823104002', `Authenticated as 620823104002`);
    const studentToken = studentLogin.data.token;

    // ----------------------------------------------------
    // TEST 2: Staff Authentication
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Staff Authentication ---');
    const advisorLogin = await request('POST', '/api/auth/login', {
      username: 'arularasi',
      password: 'advisor@123'
    });
    assert(advisorLogin.status === 200, `Advisor login returned status 200 (Got ${advisorLogin.status})`);
    assert(advisorLogin.data && advisorLogin.data.token, `Advisor authenticated successfully`);
    const advisorToken = advisorLogin.data.token;

    const hodLogin = await request('POST', '/api/auth/login', {
      username: 'gopinath',
      password: 'hod@123'
    });
    assert(hodLogin.status === 200, `HOD login returned status 200 (Got ${hodLogin.status})`);
    const hodToken = hodLogin.data.token;

    // ----------------------------------------------------
    // TEST 3: OD Draft Creation & Resumption
    // ----------------------------------------------------
    console.log('\n--- TEST 3: OD Application - Save Draft & Resumption ---');
    const testEventTitle = 'National Hackathon Challenge 2026';
    const yearSeed = 2028 + Math.floor(Math.random() * 5);
    const monthSeed = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const daySeed = Math.floor(Math.random() * 20) + 1;
    const d1 = String(daySeed).padStart(2, '0');
    const d2 = String(daySeed + 1).padStart(2, '0');
    const testStartDate = `${yearSeed}-${monthSeed}-${d1}`;
    const testEndDate = `${yearSeed}-${monthSeed}-${d2}`;

    const draftRes = await request('POST', '/api/od/draft', {
      odType: 'Hackathon',
      eventTitle: testEventTitle,
      organizer: 'Anna University Chennai',
      venue: 'Tag Auditorium, Main Campus',
      startDate: testStartDate,
      endDate: testEndDate,
      reason: 'Representing college in final round of national collegiate hackathon',
      documentName: 'invitation_letter.pdf',
      documentType: 'application/pdf',
      documentSize: 124500,
      documentData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...'
    }, studentToken);

    assert(draftRes.status === 200, `OD draft saved successfully (Got ${draftRes.status})`);
    assert(draftRes.data.status === 'DRAFT', `Saved application status is DRAFT`);
    const draftId = draftRes.data.id;
    console.log(`    Draft ID created: ${draftId}`);

    // Verify draft appears in student OD list
    const studentOds = await request('GET', '/api/od/student', null, studentToken);
    const foundDraft = Array.isArray(studentOds.data) && studentOds.data.find(d => d.id === draftId);
    assert(foundDraft && foundDraft.status === 'DRAFT', `Draft found in student application list`);

    // ----------------------------------------------------
    // TEST 4: OD Submit Validation & Overlap Prevention
    // ----------------------------------------------------
    console.log('\n--- TEST 4: OD Submission Validation & Duplicate Protection ---');
    
    // Test validation: Missing required field
    const invalidSub = await request('POST', '/api/od/submit', {
      odType: 'Hackathon',
      eventTitle: '', // Missing
      organizer: 'Anna University',
      venue: 'Auditorium',
      startDate: testStartDate,
      endDate: testEndDate,
      reason: 'Testing'
    }, studentToken);
    assert(invalidSub.status === 400, `Rejected application with missing eventTitle with 400 (Got ${invalidSub.status})`);

    // Test validation: Inverted dates (end before start)
    const invertedDates = await request('POST', '/api/od/submit', {
      odType: 'Hackathon',
      eventTitle: 'Tech Fest',
      organizer: 'Anna University',
      venue: 'Auditorium',
      startDate: testEndDate,
      endDate: testStartDate,
      reason: 'Testing inverted dates'
    }, studentToken);
    assert(invertedDates.status === 400, `Rejected inverted dates (end < start) with 400 (Got ${invertedDates.status})`);

    // Promote the draft to SUBMITTED
    const finalSubmit = await request('POST', '/api/od/submit', {
      id: draftId,
      odType: 'Hackathon',
      eventTitle: testEventTitle,
      organizer: 'Anna University Chennai',
      venue: 'Tag Auditorium, Main Campus',
      startDate: testStartDate,
      endDate: testEndDate,
      reason: 'Representing college in final round of national collegiate hackathon',
      documentName: 'invitation_letter.pdf',
      documentType: 'application/pdf',
      documentSize: 124500,
      documentData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...'
    }, studentToken);
    assert(finalSubmit.status === 200, `Successfully submitted draft as formal OD application (Got ${finalSubmit.status})`);
    assert(finalSubmit.data.status === 'PENDING_ADVISOR', `Promoted status is PENDING_ADVISOR`);

    // Test duplicate submission prevention on overlapping active dates
    const duplicateSub = await request('POST', '/api/od/submit', {
      odType: 'Workshop',
      eventTitle: 'Cloud DevOps Workshop',
      organizer: 'PSG Tech',
      venue: 'Lab 3',
      startDate: testStartDate, // Overlaps with testStartDate to testEndDate
      endDate: testEndDate,
      reason: 'Attending workshop'
    }, studentToken);
    assert(duplicateSub.status === 400, `Blocked duplicate overlapping OD application with 400 (Got ${duplicateSub.status})`);

    // ----------------------------------------------------
    // TEST 5: OD Approval Routing (Student -> Advisor -> HOD)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: OD Multi-Tier Approval Workflow ---');
    const submittedOdId = finalSubmit.data.id;

    // Advisor reviews and approves
    const advisorAction = await request('POST', `/api/od/${submittedOdId}/advisor-action`, {
      approved: true,
      reason: 'Verified participation invitation. Recommended.'
    }, advisorToken);
    assert(advisorAction.status === 200, `Advisor approved request (Status ${advisorAction.status})`);
    assert(advisorAction.data.status === 'PENDING_HOD' || advisorAction.data.status === 'APPROVED', `OD routed to status ${advisorAction.data.status}`);

    // If routed to HOD, HOD approves
    if (advisorAction.data.status === 'PENDING_HOD') {
      const hodAction = await request('POST', `/api/od/${submittedOdId}/hod-action`, {
        approved: true,
        reason: 'Endorsed for technical competition'
      }, hodToken);
      assert(hodAction.status === 200, `HOD approved request (Status ${hodAction.status})`);
      assert(hodAction.data.status === 'APPROVED' || hodAction.data.status === 'PENDING_PRINCIPAL', `OD finalized/forwarded to ${hodAction.data.status}`);
    }

    // Student checks updated status
    const studentStatusCheck = await request('GET', '/api/od/student', null, studentToken);
    const updatedOd = Array.isArray(studentStatusCheck.data) && studentStatusCheck.data.find(d => d.id === submittedOdId);
    assert(updatedOd && (updatedOd.status === 'APPROVED' || updatedOd.status === 'PENDING_HOD' || updatedOd.status === 'PENDING_PRINCIPAL'), `Student sees updated approval status: ${updatedOd ? updatedOd.status : 'not found'}`);

    // ----------------------------------------------------
    // TEST 6: Student-Staff Chat - Contacts & Permissions
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Student-Staff Chat - Contacts & Role Isolation ---');
    
    // Student gets allowed contacts
    const contactsRes = await request('GET', '/api/chat/contacts', null, studentToken);
    assert(contactsRes.status === 200, `Student retrieved allowed contacts list (Got ${contactsRes.status})`);
    const contactList = contactsRes.data;
    const hasAdvisor = Array.isArray(contactList) && contactList.some(c => c.identifier === 'arularasi');
    const hasHod = Array.isArray(contactList) && contactList.some(c => c.identifier === 'gopinath');
    const hasDivya = Array.isArray(contactList) && contactList.some(c => c.identifier === 'divyabharathi'); // CSE-B advisor
    assert(hasAdvisor, `Student allowed to contact assigned Class Advisor (Arularasi)`);
    assert(hasHod, `Student allowed to contact HOD (Dr. Gopinath)`);
    assert(!hasDivya, `Student CANNOT contact other section's advisor (Divyabharathi)`);

    // Student attempts unauthorized conversation with cross-section advisor
    const unauthorizedConv = await request('POST', '/api/chat/conversations', {
      targetIdentifier: 'divyabharathi'
    }, studentToken);
    assert(unauthorizedConv.status === 403, `Blocked unauthorized conversation attempt with cross-section advisor with 403 (Got ${unauthorizedConv.status})`);

    // ----------------------------------------------------
    // TEST 7: Student-Staff Chat - Message Exchange & Unread Badges
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Chat Conversation Creation & Bi-Directional Messaging ---');
    
    // Student starts conversation with Class Advisor
    const convRes = await request('POST', '/api/chat/conversations', {
      targetIdentifier: 'arularasi'
    }, studentToken);
    assert(convRes.status === 200, `Started conversation with Class Advisor (Got ${convRes.status})`);
    const conversationId = convRes.data.id;
    console.log(`    Conversation ID: ${conversationId}`);

    // Student sends message to Advisor
    const studentMsgRes = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
      content: 'Good afternoon Ma\'am, I have submitted the OD request for the National Hackathon.'
    }, studentToken);
    assert(studentMsgRes.status === 200, `Student sent message successfully`);
    assert(studentMsgRes.data.senderRole === 'STUDENT', `Sender role derived securely as STUDENT (not from client body)`);
    assert(studentMsgRes.data.senderId === '620823104002', `Sender ID derived from authenticated session as 620823104002`);

    // Advisor checks unread count & message history
    const advisorUnreadRes = await request('GET', '/api/chat/unread-count', null, advisorToken);
    assert(advisorUnreadRes.status === 200 && advisorUnreadRes.data.unreadCount >= 1, `Advisor received unread notification indicator (Count: ${advisorUnreadRes.data.unreadCount})`);

    // Advisor reads message history (this automatically marks unread as read)
    const advisorMessagesRes = await request('GET', `/api/chat/conversations/${conversationId}/messages`, null, advisorToken);
    assert(advisorMessagesRes.status === 200, `Advisor retrieved message history`);
    assert(Array.isArray(advisorMessagesRes.data) && advisorMessagesRes.data.length >= 1, `Messages contain student message`);

    // Advisor replies
    const advisorReply = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
      content: 'I have reviewed your application and verified your invitation letter. Best wishes!'
    }, advisorToken);
    assert(advisorReply.status === 200, `Advisor sent reply message successfully`);
    assert(advisorReply.data.senderRole === 'ADVISOR', `Advisor sender role derived as ADVISOR`);

    // Student checks unread count
    const studentUnreadRes = await request('GET', '/api/chat/unread-count', null, studentToken);
    assert(studentUnreadRes.status === 200 && studentUnreadRes.data.unreadCount >= 1, `Student received unread message indicator (Count: ${studentUnreadRes.data.unreadCount})`);

    // Student reads message history
    const studentReadRes = await request('GET', `/api/chat/conversations/${conversationId}/messages`, null, studentToken);
    assert(studentReadRes.status === 200, `Student read messages`);
    const latestReply = Array.isArray(studentReadRes.data) && studentReadRes.data.find(m => m.senderRole === 'ADVISOR');
    assert(latestReply && latestReply.content.includes('Best wishes'), `Student received advisor reply text`);

    // ----------------------------------------------------
    // TEST 8: Chat Privacy & Security Enforcements
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Chat Privacy & Multi-Tenancy Protection ---');
    
    // Log in as second student (Abinaya P - 620823104003)
    const student2Login = await request('POST', '/api/auth/login', {
      username: '620823104003',
      password: 'student@12'
    });
    const student2Token = student2Login.data.token;

    // Second student attempts to read conversation between Student 1 and Advisor
    const eavesdropRes = await request('GET', `/api/chat/conversations/${conversationId}/messages`, null, student2Token);
    assert(eavesdropRes.status === 403, `Blocked other student from eavesdropping on private conversation with 403 (Got ${eavesdropRes.status})`);

    // Second student attempts to send message into Student 1's conversation
    const hijackRes = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
      content: 'Trying to inject message into someone else\'s chat'
    }, student2Token);
    assert(hijackRes.status === 403, `Blocked unauthorized student from writing into conversation with 403 (Got ${hijackRes.status})`);

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
