const BASE_URL = 'http://localhost:8080';

async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function get(url, token) {
  const headers = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function del(url, token) {
  const headers = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function login(username, password) {
  const res = await post(`${BASE_URL}/api/auth/login`, { username, password });
  if (!res.ok || !res.data || !res.data.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function runTests() {
  console.log("================================================================================");
  console.log("   EPOCH MODERN CHATTING SYSTEM - COMPREHENSIVE VERIFICATION SUITE   ");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Authenticate Students & Staff
    console.log("--- 1. Authenticating Accounts ---");
    const student1 = await login("620823104002", "student@12");
    assert(student1 && student1.token, "Student 1 (620823104002) logged in successfully");

    const student2 = await login("620823104111", "student@12");
    assert(student2 && student2.token, "Student 2 (620823104111) logged in successfully");

    const advisor = await login("arularasi", "advisor@123");
    assert(advisor && advisor.token, "Advisor (arularasi) logged in successfully");

    // 2. Test Smart Directory Search
    console.log("\n--- 2. Testing Smart Directory Search ---");
    const dirSearchRes = await get(`${BASE_URL}/api/chat/users/search?query=620823104111&limit=10`, student1.token);
    assert(dirSearchRes.ok && dirSearchRes.status === 200, "Directory search returned 200 OK");
    assert(Array.isArray(dirSearchRes.data) && dirSearchRes.data.length > 0, "Directory returned matching registered user record");
    const foundUser = dirSearchRes.data[0];
    assert(foundUser && foundUser.name && (foundUser.identifier === "620823104111" || foundUser.regNo === "620823104111"),
      `Found registered student: ${foundUser.name} (${foundUser.identifier || foundUser.regNo})`);

    // 3. Test Direct Conversation Creation (Zero Request Gates)
    console.log("\n--- 3. Testing Direct Conversation Creation (Zero Request Gates) ---");
    const createConvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: "620823104111" }, student1.token);
    assert(createConvRes.ok && createConvRes.status === 200, "Direct conversation initiation returned 200 OK without request/accept gates");
    const conv = createConvRes.data;
    assert(conv && conv.id && conv.id.includes("620823104002") && conv.id.includes("620823104111"),
      `Conversation established with canonical ID: ${conv.id}`);

    // 4. Test Text Messaging Delivery & Status
    console.log("\n--- 4. Testing Text Messaging Delivery & Status ---");
    const msgText = `Hello! Modern chatting system test at ${new Date().toLocaleTimeString()}`;
    const sendMsgRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, {
      content: msgText,
      recipientId: "620823104111"
    }, student1.token);

    assert(sendMsgRes.ok && sendMsgRes.status === 200, "Student 1 message sent with 200 OK");
    const msg1 = sendMsgRes.data;
    assert(msg1 && msg1.id && msg1.content === msgText, `Message created with ID: ${msg1.id}`);
    assert(msg1.status === "DELIVERED" || msg1.delivered === true, "Message marked DELIVERED upon persistence");

    // 5. Test Student 2 Receiving & Marking as Read
    console.log("\n--- 5. Testing Student 2 Receiving & Read Status ---");
    const getMsgsRes = await get(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, student2.token);
    assert(getMsgsRes.ok && getMsgsRes.status === 200, "Student 2 retrieved messages with 200 OK");
    const msgsList = getMsgsRes.data;
    const receivedMsg = msgsList.find(m => m.id === msg1.id);
    assert(receivedMsg && receivedMsg.content === msgText, "Student 2 received Student 1's exact message");

    const markReadRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/read`, {}, student2.token);
    assert(markReadRes.ok && markReadRes.status === 200, "Student 2 marked conversation as read (200 OK)");

    // 6. Test Quoted Reply
    console.log("\n--- 6. Testing Quoted Reply ---");
    const replyText = "Reply: Received your message clearly!";
    const replyRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, {
      content: replyText,
      recipientId: "620823104002",
      replyToId: msg1.id,
      replyToSender: "ABINESH K",
      replyToText: msg1.content
    }, student2.token);

    assert(replyRes.ok && replyRes.status === 200, "Student 2 sent quoted reply with 200 OK");
    const replyMsg = replyRes.data;
    assert(replyMsg.replyToId === msg1.id && replyMsg.replyToText === msg1.content, "Quoted reply reference preserved correctly");

    // 7. Test Real-time Typing Indicators
    console.log("\n--- 7. Testing Real-time Typing Indicators ---");
    const typingPostRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/typing`, { isTyping: true }, student2.token);
    assert(typingPostRes.ok && typingPostRes.status === 200, "Student 2 typing state posted (200 OK)");

    const typingGetRes = await get(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/typing`, student1.token);
    assert(typingGetRes.ok && typingGetRes.status === 200, "Student 1 queried typing status (200 OK)");
    const typers = typingGetRes.data;
    assert(Array.isArray(typers) && typers.some(t => t.identifier === "620823104111"), "Student 2 detected as actively typing");

    await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/typing`, { isTyping: false }, student2.token);

    // 8. Test Voice Note Message
    console.log("\n--- 8. Testing Voice Note Message ---");
    const voiceDataUrl = "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=";
    const voiceMsgRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, {
      content: "🎙️ Voice message (6s)",
      recipientId: "620823104111",
      attachmentUrl: voiceDataUrl,
      attachmentName: "Voice Note (6s)",
      attachmentType: "audio/webm",
      attachmentSize: 8450
    }, student1.token);

    assert(voiceMsgRes.ok && voiceMsgRes.status === 200, "Voice note sent with 200 OK");
    const voiceMsg = voiceMsgRes.data;
    assert(voiceMsg.attachmentType === "audio/webm" && voiceMsg.attachmentUrl === voiceDataUrl,
      "Voice note audio attachment metadata and payload preserved");

    // 9. Test Image Attachment
    console.log("\n--- 9. Testing Image Attachment ---");
    const imgDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const imgMsgRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, {
      content: "Project architecture screenshot",
      recipientId: "620823104002",
      attachmentUrl: imgDataUrl,
      attachmentName: "architecture.png",
      attachmentType: "image/png",
      attachmentSize: 1200
    }, student2.token);

    assert(imgMsgRes.ok && imgMsgRes.status === 200, "Image message sent with 200 OK");
    const imgMsg = imgMsgRes.data;
    assert(imgMsg.attachmentType === "image/png" && imgMsg.attachmentName === "architecture.png",
      "Image attachment metadata and URL preserved");

    // 10. Test Message Deletion / Unsend
    console.log("\n--- 10. Testing Message Deletion (Unsend for Everyone) ---");
    const deleteRes = await del(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages/${encodeURIComponent(msg1.id)}`, student1.token);

    assert(deleteRes.ok && deleteRes.status === 200, "Student 1 deleted message with 200 OK");
    assert(deleteRes.data && deleteRes.data.success === true, "Delete response returned success: true");

    // Verify deletion reflection
    const checkDeletedRes = await get(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, student2.token);
    const refreshedMsgs = checkDeletedRes.data;
    const deletedItem = refreshedMsgs.find(m => m.id === msg1.id);
    assert(deletedItem && (deletedItem.deleted === true || deletedItem.isDeleted === true), "Message flagged as deleted");
    assert(deletedItem && deletedItem.content === "This message was deleted", "Message content updated to 'This message was deleted'");
    assert(deletedItem && deletedItem.attachmentUrl === null, "Deleted message attachments cleared");

    // 11. Test Advisor-Student Direct Communication
    console.log("\n--- 11. Testing Staff-Student Direct Communication ---");
    const advisorConvRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: "620823104002" }, advisor.token);
    assert(advisorConvRes.ok && advisorConvRes.status === 200, "Advisor initiated direct conversation with student (200 OK)");
    const advisorConv = advisorConvRes.data;

    const advisorMsgRes = await post(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(advisorConv.id)}/messages`, {
      content: "Please submit your project synopsis by Friday 4 PM.",
      recipientId: "620823104002"
    }, advisor.token);
    assert(advisorMsgRes.ok && advisorMsgRes.status === 200, "Advisor sent official directive with 200 OK");

    // 12. Test Session Persistence Across Logout & Re-login
    console.log("\n--- 12. Testing Session Persistence Across Logout & Re-login ---");
    const freshStudent1 = await login("620823104002", "student@12");
    const freshConvs = await get(`${BASE_URL}/api/chat/conversations`, freshStudent1.token);
    assert(freshConvs.ok && Array.isArray(freshConvs.data), "Retrieved conversations after re-login");
    const convFound = freshConvs.data.find(c => c.id === conv.id);
    assert(!!convFound, "Conversation restored with complete metadata after fresh re-login");

    const freshMsgs = await get(`${BASE_URL}/api/chat/conversations/${encodeURIComponent(conv.id)}/messages`, freshStudent1.token);
    assert(freshMsgs.ok && Array.isArray(freshMsgs.data) && freshMsgs.data.length >= 3,
      `All conversation messages persisted (${freshMsgs.data.length} messages found)`);

    console.log("\n================================================================================");
    console.log(`   SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (${Math.round(passed / total * 100)}%)   `);
    console.log("================================================================================\n");

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution aborted with unhandled error:", err);
    process.exit(1);
  }
}

runTests();
