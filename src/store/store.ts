import { createStore, type Store } from "tinybase";
import { createLocalPersister } from "tinybase/persisters/persister-browser";

/**
 * Storage layout is a contract. These names are the app's persisted API —
 * changing one is a migration, not an edit.
 * See docs/devalbo-principles/principles/PRINCIPLES_AND_GOALS.md
 */
export const TABLES = {
  greetings: "greetings",
} as const;

export const STORAGE_KEY = "devalbo-spa-template";

export function createAppStore(): Store {
  return createStore().setTablesSchema({
    [TABLES.greetings]: {
      name: { type: "string" },
      createdAt: { type: "string" },
    },
  });
}

/**
 * Attaches browser persistence and hydrates. Browser-only: never call this at
 * module scope, or it runs during a test's module load.
 */
export async function persistStore(store: Store): Promise<() => void> {
  const persister = createLocalPersister(store, STORAGE_KEY);
  await persister.startAutoLoad();
  await persister.startAutoSave();
  return () => {
    void persister.destroy();
  };
}
