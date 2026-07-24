import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { scenario, messages, targetBand, words } = await req.json()

    if (!scenario || !messages) {
      return NextResponse.json({ error: 'Missing scenario or messages' }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình trên Vercel.' }, { status: 500 })
    }

    let difficultyInstruction = ''
    switch (targetBand) {
      case 'mat_goc': difficultyInstruction = '\nDIFFICULTY LEVEL (A0-A1): Ultra-basic vocabulary. Explain 80% in Vietnamese.'; break
      case 'co_ban':  difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Simple sentences. 50% English, 50% Vietnamese.'; break
      case 'trung_cap': difficultyInstruction = '\nDIFFICULTY LEVEL (B2): Academic vocabulary. Explain primarily in English.'; break
      case 'nang_cao':  difficultyInstruction = '\nDIFFICULTY LEVEL (C1-C2): Advanced. 100% Native English.'; break
      default: difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Common vocabulary.'
    }

    const wordsInstruction = words?.length > 0 ? `\nNaturally include these words if possible: ${words.join(', ')}.` : ''

    const systemPrompt = `You are an AI English tutor playing a roleplay game.
Scenario: ${scenario}
Respond naturally as the other person. Keep replies short and conversational.
If no prior messages exist, YOU initiate the conversation.
Analyze the user's LAST message for grammar errors or naturalness.
${difficultyInstruction}${wordsInstruction}

Respond ONLY in strict JSON:
{"reply":"...","grammarFix":"... (Vietnamese) or null","nativeSuggestion":"... or null"}`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'AI API failed' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(JSON.parse(data.choices[0]?.message?.content || '{}'))
  } catch (error) {
    console.error('Error in /api/ai/chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
