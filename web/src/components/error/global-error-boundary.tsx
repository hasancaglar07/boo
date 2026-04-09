/**
 * Global Error Boundary
 *
 * Catches errors anywhere in the app and provides fallback UI
 */

"use client";

import { Component, ReactNode } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error
    trackEvent("global_error_caught", {
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
    });

    // Log to console
    console.error("Global Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    trackEvent("global_error_reset");
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    trackEvent("global_error_go_home");
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                An unexpected error occurred. We're sorry for the inconvenience.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-64">
                    {this.state.error.toString()}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="primary" className="flex-1">
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 size-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * useErrorHandler Hook
 *
 * Provides error handling for functional components
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    trackEvent("manual_error_reported", {
      error_message: error.message,
      error_context: context,
      error_stack: error.stack,
    });

    console.error(`Manual error report (${context || "unknown"}):`, error);
  };

  return {
    handleError,
  };
}
