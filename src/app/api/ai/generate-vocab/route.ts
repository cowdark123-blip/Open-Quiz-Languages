import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { term } = await req.json()

    if (!term || typeof term !== 'string' || !term.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập từ vựng cần tra cứu' }, { status: 400 })
    }

    const cleanTerm = term.trim()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trong tệp .env.local' },
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

    // Dual-version endpoints (v1beta & v1) x Official Gemini Models
    const endpoints = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    ]

    let lastError = ''
    let parsedData = null

    for (const url of endpoints) {
      try {
        const res = await fetch(`${url}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

          if (textResponse) {
            const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
            parsedData = JSON.parse(cleanJson)
            break
          }
        } else {
          const errBody = await res.text()
          const modelName = url.split('/models/')[1]?.split(':')[0] || url
          lastError = `[${modelName}] HTTP ${res.status}: ${errBody}`
        }
      } catch (err: any) {
        lastError = `Error: ${err.message}`
      }
    }

    if (parsedData) {
      return NextResponse.json({ success: true, data: parsedData })
    }

    return NextResponse.json(
      { error: `Không thể kết nối Gemini API (${lastError})` },
      { status: 500 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý tra cứu từ vựng với Gemini AI' },
      { status: 500 }
    )
  }
}
