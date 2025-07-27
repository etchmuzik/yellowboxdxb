#\!/bin/bash

# Sub-Agent 5: Error Handling & Loading States
echo "[$(date)] Sub-Agent-5: Starting error handling implementation..." >> logs/task-005.log

# Create error boundary component
echo "Creating ErrorBoundary component..."
cat > src/components/ErrorBoundary.tsx << 'ERRORBOUNDARY'
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log to error service
    if (window.errorService) {
      window.errorService.logError(error, { errorInfo });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="bg-muted p-4 rounded text-left text-sm">
              <code>{this.state.error?.message}</code>
            </div>
            <Button onClick={this.handleReset}>Refresh Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
ERRORBOUNDARY

# Create loading states component
echo "Creating loading states..."
cat > src/components/ui/loading-states.tsx << 'LOADING'
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
    />
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

interface CardLoaderProps {
  count?: number;
}

export function CardLoader({ count = 3 }: CardLoaderProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function TableLoader() {
  return (
    <div className="space-y-2">
      <div className="h-10 bg-muted rounded animate-pulse"></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/50 rounded animate-pulse"></div>
      ))}
    </div>
  );
}
LOADING

# Update App.tsx to use ErrorBoundary
echo "Updating App.tsx with ErrorBoundary..."
sed -i.bak '1i\import { ErrorBoundary } from "@/components/ErrorBoundary";' src/App.tsx
sed -i.bak 's/<BrowserRouter>/<ErrorBoundary>\n        <BrowserRouter>/' src/App.tsx
sed -i.bak 's/<\/BrowserRouter>/<\/BrowserRouter>\n      <\/ErrorBoundary>/' src/App.tsx

echo "[$(date)] Sub-Agent-5: Error handling implementation completed" >> logs/task-005.log
echo "[$(date)] TASK-005: COMPLETED - Error boundaries and loading states added" >> logs/task-completion.log

echo "✓ Error handling implementation completed\!"
