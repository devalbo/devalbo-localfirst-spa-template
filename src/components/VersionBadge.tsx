import styles from "./VersionBadge.module.css";

/**
 * Build identity, always visible. A deployed SPA otherwise gives you no way to
 * answer "is the user looking at the fix I shipped?"
 * See docs/devalbo-principles/operations/VERSIONING.md
 */
export function VersionBadge(): React.JSX.Element {
  const built = new Date(__BUILD_TIMESTAMP__);
  const branch = __GIT_BRANCH__ === "main" ? "" : ` (${__GIT_BRANCH__})`;

  return (
    <footer className={styles["badge"]}>
      <span title={built.toISOString()}>
        v{__APP_VERSION__} · {__GIT_COMMIT_SHA__}
        {branch} · built {built.toLocaleDateString()}
      </span>
    </footer>
  );
}
