import { UtensilsCrossed, HelpCircle } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
  onFAQ: () => void;
}

export function HomePage({ onStart, onFAQ }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-6 rounded-full shadow-lg">
            <UtensilsCrossed className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            What Does My GF Want to Eat?
          </h1>
          <p className="text-lg text-gray-600">
            The app that finally answers the question you ask every single day.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="space-y-2 text-left text-gray-700">
            <p><span className="font-medium">You:</span> "What do you want to eat?"</p>
            <p><span className="font-medium">Her:</span> "I don't know, anything."</p>
            <p><span className="font-medium">You:</span> "How about pizza?"</p>
            <p><span className="font-medium">Her:</span> "No, not that."</p>
            <p className="text-gray-500 italic pt-2">*internal screaming*</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-lg"
        >
          Let's Figure This Out
        </button>

        {/* Subtext */}
        <p className="text-sm text-gray-500">
          Upload her food preferences. Get suggestions. Save your sanity.
        </p>

        {/* FAQ Link */}
        <button
          onClick={onFAQ}
          className="flex items-center justify-center gap-2 text-rose-500 hover:text-rose-600 transition-colors mx-auto font-medium"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm underline underline-offset-2">Frequently Asked Questions</span>
        </button>
      </div>
    </div>
  );
}
