import type { Row } from "tinybase";
import styles from "./Greetings.module.css";

type Props = Readonly<{
  rows: Readonly<Record<string, Row>>;
  onRemove: (id: string) => void;
}>;

export function GreetingList({ rows, onRemove }: Props): React.JSX.Element {
  const entries = Object.entries(rows);

  if (entries.length === 0) {
    return (
      <p className={styles["empty"]}>
        Nothing yet — add one. It persists across reloads, with no server.
      </p>
    );
  }

  return (
    <ul className={styles["list"]}>
      {entries.map(([id, row]) => (
        <li key={id} className={styles["item"]}>
          <span>Hello, {typeof row["name"] === "string" ? row["name"] : "(unnamed)"}</span>
          <button
            type="button"
            onClick={() => {
              onRemove(id);
            }}
          >
            remove
          </button>
        </li>
      ))}
    </ul>
  );
}
