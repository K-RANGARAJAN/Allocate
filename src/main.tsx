// Scaffold only. Owned by the interface half (Ranga).

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("index.html is missing its #root element");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
