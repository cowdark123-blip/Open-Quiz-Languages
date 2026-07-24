import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function callGemini(prompt: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(text)
}

export async function POST(req: Request) {
  try {
    const { action, text, topic, targetBand, words } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
    }

    let difficultyInstruction = ''
    switch (targetBand) {
      case 'mat_goc':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A0-A1): Explain grammar concepts using very basic terms. Explanations MUST be 80-100% in Vietnamese, highly detailed and friendly. Sentences must be extremely short.'
        break
      case 'co_ban':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Explain grammar concepts using 50% English and 50% Vietnamese. Sentences should be basic compound sentences.'
        break
      case 'trung_cap':
        difficultyInstruction = '\nDIFFICULTY LEVEL (B2): Explain grammar mostly in English with Vietnamese only for complex terms. Focus on B2 grammar rules (conditionals, relative clauses).'
        break
      case 'nang_cao':
        difficultyInstruction = '\nDIFFICULTY LEVEL (C1-C2): Explain grammar 100% in Native English without Vietnamese. Focus on idioms, inversions, and advanced collocations.'
        break
      default:
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Use common vocabulary and simple explanations.'
    }

    let prompt = ''

    if (action === 'check') {
      if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })
      prompt = `You are a strict English grammar checker.
Analyze the following text: "${text}"

Output your response in strict JSON format.

If there are NO errors, respond exactly with this JSON:
{
  "hasError": false,
  "correctedText": null,
  "explanation": "Câu của bạn đã chính xác!"
}

If there ARE errors, fix them and respond exactly with this JSON:
{
  "hasError": true,
  "correctedText": "The fully corrected English text",
  "explanation": "Detailed explanation in Vietnamese of what was wrong and why you fixed it"
}
${difficultyInstruction}`
    } else if (action === 'practice') {
      if (!topic) return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
      const wordsInstruction = words && words.length > 0 ? `Try to naturally include some of these vocabulary words if possible: ${words.join(', ')}.` : ''
      prompt = `You are an English teacher generating practice exercises.
Create 5 multiple-choice questions focusing on the grammar topic: "${topic}".
The questions can be fill-in-the-blank or find-the-error.
${wordsInstruction}

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
}
${difficultyInstruction}`
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const parsed = await callGemini(prompt)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error in /api/ai/grammar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
