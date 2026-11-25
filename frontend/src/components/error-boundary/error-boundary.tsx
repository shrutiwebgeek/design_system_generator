import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { errorFallback } from "@/styles/app.styles";

interface ErrorBoundaryProps {
  message: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Keeps a crash, or a lazy chunk that won't load, inside the part that failed. Without
 * one, React unmounts the whole app and the page goes blank. Reloading is the way back:
 * React.lazy remembers a failed import, and a new deploy means new file names.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className={errorFallback}>
        <p>{this.props.message}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Reload the page
        </Button>
      </div>
    );
  }
}
