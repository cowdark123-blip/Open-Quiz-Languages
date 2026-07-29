'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackground, BackgroundTheme, ThemeOption } from '@/contexts/BackgroundContext'
import { Image as ImageIcon, Link as LinkIcon, MonitorPlay, PlaySquare, X, Check, Info, Upload } from 'lucide-react'

interface BackgroundSwitcherProps {
  isOpen: boolean
  onClose: () => void
}



export function BackgroundSwitcher({ isOpen, onClose }: BackgroundSwitcherProps) {
  const { theme, setTheme, themeList } = useBackground()
  
  const [localTheme, setLocalTheme] = useState<BackgroundTheme>(theme)

  useEffect(() => {
    if (isOpen) {
      setLocalTheme(theme)
    }
  }, [isOpen, theme])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (file.type === 'image/gif') {
        alert('Không hỗ trợ ảnh động (GIF) để tránh nặng bộ nhớ. Vui lòng chọn ảnh tĩnh.')
        return
      }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        const MAX = 1280
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round(height * (MAX / width))
            width = MAX
          } else {
            width = Math.round(width * (MAX / height))
            height = MAX
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/webp', 0.6)
        
        try {
           const testKey = '__test_quota__'
           localStorage.setItem(testKey, compressed)
           localStorage.removeItem(testKey)
           setLocalTheme(`image:${compressed}`)
        } catch(e) {
           alert('Ảnh vẫn quá lớn sau khi nén. Vui lòng chọn ảnh khác.')
        }
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const handleApply = () => {
    setTheme(localTheme)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          {/* Backdrop click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#111827] rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-300" />
                Đổi hình nền
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              
              {/* Custom Link Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Ảnh nền tùy chỉnh</h4>
                <div className="relative flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    id="bg-upload"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="bg-upload"
                    className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed text-slate-300 flex items-center justify-center cursor-pointer transition-colors text-sm font-semibold gap-2 shadow-sm"
                  >
                    <Upload className="w-5 h-5" />
                    Tải ảnh từ thiết bị
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng tĩnh (.jpg, .png, .webp). Ảnh sẽ tự động nén để tiết kiệm dung lượng.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-1/3 h-px bg-slate-800"></div>
                <span className="px-4 text-xs text-slate-500">Hoặc chọn màu mặc định</span>
                <div className="w-1/3 h-px bg-slate-800"></div>
              </div>



              {/* Default Themes */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Giao diện hệ thống</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {themeList.map((item) => {
                    const isActive = localTheme === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLocalTheme(item.id)
                        }}
                        className={`relative p-3 rounded-xl border text-left transition-all h-20 flex flex-col justify-between ${
                          isActive
                            ? 'border-purple-500 bg-slate-900 shadow-lg shadow-purple-500/20'
                            : 'border-slate-800 bg-slate-800/50 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="text-xs font-bold text-white block">{item.label}</span>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.colors.primary }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.colors.secondary }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLocalTheme('default')
                    setTheme('default')
                    onClose()
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  Xóa nền
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
              </div>
              <button
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-200 text-slate-900 hover:bg-white transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Áp dụng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
