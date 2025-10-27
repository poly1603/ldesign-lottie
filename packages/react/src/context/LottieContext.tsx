import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import type { ILottieInstance } from '@ldesign/lottie-core'
import type { LottieContextValue } from '../types'

const LottieContext = createContext<LottieContextValue | null>(null)

export function LottieProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<Map<string, ILottieInstance>>(new Map())
  
  const register = useCallback((id: string, instance: ILottieInstance) => {
    setInstances(prev => new Map(prev).set(id, instance))
  }, [])
  
  const unregister = useCallback((id: string) => {
    setInstances(prev => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])
  
  const get = useCallback((id: string) => {
    return instances.get(id)
  }, [instances])
  
  const playAll = useCallback(() => {
    instances.forEach(instance => instance.play())
  }, [instances])
  
  const pauseAll = useCallback(() => {
    instances.forEach(instance => instance.pause())
  }, [instances])
  
  const stopAll = useCallback(() => {
    instances.forEach(instance => instance.stop())
  }, [instances])
  
  const value: LottieContextValue = {
    instances,
    register,
    unregister,
    get,
    playAll,
    pauseAll,
    stopAll
  }
  
  return (
    <LottieContext.Provider value={value}>
      {children}
    </LottieContext.Provider>
  )
}

export function useLottieContext(): LottieContextValue {
  const context = useContext(LottieContext)
  if (!context) {
    throw new Error('useLottieContext must be used within a LottieProvider')
  }
  return context
}

