import type { FallbackProps } from "react-error-boundary";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  // Preserve the development dialog and its original exception.
  if (import.meta.env.DEV) throw error;

  // Do not read or render exception properties in production. Messages and
  // stacks can contain financial data, credentials, or upstream response bodies.
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>This spark has encountered a runtime error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. Please try again. If the problem persists, contact the spark author without including passwords or financial account details.
          </AlertDescription>
        </Alert>

        <Button
          onClick={resetErrorBoundary}
          className="w-full"
          variant="outline"
        >
          <RefreshCwIcon />
          Try Again
        </Button>
      </div>
    </div>
  );
}
