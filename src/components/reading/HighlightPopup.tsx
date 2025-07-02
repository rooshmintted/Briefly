/**
 * Highlight Popup Component
 * A beautiful popup that appears above selected text with highlight option
 */

import React, { useEffect, useRef, useState } from 'react'
import { PencilIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { TextSelection } from '@/types'

interface HighlightPopupProps {
  selection: TextSelection | null
  visible: boolean
  onHighlight: () => void
  onClose: () => void
  onAIFlashcard: (front: string, back: string) => void
}

/**
 * Popup that appears above selected text to offer highlighting
 */
export function HighlightPopup({ selection, visible, onHighlight, onClose, onAIFlashcard }: HighlightPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Position popup above the selected text
  useEffect(() => {
    if (visible && selection && popupRef.current) {
      const popup = popupRef.current
      const rect = selection.boundingRect
      
      // Calculate optimal position
      const popupHeight = 48 // Approximate popup height
      const popupWidth = 240 // Approximate popup width for two buttons
      
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

  // Handle AI flashcard generation
  const handleAIFlashcard = async () => {
    if (!selection?.text) return

    setIsGeneratingAI(true)
    
    try {
      const encodedText = encodeURIComponent(selection.text)
      const response = await fetch(
        `https://mintted.app.n8n.cloud/webhook/a882bc89-fc52-4825-a2de-494fe3d91a6c?question=${encodedText}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to generate AI flashcard')
      }
      
      const data = await response.json()
      console.log('AI Flashcard API response:', data)
      
      // Handle the specific API response format: [{ "output": { "front": "...", "back": "..." } }]
      let front, back
      
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        // Expected API format
        const output = data[0].output
        front = output.front
        back = output.back
      } else if (data.front && data.back) {
        // Direct format
        front = data.front
        back = data.back
      } else if (data.output && data.output.front && data.output.back) {
        // Single object with output
        front = data.output.front
        back = data.output.back
      } else {
        // Log the unexpected format
        console.error('Unexpected response format:', JSON.stringify(data, null, 2))
      }
      
      if (front && back) {
        console.log('Calling onAIFlashcard with:', { front, back })
        onAIFlashcard(front, back)
        onClose() // Close the popup after successful generation
      } else {
        console.error('Could not extract front/back from response:', data)
        alert(`Failed to generate flashcard. Could not find front/back in response.`)
      }
    } catch (error) {
      console.error('Error generating AI flashcard:', error)
      alert('Error generating AI flashcard. Please check your connection and try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  if (!visible || !selection) {
    return null
  }

  return (
    <div
      ref={popupRef}
      className="highlight-popup animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex space-x-1">
          <button
            onClick={onHighlight}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-yellow-50 hover:text-yellow-800 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-200 rounded-md transition-colors group"
            aria-label="Highlight selected text"
          >
            <PencilIcon className="w-4 h-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
            <span>Highlight</span>
          </button>
          
          <button
            onClick={handleAIFlashcard}
            disabled={isGeneratingAI}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-200 rounded-md transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate AI flashcard"
          >
            <SparklesIcon className="w-4 h-4 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span>{isGeneratingAI ? 'Generating...' : 'AI Flashcard'}</span>
          </button>
        </div>
      </div>
      
      {/* Arrow pointing to selection */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200 dark:border-t-gray-700"></div>
        <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-white dark:border-t-gray-800 relative -top-px left-px"></div>
      </div>
    </div>
  )
} 