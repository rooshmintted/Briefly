/**
 * YouTube Video Preview Component
 * Displays video thumbnail with button to open in external browser
 */

import React from 'react'
import { clsx } from 'clsx'
import { PlayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface YouTubeEmbedProps {
  videoUrl: string
  title?: string
  className?: string
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Simple YouTube video preview component
 */
export function YouTubeEmbed({ videoUrl, title, className }: YouTubeEmbedProps) {
  const videoId = extractVideoId(videoUrl)
  
  if (!videoId) {
    return (
      <div className={clsx(
        'flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8',
        className
      )}>
        <div className="text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Invalid YouTube URL
          </p>
          <a 
            href={videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent-light dark:text-accent-dark hover:underline"
          >
            Open video in new tab
          </a>
        </div>
      </div>
    )
  }
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  
  const handleOpenInYouTube = () => {
    if (window.electronAPI) {
      // Open in external browser via Electron
      window.electronAPI.openExternal(watchUrl)
    } else {
      // Fallback for web
      window.open(watchUrl, '_blank')
    }
  }
  
  return (
    <div className={clsx('relative w-full', className)}>
      <div className="relative w-full h-0 pb-[56.25%]"> {/* 16:9 aspect ratio */}
        {/* Video thumbnail */}
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 rounded-lg overflow-hidden shadow-lg">
          <img
            src={thumbnailUrl}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default thumbnail if maxres doesn't exist
              const target = e.target as HTMLImageElement
              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }}
          />
          
          {/* Overlay with play button */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center">
              {/* Large play button icon */}
              <div className="flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6 shadow-lg">
                <PlayIcon className="w-10 h-10 text-white ml-1" />
              </div>
              
              {/* Watch on YouTube button */}
              <button
                onClick={handleOpenInYouTube}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-base font-medium transition-all transform hover:scale-105 shadow-lg mx-auto"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                <span>Watch on YouTube</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video title below thumbnail */}
      {title && (
        <p className="mt-3 text-base text-text-secondary-light dark:text-text-secondary-dark text-center font-medium">
          {title}
        </p>
      )}
    </div>
  )
} 