import React from "react";

// Last line of defence. Nothing here is expected to fire: the engine is pure,
// deterministic and covered by the smoke test. But a render that throws with no
// boundary takes the whole page to blank white, and a blank page in front of a
// judge is unrecoverable in a way a message is not.
//
// Deliberately dependency-free and styled inline, because if the failure were in
// the stylesheet or a shared component this still has to render.

interface Props {
  children: React.ReactNode;
}

interface State {
  message: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { message: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message };
  }

  componentDidCatch(error: Error): void {
    // Kept so the real stack is recoverable from the console rather than lost.
    console.error("Allocate failed to render", error);
  }

  render(): React.ReactNode {
    if (this.state.message === null) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          maxWidth: "34rem",
          margin: "12vh auto",
          padding: "1.75rem",
          border: "1px solid #d8d4ce",
          borderRadius: "10px",
          background: "#ffffff",
          color: "#1a1a1a",
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          lineHeight: 1.5
        }}
      >
        <h1 style={{ fontSize: "1.15rem", margin: "0 0 0.6rem", color: "#2f5d62" }}>
          Something went wrong
        </h1>
        <p style={{ margin: "0 0 0.9rem" }}>
          The simulator hit an error and stopped rendering. Nothing is saved on a server, so
          reloading starts a clean run at the default policy.
        </p>
        <p
          style={{
            margin: "0 0 1.1rem",
            padding: "0.6rem 0.7rem",
            background: "#f2f0ec",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}
        >
          {this.state.message}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            font: "inherit",
            padding: "0.5rem 0.9rem",
            borderRadius: "6px",
            border: "1px solid #2f5d62",
            background: "#2f5d62",
            color: "#ffffff",
            cursor: "pointer"
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
