import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript, targetWords, scenarioPrompt } = await req.json()

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Không tìm thấy văn bản bài nói' }, { status: 400 })
    }

    const words = targetWords && Array.isArray(targetWords) ? targetWords : ['resilience', 'meticulous']
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GEMINI_API_KEY trong tệp .env.local' },
        { status: 400 }
      )
    }

    const prompt = `You are a strict English Speaking Examiner (IELTS/CEFR standard).
Evaluate the user's spoken response based on the following criteria:

Scenario Prompt: "${scenarioPrompt || 'Describe a recent challenge at work or school.'}"
Target Mandatory Words to Use: ${words.join(', ')}
User Spoken Transcript: "${transcript}"

Analyze carefully and return ONLY a raw valid JSON object with NO markdown formatting, matching this exact schema:
{
  "overall_score": 88,
  "accuracy_score": 90,
  "fluency_score": 85,
  "prosody_score": 87,
  "target_words_used": ["usedWord1"],
  "missing_target_words": ["missingWord1"],
  "grammar_feedback": "Detailed grammar feedback and corrections in Vietnamese",
  "native_suggestion": "An upgraded natural native-sounding response in English",
  "word_scores": [
    { "word": "exampleWord", "accuracy": 92, "status": "good" }
  ]
}

For "word_scores", split the transcript word by word, score accuracy (0-100), and assign status ("good" for >=85, "average" for 60-84, "poor" for <60).`

    // Model candidates list for fallback mechanism
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash']
    let lastError = ''
    let parsedData = null

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

          if (textResponse) {
            const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
            parsedData = JSON.parse(cleanJson)
            break // Successfully evaluated!
          }
        } else {
          const errBody = await res.text()
          lastError = `[${model}] HTTP ${res.status}: ${errBody}`
        }
      } catch (err: any) {
        lastError = `[${model}] Error: ${err.message}`
      }
    }

    if (parsedData) {
      return NextResponse.json({ success: true, data: parsedData })
    }

    return NextResponse.json(
      { error: `Không thể kết nối Gemini Speaking AI (${lastError})` },
      { status: 500 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi phân tích bài nói' },
      { status: 500 }
    )
  }
}
