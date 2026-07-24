export const playTTS = (text: string, rate = 0.88, lang = 'en-US') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = 1.0
  utterance.volume = 1.0

  const voices = window.speechSynthesis.getVoices()
  
  const naturalVoices = voices.filter(v => 
    v.lang.startsWith('en') && (
      v.name.includes('Natural') || 
      v.name.includes('Online') || 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel')
    )
  )

  if (naturalVoices.length > 0) {
    utterance.voice = naturalVoices[0]
  } else {
    const enVoices = voices.filter(v => v.lang.startsWith('en'))
    if (enVoices.length > 0) {
      utterance.voice = enVoices[0]
    }
  }

  window.speechSynthesis.speak(utterance)
}
