'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { useBackground, BackgroundTheme } from '@/contexts/BackgroundContext'

const themeBgClasses: Record<BackgroundTheme, string> = {
  cosmic: 'bg-gradient-cosmic',
  glass: 'bg-gradient-glass',
  gradient: 'bg-gradient-vibrant',
  ambient: 'bg-gradient-ambient',
}

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useBackground()
  const [isMuted, setIsMuted] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const toggleMute = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isMuted ? 'unMute' : 'mute'
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      )
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Dynamic Animated Background Layer */}
      <AnimatePresence>
        {theme.startsWith('youtube:') ? (
          <motion.div
            key={theme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-0 overflow-hidden bg-black"
          >
            <div className="absolute inset-0 pointer-events-none z-0">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${theme.split(':')[1]}?autoplay=1&mute=1&loop=1&controls=0&playlist=${theme.split(':')[1]}&rel=0&showinfo=0&enablejsapi=1`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh]"
                style={{ border: 'none' }}
                allow="autoplay; encrypted-media"
              />
              <div className="absolute inset-0 bg-slate-950/60" /> {/* Dark overlay for readability */}
            </div>
            
            {/* Volume Toggle Button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-6 right-6 z-50 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full backdrop-blur-md border border-slate-700/50 shadow-xl transition-all hover:scale-110 active:scale-95"
              aria-label={isMuted ? 'Unmute Background Video' : 'Mute Background Video'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </motion.div>
        ) : theme.startsWith('image:') ? (
          <motion.div
            key={theme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-0 pointer-events-none bg-black"
          >
            <img
              src={theme.substring(6)}
              alt="Custom Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60" />
          </motion.div>
        ) : (
          <motion.div
            key={theme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className={`fixed inset-0 z-0 pointer-events-none ${
              themeBgClasses[theme as BackgroundTheme] || 'bg-gradient-cosmic'
            }`}
          >
            {/* Animated Glow Spot 1 (Top Left) */}
            <motion.div
              animate={{
                x: [0, 40, -20, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.15, 0.95, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{
                background:
                  theme === 'cosmic'
                    ? 'radial-gradient(circle, #8b5cf6 0%, #6366f1 100%)'
                    : theme === 'glass'
                    ? 'radial-gradient(circle, #06b6d4 0%, #3b82f6 100%)'
                    : theme === 'gradient'
                    ? 'radial-gradient(circle, #d946ef 0%, #ec4899 100%)'
                    : 'radial-gradient(circle, #10b981 0%, #059669 100%)',
              }}
            />

            {/* Animated Glow Spot 2 (Bottom Right) */}
            <motion.div
              animate={{
                x: [0, -50, 30, 0],
                y: [0, 40, -30, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{
                background:
                  theme === 'cosmic'
                    ? 'radial-gradient(circle, #ec4899 0%, #a855f7 100%)'
                    : theme === 'glass'
                    ? 'radial-gradient(circle, #3b82f6 0%, #0284c7 100%)'
                    : theme === 'gradient'
                    ? 'radial-gradient(circle, #f59e0b 0%, #ef4444 100%)'
                    : 'radial-gradient(circle, #14b8a6 0%, #064e3b 100%)',
              }}
            />

            {/* Animated Mesh Center Glow Spot */}
            <motion.div
              animate={{
                opacity: [0.15, 0.3, 0.15],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{
                background:
                  theme === 'cosmic'
                    ? 'radial-gradient(circle, #c084fc 0%, transparent 70%)'
                    : theme === 'glass'
                    ? 'radial-gradient(circle, #38bdf8 0%, transparent 70%)'
                    : theme === 'gradient'
                    ? 'radial-gradient(circle, #f472b6 0%, transparent 70%)'
                    : 'radial-gradient(circle, #34d399 0%, transparent 70%)',
              }}
            />

            {/* Glass overlay grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen w-full">{children}</div>
    </div>
  )
}
