import { createFileRoute, Link } from "@tanstack/react-router";

function Home(): React.JSX.Element {
  return (
    <section>
      <h1>devalbo SPA template</h1>
      <p>
        A local-first, peer-to-peer TypeScript SPA. Everything works offline from first load, with
        no server and no account.
      </p>
      <p>
        <Link to="/greetings">Greetings</Link> is a worked example of the whole stack: a Zod schema,
        a TinyBase store, a command returning a structured result, and a component that calls the
        command rather than writing to the store itself.
      </p>
    </section>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
