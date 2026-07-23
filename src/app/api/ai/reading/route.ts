import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { words } = await req.json()

    if (!words || words.length === 0) {
      return NextResponse.json({ error: 'Missing words' }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const systemPrompt = `You are an expert English teacher.
The user wants to practice reading comprehension based on a specific set of vocabulary words.
Words to include: ${words.join(', ')}

Please write a short, engaging article (150-250 words) that naturally includes all of these words.
Then, create 3 multiple choice reading comprehension questions based on the article.

You MUST respond in strict JSON format exactly like this:
{
  "article": "The generated article text here...",
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Exact text of the correct option",
      "explanation": "Brief explanation in Vietnamese of why this is correct"
    }
  ]
}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API Error:', errorText)
      return NextResponse.json({ error: 'Failed to generate reading material' }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error in /api/ai/reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
