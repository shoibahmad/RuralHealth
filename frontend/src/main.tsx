import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initErrorTracking } from "./lib/errorTracking";

// Initialise error tracking before rendering so the sink is ready to capture
// any bootstrap errors. No-ops when the DSN env var is unset.
initErrorTracking();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
