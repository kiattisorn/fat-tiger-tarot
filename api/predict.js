module.exports = async function handler(req, res) {
    // กำหนดการรับเฉพาะ HTTP POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // ตรวจสอบ API Key ใน Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ GEMINI_API_KEY ในการตั้งค่า Environment Variables ของ Vercel' });
    }

    const { category, question, context, drawnCards } = req.body;

    const prompt = `
คุณคือ "แม่หมอเสืออ้วนป้ายหู่ (Fat Tiger Bai Hu)" ผู้เชี่ยวชาญการอ่านไพ่ทาโร่ตามหลักสากล

ข้อมูลผู้ขอคำทำนาย:
- หมวดหมู่: ${category}
- คำถาม: "${question}"
- บริบทเพิ่มเติม: "${context || 'ไม่มี'}"

ไพ่ 3 ใบที่เปิดได้ (Past - Present - Future):
1. ${drawnCards[0].position}: ${drawnCards[0].nameTh} (${drawnCards[0].name}) [${drawnCards[0].type}]
2. ${drawnCards[1].position}: ${drawnCards[1].nameTh} (${drawnCards[1].name}) [${drawnCards[1].type}]
3. ${drawnCards[2].position}: ${drawnCards[2].nameTh} (${drawnCards[2].name}) [${drawnCards[2].type}]

แนวทางการทำนาย:
1. วิเคราะห์เชื่อมโยงไพ่ทั้ง 3 ใบเข้ากับคำถามและบริบทอย่างตรงจุด
2. แทนตัวเองว่า "แม่หมอเสืออ้วน" ใช้ภาษาเป็นกันเอง อบอุ่น และให้คำแนะนำเชิงบวกที่นำไปใช้ได้จริง
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // กรณี Gemini API ส่งข้อผิดพลาดกลับมา ให้แสดงข้อความแจ้งเตือนฉบับเต็ม
        if (data.error) {
            return res.status(500).json({ error: `Gemini API Error: ${data.error.message || JSON.stringify(data.error)}` });
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: 'ไม่พบเนื้อหาคำทำนายตอบกลับจากระบบ AI' });
        }
    } catch (error) {
        return res.status(500).json({ error: `Server Error: ${error.message}` });
    }
};
