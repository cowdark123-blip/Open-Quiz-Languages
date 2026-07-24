'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackground, BackgroundTheme, ThemeOption } from '@/contexts/BackgroundContext'
import { Image as ImageIcon, Link as LinkIcon, MonitorPlay, PlaySquare, X, Check, Info } from 'lucide-react'

interface BackgroundSwitcherProps {
  isOpen: boolean
  onClose: () => void
}

const PRESET_CATEGORIES = [
  {
    category: 'Study with me',
    items: [
      { id: 'youtube:lTRiuFIWV54', title: 'Lofi Girl Live' },
      { id: 'youtube:kgx4WGK0oNU', title: 'Jazz Relaxing' },
      { id: 'youtube:5qap5aO4i9A', title: 'Lofi Hip Hop' },
      { id: 'youtube:DWcJFNfaw9c', title: 'Lofi Relax' },
    ],
  },
  {
    category: '4K Live Wallpaper',
    items: [
      { id: 'youtube:qRTVg8HHzUo', title: '4K Landscape' },
      { id: 'youtube:XqZsoesa55w', title: 'Ocean Aquarium' },
      { id: 'youtube:vW1hK4lJzqk', title: 'Cozy Rain' },
      { id: 'youtube:V-_O7nl0Ii0', title: 'Fireplace' },
    ],
  }
]

export function BackgroundSwitcher({ isOpen, onClose }: BackgroundSwitcherProps) {
  const { theme, setTheme, themeList } = useBackground()
  
  const [localTheme, setLocalTheme] = useState<BackgroundTheme>(theme)
  const [customLink, setCustomLink] = useState('')

  useEffect(() => {
    if (isOpen) {
      setLocalTheme(theme)
      if (theme.startsWith('youtube:') || theme.startsWith('image:')) {
        const value = theme.substring(theme.indexOf(':') + 1)
        setCustomLink(theme.startsWith('youtube:') ? `https://youtube.com/watch?v=${value}` : value)
      } else {
        setCustomLink('')
      }
    }
  }, [isOpen, theme])

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomLink(val)
    
    // Auto-detect YouTube
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = val.match(ytRegex)
    if (match && match[1]) {
      setLocalTheme(`youtube:${match[1]}`)
    } else if (val.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      setLocalTheme(`image:${val}`)
    }
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
                <h4 className="text-sm font-semibold text-white">Link ảnh / GIF / YouTube</h4>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={customLink}
                    onChange={handleLinkChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Dán link ảnh, GIF hoặc YouTube vào đây..."
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Hỗ trợ link ảnh trực tiếp (.jpg, .png, .gif) hoặc link video YouTube
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-1/3 h-px bg-slate-800"></div>
                <span className="px-4 text-xs text-slate-500">Hoặc có thể chọn</span>
                <div className="w-1/3 h-px bg-slate-800"></div>
              </div>

              {/* YouTube Presets */}
              {PRESET_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {cat.category}
                    <MonitorPlay className="w-4 h-4 text-red-500" />
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {cat.items.map((item) => {
                      const isActive = localTheme === item.id
                      const videoId = item.id.split(':')[1]
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLocalTheme(item.id)
                            setCustomLink(`https://youtube.com/watch?v=${videoId}`)
                          }}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                            isActive ? 'border-purple-500 ring-4 ring-purple-500/20' : 'border-transparent hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('hqdefault.jpg')) {
                                target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                              }
                            }}
                          />
                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 bg-black/20 flex items-end justify-end p-2">
                            <PlaySquare className="w-5 h-5 text-white/80" />
                          </div>
                          {isActive && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <Check className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

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
                          setCustomLink('')
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
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
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
