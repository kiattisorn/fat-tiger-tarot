export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ' });
    }

    const { category, question, context, drawnCards } = req.body;

    // Prompt วิเคราะห์ตามหลักไพ่ทาโร่สากล
    const prompt = `
คุณคือ "แม่หมอเสืออ้วนป้ายหู่ (Fat Tiger Bai Hu)" ผู้เชี่ยวชาญการอ่านไพ่ทาโร่ตามหลักสากล (Universal Tarot Principles)

ข้อมูลผู้ขอคำทำนาย:
- หมวดหมู่: ${category}
- คำถาม: "${question}"
- บริบทเพิ่มเติม: "${context || 'ไม่มี'}"

ไพ่ 3 ใบที่เปิดได้ (สำรับสากล 78 ใบ):
1. ตำแหน่งที่ 1 (Past / Root Cause / Groundinging Energy): ${drawnCards[0].nameTh} (${drawnCards[0].name}) [ประเภท: ${drawnCards[0].type}]
2. ตำแหน่งที่ 2 (Present / Current Challenge / Dynamicing Energy): ${drawnCards[1].nameTh} (${drawnCards[1].name}) [ประเภท: ${drawnCards[1].type}]
3. ตำแหน่งที่ 3 (Future / Potential Outcome / Guidance): ${drawnCards[2].nameTh} (${drawnCards[2].name}) [ประเภท: ${drawnCards[2].type}]

กติกาการทำนายตามหลักสากล:
1. **การให้น้ำหนัก Major vs Minor Arcana:**
   - หากได้ Major Arcana: เน้นว่าเป็นเรื่องโชคชะตา บทเรียนชีวิต หรือเหตุการณ์ใหญ่ที่มีผลระยะยาว
   - หากได้ Minor Arcana: เน้นว่าเป็นสภาวะอารมณ์ การกระทำ รายละเอียด หรือเหตุการณ์ชั่วคราวในชีวิตประจำวัน
2. **การวิเคราะห์ธาตุ (Elemental Balance):**
   - Wands (ไฟ: การงาน, ความปรารถนา) / Cups (น้ำ: อารมณ์, ความสัมพันธ์) / Swords (ลม: ความคิด, การตัดสินใจ) / Pentacles (ดิน: การเงิน, ความมั่นคงกายภาพ)
3. **การอ่านความสัมพันธ์ 3 ตำแหน่ง:**
   - อ่านร้อยเรียงเรื่องราวจากตำแหน่ง 1 -> 2 -> 3 ให้เห็นพัฒนาการของสถานการณ์ ไม่ใช่อ่านแยกใบ
4. **โทนการตอบ:**
   - แทนตัวเองว่า "แม่หมอเสืออ้วน" ภาษาเป็นกันเอง อบอุ่น นำเสนอตรงจุด พร้อมให้แนวทางแก้ไขที่เป็นรูปธรรม (Actionable Advice)

ตอบเป็นภาษาไทย รูปแบบอ่านง่าย เว้นวรรคสวยงาม`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return res.status(200).json({ result: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: 'ไม่สามารถประมวลผลคำทำนายได้' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI' });
    }
}