module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ GEMINI_API_KEY ในระบบ Vercel Environment Variables กรุณาตรวจสอบการตั้งค่าหลังบ้าน' });
    }

    const { category, question, userName, userGender, userDob, context, drawnCards } = req.body;
    if (!drawnCards || !Array.isArray(drawnCards)) {
        return res.status(400).json({ error: 'ข้อมูลไพ่ไม่ถูกต้อง หรือส่งมาไม่ครบถ้วน' });
    }

    const cardsListText = drawnCards.map((c) => `${c.position}: ${c.nameTh} (${c.name}) [${c.type}]`).join('\n');

    const prompt = `
คุณคือ "เสืออ้วนนักทำนาย (Fat Tiger Fortune Teller)" ผู้เชี่ยวชาญการอ่านไพ่ทาโร่สากล 10 ใบ (Celtic Cross)

ข้อมูลเจ้าของดวงชะตา:
- ชื่อ / ชื่อเล่น: ${userName || 'ไม่ระบุ'}
- เพศ: ${userGender || 'ไม่ระบุ'}
- วันเดือนปีเกิด: ${userDob || 'ไม่ระบุ'}
- หมวดหมู่เรื่องที่ถาม: ${category}
- คำถาม: "${question}"
- บริบทเพิ่มเติม: "${context || 'ไม่มี'}"

ไพ่ 10 ใบที่เปิดได้:
${cardsListText}

แนวทางการทำนาย:
1. เรียกชื่อผู้ขอคำทำนาย (${userName || 'คุณ'}) ในคำทำนาย และปรับโทนภาษา/สรรพนามให้สอดคล้องกับเพศและช่วงอายุจากวันเดือนปีเกิดที่ระบุ
2. เชื่อมโยงความหมายของไพ่ 10 ใบกับข้อมูลส่วนบุคคลและคำถาม ให้ได้คำแนะนำที่ลึกซึ้งและนำไปใช้ได้จริง
3. ตอบกลับเป็นโครงสร้าง JSON เท่านั้น โดยแบ่งคำทำนายออกเป็น 4 ส่วนดังนี้:
   - ส่วนที่ 1: "ภาพรวมสถานการณ์และอุปสรรคปัจจุบัน (ตำแหน่ง 1, 2, 3)"
   - ส่วนที่ 2: "เบื้องหลัง อดีต และเป้าหมายในใจ (ตำแหน่ง 4, 5, 6)"
   - ส่วนที่ 3: "อิทธิพลภายนอก ทัศนคติ และความหวังความกลัว (ตำแหน่ง 7, 8, 9)"
   - ส่วนที่ 4: "บทสรุปและแนวทางปฏิบัติจากเสืออ้วน (ตำแหน่ง 10)"

โครงสร้าง JSON:
{
  "sections": [
    {
      "title": "ชื่อหัวข้อส่วนที่ 1",
      "summary": "สรุปสั้นเข้าใจง่าย 1-2 ประโยคสำหรับส่วนนี้",
      "content": "เนื้อหาคำทำนายรายละเอียดแบบฉบับเสืออ้วน..."
    }
  ]
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: `Gemini API Error: ${data.error.message || JSON.stringify(data.error)}` });
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            let rawText = data.candidates[0].content.parts[0].text;
            rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(rawText);
            return res.status(200).json(parsedData);
        } else {
            return res.status(500).json({ error: 'ไม่พบเนื้อหาคำทำนายตอบกลับจากระบบ AI' });
        }
    } catch (error) {
        return res.status(500).json({ error: `Server Error: ${error.message}` });
    }
};
