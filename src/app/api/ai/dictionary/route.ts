import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { word, contextSentence } = await req.json()

    if (!word) {
      return NextResponse.json({ success: false, error: 'Word is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    })

    const prompt = `
      You are an expert English-Vietnamese dictionary assistant.
      The user wants to look up the word: "${word}".
      The sentence context is: "${contextSentence || 'N/A'}"

      Please provide the dictionary information for this word, considering its context if provided.
      Return the result as a strict JSON object with these exact keys:
      {
        "term": "the base form of the word (e.g., if input is 'running', return 'run')",
        "ipa": "IPA pronunciation of the term",
        "definition": "English definition of the term, appropriate for the context",
        "vietnameseTranslation": "Vietnamese translation, appropriate for the context",
        "exampleSentence": "A good example sentence using the term, or return the provided context sentence if it is good."
      }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the JSON output from Gemini
    try {
      const data = JSON.parse(text)
      return NextResponse.json({ success: true, data })
    } catch (parseError) {
      // Fallback if not perfectly JSON
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1)
      const data = JSON.parse(jsonStr)
      return NextResponse.json({ success: true, data })
    }
  } catch (error: any) {
    console.error('Dictionary API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}
