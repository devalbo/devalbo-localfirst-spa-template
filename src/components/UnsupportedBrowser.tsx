import styles from "./Notice.module.css";

type Props = Readonly<{ missing: readonly string[] }>;

/** Shown instead of the app when a hard requirement is absent. Never fail silently. */
export function UnsupportedBrowser({ missing }: Props): React.JSX.Element {
  return (
    <div role="alert" className={`${styles["notice"]} ${styles["error"]}`}>
      <h1>Unsupported browser</h1>
      <p>This app needs browser features your browser doesn&rsquo;t provide:</p>
      <ul>
        {missing.map((feature) => (
          <li key={feature}>
            <code>{feature}</code>
          </li>
        ))}
      </ul>
      <p>Try a current version of Chrome, Firefox, or Safari.</p>
    </div>
  );
}
