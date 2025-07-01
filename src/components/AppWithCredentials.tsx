/**
 * App Wrapper with Credentials Check
 * Ensures Supabase credentials are available before loading the main app
 */

import { useState, useEffect } from 'react'
import { CredentialsSetup } from './settings/CredentialsSetup'
import App from '../App'

/**
 * Wrapper component that handles credential validation
 */
export function AppWithCredentials() {
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkCredentials()
  }, [])

  /**
   * Check if Supabase credentials are available
   */
  async function checkCredentials() {
    try {
      // First check environment variables
      const envUrl = window.electronAPI?.env.SUPABASE_URL
      const envKey = window.electronAPI?.env.SUPABASE_ANON_KEY
      
      if (envUrl && envKey) {
        console.log('Credentials found in environment variables')
        setHasCredentials(true)
        setIsLoading(false)
        return
      }

      // If env variables aren't available, check stored credentials
      const storedUrl = await window.electronAPI?.getAppSetting('supabaseUrl')
      const storedKey = await window.electronAPI?.getAppSetting('supabaseKey')
      
      if (storedUrl && storedKey) {
        console.log('Credentials found in stored settings')
        setHasCredentials(true)
      } else {
        console.log('No credentials found - showing setup')
        setHasCredentials(false)
      }
    } catch (error) {
      console.error('Error checking credentials:', error)
      setHasCredentials(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle successful credential setup
   */
  async function handleCredentialsSet() {
    try {
      // Refresh the Supabase service to use new credentials
      const { refreshSupabaseServiceInstance } = await import('../lib/supabase')
      await refreshSupabaseServiceInstance()
      
      // Mark credentials as available
      setHasCredentials(true)
      
      // Refresh the app to reinitialize everything
      if (window.electronAPI?.refreshApp) {
        await window.electronAPI.refreshApp()
      }
    } catch (error) {
      console.error('Error after setting credentials:', error)
      // Still mark as having credentials and let the app handle any errors
      setHasCredentials(true)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show credentials setup if needed
  if (!hasCredentials) {
    return <CredentialsSetup onCredentialsSet={handleCredentialsSet} />
  }

  // Show main app
  return <App />
} 