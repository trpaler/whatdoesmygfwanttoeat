import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onHome: () => void;
}

export function ErrorScreen({ message, onRetry, onHome }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 p-6 rounded-full">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800">
          Well, This Is Awkward...
        </h2>

        {/* Message */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-700">{message}</p>
        </div>

        {/* Humor */}
        <p className="text-gray-500 italic">
          Maybe the universe is telling you to just get pizza.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={onHome}
            className="w-full bg-white text-gray-700 font-semibold py-4 px-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
