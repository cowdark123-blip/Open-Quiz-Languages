import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'generate') {
      const { words, targetBand } = body
      if (!words || !Array.isArray(words) || words.length === 0) {
        return NextResponse.json({ error: 'Missing words' }, { status: 400 })
      }

      const bandGuidance = targetBand === 'nang_cao' 
        ? 'Tình huống phức tạp, học thuật, tranh luận (C1-C2).' 
        : targetBand === 'mat_goc'
          ? 'Tình huống giao tiếp cực kỳ cơ bản hằng ngày (A1).'
          : 'Tình huống giao tiếp công sở, đời sống thông thường (B1).'

      const prompt = `Tạo một tình huống giao tiếp tiếng Anh ngắn (roleplay scenario) yêu cầu người học phải nói và sử dụng các từ vựng sau: ${words.join(', ')}.
Yêu cầu:
- ${bandGuidance}
- KHÔNG viết trước câu thoại cho người dùng. Chỉ mô tả bối cảnh và yêu cầu họ phải nói gì để hoàn thành tình huống.
- Trả về JSON theo định dạng bắt buộc.

Định dạng JSON:
{
  "scenario": {
    "title": "Tiêu đề tình huống ngắn gọn",
    "description": "Mô tả bối cảnh và yêu cầu người dùng phải nói gì bằng tiếng Việt",
    "expectedWords": ["từ 1", "từ 2"] // Copy lại danh sách từ vựng trên
  }
}`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(result)

      return NextResponse.json(parsed)
    }

    if (action === 'evaluate') {
      const { transcript, expectedWords } = body
      if (!transcript) {
        return NextResponse.json({ error: 'Missing transcript' }, { status: 400 })
      }

      const prompt = `Đánh giá câu nói tiếng Anh sau đây của người học: "${transcript}".
Các từ vựng mục tiêu cần dùng: ${expectedWords ? expectedWords.join(', ') : 'Không có'}.

Chấm điểm (thang 1-10):
- fluency: Độ trôi chảy, tự nhiên (dựa trên cấu trúc câu).
- accuracy: Độ chính xác ngữ pháp và phát âm (nếu câu có từ vô nghĩa hoặc sai ngữ pháp nặng thì trừ điểm).
- feedback: Nhận xét ngắn gọn bằng tiếng Việt, chỉ ra lỗi sai (nếu có) và cách nói hay hơn.

Định dạng JSON bắt buộc:
{
  "score": {
    "fluency": 8,
    "accuracy": 7,
    "feedback": "Nhận xét chi tiết..."
  }
}`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(result)

      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Speaking API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
