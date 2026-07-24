import React, { useMemo } from 'react'
import { VocabItem } from '@/types/database'
import { CheckSquare, Square } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'

interface WordSelectorProps {
  items: VocabItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export default function WordSelector({ items, selectedIds, onChange, disabled }: WordSelectorProps) {
  const { vocabSets } = useVocab()
  const [openStates, setOpenStates] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('wordSelectorOpenStates')
      if (saved) setOpenStates(JSON.parse(saved))
    } catch (e) {}
  }, [])

  const handleToggleDetails = (setId: string, isOpen: boolean) => {
    setOpenStates(prev => {
      const next = { ...prev, [setId]: isOpen }
      localStorage.setItem('wordSelectorOpenStates', JSON.stringify(next))
      return next
    })
  }

  const handleToggleAll = () => {
    if (selectedIds.length === items.length) {
      onChange([])
    } else {
      onChange(items.map(i => i.id))
    }
  }

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const groupedItems = useMemo(() => {
    const groups: Record<string, VocabItem[]> = {}
    items.forEach(item => {
      if (!groups[item.set_id]) groups[item.set_id] = []
      groups[item.set_id].push(item)
    })
    return groups
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-300">Chọn từ vựng tham gia bài tập ({selectedIds.length}/{items.length}):</label>
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggleAll}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-50"
        >
          {selectedIds.length === items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-6">
        {Object.entries(groupedItems).map(([setId, groupItems]) => {
          const setInfo = vocabSets.find(s => s.id === setId)
          const setTitle = setInfo?.title || 'Từ vựng đã chọn'
          
          return (
            <details 
              key={setId} 
              className="space-y-3 group" 
              open={openStates[setId] !== false}
              onToggle={(e) => handleToggleDetails(setId, e.currentTarget.open)}
            >
              <summary className="text-sm font-bold text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between cursor-pointer list-none hover:text-purple-300 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 group-open:rotate-90 transition-transform">▶</span>
                  <span>{setTitle}</span>
                </div>
                <span className="text-[10px] font-normal bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{groupItems.length} từ</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {groupItems.map(item => {
                  const isSelected = selectedIds.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected ? 'bg-purple-600/20 border-purple-500/50 text-purple-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => handleToggle(item.id)}
                          className="hidden"
                        />
                        {isSelected ? <CheckSquare className="w-5 h-5 text-purple-400 shrink-0" /> : <Square className="w-5 h-5 text-slate-500 shrink-0" />}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-bold text-slate-200 truncate">{item.term}</span>
                        <span className="text-xs text-slate-500 truncate mt-0.5">{item.vietnamese_translation || item.definition}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
