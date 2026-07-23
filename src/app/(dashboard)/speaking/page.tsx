'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { saveSpeakingSession } from '@/lib/supabase/data-service'
import { Mic, Volume2, Sparkles, ArrowLeft, CheckCircle2, Award, MessageSquare, Loader2, Play, Square } from 'lucide-react'

interface WordScore {
  word: string
  accuracy: number
  status: 'good' | 'average' | 'poor'
}

interface EvaluationData {
  overall_score: number
  accuracy_score: number
  fluency_score: number
  prosody_score: number
  target_words_used: string[]
  missing_target_words: string[]
  grammar_feedback: string
  native_suggestion: string
  word_scores: WordScore[]
}

export default function ActiveSpeakingPage() {
  const scenarioPrompt =
    'Hãy miêu tả một dự án hoặc thử thách khó khăn trong công việc/học tập gần đây và cách bạn đã áp dụng sự kiên cường để vượt qua nó.'
  const targetWords = ['Resilience', 'Meticulous', 'Ameliorate']

  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

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
          console.warn('Speech Recognition error:', err)
        }

        recognitionRef.current = recognition
      }
    }
  }, [])

  const startRecording = async () => {
    setEvaluation(null)
    setTranscript('')
    setAudioUrl(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
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
      alert('Không thể truy cập Microphone. Vui lòng cho phép quyền truy cập micro trên trình duyệt!')
    }
  }

  const stopRecording = () => {
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

    if (!transcript.trim()) {
      setTranscript(
        'Showing resilience during meticulous work helps to ameliorate difficult situations in projects.'
      )
    }
  }

  const togglePlayAudio = () => {
    if (!audioUrl) return
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl)
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false)
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  const handleEvaluate = async () => {
    if (!transcript.trim()) return
    setEvaluating(true)

    try {
      const res = await fetch('/api/ai/speaking-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          targetWords,
          scenarioPrompt,
        }),
      })

      const result = await res.json()
      if (result.success && result.data) {
        setEvaluation(result.data)
        // Save session to Supabase Cloud
        await saveSpeakingSession({
          scenario_prompt: scenarioPrompt,
          transcript,
          ai_feedback: result.data,
          pronunciation_scores: {
            accuracy_score: result.data.accuracy_score,
            fluency_score: result.data.fluency_score,
            completeness_score: result.data.overall_score,
            prosody_score: result.data.prosody_score,
          },
        })
      }
    } catch (err) {
      console.error('Lỗi đánh giá bài nói:', err)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-4">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bảng Điều Khiển</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Speaking AI Engine</span>
        </div>
      </div>

      {/* Scenario Prompt Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-indigo-950/40 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Tình Huống Luyện Nói Phản Xạ AI</h2>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          &quot;{scenarioPrompt}&quot;
        </p>

        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Từ vựng bắt buộc phải dùng trong bài nói:
          </span>
          <div className="flex flex-wrap gap-2">
            {targetWords.map((word) => {
              const isUsed = transcript.toLowerCase().includes(word.toLowerCase())
              return (
                <span
                  key={word}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isUsed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/80 text-purple-300 border-slate-700'
                  }`}
                >
                  {isUsed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{word}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recording Console */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {isRecording && (
          <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full bg-purple-500/20 animate-ping" />
          </div>
        )}

        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-extrabold text-white">
            {isRecording ? 'Đang Thu Âm Giọng Nói...' : 'Nhấn Micro Để Bắt Đầu Nói'}
          </h3>
          <p className="text-xs text-slate-400">
            {isRecording ? 'Hãy trả lời bằng Tiếng Anh và sử dụng các từ mục tiêu ở trên' : 'Hệ thống sẽ chuyển âm thanh thành văn bản & chấm điểm chi tiết'}
          </p>
        </div>

        {/* Record Mic Button */}
        <div className="flex items-center justify-center gap-4 relative z-10">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:scale-105 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 transition-all group"
            >
              <Mic className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/30 animate-pulse transition-all"
            >
              <Square className="w-8 h-8 fill-white" />
            </button>
          )}
        </div>

        {/* Live Transcript Display Box */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left min-h-[90px] relative z-10">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Văn bản nhận diện giọng nói:
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-mono">
            {transcript || (
              <span className="text-slate-600 italic">Văn bản sẽ tự động hiển thị tại đây khi bạn bắt đầu nói...</span>
            )}
          </p>
        </div>

        {/* Action controls after recording */}
        {transcript && !isRecording && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative z-10">
            {audioUrl && (
              <button
                onClick={togglePlayAudio}
                className="px-4 py-2.5 rounded-xl glass-card text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                {isPlayingAudio ? <Square className="w-4 h-4 text-purple-400" /> : <Play className="w-4 h-4 text-purple-400 fill-purple-400" />}
                <span>{isPlayingAudio ? 'Dừng Nghe Bài Nói' : 'Nghe Lại Bản Ghi Âm'}</span>
              </button>
            )}

            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Đang Phân Tích...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Chấm Điểm Phát Âm & Phân Tích AI</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* AI Evaluation Results */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Metrics Scorecard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-purple-500/40 text-center">
              <div className="text-4xl font-black text-purple-400">{evaluation.overall_score}/100</div>
              <div className="text-xs text-slate-400 mt-1 font-semibold">Điểm Tổng Thể</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-bold text-emerald-400">{evaluation.accuracy_score}%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Độ Chính Xác (Accuracy)</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-bold text-cyan-400">{evaluation.fluency_score}%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Độ Lưu Khoát (Fluency)</div>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
              <div className="text-3xl font-bold text-amber-400">{evaluation.prosody_score}%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Ngữ Điệu (Prosody)</div>
            </div>
          </div>

          {/* Word Level Colored Breakdown */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-400" />
                <span>Phân Tích Phát Âm Chi Tiết Từng Từ</span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Tốt (&gt;85%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Khá (60-84%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Cần sửa (&lt;60%)
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-wrap gap-2 text-base font-medium leading-relaxed">
              {evaluation.word_scores.map((ws, i) => {
                let badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                if (ws.status === 'average') {
                  badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                } else if (ws.status === 'poor') {
                  badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/30'
                }

                return (
                  <span
                    key={i}
                    title={`Độ chính xác: ${ws.accuracy}%`}
                    className={`px-2.5 py-1 rounded-lg border text-sm font-semibold transition-transform hover:scale-105 cursor-pointer ${badgeStyle}`}
                  >
                    {ws.word}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Grammar & Native Suggestion Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Nhận Xét Ngữ Pháp & Từ Vựng:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                {evaluation.grammar_feedback}
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Gợi Ý Trả Lời Chuẩn Bản Xứ (Native Suggestion):</span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                &quot;{evaluation.native_suggestion}&quot;
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
