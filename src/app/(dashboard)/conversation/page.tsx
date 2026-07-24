'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Send, Bot, User, Loader2, Sparkles, Volume2, RotateCcw } from 'lucide-react'
import { getCurrentUserProfile, loadConversationHistory, saveConversationHistory, deleteConversationHistory, checkAndUpdateStreak } from '@/lib/supabase/data-service'
import { playTTS } from '@/lib/tts'
import InteractiveText from '@/components/InteractiveText'

type Message = {
  role: 'user' | 'assistant'
  content: string
  grammarFix?: string | null
  nativeSuggestion?: string | null
}

const SCENARIOS = [
  'Phỏng vấn xin việc',
  'Đặt phòng khách sạn',
  'Gọi món cà phê',
  'Khách du lịch hỏi đường',
  'Mua sắm tại siêu thị',
]

export default function ConversationPage() {
  const [scenario, setScenario] = useState(SCENARIOS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [targetBand, setTargetBand] = useState('co_ban')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function fetchBand() {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) setTargetBand(profile.target_band)
    }
    fetchBand()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    async function loadHistory() {
      const history = await loadConversationHistory(scenario)
      setMessages(history)
    }
    loadHistory()
  }, [scenario])

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      // Start recording
      setInput('')
      setRecordingTime(0)
      audioChunksRef.current = []
      
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
            
            setLoading(true)
            try {
              const res = await fetch('/api/ai/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData })
              })
              const data = await res.json()
              if (res.ok && data.success && data.text) {
                setInput(data.text)
                await sendMessage(data.text)
              }
            } catch (err) {
              console.error('STT Error', err)
            } finally {
              setLoading(false)
            }
          }
        }

        mediaRecorder.start()
        setIsRecording(true)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } catch (err) {
        console.error('Microphone error', err)
        alert('Không thể truy cập Micro. Vui lòng cấp quyền.')
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  const playAudio = (text: string) => {
    playTTS(text)
  }

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = (overrideInput || input).trim()
    if (!textToSend) return

    const newMsg: Message = { role: 'user', content: textToSend }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    
    await saveConversationHistory(scenario, updatedMessages)

    try {
      // Send only recent context to avoid token limits
      const contextMessages = updatedMessages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, messages: contextMessages, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        
        const finalMessages: Message[] = [
          ...updatedMessages, 
          { 
            role: 'assistant', 
            content: data.reply,
            grammarFix: data.grammarFix,
            nativeSuggestion: data.nativeSuggestion
          }
        ]
        setMessages(finalMessages)
        await saveConversationHistory(scenario, finalMessages)

        const userMsgCount = finalMessages.filter(m => m.role === 'user').length
        if (userMsgCount >= 2) {
           await checkAndUpdateStreak()
           if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))
        }

        playAudio(data.reply)
      } else {
        console.error('Failed to get response')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa lịch sử trò chuyện này?')) {
      await deleteConversationHistory(scenario)
      setMessages([])
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Hội Thoại AI (Roleplay)
          </h2>
          <p className="text-xs text-slate-400">Luyện phản xạ giao tiếp & Sửa lỗi ngữ pháp</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value)
              setMessages([])
            }}
          >
            {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={handleReset} 
            className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Bắt đầu cuộc trò chuyện với chủ đề <strong>"{scenario}"</strong></p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'glass-card border-slate-700 text-slate-200 rounded-bl-none'}`}>
                <div className="text-sm">
                  {msg.role === 'assistant' ? <InteractiveText text={msg.content} /> : msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button onClick={() => playAudio(msg.content)} className="mt-2 text-blue-400 hover:text-blue-300">
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* AI Feedback on User's previous message */}
            {msg.role === 'assistant' && (msg.grammarFix || msg.nativeSuggestion) && (
              <div className="mt-2 ml-10 space-y-1 max-w-[75%]">
                {msg.grammarFix && msg.grammarFix !== "null" && (
                  <div className="text-xs bg-red-950/40 border border-red-900/50 text-red-300 px-3 py-1.5 rounded-lg">
                    <strong>Sửa lỗi:</strong> {msg.grammarFix}
                  </div>
                )}
                {msg.nativeSuggestion && msg.nativeSuggestion !== "null" && (
                  <div className="text-xs bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 px-3 py-1.5 rounded-lg flex gap-1 items-start">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                    <span><strong>Gợi ý Native:</strong> {msg.nativeSuggestion}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-blue-400 ml-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">AI đang soạn tin nhắn...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center gap-2">
        <button 
          onClick={toggleRecording}
          className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          {isRecording ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3 bg-white rounded-full animate-pulse"></span>
              <span className="w-1.5 h-5 bg-white rounded-full animate-pulse delay-75"></span>
              <span className="w-1.5 h-3 bg-white rounded-full animate-pulse delay-150"></span>
            </div>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
        {isRecording && (
          <div className="absolute -top-10 left-4 bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            Đang ghi âm... 00:{recordingTime.toString().padStart(2, '0')}
          </div>
        )}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Nhập tin nhắn (tiếng Anh)..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500"
          disabled={loading || isRecording}
        />
        <button 
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading || isRecording}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  )
}
