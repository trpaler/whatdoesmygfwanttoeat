import { useState, useCallback, useEffect } from 'react';
import type { AppState, FoodPreferences, Recommendation, ParseResult } from './types';
import { getRecommendations } from './services/api';
import { trackNavigation, trackButtonClick, trackTryAgainClicked, trackError } from './services/analytics';
import { HomePage } from './components/HomePage';
import { InputPage } from './components/InputPage';
import { LoadingScreen } from './components/LoadingScreen';
import { RecommendationCard } from './components/RecommendationCard';
import { ErrorScreen } from './components/ErrorScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DevDashboard } from './components/DevDashboard';
import { FAQPage } from './components/FAQPage';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('home');
  const [preferences, setPreferences] = useState<FoodPreferences | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDevDashboard, setShowDevDashboard] = useState(false);
  const [swipeStats, setSwipeStats] = useState({ accepted: 0, rejected: 0 });

  // Check for dev mode via URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      setShowDevDashboard(true);
    }
  }, []);

  // Keyboard shortcut for dev dashboard (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevDashboard(prev => !prev);
      }
      // Also close with Escape
      if (e.key === 'Escape' && showDevDashboard) {
        setShowDevDashboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDevDashboard]);

  // Track state changes
  const changeState = useCallback((newState: AppState, from: string) => {
    trackNavigation(from, newState);
    setAppState(newState);
  }, []);

  const handleStart = useCallback(() => {
    trackButtonClick('lets_figure_this_out', { from: 'home' });
    changeState('upload', 'home');
  }, [changeState]);

  const handleFAQ = useCallback(() => {
    trackButtonClick('faq', { from: 'home' });
    changeState('faq', 'home');
  }, [changeState]);

  const handleBack = useCallback(() => {
    trackButtonClick('back_to_home', { from: appState });
    setAppState('home');
    setPreferences(null);
    setRecommendations([]);
    setMessage('');
    setError('');
    setSwipeStats({ accepted: 0, rejected: 0 });
  }, [appState]);

  const handleDataProcessed = useCallback(async (result: ParseResult) => {
    if (!result.success || !result.data) {
      setError(result.error || 'Failed to process input');
      trackError('data_processing', 'InputPage', new Error(result.error || 'Unknown error'));
      changeState('error', 'upload');
      return;
    }

    setPreferences(result.data);
    changeState('loading', 'upload');

    try {
      const response = await getRecommendations(result.data);
      setRecommendations(response.recommendations);
      setMessage(response.message);
      changeState('recommendations', 'loading');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      trackError('get_recommendations', 'App', err instanceof Error ? err : new Error(errorMessage));
      changeState('error', 'loading');
    }
  }, [changeState]);

  const handleTryAgain = useCallback(async () => {
    trackTryAgainClicked(swipeStats.rejected, swipeStats.accepted);
    trackButtonClick('try_again', { 
      from: appState,
      previousAccepted: swipeStats.accepted,
      previousRejected: swipeStats.rejected,
    });
    
    // Reset swipe stats
    setSwipeStats({ accepted: 0, rejected: 0 });

    if (!preferences) {
      changeState('upload', appState);
      return;
    }

    changeState('loading', appState);

    try {
      const response = await getRecommendations(preferences);
      setRecommendations(response.recommendations);
      setMessage(response.message);
      changeState('recommendations', 'loading');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      trackError('get_recommendations_retry', 'App', err instanceof Error ? err : new Error(errorMessage));
      changeState('error', 'loading');
    }
  }, [preferences, appState, swipeStats, changeState]);

  const handleRetry = useCallback(() => {
    trackButtonClick('retry_after_error', { from: 'error' });
    if (preferences) {
      handleTryAgain();
    } else {
      changeState('upload', 'error');
    }
  }, [preferences, handleTryAgain, changeState]);

  const handleSwipeStatsUpdate = useCallback((accepted: number, rejected: number) => {
    setSwipeStats({ accepted, rejected });
  }, []);

  // Render based on current state
  const renderContent = () => {
    switch (appState) {
      case 'home':
        return <HomePage onStart={handleStart} onFAQ={handleFAQ} />;
      
      case 'upload':
        return <InputPage onDataProcessed={handleDataProcessed} onBack={handleBack} />;
      
      case 'loading':
        return <LoadingScreen />;
      
      case 'recommendations':
        return (
          <RecommendationCard
            recommendations={recommendations}
            message={message}
            onTryAgain={handleTryAgain}
            onBack={handleBack}
            onSwipeStatsUpdate={handleSwipeStatsUpdate}
          />
        );
      
      case 'error':
        return (
          <ErrorScreen
            message={error}
            onRetry={handleRetry}
            onHome={handleBack}
          />
        );
      
      case 'faq':
        return <FAQPage onBack={handleBack} />;
      
      default:
        return <HomePage onStart={handleStart} onFAQ={handleFAQ} />;
    }
  };

  return (
    <>
      {renderContent()}
      {showDevDashboard && (
        <DevDashboard onClose={() => setShowDevDashboard(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
