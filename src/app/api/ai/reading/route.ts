import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { words, targetBand, questionCount = 5, articleLength = 'medium' } = await req.json()

    if (!words || words.length === 0) {
      return NextResponse.json({ error: 'Missing words' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
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

    let lengthInstruction = '150-250 words'
    if (articleLength === 'short') lengthInstruction = '100-150 words'
    else if (articleLength === 'long') lengthInstruction = '350-400 words'

    const prompt = `You are an expert English teacher.
The user wants to practice reading comprehension based on a specific set of vocabulary words.
Words to include: ${words.join(', ')}

Please write a short, engaging article (${lengthInstruction}) that naturally includes all of these words.
Then, create ${questionCount} multiple choice reading comprehension questions based on the article.
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error in /api/ai/reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
