import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { FeedbackProvider } from "./components/ui/Feedback";

// Shared styles, loaded once for the whole app (each page also loads its own CSS)
import "./styles/app.css";
import "./styles/dashboard.css";
import "./styles/tables.css";
import "./styles/lists.css";
import "./styles/page-kit.css";

/* React Query keeps API data cached and shared between pages.
   - retry: one automatic retry for failed loads (not for 401/403, which won't fix themselves)
   - refetchOnWindowFocus: off, so switching browser tabs doesn't reload every page */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </QueryClientProvider>
  </StrictMode>
);
