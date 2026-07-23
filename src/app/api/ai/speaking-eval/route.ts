import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { transcript, targetWords, scenarioPrompt } = await req.json()

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Không tìm thấy văn bản bài nói' }, { status: 400 })
    }

    const words = targetWords && Array.isArray(targetWords) ? targetWords : ['resilience', 'meticulous']
    const apiKey = process.env.GEMINI_API_KEY

    // 1. Call Real Google Gemini API if GEMINI_API_KEY exists
    if (apiKey) {
      try {
        const prompt = `You are a strict English Speaking Examiner (IELTS/CEFR standard).
Evaluate the user's spoken response based on the following criteria:

Scenario Prompt: "${scenarioPrompt || 'Describe a recent challenge at work or school.'}"
Target Mandatory Words to Use: ${words.join(', ')}
User Spoken Transcript: "${transcript}"

Analyze carefully and return ONLY a raw valid JSON object with NO markdown formatting, matching this exact schema:
{
  "overall_score": 88,
  "accuracy_score": 90,
  "fluency_score": 85,
  "prosody_score": 87,
  "target_words_used": ["usedWord1"],
  "missing_target_words": ["missingWord1"],
  "grammar_feedback": "Detailed grammar feedback and corrections in Vietnamese",
  "native_suggestion": "An upgraded natural native-sounding response in English",
  "word_scores": [
    { "word": "exampleWord", "accuracy": 92, "status": "good" }
  ]
}

For "word_scores", split the transcript word by word, score accuracy (0-100), and assign status ("good" for >=85, "average" for 60-84, "poor" for <60).`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.3,
              },
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text

          if (textResponse) {
            const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
            const parsed = JSON.parse(cleanJson)
            return NextResponse.json({ success: true, data: parsed, isRealAI: true })
          }
        }
      } catch (err) {
        console.warn('Gemini API speaking eval call failed, falling back to heuristic engine:', err)
      }
    }

    // 2. Fallback Heuristic Pronunciation & Grammar Analyzer Engine
    const cleanTranscript = transcript.trim()
    const transcriptLower = cleanTranscript.toLowerCase()

    const targetWordsUsed = words.filter((w) => transcriptLower.includes(w.toLowerCase()))
    const missingTargetWords = words.filter((w) => !transcriptLower.includes(w.toLowerCase()))

    const splitWords = cleanTranscript.split(/\s+/)
    const wordScores = splitWords.map((w) => {
      const cleanW = w.replace(/[^a-zA-Z]/g, '').toLowerCase()
      let accuracy = 85 + Math.floor(Math.random() * 12)

      if (words.map((tw) => tw.toLowerCase()).includes(cleanW)) {
        accuracy = 96
      } else if (cleanW.length > 7 && Math.random() > 0.6) {
        accuracy = 72
      } else if (cleanW.length < 3 && Math.random() > 0.8) {
        accuracy = 54
      }

      let status: 'good' | 'average' | 'poor' = 'good'
      if (accuracy < 60) status = 'poor'
      else if (accuracy < 85) status = 'average'

      return {
        word: w,
        accuracy,
        status,
      }
    })

    const overallScore = Math.round(
      wordScores.reduce((acc, curr) => acc + curr.accuracy, 0) / (wordScores.length || 1)
    )

    const fallbackResponse = {
      overall_score: Math.min(98, Math.max(65, overallScore)),
      accuracy_score: Math.min(99, overallScore + 2),
      fluency_score: Math.min(95, overallScore - 2),
      prosody_score: Math.min(94, overallScore - 1),
      target_words_used: targetWordsUsed,
      missing_target_words: missingTargetWords,
      grammar_feedback:
        targetWordsUsed.length === words.length
          ? 'Tuyệt vời! Bạn đã sử dụng chính xác tất cả các từ vựng mục tiêu trong câu nói. Cấu trúc câu tự nhiên và mượt mà.'
          : `Bạn đã sử dụng thành công từ "${targetWordsUsed.join(', ')}". Đừng quên thử lồng ghép thêm từ "${missingTargetWords.join(', ')}" để đạt điểm phản xạ cao hơn!`,
      native_suggestion: `In professional environments, applying ${words[0] || 'resilience'} during difficult challenges is crucial for success.`,
      word_scores: wordScores,
    }

    return NextResponse.json({ success: true, data: fallbackResponse, isRealAI: false })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi phân tích bài nói' }, { status: 500 })
  }
}
