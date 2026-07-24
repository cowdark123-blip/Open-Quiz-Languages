'use client'

import React, { useState, useEffect, useRef } from 'react'
import { fetchUserVocabSets, fetchVocabItems, getCurrentUserProfile, loadActiveSession, saveActiveSession, deleteActiveSession } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { Mic, Loader2, Play, Square, Sparkles, MessageCircle, AlertCircle, RotateCcw } from 'lucide-react'
import NavigationGuard from '@/components/NavigationGuard'
import MultiSetSelector from '@/components/MultiSetSelector'
import WordSelector from '@/components/WordSelector'
import InteractiveText from '@/components/InteractiveText'
import { fetchVocabItemsBySets } from '@/lib/supabase/data-service'
import { useVocab } from '@/contexts/VocabContext'

export default function SpeakingPage() {
  const { vocabSets: sets, isLoading: contextLoading } = useVocab()
  const [selectedSets, setSelectedSets] = useState<string[]>([])
  const [fetchedItems, setFetchedItems] = useState<VocabItem[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [targetBand, setTargetBand] = useState('co_ban')

  const [scenario, setScenario] = useState<{title: string, description: string, expectedWords: string[]} | null>(null)
  const [pendingSession, setPendingSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const isSavedRef = useRef(false)
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalScore, setFinalScore] = useState<any>(null)
  const [evaluating, setEvaluating] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (sets.length > 0 && selectedSets.length === 0) {
      setSelectedSets([sets[0].id])
    }
    const loadProfile = async () => {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) setTargetBand(profile.target_band)
    }
    loadProfile()
  }, [sets, selectedSets])

  useEffect(() => {
    const loadSession = async () => {
      if (selectedSets.length === 0) return
      setIsLoadingSession(true)
      const resourceId = selectedSets.slice().sort().join(',')
      const sessionData = await loadActiveSession('speaking', resourceId)
      if (sessionData && sessionData.scenario) {
        setPendingSession(sessionData)
      } else {
        setPendingSession(null)
      }

      const fetched = await fetchVocabItemsBySets(selectedSets)
      setFetchedItems(fetched)
      if (fetched.length > 0) setSelectedWords(fetched.map(i => i.id))
      setIsLoadingSession(false)
    }
    loadSession()
  }, [selectedSets])

  const handleGenerateScenario = async () => {
    const targetItems = fetchedItems.filter(i => selectedWords.includes(i.id))
    if (targetItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một từ vựng.')
      return
    }
    setLoading(true)
    setErrorMsg('')
    setScenario(null)
    setFinalScore(null)
    setTranscript('')

    try {
      const words = targetItems.map(i => i.term).slice(0, 10)
      const res = await fetch('/api/ai/speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', words, targetBand })
      })
      const data = await res.json()
      if (data.scenario) {
        setScenario(data.scenario)
        const resourceId = selectedSets.slice().sort().join(',')
        await saveActiveSession('speaking', resourceId, {
          scenario: data.scenario
        })
      } else {
        setErrorMsg('Lỗi khi tạo tình huống.')
      }
    } catch (e) {
      setErrorMsg('Có lỗi xảy ra kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        } 
      })
      mediaStreamRef.current = stream

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextCtor()
      audioContextRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      drawWaveform()
      setIsRecording(true)
      setHasRecorded(true)
      setTranscript('')

      // Use MediaRecorder instead of SpeechRecognition for better compatibility
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const audioData = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve((reader.result as string).split(',')[1])
            reader.readAsDataURL(audioBlob)
          })
          
          setTranscript('Đang xử lý giọng nói...')
          try {
            const res = await fetch('/api/ai/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioData })
            })
            const data = await res.json()
            if (res.ok && data.success && data.text) {
              setTranscript(data.text)
            } else {
              setTranscript('')
              alert('Không thể nhận diện giọng nói, vui lòng thử lại.')
            }
          } catch (err) {
            setTranscript('')
            alert('Lỗi kết nối khi nhận diện giọng nói.')
          }
        }
      }

      mediaRecorder.start()
    } catch (e) {
      console.error(e)
      alert('Không thể truy cập Micro.')
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = 'rgb(15, 23, 42)' // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.lineWidth = 3
      ctx.strokeStyle = '#0ea5e9' // sky-500
      ctx.beginPath()

      const sliceWidth = canvas.width * 1.0 / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * canvas.height / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }

      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    draw()
  }

  const evaluateSpeaking = async () => {
    if (!transcript) return
    setEvaluating(true)
    try {
      const res = await fetch('/api/ai/speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'evaluate', 
          transcript, 
          expectedWords: scenario?.expectedWords 
        })
      })
      const data = await res.json()
      if (data.score) {
        setFinalScore(data.score)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEvaluating(false)
    }
  }

  const handleSaveAndExit = async () => {
    isSavedRef.current = true
    if (scenario) {
      const resourceId = selectedSets.slice().sort().join(',')
      await saveActiveSession('speaking', resourceId, { scenario })
    }
    window.history.go(-2)
  }

  const handleDiscardAndExit = async () => {
    isSavedRef.current = true
    const resourceId = selectedSets.slice().sort().join(',')
    await deleteActiveSession('speaking', resourceId)
    window.history.go(-2)
  }

  useEffect(() => {
    return () => {
      if (!isSavedRef.current && scenario) {
        const resourceId = selectedSets.slice().sort().join(',')
        deleteActiveSession('speaking', resourceId)
      }
    }
  }, [scenario, selectedSets])

  if (contextLoading || isLoadingSession) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-slate-400 text-sm">Đang kiểm tra tiến trình đã lưu...</p>
      </div>
    )
  }

  return (
    <NavigationGuard 
      isDirty={!!scenario}
      onSaveAndExit={handleSaveAndExit}
      onDiscardAndExit={handleDiscardAndExit}
    >
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-sky-400" />
            Luyện Nói AI (Speaking)
          </h2>
          <p className="text-xs text-slate-400">Tạo tình huống và chấm điểm phát âm</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {!pendingSession && !scenario && (
        <details className="glass-panel p-6 rounded-3xl border border-slate-800 group" open>
          <summary className="font-bold text-white text-lg border-b border-slate-800 pb-2 cursor-pointer list-none flex items-center justify-between">
            <span>Cấu hình bài nói</span>
            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          
          <div className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <MultiSetSelector 
                  sets={sets}
                  selectedIds={selectedSets}
                  onChange={setSelectedSets}
                />
              </div>
              <div>
                <WordSelector 
                  items={fetchedItems}
                  selectedIds={selectedWords}
                  onChange={setSelectedWords}
                />
              </div>
            </div>
            
            <button
              onClick={handleGenerateScenario}
              disabled={loading || selectedWords.length === 0}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Tạo tình huống AI 🎭
            </button>
          </div>
        </details>
      )}

      {pendingSession && (
        <div className="glass-panel p-8 rounded-3xl border border-sky-500/30 text-center space-y-4 animate-in fade-in">
          <h3 className="text-xl font-bold text-white">Phát hiện tình huống đang luyện dở</h3>
          <p className="text-sm text-slate-400">Bạn có muốn tiếp tục luyện nói tình huống này hay tạo mới?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setScenario(pendingSession.scenario)
                setPendingSession(null)
              }}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              Tiếp Tục Luyện
            </button>
            <button
              onClick={async () => {
                setPendingSession(null)
                const resourceId = selectedSets.slice().sort().join(',')
                await deleteActiveSession('speaking', resourceId)
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Tạo Tình Huống Mới
            </button>
          </div>
        </div>
      )}

      {scenario && (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-8 animate-in fade-in">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">{scenario.title}</h3>
            <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <InteractiveText text={scenario.description} />
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-400 py-1">Từ vựng cần dùng:</span>
              {scenario.expectedWords.map((w, i) => (
                <span key={i} className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-sm border border-sky-500/30">
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-center">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={100} 
              className="w-full max-w-lg mx-auto bg-slate-900 rounded-xl border border-slate-700"
            />
            
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Mic className="w-5 h-5" /> Bắt đầu thu âm
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Square className="w-5 h-5" /> Dừng thu âm
                </button>
              )}
            </div>
          </div>

          {(hasRecorded) && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 min-h-24">
                <p className="text-slate-300">
                  <span className="font-semibold text-sky-400">Bạn vừa nói: </span>
                  {transcript === 'Đang xử lý giọng nói...' ? (
                    <span className="text-slate-400 flex items-center gap-2 inline-flex">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý giọng nói...
                    </span>
                  ) : (
                    transcript || (isRecording ? 'Đang nghe...' : 'Không nhận diện được giọng nói.')
                  )}
                </p>
              </div>

              {!isRecording && transcript && transcript !== 'Đang xử lý giọng nói...' && !finalScore && (
                <button
                  onClick={evaluateSpeaking}
                  disabled={evaluating}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex justify-center items-center gap-2"
                >
                  {evaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Chấm điểm'}
                </button>
              )}
              
              {!isRecording && (!transcript || transcript === 'Đang xử lý giọng nói...') && !finalScore && (
                <div className="text-center text-sm text-slate-400 py-2">
                  Vui lòng thử thu âm lại hoặc nói rõ hơn.
                </div>
              )}

              {finalScore && (
                <div className="p-6 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl space-y-4 animate-in fade-in">
                  <h4 className="text-xl font-bold text-emerald-400">Đánh giá của AI</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                      <div className="text-slate-400 text-sm">Lưu loát</div>
                      <div className="text-3xl font-bold text-white">{finalScore.fluency}/10</div>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                      <div className="text-slate-400 text-sm">Phát âm & Chính xác</div>
                      <div className="text-3xl font-bold text-white">{finalScore.accuracy}/10</div>
                    </div>
                  </div>
                  <p className="text-slate-300 mt-4 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <InteractiveText text={finalScore.feedback} />
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button
                      onClick={() => {
                        setFinalScore(null)
                        setTranscript('')
                        setHasRecorded(false)
                      }}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                      <RotateCcw className="w-5 h-5" /> Thử Lại
                    </button>
                    <button
                      onClick={async () => {
                        setScenario(null)
                        const resourceId = selectedSets.slice().sort().join(',')
                        await deleteActiveSession('speaking', resourceId)
                      }}
                      className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20"
                    >
                      Đi tiếp (Tình huống mới)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </NavigationGuard>
  )
}
