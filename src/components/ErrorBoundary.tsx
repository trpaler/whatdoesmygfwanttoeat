import { Component, type ReactNode } from 'react';
import { trackReactCrash } from '../services/analytics';
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the crash
    trackReactCrash(error, errorInfo.componentStack || '');
    
    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="bg-red-100 p-6 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800">
              Oops! Something Went Wrong
            </h2>

            {/* Message */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 text-left">
              <p className="text-gray-700 mb-4">
                The app crashed unexpectedly. Don't worry, your data is safe.
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-mono text-red-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Try refreshing the page or going back to the home screen.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-white text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
                >
                  <Home className="w-5 h-5" />
                  Home
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-white text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
                >
                  <Bug className="w-5 h-5" />
                  Reload
                </button>
              </div>
            </div>

            {/* Dev hint */}
            <p className="text-xs text-gray-400">
              Press Ctrl+Shift+D to view error logs
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
