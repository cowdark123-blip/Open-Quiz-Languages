'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, RotateCcw, AlertCircle, X, Volume2, ArrowUp } from 'lucide-react'
import { playTTS } from '@/lib/tts'
import { motion, AnimatePresence } from 'framer-motion'

interface SyllableBreakdown {
  syllable: string
  ipa: string
  status: 'correct' | 'incorrect' | 'warning'
  isStressed: boolean
  feedback: string
}

interface EvaluationResult {
  targetWord: string
  ipaStandard: string
  overallAccuracy: number
  syllableBreakdown: SyllableBreakdown[]
  phoneticAdvice: string
}

interface AIPronunciationTrainerProps {
  targetWord: string
  targetSentence?: string
}

export function AIPronunciationTrainer({ targetWord, targetSentence }: AIPronunciationTrainerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recordTime, setRecordTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let currentTranscript = ''
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' '
          }
          setTranscript(currentTranscript.trim())
        }

        recognition.onerror = (err: any) => {
          console.warn('Speech Recognition warning:', err)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  const startRecording = async () => {
    setResult(null)
    setErrorMsg('')
    setTranscript('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsModalOpen(true)
      setRecordTime(0)

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {
          // Ignore
        }
      }
    } catch {
      setErrorMsg('Không thể kết nối Micro. Vui lòng cấp quyền sử dụng micro trên trình duyệt!')
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && isModalOpen) {
      interval = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 30) {
            handleSubmitModal()
            return 30
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isModalOpen])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const stopRecordingAndEvaluate = async () => {
    if (mediaRecorderRef.current && isRecording) {
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => resolve()
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
        } else {
          resolve()
        }
      })
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore
      }
    }

    setIsRecording(false)

    let audioData = ''
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      audioData = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(audioBlob)
      })
    }

    const finalTranscript = transcript.trim()
    if (!finalTranscript && !audioData) {
      setErrorMsg('Vui lòng cấp quyền micro và thử nói lại. Chưa nhận diện được giọng nói!')
      return
    }

    setTranscript(finalTranscript)
    setEvaluating(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/ai/speaking-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord,
          targetSentence,
          userTranscript: finalTranscript,
          audioData,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setResult(data.data)
      } else {
        setErrorMsg(data.error || 'Lỗi phân tích phát âm Groq AI')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ Groq AI')
    } finally {
      setEvaluating(false)
    }
  }

  const handleRetry = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore
      }
    }

    setIsRecording(false)
    setResult(null)
    setTranscript('')
    setErrorMsg('')
    audioChunksRef.current = []
  }

  const handleCancelModal = () => {
    setIsModalOpen(false)
    handleRetry()
  }

  const handleSubmitModal = () => {
    setIsModalOpen(false)
    stopRecordingAndEvaluate()
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-left space-y-4 shadow-xl select-none" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-white">Luyện Phát Âm AI (Groq Llama 3.3)</span>
        </div>
        {result && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Thử lại 🔄</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* State 1 & 2: Record / Stop controls */}
      {!result && !evaluating && (
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <button
            type="button"
            onClick={startRecording}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 w-full justify-center"
          >
            <Mic className="w-4 h-4 text-white" />
            <span>Nói từ "{targetWord}" ngay 🎙️</span>
          </button>
        </div>
      )}

      {/* State 3: Processing */}
      {evaluating && (
        <div className="py-4 text-center space-y-2 text-purple-300">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold">AI đang chấm điểm ngữ điệu & độ chính xác...</p>
        </div>
      )}

      {/* State 4: Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div>
              <div className="text-xl font-black text-purple-300">{result.overallAccuracy}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Độ chính xác (Accuracy)</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">{result.targetWord}</div>
              <div className="text-xs font-mono text-purple-300">{result.ipaStandard}</div>
            </div>
          </div>

          <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
            💬 <strong>Lời khuyên AI:</strong> {result.phoneticAdvice}
          </p>

          {/* Color-coded Syllable Analysis */}
          {result.syllableBreakdown && result.syllableBreakdown.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {result.syllableBreakdown.map((s, idx) => {
                let badge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                if (s.status === 'warning') badge = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                if (s.status === 'incorrect') badge = 'bg-red-500/20 text-red-300 border-red-500/30'

                return (
                  <div key={idx} className="flex items-center gap-1.5 group relative">
                    {idx > 0 && <span className="text-slate-600 font-bold">-</span>}
                    <div className="relative">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border cursor-help transition-all flex items-center justify-center ${badge}`}
                      >
                        {s.isStressed ? <span className="uppercase">{s.syllable}'</span> : s.syllable}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-slate-900 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none text-center">
                        <div className="text-xs font-mono text-purple-300 mb-1">IPA: {s.ipa}</div>
                        <div className="text-[10px] text-slate-300 leading-snug">{s.feedback}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Recording Modal matching UI spec */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020817]/80 backdrop-blur-sm" onClick={handleCancelModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-[400px] bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={handleCancelModal} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 z-10">
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-5 space-y-4 mt-2">
                {/* Block 1: Target Text */}
                <div className="bg-[#1e293b] rounded-xl p-5 flex flex-col justify-center relative">
                  <div className="flex justify-between items-start w-full mb-3">
                    <span className="text-sm text-slate-300 font-medium">Đọc văn bản này:</span>
                    <button onClick={() => playTTS(targetWord)} className="text-slate-400 hover:text-white p-1">
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-[28px] font-black text-white leading-tight">
                    {targetWord}
                  </div>
                </div>

                {/* Block 2: Recording Area */}
                <div className="bg-[#1e293b] rounded-xl p-5 space-y-6">
                  {/* Waveform Visualization */}
                  <div className="h-6 flex items-center gap-[3px] justify-center overflow-hidden w-full px-2">
                    {[...Array(40)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: isRecording ? [4, Math.random() * 20 + 4, 4] : 4,
                          opacity: isRecording ? [0.4, 1, 0.4] : 0.4
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: Math.random() * 0.5 + 0.5,
                          delay: i * 0.05
                        }}
                        className="w-1 bg-blue-500 rounded-full"
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm font-medium text-slate-400">
                    <span>Tối đa 0:30</span>
                    <span className={recordTime >= 25 ? 'text-red-400' : 'text-slate-300'}>{formatTime(recordTime)}</span>
                  </div>
                </div>

                {/* Block 3: Buttons */}
                <div className="flex items-center gap-4 pt-2">
                  <button onClick={handleCancelModal} className="flex-1 py-3.5 rounded-xl bg-transparent border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 hover:text-white transition-colors">
                    Hủy
                  </button>
                  <button onClick={handleSubmitModal} className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <ArrowUp className="w-5 h-5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
