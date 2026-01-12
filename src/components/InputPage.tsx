import { useState, useRef } from 'react';
import { Upload, FileJson, FileSpreadsheet, FileText, ArrowLeft, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import type { ParseResult } from '../types';
import { parseFile, parseTextInput } from '../utils/fileParsers';
import { logger } from '../services/logger';

interface InputPageProps {
  onDataProcessed: (result: ParseResult) => void;
  onBack: () => void;
}

const EXAMPLE_FORMAT = `Example format (copy and modify):

Joe's Pizza
Pad Thai Palace
Sushi Garden
Italian food
Thai cuisine
Ramen

dislike: Spicy food
dislike: Cilantro
avoid: Fast food chains

mood: Comfort food
mood: Date night`;

export function InputPage({ onDataProcessed, onBack }: InputPageProps) {
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      setError('Please enter some food preferences or upload a file.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    logger.info('text_input_submitted', {
      length: textInput.length,
      lineCount: textInput.split('\n').length,
    });

    try {
      const result = parseTextInput(textInput);
      
      if (result.success) {
        logger.info('text_input_parsed', {
          preferences: result.data?.preferences.length,
          restaurants: result.data?.restaurants.length,
          dislikes: result.data?.dislikes.length,
        });
        onDataProcessed(result);
      } else {
        setError(result.error || 'Failed to parse input');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const result = await parseFile(file);
      
      if (result.success) {
        onDataProcessed(result);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const copyExample = () => {
    setTextInput(EXAMPLE_FORMAT.split('\n\n')[1]); // Just the example, not the header
    setShowExample(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 pb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full overflow-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            What Does She Like?
          </h2>
          <p className="text-gray-600">
            Enter her food preferences below or upload order history
          </p>
        </div>

        {/* Text Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Quick Input
            </label>
            <button
              onClick={() => setShowExample(!showExample)}
              className="flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Show format</span>
              {showExample ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Example Format */}
          {showExample && (
            <div className="mb-3 bg-gray-50 rounded-lg p-3 text-sm">
              <pre className="text-gray-600 whitespace-pre-wrap font-mono text-xs">
                {EXAMPLE_FORMAT}
              </pre>
              <button
                onClick={copyExample}
                className="mt-2 text-rose-500 hover:text-rose-600 text-xs font-medium"
              >
                Use this template
              </button>
            </div>
          )}

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Enter restaurants, cuisines, or dishes she likes...

Example:
Joe's Pizza
Thai food
Sushi
dislike: Spicy food
mood: Comfort food`}
            className="w-full h-40 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm"
            disabled={isProcessing}
          />

          <p className="text-xs text-gray-500 mt-2">
            Tip: Add "dislike:" or "avoid:" before items she doesn't want. Add "mood:" for vibes.
          </p>

          <button
            onClick={handleTextSubmit}
            disabled={isProcessing || !textInput.trim()}
            className="w-full mt-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? 'Processing...' : 'Get Suggestions'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or upload order history</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* File Upload Section */}
        <div
          onClick={handleFileClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full p-6 rounded-xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-3
            transition-all duration-200
            ${isDragging 
              ? 'border-rose-400 bg-rose-50' 
              : 'border-gray-200 bg-white/50 hover:border-rose-300 hover:bg-white/80'
            }
            ${isProcessing ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.pdf,.docx,.doc"
            onChange={handleInputChange}
            className="hidden"
          />

          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-rose-200 border-t-rose-500" />
              <p className="text-gray-600 text-sm">Processing file...</p>
            </>
          ) : (
            <>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-rose-500' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className="text-gray-700 font-medium text-sm">
                  {isDragging ? 'Drop it!' : 'Click or drag file here'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Supports JSON, CSV, PDF, DOCX
                </p>
              </div>
            </>
          )}
        </div>

        {/* File Format Info */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <FileJson className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">JSON</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <FileSpreadsheet className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">CSV</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <FileText className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">PDF</p>
          </div>
          <div className="bg-white/60 rounded-lg p-2 text-center">
            <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-gray-600">DOCX</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium text-sm">Oops!</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
