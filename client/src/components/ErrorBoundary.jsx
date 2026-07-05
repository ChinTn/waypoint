import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/20 text-red-400 font-sans text-sm rounded-xl border border-red-500/30 m-4 w-full">
          <h2 className="text-xl font-bold mb-4 text-white">Frontend Crash!</h2>
          <p className="mb-4 text-white">Please copy and paste this exact error message to the AI:</p>
          <div className="bg-neutral-950/50 p-4 rounded overflow-auto max-h-[400px]">
            <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
            <pre className="mt-2 text-xs opacity-70 text-red-300 whitespace-pre-wrap">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
