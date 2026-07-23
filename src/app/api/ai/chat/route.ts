import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { scenario, messages } = await req.json()

    if (!scenario || !messages) {
      return NextResponse.json({ error: 'Missing scenario or messages' }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const systemPrompt = `You are an AI English tutor playing a roleplay game.
Scenario: ${scenario}

Your job is to respond naturally to the user's messages as the other person in the scenario.
Keep your responses relatively short, conversational, and natural. Do not break character in the "reply" field.
Additionally, as an English tutor, you must analyze the user's LAST message.
If they made grammatical errors, provide a brief correction in Vietnamese.
If their sentence is grammatically correct but could sound more native/natural, provide a suggestion.

You MUST respond in strict JSON format:
{
  "reply": "Your natural response in character (English)",
  "grammarFix": "Your correction in Vietnamese (or null if no major errors)",
  "nativeSuggestion": "A more natural way to say it in English (or null if already perfect)"
}`

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API Error:', errorText)
      return NextResponse.json({ error: 'Failed to generate response' }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Empty response from Groq' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error in /api/ai/chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
