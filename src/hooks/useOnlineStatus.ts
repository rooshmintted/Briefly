/**
 * Online Status Hook
 * Monitors network connectivity and updates app state accordingly
 */

import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

/**
 * Custom hook to monitor online/offline status
 */
export function useOnlineStatus() {
  const setOnlineStatus = useAppStore(state => state.setOnlineStatus)

  useEffect(() => {
    // Set initial status
    setOnlineStatus(navigator.onLine)

    // Handle online/offline events
    const handleOnline = () => {
      setOnlineStatus(true)
      console.log('Connection restored')
    }

    const handleOffline = () => {
      setOnlineStatus(false)
      console.log('Connection lost')
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])
} 