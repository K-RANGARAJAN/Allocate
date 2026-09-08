import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";
import "./styles/shell.css";
import "./styles/metrics.css";
import "./styles/tables.css";
import "./styles/comparison.css";
import "./styles/equity.css";
import "./styles/animation.css";
import "./styles/home.css";
import "./styles/hint.css";

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
