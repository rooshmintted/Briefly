/**
 * Flashcard Editor Component
 * Allows users to create and edit flashcards with front/back content
 */

import React, { useState, useEffect } from 'react'
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import { Flashcard, CreateFlashcardData, UpdateFlashcardData } from '@/types'

interface FlashcardEditorProps {
  flashcard?: Flashcard | null
  onSave: (data: CreateFlashcardData | UpdateFlashcardData) => void
  onCancel: () => void
  contextText?: string
  highlightId?: string
}

/**
 * Flashcard editor component for creating and editing study cards
 */
export function FlashcardEditor({ 
  flashcard, 
  onSave, 
  onCancel, 
  contextText,
  highlightId 
}: FlashcardEditorProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form data when flashcard prop changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front || '')
      setBack(flashcard.back || '')
      setTags(flashcard.tags || [])
    } else {
      // New flashcard - clear form
      setFront('')
      setBack('')
      setTags([])
    }
  }, [flashcard])

  const isEditing = !!flashcard

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!front.trim() || !back.trim()) {
      return
    }

    setIsLoading(true)

    try {
      const flashcardData = {
        front: front.trim(),
        back: back.trim(),
        context_text: contextText,
        highlight_id: highlightId,
        tags: tags.length > 0 ? tags : undefined
      }

      onSave(flashcardData)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            {isEditing ? 'Edit Flashcard' : 'Create New Flashcard'}
          </h2>
          <button
            onClick={onCancel}
            className="btn-ghost p-2"
            aria-label="Close flashcard editor"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Context Display */}
          {contextText && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Context from Article:
              </h3>
              <p className="text-sm text-text-primary-light dark:text-text-primary-dark italic">
                "{contextText}"
              </p>
            </div>
          )}

          {/* Front Side */}
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Front (Question/Prompt) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question or prompt for your flashcard..."
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark resize-vertical"
            />
          </div>

          {/* Back Side */}
          <div>
            <label htmlFor="back" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Back (Answer/Explanation) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer or explanation for your flashcard..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark resize-vertical"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Tags (Optional)
            </label>
            
            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-accent-light/10 text-accent-light dark:bg-accent-dark/10 dark:text-accent-dark"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 text-accent-light/70 hover:text-accent-light dark:text-accent-dark/70 dark:hover:text-accent-dark"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent bg-white dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-4 py-2 bg-accent-light hover:bg-accent-light/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-r-md transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!front.trim() || !back.trim() || isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Flashcard' : 'Create Flashcard')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 