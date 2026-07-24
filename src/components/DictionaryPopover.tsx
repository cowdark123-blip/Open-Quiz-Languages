'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Check, X, Book, Volume2 } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'
import { playTTS } from '@/lib/tts'
import { motion } from 'framer-motion'

interface DictionaryPopoverProps {
  word: string
  contextSentence: string
  onClose: () => void
}

export default function DictionaryPopover({ word, contextSentence, onClose }: DictionaryPopoverProps) {
  const { vocabSets, addWordToSet, createSetAndAddWord, isWordSaved } = useVocab()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  const isAlreadySaved = isWordSaved(data?.term || word)

  useEffect(() => {
    if (vocabSets.length > 0 && !selectedSetId) {
      setSelectedSetId(vocabSets[0].id)
    }
  }, [vocabSets, selectedSetId])

  useEffect(() => {
    async function fetchDefinition() {
      try {
        const res = await fetch('/api/ai/dictionary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, contextSentence })
        })
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError('Không thể lấy định nghĩa.')
        }
      } catch (err) {
        setError('Lỗi kết nối.')
      } finally {
        setLoading(false)
      }
    }
    fetchDefinition()
  }, [word, contextSentence])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    let success = false
    
    if (isCreatingSet) {
      if (!newSetName.trim()) {
        alert('Vui lòng nhập tên bộ từ')
        setSaving(false)
        return
      }
      success = await createSetAndAddWord(newSetName, data.term, data.definition, data.ipa, data.vietnameseTranslation, data.exampleSentence)
    } else {
      if (!selectedSetId) {
        alert('Vui lòng chọn bộ từ')
        setSaving(false)
        return
      }
      success = await addWordToSet(selectedSetId, data.term, data.definition, data.ipa, data.vietnameseTranslation, data.exampleSentence)
    }

    if (success) {
      setSaved(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      alert('Có lỗi xảy ra khi lưu từ.')
    }
    setSaving(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute z-50 mt-2 w-80 sm:w-96 glass-panel rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
      onClick={(e) => e.stopPropagation()} // Prevent bubbling up to the InteractiveText container
    >
      <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-white text-lg">Từ điển AI</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-2" />
            <span className="text-xs">Đang tra từ...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-4 text-sm">{error}</div>
        ) : data ? (
          <>
            <div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-2xl font-black text-white">{data.term}</span>
                {data.ipa && <span className="text-sm font-mono text-purple-300 italic mb-1">{data.ipa}</span>}
                <button 
                  onClick={async () => {
                    setIsAudioPlaying(true)
                    await playTTS(data.term)
                    setIsAudioPlaying(false)
                  }} 
                  disabled={isAudioPlaying}
                  className="p-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 mb-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAudioPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-slate-300 text-sm font-medium">{data.definition}</p>
              <p className="text-purple-300 text-sm font-semibold mt-1">{data.vietnameseTranslation}</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Ví dụ ngữ cảnh</span>
              <p className="text-xs text-slate-300 italic">"{data.exampleSentence}"</p>
            </div>

            {isAlreadySaved ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Từ này đã có trong bộ từ của bạn</span>
              </div>
            ) : saved ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Đã lưu thành công!</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-800/50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Thêm vào bộ từ</div>
                
                {isCreatingSet ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Tên bộ từ mới..."
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex justify-center items-center"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Lưu'}
                      </button>
                      <button 
                        onClick={() => setIsCreatingSet(false)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select
                      value={selectedSetId}
                      onChange={(e) => setSelectedSetId(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                    >
                      {vocabSets.length === 0 && <option value="" disabled>Chưa có bộ từ nào</option>}
                      {vocabSets.map(set => (
                        <option key={set.id} value={set.id}>{set.title}</option>
                      ))}
                    </select>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSave}
                        disabled={saving || !selectedSetId}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Lưu từ
                      </button>
                      <button
                        onClick={() => setIsCreatingSet(true)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                      >
                        + Bộ mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-3 mt-3 border-t border-slate-800/50 space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tra từ điển ngoại vi 🌐</div>
              <div className="flex gap-2">
                <a 
                  href={`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent((data.term || word).toLowerCase())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Book className="w-3 h-3" />
                  Cambridge 📘
                </a>
                <a 
                  href={`http://tracuu.soha.vn/dict/en_vn/${encodeURIComponent((data.term || word).toLowerCase())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Book className="w-3 h-3" />
                  Soha 📙
                </a>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  )
}
