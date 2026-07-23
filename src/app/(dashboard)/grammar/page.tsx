'use client'

import { useState, useEffect } from 'react'
import { PenTool, CheckCircle2, XCircle, Loader2, Play, Sparkles } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/supabase/data-service'

const TOPICS = [
  'Các thì trong tiếng Anh (Tenses)',
  'Mệnh đề quan hệ (Relative Clauses)',
  'Câu điều kiện (Conditionals)',
  'Câu bị động (Passive Voice)',
  'Giới từ (Prepositions)',
  'Câu trực tiếp & Gián tiếp (Reported Speech)'
]

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<'check' | 'practice'>('check')
  
  // Tab 1 State
  const [textToCheck, setTextToCheck] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ hasError: boolean, correctedText: string | null, explanation: string } | null>(null)

  // Tab 2 State
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])
  const [generating, setGenerating] = useState(false)
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [targetBand, setTargetBand] = useState('co_ban')

  useEffect(() => {
    async function fetchBand() {
      const { profile } = await getCurrentUserProfile()
      if (profile?.target_band) setTargetBand(profile.target_band)
    }
    fetchBand()
  }, [])

  const handleCheckGrammar = async () => {
    if (!textToCheck.trim()) return
    setChecking(true)
    setCheckResult(null)

    try {
      const res = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', text: textToCheck, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        setCheckResult(data)
      } else {
        alert('Có lỗi xảy ra khi kiểm tra.')
      }
    } catch (error) {
      console.error(error)
      alert('Lỗi kết nối.')
    } finally {
      setChecking(false)
    }
  }

  const handleGeneratePractice = async () => {
    setGenerating(true)
    setPracticeQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const res = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'practice', topic: selectedTopic, targetBand })
      })

      if (res.ok) {
        const data = await res.json()
        setPracticeQuestions(data.questions)
      } else {
        alert('Có lỗi xảy ra khi tạo bài tập.')
      }
    } catch (error) {
      console.error(error)
      alert('Lỗi kết nối.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-emerald-400" />
              Trợ Lý Ngữ Pháp AI
            </h2>
            <p className="text-xs text-slate-400">Sửa lỗi câu hoặc tạo bài tập ngữ pháp theo chủ đề</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl w-full max-w-sm border border-slate-800">
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'check' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kiểm tra câu
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'practice' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Luyện tập
          </button>
        </div>
      </div>

      {activeTab === 'check' && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Nhập đoạn văn tiếng Anh cần sửa lỗi:</label>
            <textarea
              value={textToCheck}
              onChange={(e) => setTextToCheck(e.target.value)}
              placeholder="VD: She don't like to playing soccer."
              className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none transition-colors"
            />
          </div>
          
          <button 
            onClick={handleCheckGrammar}
            disabled={!textToCheck.trim() || checking}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-300" />}
            Sửa Lỗi Bằng AI
          </button>

          {checkResult && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {!checkResult.hasError ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-400">Hoàn hảo!</h4>
                    <p className="text-sm text-slate-300">{checkResult.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-slate-900/80 border border-slate-700 rounded-2xl space-y-4">
                  <div>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1 block">Đã phát hiện lỗi</span>
                    <p className="text-sm text-slate-300"><strong>AI Giải thích:</strong> {checkResult.explanation}</p>
                  </div>
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 block">Câu sửa hoàn chỉnh</span>
                    <p className="text-emerald-400 font-medium text-lg">{checkResult.correctedText}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Chọn chủ đề ngữ pháp:</label>
              <select 
                className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button 
              onClick={handleGeneratePractice}
              disabled={generating}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
              Tạo Bài Tập
            </button>
          </div>

          {practiceQuestions.length > 0 && (
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 animate-in fade-in">
              <h3 className="text-xl font-bold text-white mb-6">Bài tập: {selectedTopic}</h3>
              <div className="space-y-8">
                {practiceQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-white font-medium text-lg">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = answers[idx] === opt
                        const isCorrect = opt === q.answer
                        
                        let btnClass = "p-4 rounded-xl border text-sm text-left transition-all "
                        if (!submitted) {
                          btnClass += isSelected ? "bg-emerald-600/20 border-emerald-500 text-emerald-300" : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"
                        } else {
                          if (isCorrect) btnClass += "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                          else if (isSelected) btnClass += "bg-red-600/20 border-red-500 text-red-300"
                          else btnClass += "bg-slate-900/50 border-slate-800 text-slate-500 opacity-50"
                        }

                        return (
                          <button 
                            key={i}
                            disabled={submitted}
                            onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                            className={btnClass}
                          >
                            <div className="flex items-center justify-between">
                              <span>{opt}</span>
                              {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                              {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {submitted && (
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 text-sm text-slate-300">
                        <strong className="text-emerald-400">Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!submitted ? (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length < practiceQuestions.length}
                  className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg disabled:opacity-50 transition-all shadow-lg"
                >
                  Nộp Bài
                </button>
              ) : (
                <button
                  onClick={handleGeneratePractice}
                  className="mt-8 w-full py-4 rounded-xl glass-card text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 font-bold text-lg transition-all"
                >
                  Tạo Bài Khác
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
