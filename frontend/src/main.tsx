import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Default to dark mode (the `.dark` class is already on <html> in index.html,
// but enforce it here as a belt-and-braces measure).
document.documentElement.classList.add("dark");

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
