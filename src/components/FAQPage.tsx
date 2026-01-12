import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQPageProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Will this actually solve the problem?",
    answer: "No guarantees, but it's better than suggesting Chipotle for the 47th time. The app uses her actual preferences to make weighted suggestions - places she visits more often are more likely to come up. It's science... sort of.",
  },
  {
    question: "Can I use this for my boyfriend/partner/roommate?",
    answer: "Absolutely. The struggle is universal. Whether it's your girlfriend, boyfriend, spouse, roommate, or that one friend who can never decide - this app works for everyone who's ever said \"I don't know, anything.\"",
  },
  {
    question: "What if she says \"not that\" to every suggestion?",
    answer: "There's a \"Try Again\" button. Use it liberally. Each time you hit it, you'll get a fresh set of recommendations based on her preferences. The algorithm shuffles things around, so you might find a winner on the second (or tenth) try.",
  },
  {
    question: "Does this store my data?",
    answer: "Nope. Everything stays in your browser session. We don't have servers, we don't have databases, and we definitely don't have commitment issues about your data. When you close the tab, it's gone. Privacy level: maximum.",
  },
  {
    question: "What file formats are supported?",
    answer: "We support JSON, CSV, and PDF/DOCX files. JSON works best for structured data, CSV is great for spreadsheets, and PDF/DOCX is for when you've got a text document with food preferences. The app will do its best to extract useful information from whatever you throw at it.",
  },
  {
    question: "How does the recommendation algorithm work?",
    answer: "It's weighted random selection based on frequency. If she's ordered from Joe's Pizza 15 times and Thai Palace 5 times, Joe's Pizza is 3x more likely to be recommended. The more data you feed it, the smarter it gets. No AI, no API costs - just math.",
  },
  {
    question: "What should I put in the preferences file?",
    answer: "Anything food-related! Restaurant names, cuisine types (Italian, Thai, etc.), specific dishes she likes, places to avoid, mood tags (comfort food, healthy, adventurous). The more data, the better the recommendations. Check the README for format examples.",
  },
  {
    question: "Why do some suggestions have low confidence?",
    answer: "Confidence is based on frequency. If something only appears once in her data, it's a \"low confidence\" pick - basically a wild card. High confidence items are things she's ordered or mentioned many times. Mix of both keeps things interesting!",
  },
  {
    question: "Can I export or share my results?",
    answer: "Not yet, but you can screenshot! We're keeping things simple for now. The app is meant to be a quick decision helper, not a permanent record of your food indecision journey.",
  },
  {
    question: "Is there a mobile app?",
    answer: "This IS the mobile app! It's a web app that works great on phones. Just open it in your browser, add it to your home screen if you want, and you're good to go. No app store required.",
  },
  {
    question: "What's with the dev dashboard?",
    answer: "Press Ctrl+Shift+D (or add ?dev=true to the URL) to open the developer dashboard. It shows all the events and logs from your session - useful for debugging or just seeing what's happening under the hood. You can export logs as JSON if you need help troubleshooting.",
  },
  {
    question: "The app isn't working. What do I do?",
    answer: "First, try refreshing the page. If that doesn't work, open the dev dashboard (Ctrl+Shift+D), export your logs, and check for errors. The logs are formatted to be AI-friendly, so you can even ask Claude or ChatGPT to help diagnose the issue!",
  },
];

export function FAQPage({ onBack }: FAQPageProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-4 rounded-full shadow-lg">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600">
            Everything you wanted to know but were too hungry to ask
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleExpanded(index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800 pr-4">
                  {faq.question}
                </span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {expandedIndex === index && (
                <div className="px-4 pb-4">
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Still have questions? Check out the{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-500 hover:text-rose-600 underline"
            >
              GitHub repo
            </a>
            {' '}or just wing it. That's what we do with dinner anyway.
          </p>
        </div>
      </div>
    </div>
  );
}
