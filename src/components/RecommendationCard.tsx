import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles, Store, Utensils, ChefHat, ArrowLeft, Check, Mail } from 'lucide-react';
import type { Recommendation } from '../types';
import { trackRecommendationSwiped, trackSessionComplete, trackButtonClick } from '../services/analytics';
import { logger } from '../services/logger';

// Configure your email via environment variable or change the fallback
const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL || 'your-email@example.com';

interface RecommendationCardProps {
  recommendations: Recommendation[];
  message: string;
  onTryAgain: () => void;
  onBack: () => void;
  onSwipeStatsUpdate?: (accepted: number, rejected: number) => void;
}

export function RecommendationCard({ 
  recommendations, 
  message, 
  onTryAgain, 
  onBack,
  onSwipeStatsUpdate,
}: RecommendationCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedItems, setLikedItems] = useState<Recommendation[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [animation, setAnimation] = useState<'none' | 'left' | 'right'>('none');
  const [swipeDirection, setSwipeDirection] = useState<'none' | 'left' | 'right'>('none');
  const completionTracked = useRef(false);
  
  // Touch/drag state
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const currentRec = recommendations[currentIndex];
  const isComplete = currentIndex >= recommendations.length;

  // Report stats to parent
  useEffect(() => {
    onSwipeStatsUpdate?.(likedItems.length, rejectedCount);
  }, [likedItems.length, rejectedCount, onSwipeStatsUpdate]);

  // Track session completion
  useEffect(() => {
    if (isComplete && !completionTracked.current) {
      completionTracked.current = true;
      trackSessionComplete(
        likedItems.length + rejectedCount,
        likedItems.length,
        rejectedCount
      );
    }
  }, [isComplete, likedItems.length, rejectedCount]);

  const handleSwipe = (liked: boolean) => {
    if (!currentRec) return;
    
    setAnimation(liked ? 'right' : 'left');
    
    // Track the swipe
    trackRecommendationSwiped(
      currentRec,
      liked ? 'accept' : 'reject',
      currentIndex,
      recommendations.length
    );
    
    if (liked) {
      setLikedItems(prev => [...prev, currentRec]);
    } else {
      setRejectedCount(prev => prev + 1);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setAnimation('none');
      setSwipeDirection('none');
    }, 300);
  };

  const handleSkipToResults = () => {
    trackButtonClick('skip_to_results', {
      viewedCount: currentIndex,
      totalCount: recommendations.length,
      acceptedCount: likedItems.length,
    });
    
    logger.info('user_chose_food', {
      viewedCount: currentIndex,
      acceptedCount: likedItems.length,
    });
    
    // Jump to results by setting index to end
    setCurrentIndex(recommendations.length);
  };

  const handleBackClick = () => {
    trackButtonClick('back_from_recommendations', {
      viewedCount: currentIndex,
      totalCount: recommendations.length,
      acceptedCount: likedItems.length,
    });
    onBack();
  };

  const handleFeedbackClick = () => {
    trackButtonClick('feedback_email_clicked', {
      acceptedCount: likedItems.length,
      rejectedCount: rejectedCount,
    });
    
    logger.info('feedback_email_opened', {
      acceptedCount: likedItems.length,
      rejectedCount: rejectedCount,
    });
    
    // Create mailto link with pre-filled subject and body
    const subject = encodeURIComponent('Feedback: What Does My GF Want to Eat');
    const body = encodeURIComponent(
      `Hi!\n\nI have some feedback about the app:\n\n[Your feedback here]\n\n---\nSession stats:\n- Suggestions liked: ${likedItems.length}\n- Suggestions skipped: ${rejectedCount}`
    );
    
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
      cardRef.current.style.transition = 'none';
    }
    
    // Show direction indicator
    if (diff > 50) {
      setSwipeDirection('right');
    } else if (diff < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection('none');
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const diff = currentX.current - startX.current;
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    if (diff > 100) {
      handleSwipe(true);
    } else if (diff < -100) {
      handleSwipe(false);
    } else {
      // Reset position
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0)';
      }
      setSwipeDirection('none');
    }
  };

  // Mouse handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
      cardRef.current.style.transition = 'none';
    }
    
    if (diff > 50) {
      setSwipeDirection('right');
    } else if (diff < -50) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection('none');
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    const diff = currentX.current - startX.current;
    
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out';
    }
    
    if (diff > 100) {
      handleSwipe(true);
    } else if (diff < -100) {
      handleSwipe(false);
    } else {
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0) rotate(0)';
      }
      setSwipeDirection('none');
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'restaurant':
        return <Store className="w-5 h-5" />;
      case 'cuisine':
        return <ChefHat className="w-5 h-5" />;
      case 'dish':
        return <Utensils className="w-5 h-5" />;
    }
  };

  const getConfidenceColor = (confidence: Recommendation['confidence']) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Results screen when all cards are viewed
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col p-6">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors self-start mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Start Over</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="text-center space-y-6">
            <Sparkles className="w-16 h-16 text-rose-400 mx-auto" />
            
            <h2 className="text-3xl font-bold text-gray-800">
              {likedItems.length > 0 ? "Here's What Might Work!" : "Tough Crowd..."}
            </h2>

            {likedItems.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  You liked {likedItems.length} suggestion{likedItems.length > 1 ? 's' : ''}. 
                  Time to present them strategically.
                </p>
                
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                  {likedItems.map((item, idx) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                    >
                      <span className="text-lg font-bold text-green-600">#{idx + 1}</span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                      </div>
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 italic">
                  Suggestion: Start with #{likedItems.length > 1 ? '2' : '1'} so she feels like she's choosing
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  None of these worked? That's okay, the struggle is real.
                </p>
                <p className="text-sm text-gray-500">
                  Maybe try updating the preferences file, or just order pizza anyway.
                </p>
              </div>
            )}

            <button
              onClick={onTryAgain}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>

            {/* Feedback Section */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleFeedbackClick}
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-rose-500 transition-colors mx-auto"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Have suggestions to improve?</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main card view
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {recommendations.length}
        </span>
      </div>

      {/* Message */}
      <p className="text-center text-gray-600 mb-4">{message}</p>

      {/* Skip button */}
      <button
        onClick={handleSkipToResults}
        className="self-center mb-4 flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors text-sm font-medium"
      >
        <Check className="w-4 h-4" />
        I've chosen my food!
      </button>

      {/* Card with swipe */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full relative">
        {/* Swipe direction indicators */}
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-red-500 text-white p-3 rounded-full shadow-lg">
            <ThumbsDown className="w-8 h-8" />
          </div>
        </div>
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-green-500 text-white p-3 rounded-full shadow-lg">
            <ThumbsUp className="w-8 h-8" />
          </div>
        </div>

        <div 
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className={`
            w-full bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none
            transition-all duration-300 ease-out
            ${animation === 'left' ? '-translate-x-full opacity-0 rotate-[-10deg]' : ''}
            ${animation === 'right' ? 'translate-x-full opacity-0 rotate-[10deg]' : ''}
          `}
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-rose-400 to-orange-400 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(currentRec.type)}
              <span className="text-sm capitalize opacity-90">{currentRec.type}</span>
            </div>
            <h3 className="text-2xl font-bold">{currentRec.name}</h3>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4">
            {/* Reason */}
            <p className="text-gray-700 leading-relaxed">
              {currentRec.reason}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {currentRec.tags.map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getConfidenceColor(currentRec.confidence)}`}>
                {currentRec.confidence}
              </span>
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <p className="text-xs text-gray-400 mt-3">
          Swipe or drag the card left/right
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <button
            onClick={() => handleSwipe(false)}
            className="p-5 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 group"
          >
            <ThumbsDown className="w-8 h-8 text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
          
          <button
            onClick={() => handleSwipe(true)}
            className="p-5 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 group"
          >
            <ThumbsUp className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition-colors" />
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-sm text-gray-500 mt-4">
          {likedItems.length > 0 
            ? `${likedItems.length} suggestion${likedItems.length > 1 ? 's' : ''} saved`
            : 'Swipe right to save, left to skip'
          }
        </p>
      </div>
    </div>
  );
}
