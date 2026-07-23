'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, RotateCcw, AlertCircle } from 'lucide-react'

interface WordAnalysis {
  word: string
  status: 'good' | 'average' | 'poor'
  note?: string
}

interface EvaluationResult {
  accuracyScore: number
  prosodyScore: number
  overallScore: number
  feedbackText: string
  wordAnalysis: WordAnalysis[]
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-white" />
              <span>Nói từ &quot;{targetWord}&quot; ngay 🎙️</span>
            </button>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/30 animate-ping absolute" />
                <button
                  type="button"
                  onClick={stopRecordingAndEvaluate}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg relative z-10"
                >
                  <Square className="w-5 h-5 fill-white" />
                </button>
              </div>
              <span className="text-[11px] text-purple-300 font-semibold animate-pulse">
                Đang thu âm... Nhấn dừng khi nói xong
              </span>
            </div>
          )}
          {transcript && (
            <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800 max-w-full truncate">
              Văn bản: &quot;{transcript}&quot;
            </p>
          )}
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-xl font-black text-purple-300">{result.accuracyScore}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Chính xác (Accuracy)</div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="text-xl font-black text-cyan-300">{result.prosodyScore}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Ngữ điệu (Prosody)</div>
            </div>
          </div>

          <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
            💬 <strong>Nhận xét AI:</strong> {result.feedbackText}
          </p>

          {/* Color-coded Word Analysis */}
          {result.wordAnalysis && result.wordAnalysis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {result.wordAnalysis.map((w, idx) => {
                let badge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                if (w.status === 'average') badge = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                if (w.status === 'poor') badge = 'bg-red-500/20 text-red-300 border-red-500/30'

                return (
                  <span
                    key={idx}
                    title={w.note || w.word}
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${badge}`}
                  >
                    {w.word}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
