import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { VersionBadge } from "@/components/VersionBadge";
import styles from "./__root.module.css";

function RootLayout(): React.JSX.Element {
  return (
    <div className={styles["shell"]}>
      <nav className={styles["nav"]}>
        <Link to="/">Home</Link>
        <Link to="/greetings">Greetings</Link>
      </nav>
      <main>
        <Outlet />
      </main>
      <VersionBadge />
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <p>No such page.</p>,
});
