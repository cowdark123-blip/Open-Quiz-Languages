export const playTTS = (text: string, rate = 0.9, lang = 'en') => {
  if (typeof window === 'undefined') return

  try {
    // Attempt to use Google Translate TTS
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`
    const audio = new Audio(url)
    audio.playbackRate = rate
    audio.play().catch((err) => {
      console.warn('Google TTS failed, falling back to local speech synthesis', err)
      fallbackTTS(text, rate, lang)
    })
  } catch (error) {
    fallbackTTS(text, rate, lang)
  }
}

function fallbackTTS(text: string, rate: number, lang: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'en' ? 'en-US' : lang
  utterance.rate = rate
  utterance.pitch = 1.0
  utterance.volume = 1.0

  const voices = window.speechSynthesis.getVoices()
  const naturalVoices = voices.filter(v => 
    v.lang.startsWith(lang) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  )

  if (naturalVoices.length > 0) {
    utterance.voice = naturalVoices[0]
  } else {
    const matchingVoices = voices.filter(v => v.lang.startsWith(lang))
    if (matchingVoices.length > 0) utterance.voice = matchingVoices[0]
  }

  window.speechSynthesis.speak(utterance)
}
