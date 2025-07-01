/**
 * Credentials Setup Component
 * Displays when Supabase credentials are missing and allows users to input them
 */

import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'

interface CredentialsSetupProps {
  onCredentialsSet: () => void
}

/**
 * Component for setting up Supabase credentials
 */
export function CredentialsSetup({ onCredentialsSet }: CredentialsSetupProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!supabaseUrl.trim() || !supabaseKey.trim() || !userId.trim()) {
        setError('All fields are required')
        return
      }

      // Validate URL format
      try {
        new URL(supabaseUrl)
      } catch {
        setError('Please enter a valid Supabase URL')
        return
      }

      // Store credentials using Electron API
      await window.electronAPI.setAppSetting('supabaseUrl', supabaseUrl.trim())
      await window.electronAPI.setAppSetting('supabaseKey', supabaseKey.trim())
      await window.electronAPI.setAppSetting('userId', userId.trim())

      // Test the connection by creating a Supabase service
      const { SupabaseService } = await import('@/lib/supabase')
      const testService = new SupabaseService(supabaseUrl.trim(), supabaseKey.trim())
      testService.setUserId(userId.trim())

      // Try to load publications as a connection test
      const testResult = await testService.getAvailablePublications()
      if (testResult.error && !testResult.error.includes('User ID not set')) {
        setError(`Connection failed: ${testResult.error}`)
        return
      }

      // Success! Notify parent component
      onCredentialsSet()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save credentials'
      setError(errorMessage)
      console.error('Error saving credentials:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestExampleData = () => {
    setSupabaseUrl('https://your-project.supabase.co')
    setSupabaseKey('your-anon-key-here')
    setUserId('your-user-id')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Setup Supabase Credentials
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your Supabase credentials to connect to your stories database
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="supabaseUrl" className="block text-sm font-medium text-gray-700">
                Supabase URL
              </label>
              <input
                id="supabaseUrl"
                name="supabaseUrl"
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="supabaseKey" className="block text-sm font-medium text-gray-700">
                Supabase Anon Key
              </label>
              <input
                id="supabaseKey"
                name="supabaseKey"
                type="password"
                required
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <input
                id="userId"
                name="userId"
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="your-user-id"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing Connection...
                </span>
              ) : (
                'Connect to Supabase'
              )}
            </button>

            <button
              type="button"
              onClick={handleTestExampleData}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fill Example Data
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500 space-y-2">
            <p><strong>Where to find these values:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Supabase URL:</strong> Project Settings → API → Project URL</li>
              <li>• <strong>Anon Key:</strong> Project Settings → API → Project API keys → anon public</li>
              <li>• <strong>User ID:</strong> Your unique identifier for filtering stories</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
} 