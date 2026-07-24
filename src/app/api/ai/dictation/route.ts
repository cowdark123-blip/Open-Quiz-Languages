import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const { words, targetBand, questionCount, durationLimit } = await req.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ success: false, error: 'Thiếu danh sách từ vựng' }, { status: 400 })
    }

    const bandGuidance = targetBand === 'nang_cao' 
      ? 'Sử dụng cấu trúc câu phức tạp, từ vựng học thuật, độ dài 15-20 từ.' 
      : targetBand === 'mat_goc'
        ? 'Sử dụng cấu trúc ngữ pháp cơ bản, từ vựng đơn giản, độ dài 5-8 từ.'
        : 'Sử dụng cấu trúc câu thông dụng, độ dài 8-15 từ.'

    const lengthConstraint = durationLimit ? `Độ dài tương đối của mỗi câu: phù hợp để đọc trong tối đa ${durationLimit} giây.` : ''

    const prompt = `Tạo các câu ví dụ hoàn toàn mới bằng tiếng Anh cho các từ vựng sau đây để dùng trong bài tập Nghe Chép Chính Tả (Dictation).
Yêu cầu:
- Mỗi từ vựng tương ứng với 1 câu ví dụ.
- ${bandGuidance}
- ${lengthConstraint}
- Các câu phải hoàn toàn tự nhiên và đúng ngữ pháp.
- KHÔNG giải thích, CHỈ trả về mảng JSON chứa các chuỗi câu. 

Danh sách từ: ${words.join(', ')}

Định dạng JSON bắt buộc:
{
  "sentences": ["câu 1", "câu 2", ...]
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)

    return NextResponse.json({ success: true, sentences: parsed.sentences || [] })
  } catch (error: any) {
    console.error('Dictation Generation Error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi khi tạo câu' }, { status: 500 })
  }
}
