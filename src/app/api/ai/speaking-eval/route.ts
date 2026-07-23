import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript, targetWords, scenarioPrompt } = await req.json()

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Không tìm thấy văn bản bài nói' }, { status: 400 })
    }

    const words = targetWords && Array.isArray(targetWords) ? targetWords : ['resilience', 'meticulous']
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GROQ_API_KEY trong tệp .env.local' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a strict English Speaking Examiner (IELTS/CEFR standard).
Evaluate the user's spoken response based on the scenario prompt and target mandatory words.

You MUST output ONLY a valid JSON object matching this exact schema:
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

    const userPrompt = `Scenario Prompt: "${scenarioPrompt || 'Describe a recent challenge at work or school.'}"
Target Mandatory Words to Use: ${words.join(', ')}
User Spoken Transcript: "${transcript}"`

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
      { error: error.message || 'Lỗi phân tích bài nói' },
      { status: 500 }
    )
  }
}
