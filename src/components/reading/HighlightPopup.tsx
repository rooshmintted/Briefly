/**
 * Highlight Popup Component
 * A beautiful popup that appears above selected text with highlight option
 */

import React, { useEffect, useRef } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import { TextSelection } from '@/types'

interface HighlightPopupProps {
  selection: TextSelection | null
  visible: boolean
  onHighlight: () => void
  onClose: () => void
}

/**
 * Popup that appears above selected text to offer highlighting
 */
export function HighlightPopup({ selection, visible, onHighlight, onClose }: HighlightPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Position popup above the selected text
  useEffect(() => {
    if (visible && selection && popupRef.current) {
      const popup = popupRef.current
      const rect = selection.boundingRect
      
      // Calculate optimal position
      const popupHeight = 48 // Approximate popup height
      const popupWidth = 120 // Approximate popup width
      
      // Position above the selection with some padding
      let top = rect.top - popupHeight - 8
      let left = rect.left + (rect.width / 2) - (popupWidth / 2)
      
      // Ensure popup doesn't go off-screen
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Adjust horizontal position
      if (left < 8) {
        left = 8
      } else if (left + popupWidth > viewportWidth - 8) {
        left = viewportWidth - popupWidth - 8
      }
      
      // If there's not enough space above, show below
      if (top < 8) {
        top = rect.bottom + 8
      }
      
      popup.style.position = 'fixed'
      popup.style.top = `${top}px`
      popup.style.left = `${left}px`
      popup.style.zIndex = '1000'
    }
  }, [visible, selection])

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  if (!visible || !selection) {
    return null
  }

  return (
    <div
      ref={popupRef}
      className="highlight-popup animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <button
          onClick={onHighlight}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-200 rounded-md transition-colors group"
          aria-label="Highlight selected text"
        >
          <PencilIcon className="w-4 h-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
          <span>Highlight</span>
        </button>
      </div>
      
      {/* Arrow pointing to selection */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-gray-700"></div>
        <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-white dark:border-t-gray-800 relative -top-px left-px"></div>
      </div>
    </div>
  )
} 