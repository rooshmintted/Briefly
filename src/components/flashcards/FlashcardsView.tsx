/**
 * Flashcards View Component
 * Displays all flashcards across all stories for the flashcards smart view
 */

import React, { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Flashcard } from '@/types'
import { formatTimeAgo } from '@/lib/dateUtils'
import { 
  TagIcon, 
  BookOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline'

interface FlashcardWithStory extends Flashcard {
  storyTitle?: string
  storyPublicationName?: string
}

/**
 * Individual flashcard item for the flashcards view
 */
function FlashcardViewItem({ flashcard }: { flashcard: FlashcardWithStory }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const { selectStory, stories } = useAppStore()

  const handleOpenStory = () => {
    selectStory(flashcard.story_id)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFlip}
              className="flex items-center space-x-1 text-sm text-accent-light dark:text-accent-dark hover:underline"
            >
              {isFlipped ? (
                <>
                  <EyeSlashIcon className="w-4 h-4" />
                  <span>Show Front</span>
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4" />
                  <span>Show Back</span>
                </>
              )}
            </button>
            
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatTimeAgo(flashcard.created_at)}
            </span>
          </div>

          <button
            onClick={handleOpenStory}
            className="flex items-center space-x-1 text-sm text-accent-light dark:text-accent-dark hover:underline"
            title="Open story"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            <span>Open Story</span>
          </button>
        </div>

        {/* Story Info */}
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center space-x-2 text-sm">
            <BookOpenIcon className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
            <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
              {flashcard.storyTitle}
            </span>
            {flashcard.storyPublicationName && (
              <>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">•</span>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  {flashcard.storyPublicationName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Flashcard Content */}
        <div className="min-h-[120px]">
          {!isFlipped ? (
            <div>
              <h4 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Front:
              </h4>
              <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                {flashcard.front}
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                Back:
              </h4>
              <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-wrap">
                {flashcard.back}
              </p>
            </div>
          )}
        </div>

        {/* Context */}
        {flashcard.context_text && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Context:
            </h5>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark italic">
              "{flashcard.context_text}"
            </p>
          </div>
        )}

        {/* Tags */}
        {flashcard.tags && flashcard.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {flashcard.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Main flashcards view component
 */
export function FlashcardsView() {
  const { allFlashcards, loadAllFlashcards, stories, isLoading } = useAppStore()
  const [flashcardsWithStory, setFlashcardsWithStory] = useState<FlashcardWithStory[]>([])

  // Load flashcards on mount
  useEffect(() => {
    loadAllFlashcards()
  }, [loadAllFlashcards])

  // Combine flashcards with story information
  useEffect(() => {
    const enrichedFlashcards = allFlashcards.map(flashcard => {
      const story = stories.find(s => s.id === flashcard.story_id)
      return {
        ...flashcard,
        storyTitle: story?.title,
        storyPublicationName: story?.publication_name
      }
    })
    setFlashcardsWithStory(enrichedFlashcards)
  }, [allFlashcards, stories])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-light dark:border-accent-dark mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading flashcards...
          </p>
        </div>
      </div>
    )
  }

  if (flashcardsWithStory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
            No Flashcards Yet
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Start creating flashcards while reading stories to build your study collection.
          </p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            💡 Tip: Select text in any story to create flashcards from highlighted content
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            📚 Your Flashcards
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Review and study your flashcards from across all stories
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent-light dark:text-accent-dark">
                {flashcardsWithStory.length}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Total Flashcards
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-light dark:text-accent-dark">
                {new Set(flashcardsWithStory.map(f => f.story_id)).size}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Stories with Flashcards
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-light dark:text-accent-dark">
                {new Set(flashcardsWithStory.flatMap(f => f.tags || [])).size}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Unique Tags
              </div>
            </div>
          </div>
        </div>

        {/* Flashcards Grid */}
        <div className="space-y-4">
          {flashcardsWithStory.map((flashcard) => (
            <FlashcardViewItem
              key={flashcard.id}
              flashcard={flashcard}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 