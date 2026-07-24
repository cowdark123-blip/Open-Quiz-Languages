'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Sparkles, Loader2, Trash2, Plus, FileInput, Check, RefreshCw } from 'lucide-react'
import { VocabItem } from '@/types/database'

export interface ParsedItem {
  id: string
  term: string
  definition: string
  vietnamese_translation?: string
  ipa?: string
  example_sentence?: string
  synonyms?: string[]
  synonymsText?: string
}

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: Partial<VocabItem>[], overwrite?: boolean) => Promise<boolean | void>
  existingItems?: (VocabItem | Partial<VocabItem>)[]
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  existingItems = [],
}: BulkImportModalProps) {
  const [rawText, setRawText] = useState('')
  const [fieldSep, setFieldSep] = useState<'tab' | 'comma' | 'custom'>('tab')
  const [customFieldSep, setCustomFieldSep] = useState('-')
  const [cardSep, setCardSep] = useState<'newline' | 'semicolon'>('newline')
  
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [useAiFill, setUseAiFill] = useState(false)
  const [overwrite, setOverwrite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Parse logic
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedItems([])
      return
    }

    const cardDelimiter = cardSep === 'semicolon' ? ';' : '\n'
    const lines = rawText
      .split(cardDelimiter)
      .map((l) => l.trim())
      .filter(Boolean)

    let fieldDelimiter = '\t'
    if (fieldSep === 'comma') fieldDelimiter = ','
    if (fieldSep === 'custom') fieldDelimiter = customFieldSep || '-'

    const items: ParsedItem[] = lines.map((line, idx) => {
      const parts = line.split(fieldDelimiter).map((p) => p.trim())
      const term = parts[0] || ''
      const definition = parts[1] || ''
      const ipa = parts[2] || ''
      const pos = parts[3] || ''
      const example = parts[4] || ''
      const synonymsRaw = parts[5] || ''

      const formattedDef = pos && !definition.includes(`(${pos})`) ? `(${pos}) ${definition}` : definition
      const synArray = synonymsRaw ? synonymsRaw.split(',').map((s) => s.trim()).filter(Boolean) : []

      return {
        id: `parsed-${idx}-${Date.now()}`,
        term,
        definition: formattedDef,
        vietnamese_translation: formattedDef,
        ipa,
        example_sentence: example,
        synonyms: synArray,
        synonymsText: synArray.join(', '),
      }
    })

    setParsedItems(items)
  }, [rawText, fieldSep, customFieldSep, cardSep])

  // Duplicate detection computation
  const itemDuplicates = useMemo(() => {
    return parsedItems.map((item, idx) => {
      const termLower = item.term.trim().toLowerCase()
      const defLower = (item.definition || item.vietnamese_translation || '').trim().toLowerCase()

      const isTermDupInternal =
        termLower !== '' &&
        parsedItems.some(
          (other, oIdx) => oIdx !== idx && other.term.trim().toLowerCase() === termLower
        )
      const isDefDupInternal =
        defLower !== '' &&
        parsedItems.some(
          (other, oIdx) =>
            oIdx !== idx &&
            (other.definition || other.vietnamese_translation || '').trim().toLowerCase() === defLower
        )

      const isTermDupDb =
        termLower !== '' &&
        existingItems.some((e) => (e.term || '').trim().toLowerCase() === termLower)
      const isDefDupDb =
        defLower !== '' &&
        existingItems.some(
          (e) =>
            (e.definition || '').trim().toLowerCase() === defLower ||
            (e.vietnamese_translation && e.vietnamese_translation.trim().toLowerCase() === defLower)
        )

      const isTermDup = isTermDupInternal || isTermDupDb
      const isDefDup = isDefDupInternal || isDefDupDb
      const isDup = isTermDup || isDefDup

      return {
        id: item.id,
        isTermDup,
        isDefDup,
        isDup,
      }
    })
  }, [parsedItems, existingItems])

  const dupCount = useMemo(() => {
    return itemDuplicates.filter((d) => d.isDup).length
  }, [itemDuplicates])

  if (!isOpen) return null

  const handleUpdateItem = (id: string, field: keyof ParsedItem, value: any) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'synonymsText') {
            updated.synonyms = (value as string)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          }
          return updated
        }
        return item
      })
    )
  }

  const handleDeleteItem = (id: string) => {
    setParsedItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleRemoveAllDuplicates = () => {
    const dupMap = new Map(itemDuplicates.map((d) => [d.id, d.isDup]))
    setParsedItems((prev) => prev.filter((item) => !dupMap.get(item.id)))
  }

  const handleAddEmptyRow = () => {
    setParsedItems((prev) => [
      ...prev,
      {
        id: `parsed-new-${Date.now()}`,
        term: '',
        definition: '',
        vietnamese_translation: '',
        ipa: '',
        example_sentence: '',
        synonyms: [],
        synonymsText: '',
      },
    ])
  }

  const handleImportSubmit = async () => {
    const validItems = parsedItems.filter((i) => i.term.trim())
    if (validItems.length === 0) {
      setErrorMsg('Vui lòng nhập ít nhất 1 từ vựng hợp lệ')
      return
    }

    setLoading(true)
    setErrorMsg('')

    let finalItems: ParsedItem[] = [...validItems]

    // AI Auto-Fill if selected
    if (useAiFill) {
      const itemsToFill = finalItems.filter(
        (i) => !i.definition || !i.ipa || !i.example_sentence
      )
      
      if (itemsToFill.length > 0) {
        setAiProgress({ current: 0, total: itemsToFill.length })
        let count = 0

        for (let i = 0; i < finalItems.length; i++) {
          const item = finalItems[i]
          if (!item.definition || !item.ipa || !item.example_sentence) {
            try {
              const res = await fetch('/api/ai/generate-vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: item.term }),
              })
              const result = await res.json()
              if (res.ok && result.success && result.data) {
                const d = result.data
                finalItems[i] = {
                  ...item,
                  definition: item.definition || d.definition || '',
                  vietnamese_translation: item.vietnamese_translation || d.vietnamese_translation || d.definition || '',
                  ipa: item.ipa || d.ipa || '',
                  example_sentence: item.example_sentence || d.example_sentence || '',
                  synonyms: item.synonyms?.length ? item.synonyms : (Array.isArray(d.synonyms) ? d.synonyms : (d.synonyms ? d.synonyms.split(',') : [])),
                }
              }
            } catch {
              // Ignore single item AI errors
            }
            count++
            setAiProgress({ current: count, total: itemsToFill.length })
          }
        }
      }
    }

    // Map to VocabItem payload
    const payload: Partial<VocabItem>[] = finalItems.map((item) => ({
      term: item.term.trim(),
      definition: item.definition.trim() || item.term.trim(),
      vietnamese_translation: item.vietnamese_translation || item.definition,
      ipa: item.ipa,
      example_sentence: item.example_sentence,
      synonyms: item.synonyms || [],
    }))

    const success = await onImport(payload, overwrite)
    setLoading(false)
    setAiProgress(null)

    if (success !== false) {
      setRawText('')
      setParsedItems([])
      onClose()
    } else {
      setErrorMsg('Không thể lưu dữ liệu vào cơ sở dữ liệu')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nhập Dữ Liệu Hàng Loạt</h3>
              <p className="text-xs text-slate-400">Chép và dán dữ liệu từ Word, Excel, Google Docs, Quizlet v.v.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Separator Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {/* Field Separator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Giữa thuật ngữ & định nghĩa (Field Separator):
              </label>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="fieldSep"
                    checked={fieldSep === 'tab'}
                    onChange={() => setFieldSep('tab')}
                    className="accent-purple-500"
                  />
                  <span>Tab (\t)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="fieldSep"
                    checked={fieldSep === 'comma'}
                    onChange={() => setFieldSep('comma')}
                    className="accent-purple-500"
                  />
                  <span>Dấu phẩy (,)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="fieldSep"
                    checked={fieldSep === 'custom'}
                    onChange={() => setFieldSep('custom')}
                    className="accent-purple-500"
                  />
                  <span>Tùy chọn:</span>
                </label>
                {fieldSep === 'custom' && (
                  <input
                    type="text"
                    value={customFieldSep}
                    onChange={(e) => setCustomFieldSep(e.target.value)}
                    className="w-12 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-center text-xs text-white"
                    maxLength={3}
                  />
                )}
              </div>
            </div>

            {/* Card Separator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Giữa các thẻ (Card Separator):
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="cardSep"
                    checked={cardSep === 'newline'}
                    onChange={() => setCardSep('newline')}
                    className="accent-purple-500"
                  />
                  <span>Dòng mới (\n)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="cardSep"
                    checked={cardSep === 'semicolon'}
                    onChange={() => setCardSep('semicolon')}
                    className="accent-purple-500"
                  />
                  <span>Chấm phẩy (;)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Raw Text Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dán dữ liệu thô vào đây:
            </label>
            <textarea
              rows={5}
              placeholder={`Ví dụ:\nAtmosphere\tBầu không khí\t/ˈæt.mə.sfɪər/\nResilience\tKhả năng phục hồi\t/rɪˈzɪl.jəns/`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Preview Table Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bảng Xem Trước (Preview)</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  Đã nhận diện {parsedItems.length} từ vựng
                </span>
                {dupCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                    ⚠️ {dupCount} từ bị trùng
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {dupCount > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveAllDuplicates}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-semibold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa nhanh {dupCount} từ trùng 🗑️</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng</span>
                </button>
              </div>
            </div>

            {parsedItems.length > 0 ? (
              <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-950/60 max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Từ / Cụm từ *</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Định nghĩa / Dịch nghĩa</th>
                      <th className="py-2.5 px-3 min-w-[100px]">IPA</th>
                      <th className="py-2.5 px-3 min-w-[150px]">Ví dụ</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Từ đồng nghĩa</th>
                      <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedItems.map((item, idx) => {
                      const dupState = itemDuplicates[idx] || {
                        isDup: false,
                        isTermDup: false,
                        isDefDup: false,
                      }
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            dupState.isDup
                              ? 'bg-amber-500/10 border-2 border-amber-500/80 shadow-md'
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-1.5 px-2">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.term}
                                onChange={(e) => handleUpdateItem(item.id, 'term', e.target.value)}
                                placeholder="Thuật ngữ..."
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                              />
                              {dupState.isTermDup && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⚠️ Trùng từ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-2">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.definition}
                                onChange={(e) => {
                                  handleUpdateItem(item.id, 'definition', e.target.value)
                                  handleUpdateItem(item.id, 'vietnamese_translation', e.target.value)
                                }}
                                placeholder="Nghĩa..."
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                              />
                              {dupState.isDefDup && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  ⚠️ Trùng nghĩa
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.ipa || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'ipa', e.target.value)}
                              placeholder="/.../"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.example_sentence || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'example_sentence', e.target.value)}
                              placeholder="Câu ví dụ..."
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={item.synonymsText || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'synonymsText', e.target.value)}
                              placeholder="Đồng nghĩa..."
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Chưa có dữ liệu. Dán văn bản thô phía trên để nhận diện tự động.
              </div>
            )}
          </div>

          {/* AI & Overwrite Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* AI Auto-Fill Option */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40">
              <input
                type="checkbox"
                id="useAiFill"
                checked={useAiFill}
                onChange={(e) => setUseAiFill(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              <label htmlFor="useAiFill" className="text-xs text-purple-200 cursor-pointer font-medium select-none">
                <span className="font-bold flex items-center gap-1.5 inline-flex">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Bổ sung thông tin bằng AI ✨</span>
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Tự động dùng AI điền IPA, định nghĩa, nghĩa Tiếng Việt & ví dụ cho các từ bị thiếu.
                </span>
              </label>
            </div>

            {/* Overwrite Duplicate Option */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40">
              <input
                type="checkbox"
                id="overwrite"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
              />
              <label htmlFor="overwrite" className="text-xs text-amber-200 cursor-pointer font-medium select-none">
                <span className="font-bold flex items-center gap-1.5 inline-flex">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ghi đè từ cũ 🔄</span>
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Cập nhật nội dung mới (UPDATE) lên từ đã có sẵn thay vì tạo thêm bản ghi trùng lặp.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          <div className="text-xs text-slate-400">
            {aiProgress && (
              <span className="text-purple-300 font-semibold flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Đang xử lý AI: {aiProgress.current}/{aiProgress.total} từ...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={loading || parsedItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang nhập dữ liệu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nhập {parsedItems.length} từ vựng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
