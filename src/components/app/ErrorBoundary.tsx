import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import SpecterBrand from "@/components/specter/SpecterBrand";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("Specter render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
          <div>
            <SpecterBrand size="lg" className="justify-center" />
            <h1 className="mt-6 text-2xl font-medium">Something went wrong.</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reload Specter to restore the current workspace.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

