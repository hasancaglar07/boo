/**
 * PreviewErrorBoundary Component
 *
 * Catches and logs errors in the preview page, providing fallback UI
 * and comprehensive error tracking for debugging.
 */

"use client";

import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

interface PreviewErrorBoundaryI18n {
  errorTitle: string;
  errorDescription: string;
  errorDetailsLabel: string;
  retryButton: string;
  backToLibraryButton: string;
  persistentErrorNote: string;
}

interface PreviewErrorBoundaryInnerProps {
  children: ReactNode;
  slug: string;
  fallback?: ReactNode;
  i18n: PreviewErrorBoundaryI18n;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class PreviewErrorBoundaryInner extends Component<
  PreviewErrorBoundaryInnerProps,
  PreviewErrorBoundaryState
> {
  constructor(props: PreviewErrorBoundaryInnerProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PreviewErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Preview Error Boundary caught an error:", error, errorInfo);
    }

    // Track error event
    trackEvent("preview_error_caught", {
      slug: this.props.slug,
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
    });

    // Update state
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (e.g., Sentry, LogRocket)
    // This is where you would integrate with your error tracking service
    if (typeof window !== "undefined" && window.console) {
      console.group("Preview Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Slug:", this.props.slug);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    // Track retry attempt
    trackEvent("preview_error_retry", {
      slug: this.props.slug,
    });

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page
    window.location.reload();
  };

  render() {
    const { i18n } = this.props;

    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-5" />
                {i18n.errorTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {i18n.errorDescription}
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    {i18n.errorDetailsLabel}
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-64">
                    <div className="text-red-600 mb-2">
                      {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  size="lg"
                >
                  <RefreshCw className="mr-2 size-4" />
                  {i18n.retryButton}
                </Button>
                <Button
                  onClick={() => window.location.href = "/app/library"}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {i18n.backToLibraryButton}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {i18n.persistentErrorNote}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  slug: string;
  fallback?: ReactNode;
}

export function PreviewErrorBoundary({ children, slug, fallback }: PreviewErrorBoundaryProps) {
  const t = useTranslations("PreviewErrorBoundary");
  const i18n: PreviewErrorBoundaryI18n = {
    errorTitle: t("errorTitle"),
    errorDescription: t("errorDescription"),
    errorDetailsLabel: t("errorDetailsLabel"),
    retryButton: t("retryButton"),
    backToLibraryButton: t("backToLibraryButton"),
    persistentErrorNote: t("persistentErrorNote"),
  };
  return (
    <PreviewErrorBoundaryInner slug={slug} fallback={fallback} i18n={i18n}>
      {children}
    </PreviewErrorBoundaryInner>
  );
}

/**
 * usePreviewError Hook
 *
 * Provides error handling for functional components
 */
export function usePreviewError(slug: string) {
  const handleError = (error: Error, context?: string) => {
    trackEvent("preview_manual_error", {
      slug,
      error_message: error.message,
      error_context: context,
      error_stack: error.stack,
    });

    // Log to console
    console.error(`Preview Error (${context || "unknown"}):`, error);
  };

  const handleAsyncError = async (
    asyncOperation: () => Promise<void>,
    context?: string
  ) => {
    try {
      await asyncOperation();
    } catch (error) {
      handleError(error as Error, context);
      throw error; // Re-throw for caller to handle
    }
  };

  return {
    handleError,
    handleAsyncError,
  };
}
