const BASE_URL = 'http://localhost:8080';

async function post(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(url, { method: 'GET', headers });
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
  console.log('========================================================================');
  console.log('EPOCH — WhatsApp-Style Rich Messaging & Attachments Verification');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Student and Advisor
    console.log('--- Step 1: Authentication ---');
    const stuA = await login('620823104002', 'student@12'); // Abinaya G
    const advA = await login('arularasi', 'advisor@123'); // Mrs. P. Arularasi
    assert(stuA && stuA.token, 'Student A authenticated');
    assert(advA && advA.token, 'Advisor A authenticated');

    // 2. Open / Retrieve Conversation
    console.log('\n--- Step 2: Establish Conversation ---');
    const convRes = await post(`${BASE_URL}/api/chat/conversations`, { targetIdentifier: 'arularasi' }, stuA.token);
    assert(convRes.ok && convRes.data && convRes.data.id, `Conversation established: ID ${convRes.data?.id}`);
    const convId = convRes.data.id;

    // 3. Send Initial Message
    console.log('\n--- Step 3: Send Base Message ---');
    const initialText = `Hello Mrs. Arularasi, question about project review - ${Date.now()}`;
    const sendRes1 = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: initialText,
      recipientId: 'arularasi'
    }, stuA.token);
    assert(sendRes1.ok && sendRes1.data && sendRes1.data.id, 'Base message sent successfully');
    const baseMsgId = sendRes1.data.id;
    const baseMsgText = sendRes1.data.content;

    // 4. Send Quoted Reply
    console.log('\n--- Step 4: Send Quoted Reply Message ---');
    const replyText = `Here is the update regarding project review!`;
    const sendReplyRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: replyText,
      recipientId: '620823104002',
      replyToId: baseMsgId,
      replyToSender: 'Abinaya G',
      replyToText: baseMsgText
    }, advA.token);
    assert(sendReplyRes.ok && sendReplyRes.data && sendReplyRes.data.id, 'Quoted reply sent successfully by Advisor');
    assert(sendReplyRes.data.replyToId === baseMsgId, 'Reply metadata: replyToId matches');
    assert(sendReplyRes.data.replyToSender === 'Abinaya G', 'Reply metadata: replyToSender matches');
    assert(sendReplyRes.data.replyToText === baseMsgText, 'Reply metadata: replyToText matches');

    // 5. Send Image Attachment
    console.log('\n--- Step 5: Send Image Attachment ---');
    const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const sendImgRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: 'Attached the circuit schematic diagram',
      recipientId: 'arularasi',
      attachmentUrl: dummyImageBase64,
      attachmentName: 'schematic_diagram.png',
      attachmentType: 'image/png',
      attachmentSize: 154
    }, stuA.token);
    assert(sendImgRes.ok && sendImgRes.data && sendImgRes.data.id, 'Image message sent successfully');
    assert(sendImgRes.data.attachmentUrl && sendImgRes.data.attachmentUrl.startsWith('data:image/'), 'Image attachmentUrl preserved');
    assert(sendImgRes.data.attachmentName === 'schematic_diagram.png', 'Image attachmentName preserved');
    assert(sendImgRes.data.attachmentType === 'image/png', 'Image attachmentType preserved');
    assert(sendImgRes.data.attachmentSize === 154, 'Image attachmentSize preserved');

    // 6. Send Document Attachment
    console.log('\n--- Step 6: Send Document Attachment ---');
    const dummyDocBase64 = 'data:application/pdf;base64,JVBERi0xLjUKJUZha2VQREY=';
    const sendDocRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: 'Please review my project report draft',
      recipientId: 'arularasi',
      attachmentUrl: dummyDocBase64,
      attachmentName: 'Project_Final_Report_v2.pdf',
      attachmentType: 'application/pdf',
      attachmentSize: 1048576
    }, stuA.token);
    assert(sendDocRes.ok && sendDocRes.data && sendDocRes.data.id, 'Document message sent successfully');
    assert(sendDocRes.data.attachmentName === 'Project_Final_Report_v2.pdf', 'Document attachmentName preserved');
    assert(sendDocRes.data.attachmentType === 'application/pdf', 'Document attachmentType preserved');
    assert(sendDocRes.data.attachmentSize === 1048576, 'Document attachmentSize preserved');

    // 7. Send Emoji Rich Message
    console.log('\n--- Step 7: Send Emoji Message ---');
    const emojiText = 'Approved! Excellent progress 🎓🚀👍 Keep up the great work! ✨';
    const sendEmojiRes = await post(`${BASE_URL}/api/chat/conversations/${convId}/messages`, {
      content: emojiText,
      recipientId: '620823104002'
    }, advA.token);
    assert(sendEmojiRes.ok && sendEmojiRes.data && sendEmojiRes.data.id, 'Emoji message sent successfully');
    assert(sendEmojiRes.data.content.includes('🎓🚀👍'), 'Emoji characters preserved without encoding corruption');

    // 8. Verify Persistence and Retrieval by Both Sender and Receiver
    console.log('\n--- Step 8: Multi-Party History Verification ---');
    const historyStu = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, stuA.token);
    assert(historyStu.ok && Array.isArray(historyStu.data), 'Student fetched conversation messages list');
    
    const historyAdv = await get(`${BASE_URL}/api/chat/conversations/${convId}/messages`, advA.token);
    assert(historyAdv.ok && Array.isArray(historyAdv.data), 'Advisor fetched conversation messages list');
    assert(historyStu.data.length === historyAdv.data.length, `Both users see identical message count (${historyStu.data.length})`);

    // Verify reply in history
    const historyReplyMsg = historyStu.data.find(m => m.id === sendReplyRes.data.id);
    assert(historyReplyMsg && historyReplyMsg.replyToId === baseMsgId, 'Quoted reply persists in conversation history');
    assert(historyReplyMsg && historyReplyMsg.replyToSender === 'Abinaya G', 'Quoted reply sender persists');
    assert(historyReplyMsg && historyReplyMsg.replyToText === baseMsgText, 'Quoted reply original text persists');

    // Verify image in history
    const historyImgMsg = historyAdv.data.find(m => m.id === sendImgRes.data.id);
    assert(historyImgMsg && historyImgMsg.attachmentName === 'schematic_diagram.png', 'Image attachment persists in history for receiver');
    assert(historyImgMsg && historyImgMsg.attachmentType === 'image/png', 'Image attachmentType persists for receiver');

    // Verify document in history
    const historyDocMsg = historyAdv.data.find(m => m.id === sendDocRes.data.id);
    assert(historyDocMsg && historyDocMsg.attachmentName === 'Project_Final_Report_v2.pdf', 'Document attachment persists in history for receiver');
    assert(historyDocMsg && historyDocMsg.attachmentSize === 1048576, 'Document attachmentSize persists for receiver');

    // Verify emoji in history
    const historyEmojiMsg = historyStu.data.find(m => m.id === sendEmojiRes.data.id);
    assert(historyEmojiMsg && historyEmojiMsg.content.includes('🎓🚀👍'), 'Emoji message persists in history for recipient');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
