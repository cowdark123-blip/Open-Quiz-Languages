import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { term } = await req.json()

    if (!term || typeof term !== 'string' || !term.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập từ vựng cần tra cứu' }, { status: 400 })
    }

    const cleanTerm = term.trim()
    const apiKey = process.env.GEMINI_API_KEY

    // Require GEMINI_API_KEY - No mock fallback allowed
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trong môi trường (.env.local hoặc Vercel)' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert lexicographer and English dictionary engine.
Lookup and analyze the English word or phrase: "${cleanTerm}".

Return ONLY a valid raw JSON object matching this schema without markdown codeblocks or extra prose:
{
  "term": "${cleanTerm}",
  "ipa": "/.../",
  "definition": "Clear concise academic English definition",
  "vietnamese_translation": "Dịch nghĩa tiếng Việt chính xác nhất",
  "example_sentence": "A natural realistic example sentence containing the word",
  "synonyms": "3-5 synonyms separated by commas"
}`

    // Try Gemini 1.5 Flash endpoint
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Google Gemini API trả về lỗi (${res.status}): ${errText}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textResponse) {
      return NextResponse.json({ error: 'Không nhận được phản hồi từ Gemini AI' }, { status: 500 })
    }

    const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleanJson)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý tra cứu từ vựng với Gemini AI' },
      { status: 500 }
    )
  }
}
