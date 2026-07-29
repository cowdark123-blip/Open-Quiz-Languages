export const playTTS = (text: string, rate = 0.9, lang = 'en'): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    try {
      // Attempt to use Google Translate TTS via proxy
      const url = `/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`
      const audio = new Audio(url)
      audio.playbackRate = rate
      audio.onended = () => resolve()
      audio.onerror = (err) => {
        console.warn('Google TTS failed, falling back to local speech synthesis', err)
        fallbackTTS(text, rate, lang, resolve)
      }
      audio.play().catch((err) => {
        console.warn('Google TTS play failed', err)
        fallbackTTS(text, rate, lang, resolve)
      })
    } catch (error) {
      fallbackTTS(text, rate, lang, resolve)
    }
  })
}

function fallbackTTS(text: string, rate: number, lang: string, resolve: () => void) {
  if (!('speechSynthesis' in window)) return resolve()
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

  utterance.onend = () => resolve()
  utterance.onerror = () => resolve()

  window.speechSynthesis.speak(utterance)
}
