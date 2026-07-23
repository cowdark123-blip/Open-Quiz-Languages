import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript, targetWords, scenarioPrompt } = await req.json()

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return NextResponse.json({ error: 'Không tìm thấy văn bản bài nói' }, { status: 400 })
    }

    const words = targetWords && Array.isArray(targetWords) ? targetWords : ['resilience', 'meticulous']
    const apiKey = process.env.GROQ_API_KEY

    // Require GROQ_API_KEY - No mock fallback allowed
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GROQ_API_KEY trong tệp .env.local' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a strict English Speaking Examiner (IELTS/CEFR standard).
Evaluate the user's spoken response based on the scenario prompt and target mandatory words.

You MUST output ONLY a valid JSON object matching this exact schema without markdown triple backticks:
{
  "targetWordsUsed": ["word1"],
  "targetWordsMissing": ["word2"],
  "grammarFeedback": "Detailed grammar feedback and corrections in Vietnamese",
  "nativeSuggestion": "An upgraded natural native-sounding response in English",
  "scores": {
    "overall": 85,
    "accuracy": 88,
    "fluency": 82,
    "prosody": 84
  },
  "wordScores": [
    { "word": "I", "score": 95, "status": "good" }
  ]
}

For "wordScores", split the user's transcript word by word, score accuracy (0-100), and assign status ("good" for score >=85, "average" for score 60-84, "poor" for score <60).`

    const userPrompt = `Scenario Prompt: "${scenarioPrompt || 'Describe a recent challenge at work or school.'}"
Target Mandatory Words to Use: ${words.join(', ')}
User Spoken Transcript: "${transcript.trim()}"`

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
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
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
      { error: `Không thể kết nối Groq Speaking AI (${lastError})` },
      { status: 500 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Lỗi phân tích bài nói với Groq AI' },
      { status: 500 }
    )
  }
}
