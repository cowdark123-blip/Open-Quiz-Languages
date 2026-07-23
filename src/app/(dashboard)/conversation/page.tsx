'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Send, Bot, User, Loader2, Sparkles, Volume2 } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/supabase/data-service'

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
  const [targetBand, setTargetBand] = useState('co_ban')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

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

  const initSpeechRecognition = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          setIsRecording(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsRecording(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }
  }

  useEffect(() => {
    initSpeechRecognition()
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      setInput('')
      recognitionRef.current?.start()
      setIsRecording(true)
    }
  }

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMsg: Message = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

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
        
        // Add AI response
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: data.reply,
            grammarFix: data.grammarFix,
            nativeSuggestion: data.nativeSuggestion
          }
        ])

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
                <p className="text-sm">{msg.content}</p>
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
          className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Mic className="w-5 h-5" />
        </button>
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
          onClick={sendMessage}
          disabled={!input.trim() || loading || isRecording}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  )
}
