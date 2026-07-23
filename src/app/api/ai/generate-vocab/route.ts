import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { term } = await req.json()

    if (!term || typeof term !== 'string' || !term.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập từ vựng cần tra cứu' }, { status: 400 })
    }

    const cleanTerm = term.trim()
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GROQ_API_KEY trong tệp .env.local' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert English lexicographer. Analyze the vocabulary word/phrase provided by the user.
You MUST output ONLY a valid JSON object matching this schema:
{
  "term": "${cleanTerm}",
  "ipa": "International Phonetic Alphabet representation (e.g. /ˈæt.məs.fɪər/)",
  "definition": "Clear concise academic English definition",
  "vietnamese_translation": "Dịch nghĩa tiếng Việt chính xác nhất",
  "example_sentence": "A natural realistic example sentence containing the term",
  "synonyms": "3-5 synonyms separated by commas"
}`

    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    let lastError = ''
    let parsedData = null

    for (const model of models) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Lookup vocabulary term: "${cleanTerm}"` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const content = data?.choices?.[0]?.message?.content
          if (content) {
            parsedData = JSON.parse(content)
            break
          }
        } else {
          const errText = await res.text()
          lastError = `[${model}] HTTP ${res.status}: ${errText}`
        }
      } catch (err: any) {
        lastError = `[${model}] Error: ${err.message}`
      }
    }

    if (parsedData) {
      return NextResponse.json({ success: true, data: parsedData })
    }

    return NextResponse.json(
      { error: `Không thể kết nối Groq AI (${lastError})` },
      { status: 500 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi xử lý tra cứu từ vựng với Groq AI' },
      { status: 500 }
    )
  }
}
