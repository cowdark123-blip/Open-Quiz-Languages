import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { scenario, messages, targetBand, words } = await req.json()

    if (!scenario || !messages) {
      return NextResponse.json({ error: 'Missing scenario or messages' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
    }

    let difficultyInstruction = ''
    switch (targetBand) {
      case 'mat_goc':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A0-A1): Use ultra-basic vocabulary (A1 level). Keep sentences very short and simple. Explain corrections and suggestions 80% in extremely friendly Vietnamese.'
        break
      case 'co_ban':
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Use common vocabulary and simple compound sentences. Explain corrections 50% in English, 50% in Vietnamese.'
        break
      case 'trung_cap':
        difficultyInstruction = '\nDIFFICULTY LEVEL (B2): Use academic vocabulary, collocations, and phrasal verbs. Use complex sentence structures. Explain corrections primarily in English.'
        break
      case 'nang_cao':
        difficultyInstruction = '\nDIFFICULTY LEVEL (C1-C2): Use advanced vocabulary, idioms, and academic jargon. Use complex passive and inverted structures. Respond and explain 100% in Native English, do not use Vietnamese.'
        break
      default:
        difficultyInstruction = '\nDIFFICULTY LEVEL (A2-B1): Use common vocabulary and simple compound sentences.'
    }

    const wordsInstruction = words && words.length > 0 ? `\nTry to naturally include some of these vocabulary words in your replies if possible: ${words.join(', ')}.` : ''

    const systemPrompt = `You are an AI English tutor playing a roleplay game.
Scenario: ${scenario}

Your job is to respond naturally to the user's messages as the other person in the scenario.
Keep your responses relatively short, conversational, and natural. Do not break character in the "reply" field.
If this is the start of the conversation (no previous messages), you MUST initiate the conversation and ask the first question.
Additionally, as an English tutor, you must analyze the user's LAST message.
If they made grammatical errors, provide a brief correction in Vietnamese.
If their sentence is grammatically correct but could sound more native/natural, provide a suggestion.
If there are no previous user messages, set grammarFix and nativeSuggestion to null.
${difficultyInstruction}
${wordsInstruction}

You MUST respond in strict JSON format:
{
  "reply": "Your natural response in character (English)",
  "grammarFix": "Your correction in Vietnamese (or null if no major errors)",
  "nativeSuggestion": "A more natural way to say it in English (or null if already perfect)"
}`

    // Combine system + history into a single prompt for Gemini
    const historyText = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
    const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nRespond now:`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(fullPrompt)
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error in /api/ai/chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
