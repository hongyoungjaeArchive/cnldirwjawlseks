'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getStoredApiKey, storeApiKey, removeApiKey } from './apiKey'

interface ApiKeyContextValue {
  apiKey: string | null
  hasKey: boolean
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  saveKey: (key: string) => void
  clearKey: () => void
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const stored = getStoredApiKey()
    if (stored) {
      setApiKey(stored)
    } else {
      setIsModalOpen(true) // 키 없으면 자동 오픈
    }
  }, [])

  const openModal  = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const saveKey = useCallback((key: string) => {
    storeApiKey(key)
    setApiKey(key)
    setIsModalOpen(false)
  }, [])

  const clearKey = useCallback(() => {
    removeApiKey()
    setApiKey(null)
    setIsModalOpen(true)
  }, [])

  return (
    <ApiKeyContext.Provider value={{ apiKey, hasKey: !!apiKey, isModalOpen, openModal, closeModal, saveKey, clearKey }}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider')
  return ctx
}
