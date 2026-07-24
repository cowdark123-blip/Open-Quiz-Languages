import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { audioData } = body

    if (!audioData) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu âm thanh' }, { status: 400 })
    }

    const binaryData = Buffer.from(audioData, 'base64')
    const file = new File([binaryData], 'audio.webm', { type: 'audio/webm' })

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'en',
    })

    return NextResponse.json({
      success: true,
      text: transcription.text,
    })
  } catch (error: any) {
    console.error('STT API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi gọi STT API' },
      { status: 500 }
    )
  }
}
