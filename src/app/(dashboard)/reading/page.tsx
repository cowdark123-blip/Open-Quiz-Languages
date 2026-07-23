'use client'

import { useState, useEffect } from 'react'
import { fetchUserVocabSets, fetchVocabItems } from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { BookText, Loader2, Play, CheckCircle2, XCircle } from 'lucide-react'

export default function ReadingPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [article, setArticle] = useState<string>('')
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const [activeWord, setActiveWord] = useState<VocabItem | null>(null)

  useEffect(() => {
    loadSets()
  }, [])

  const loadSets = async () => {
    setLoading(true)
    const userSets = await fetchUserVocabSets()
    setSets(userSets)
    if (userSets.length > 0) {
      setSelectedSet(userSets[0].id)
    }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!selectedSet) return
    setGenerating(true)
    setArticle('')
    setQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const items = await fetchVocabItems(selectedSet)
      setVocabItems(items)
      
      const words = items.map(item => item.term).slice(0, 10) // Limit to 10 words to not confuse AI

      if (words.length === 0) {
        alert('Bộ từ vựng trống!')
        setGenerating(false)
        return
      }

      const res = await fetch('/api/ai/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words })
      })

      if (res.ok) {
        const data = await res.json()
        setArticle(data.article)
        setQuestions(data.questions)
      } else {
        alert('Có lỗi xảy ra khi tạo bài đọc.')
      }
    } catch (error) {
      console.error(error)
      alert('Có lỗi xảy ra khi tạo bài đọc.')
    } finally {
      setGenerating(false)
    }
  }

  const handleWordClick = (wordText: string) => {
    const cleanWord = wordText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase()
    const found = vocabItems.find(item => item.term.toLowerCase() === cleanWord)
    if (found) {
      setActiveWord(found)
    } else {
      setActiveWord(null)
    }
  }

  const renderArticle = () => {
    if (!article) return null
    const wordsInArticle = article.split(' ')
    return (
      <div className="leading-relaxed text-slate-300 text-lg">
        {wordsInArticle.map((w, idx) => {
          const cleanW = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase()
          const isVocab = vocabItems.some(item => item.term.toLowerCase() === cleanW)
          return (
            <span key={idx}>
              {isVocab ? (
                <span 
                  onClick={() => handleWordClick(w)}
                  className="font-bold text-cyan-400 cursor-pointer hover:underline"
                >
                  {w}
                </span>
              ) : (
                w
              )}{' '}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookText className="w-6 h-6 text-cyan-400" />
            Đọc Hiểu AI (Reading)
          </h2>
          <p className="text-xs text-slate-400">AI sẽ viết một bài báo chứa các từ vựng bạn đang học</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : (
            <select 
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none flex-1 md:w-64"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
            >
              {sets.map(set => (
                <option key={set.id} value={set.id}>{set.title}</option>
              ))}
            </select>
          )}
          
          <button 
            onClick={handleGenerate}
            disabled={loading || generating || !selectedSet}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            Tạo Bài Đọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {article && (
            <div className="glass-card p-8 rounded-3xl border border-slate-800 relative">
              <div className="absolute top-4 right-4 text-xs font-bold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
                AI Generated
              </div>
              <h3 className="text-2xl font-black text-white mb-6">Reading Comprehension</h3>
              {renderArticle()}
            </div>
          )}

          {questions.length > 0 && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-white mb-6">Câu hỏi trắc nghiệm</h3>
              <div className="space-y-8">
                {questions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <p className="text-white font-medium">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt: string, i: number) => {
                        const isSelected = answers[idx] === opt
                        const isCorrect = opt === q.answer
                        
                        let btnClass = "p-3 rounded-xl border text-sm text-left transition-all "
                        if (!submitted) {
                          btnClass += isSelected ? "bg-cyan-600/20 border-cyan-500 text-cyan-300" : "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-500"
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
                              {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {submitted && (
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-sm text-slate-300">
                        <strong>Giải thích:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!submitted && (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length < questions.length}
                  className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold disabled:opacity-50 transition-all"
                >
                  Nộp Bài Kiểm Tra
                </button>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24">
            {activeWord ? (
              <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 bg-cyan-950/10 shadow-xl shadow-cyan-900/20">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">Tra Từ Trực Tiếp</div>
                <h3 className="text-2xl font-black text-white">{activeWord.term}</h3>
                <p className="text-sm font-mono text-slate-400 mb-4">{activeWord.ipa}</p>
                
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 mb-4">
                  <p className="text-sm text-white">{activeWord.definition}</p>
                  <p className="text-xs text-slate-400 mt-1">{activeWord.vietnamese_translation}</p>
                </div>
                
                {activeWord.example_sentence && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Ví dụ gốc</span>
                    <p className="text-sm text-slate-300 italic">"{activeWord.example_sentence}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center opacity-50">
                <BookText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nhấp vào từ vựng được tô màu trong bài đọc để xem nghĩa chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
