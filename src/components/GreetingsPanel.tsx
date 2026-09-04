import { useState } from "react";
import { useStore, useTable } from "tinybase/ui-react";
import { addGreeting, removeGreeting } from "@/commands/greetings";
import type { CommandContext } from "@/commands/types";
import { GreetingForm } from "./GreetingForm";
import styles from "./Greetings.module.css";
import { GreetingList } from "./GreetingList";

function useCommandContext(): CommandContext {
  const store = useStore();
  if (store === undefined) {
    throw new Error("GreetingsPanel rendered outside a TinyBase Provider");
  }
  return { store, now: () => new Date(), newId: () => crypto.randomUUID() };
}

export function GreetingsPanel(): React.JSX.Element {
  const rows = useTable("greetings");
  const ctx = useCommandContext();
  const [error, setError] = useState<string | null>(null);

  const submit = (name: string): void => {
    // The component calls a command; it never writes to the store directly.
    const result = addGreeting(ctx, { name });
    setError(result.success ? null : (result.error?.message ?? "Unknown error"));
  };

  return (
    <section>
      <h2>Greetings</h2>
      <GreetingForm onSubmit={submit} />
      {error !== null && (
        <p role="alert" className={styles["error"]}>
          {error}
        </p>
      )}
      <GreetingList
        rows={rows}
        onRemove={(id) => {
          removeGreeting(ctx, id);
        }}
      />
    </section>
  );
}
