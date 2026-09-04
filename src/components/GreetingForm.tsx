import { useState } from "react";
import styles from "./Greetings.module.css";

type Props = Readonly<{ onSubmit: (name: string) => void }>;

export function GreetingForm({ onSubmit }: Props): React.JSX.Element {
  const [name, setName] = useState("");

  return (
    <form
      className={styles["form"]}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name);
        setName("");
      }}
    >
      <label>
        Name{" "}
        <input
          value={name}
          placeholder="Ada"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </label>
      <button type="submit">Add</button>
    </form>
  );
}
