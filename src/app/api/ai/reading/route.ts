import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { words, targetBand } = await req.json()

    if (!words || words.length === 0) {
      return NextResponse.json({ error: 'Missing words' }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    let difficultyInstruction = ''
    switch (targetBand) {
      case 'mat_goc':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A0-A1): Write very simple and short sentences. Use basic grammar. Explanations MUST be 100% in Vietnamese.'
        break
      case 'co_ban':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Write simple compound sentences. Explanations should be easy to understand in Vietnamese.'
        break
      case 'trung_cap':
        difficultyInstruction = '\nDIFFICULTY LEVEL (B2): Use academic vocabulary, collocations. Explanations can mix English and Vietnamese.'
        break
      case 'nang_cao':
        difficultyInstruction = '\nDIFFICULTY LEVEL (C1-C2): Use advanced vocabulary, idioms, complex passive and inverted structures. Explanations MUST be 100% in Native English.'
        break
      default:
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Write simple compound sentences.'
    }

    const systemPrompt = `You are an expert English teacher.
The user wants to practice reading comprehension based on a specific set of vocabulary words.
Words to include: ${words.join(', ')}

Please write a short, engaging article (150-250 words) that naturally includes all of these words.
Then, create 3 multiple choice reading comprehension questions based on the article.
${difficultyInstruction}

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
