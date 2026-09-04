import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./Notice.module.css";

type Props = Readonly<{ children: ReactNode }>;
type State = Readonly<{ error: Error | null }>;

/**
 * Without this, a render error blanks the page silently — the opposite of the
 * fail-loudly rule. Failures should be visible and diagnosable.
 * See docs/devalbo-principles/architecture/DESIGN_AND_DEVELOPMENT.md
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    return (
      <div role="alert" className={`${styles["notice"]} ${styles["error"]}`}>
        <h1>Something broke</h1>
        <p>The app hit an error it could not recover from.</p>
        <pre className={styles["detail"]}>{error.message}</pre>
        <button
          type="button"
          onClick={() => {
            globalThis.location.reload();
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
