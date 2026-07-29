'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type BackgroundTheme = string // e.g. 'cosmic', 'youtube:dQw4w9WgXcQ', 'image:https://...'

export interface ThemeOption {
  id: BackgroundTheme
  name: BackgroundTheme
  label: string
  icon: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  description: string
}

export const themeList: ThemeOption[] = [
  {
    id: 'cosmic',
    name: 'cosmic',
    label: 'Vũ Trụ Cosmic',
    icon: 'Sparkles',
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#6366f1',
    },
    description: 'Không gian huyền ảo với hiệu ứng tím neon & sao phát sáng',
  },
  {
    id: 'glass',
    name: 'glass',
    label: 'Kính Thủy Tinh Glass',
    icon: 'Layers',
    colors: {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      accent: '#0284c7',
    },
    description: 'Giao diện kính mờ hiện đại sắc xanh băng lam',
  },
  {
    id: 'gradient',
    name: 'gradient',
    label: 'Sắc Màu Gradient',
    icon: 'Palette',
    colors: {
      primary: '#d946ef',
      secondary: '#f59e0b',
      accent: '#84cc16',
    },
    description: 'Dải màu sống động rực rỡ mang cảm hứng sáng tạo',
  },
  {
    id: 'ambient',
    name: 'ambient',
    label: 'Ánh Sáng Ambient',
    icon: 'Moon',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#064e3b',
    },
    description: 'Tông màu tối dịu mát giúp tập trung học tập ban đêm',
  },
]

export interface BackgroundContextType {
  theme: BackgroundTheme
  setTheme: (theme: BackgroundTheme) => void
  themeList: ThemeOption[]
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined)

const STORAGE_KEY = 'openquiz_background_theme'

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<BackgroundTheme>('cosmic')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      // Clean up legacy or broken key that causes QuotaExceededError
      localStorage.removeItem('openquiz_bg_theme')
      
      const savedTheme = localStorage.getItem(STORAGE_KEY)
      if (savedTheme) {
        if (savedTheme.includes('data:image/gif') || savedTheme.length > 3_000_000) {
          localStorage.removeItem(STORAGE_KEY)
          setThemeState('cosmic')
        } else {
          setThemeState(savedTheme)
        }
      }
    } catch {
      // Ignore localStorage read errors in SSR or restricted storage environments
    }
  }, [])

  const setTheme = (newTheme: BackgroundTheme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignore localStorage write errors
    }
  }

  return (
    <BackgroundContext.Provider value={{ theme: mounted ? theme : 'cosmic', setTheme, themeList }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const context = useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider')
  }
  return context
}
