import { useState, useEffect } from 'react';
import { ChefHat } from 'lucide-react';

const LOADING_MESSAGES = [
  "She said 'anything'... interpreting that...",
  "Processing 'I don't know'...",
  "Cross-referencing cravings vs reality...",
  "Consulting the oracle...",
  "Eliminating all 50 places she doesn't want...",
  "Running advanced girlfriend satisfaction algorithms...",
  "Calculating 'I'm not that hungry' to actual hunger ratio...",
  "Filtering out everything she had this week...",
  "Analyzing mood from last 3 text messages...",
  "Decoding 'whatever you want' (spoiler: it's never whatever you want)...",
  "Searching for options that aren't 'too far'...",
  "Removing places that are 'too crowded on weekends'...",
  "Factoring in the 'I had a big lunch' variable...",
  "Checking if it's too late for breakfast food (it's never too late)...",
  "Preparing suggestions that sound like her idea...",
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-6 rounded-full shadow-lg animate-pulse">
              <ChefHat className="w-16 h-16 text-white" />
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-400 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800">
          Finding the Perfect Suggestion...
        </h2>

        {/* Rotating Message */}
        <div className="h-16 flex items-center justify-center">
          <p 
            key={messageIndex}
            className="text-gray-600 animate-fade-in"
          >
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-400 to-orange-400 rounded-full animate-loading-bar"
          />
        </div>

        {/* Tip */}
        <p className="text-sm text-gray-500 italic">
          Pro tip: Act like you came up with the suggestion yourself
        </p>
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-loading-bar {
          animation: loading-bar 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
