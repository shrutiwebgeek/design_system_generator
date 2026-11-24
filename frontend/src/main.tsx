import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/error-boundary/error-boundary";
import { TooltipProvider } from "./components/ui/tooltip";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

const queryClient = new QueryClient();

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary message="Something went wrong.">
      <QueryClientProvider client={queryClient}>
        {/* shadcn's provider sets the open delay to 0 for every tooltip. */}
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
