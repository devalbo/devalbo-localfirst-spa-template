import "@/styles/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Provider } from "tinybase/ui-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UnsupportedBrowser } from "@/components/UnsupportedBrowser";
import { addGreeting, listGreetings, removeGreeting } from "@/commands/greetings";
import { createAppStore, persistStore } from "@/store/store";
import { checkPlatformSupport } from "@/utils/platform";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const container = document.querySelector("#root");
if (container === null) {
  // An "impossible" state: index.html always ships this element. Throw rather
  // than degrade — a silent no-render is far harder to diagnose.
  throw new Error("#root is missing from index.html");
}

const root = createRoot(container);
const support = checkPlatformSupport();

if (support.supported) {
  const store = createAppStore();

  // Browser-only APIs, kept out of module scope so tests and any prerender pass.
  void persistStore(store);

  if (import.meta.env.DEV) {
    // The command surface, drivable from the console by a person or an agent.
    // See docs/devalbo-principles/architecture/COMMAND_LAYER.md
    const ctx = { store, now: () => new Date(), newId: () => crypto.randomUUID() };
    Object.assign(globalThis, {
      app: {
        store,
        addGreeting: (name: string) => addGreeting(ctx, { name }),
        listGreetings: () => listGreetings(ctx),
        removeGreeting: (id: string) => removeGreeting(ctx, id),
      },
    });
  }

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  root.render(<UnsupportedBrowser missing={support.missing} />);
}
