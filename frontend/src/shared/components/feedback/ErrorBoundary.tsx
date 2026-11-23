import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-3">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Something went wrong</h3>
          <p className="mt-1 max-w-md text-xs text-muted">
            An unexpected error occurred in this view. Your account, orders, and payment data remain secure.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              <RotateCcw className="mr-1.5 size-3.5" />
              Try Again
            </Button>
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
