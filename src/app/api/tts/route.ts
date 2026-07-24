import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const text = searchParams.get('text')
    const lang = searchParams.get('lang') || 'en'

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    })

    if (!response.ok) {
      throw new Error(`Google TTS responded with status: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error: any) {
    console.error('TTS API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch TTS' },
      { status: 500 }
    )
  }
}
