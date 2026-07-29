import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { targetWord, targetSentence, userTranscript, audioData } = await req.json()

    if (!userTranscript?.trim() && !audioData) {
      return NextResponse.json({ error: 'Không nhận diện được âm thanh phát âm' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY

    // Require GROQ_API_KEY - No mock fallback allowed
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình GROQ_API_KEY trong tệp .env.local' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a strict English Pronunciation Examiner.
Evaluate the user's spoken pronunciation of the target word/sentence.

Target Word: "${targetWord || ''}"
Target Sentence: "${targetSentence || ''}"

You MUST output ONLY a valid JSON object matching this exact schema without markdown triple backticks:
{
  "targetWord": "Target word or sentence",
  "ipaStandard": "Standard IPA transcription",
  "overallAccuracy": 75,
  "syllableBreakdown": [
    {
      "syllable": "Syllable text",
      "ipa": "Syllable IPA",
      "status": "correct", // "correct" | "incorrect" | "warning"
      "isStressed": true,
      "feedback": "Specific feedback in Vietnamese"
    }
  ],
  "phoneticAdvice": "Overall advice in Vietnamese"
}`

    let finalTranscript = userTranscript?.trim() || ''

    // Whisper Fallback if no transcript but audio exists
    if (!finalTranscript && audioData) {
      try {
        const audioBuffer = Buffer.from(audioData, 'base64')
        const blob = new Blob([audioBuffer], { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', blob, 'audio.webm')
        formData.append('model', 'whisper-large-v3-turbo')
        
        const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData,
        })
        
        if (whisperRes.ok) {
          const whisperData = await whisperRes.json()
          finalTranscript = whisperData.text?.trim() || ''
        } else {
          console.error('Whisper API Error:', await whisperRes.text())
        }
      } catch (err) {
        console.error('Whisper transcription failed:', err)
      }
    }

    if (!finalTranscript) {
      return NextResponse.json({ error: 'Không nhận diện được nội dung phát âm' }, { status: 400 })
    }

    const userPrompt = `Evaluate pronunciation: Target: "${targetWord || targetSentence}", Spoken: "${finalTranscript}"`

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
      { error: error.message || 'Lỗi phân tích phát âm với Groq AI' },
      { status: 500 }
    )
  }
}
