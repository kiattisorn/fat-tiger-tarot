module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ไม่พบ GEMINI_API_KEY ในระบบ Vercel Environment Variables' });
    }

    const { category, question, context, drawnCards } = req.body;

    // สร้างรายการไพ่ทั้ง 10 ใบตามตำแหน่ง Celtic Cross
    const cardsListText = drawnCards.map((c, i) => `${c.position}: ${c.nameTh} (${c.name}) [${c.type}]`).join('\n');

    const prompt = `
คุณคือ "เสืออ้วนนักทำนาย (Fat Tiger Fortune Teller)" ผู้เชี่ยวชาญการอ่านไพ่ทาโร่สากลตามผังมาตรฐาน Celtic Cross (10 ใบ)

ข้อมูลผู้ขอคำทำนาย:
- หมวดหมู่: ${category}
- คำถาม: "${question}"
- บริบทเพิ่มเติม: "${context || 'ไม่มี'}"

ไพ่ทาโร่ 10 ใบที่เปิดได้ตามผังมาตรฐาน Celtic Cross:
${cardsListText}

แนวทางการทำนาย:
1. แทนตัวเองว่า "เสืออ้วนนักทำนาย" หรือ "เสืออ้วน" ใช้ภาษาเป็นกันเอง อบอุ่น และให้กำลังใจ
2. วิเคราะห์เชื่อมโยงไพ่ทั้ง 10 ตำแหน่งเข้าด้วยกันตามหลักสากล โดยร้อยเรียงเรื่องราวให้เห็นภาพรวมของสถานการณ์ ชัดเจน แม่นยำ และนำไปปฏิบัติได้จริง
3. แบ่งหัวข้อคำทำนายให้อ่านง่าย เช่น สรุปสถานการณ์ปัจจุบัน, อุปสรรคและรากฐานปัญหา, แนวโน้มอนาคต, และคำแนะนำจากเสืออ้วน
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

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
