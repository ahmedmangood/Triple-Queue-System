'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminUser {
  username: string
  sessionToken?: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/validate-session', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser({ username: data.username })
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      return false
    }
  }

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser({ username: data.username })
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await checkAuth()
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const value: AdminAuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}