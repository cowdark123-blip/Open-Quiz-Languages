import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { action, text, topic } = await req.json()

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    let systemPrompt = ''

    if (action === 'check') {
      if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })
      systemPrompt = `You are a strict English grammar checker.
Analyze the following text: "${text}"

If there are NO errors, respond exactly with:
{
  "hasError": false,
  "correctedText": null,
  "explanation": "Câu của bạn đã chính xác!"
}

If there ARE errors, fix them and respond exactly with:
{
  "hasError": true,
  "correctedText": "The fully corrected English text",
  "explanation": "Detailed explanation in Vietnamese of what was wrong and why you fixed it"
}`
    } else if (action === 'practice') {
      if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
      systemPrompt = `You are an English teacher generating practice exercises.
Create 5 multiple-choice questions focusing on the grammar topic: "${topic}".
The questions can be fill-in-the-blank or find-the-error.

Respond in strict JSON format:
{
  "questions": [
    {
      "question": "The question text with ______ for blanks",
      "options": ["A", "B", "C", "D"],
      "answer": "The exact correct option text",
      "explanation": "Brief explanation in Vietnamese of the grammar rule"
    }
  ]
}`
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to call AI API' }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'Empty response' }, { status: 500 })

    return NextResponse.json(JSON.parse(content))
  } catch (error) {
    console.error('Error in /api/ai/grammar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
