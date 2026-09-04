import { createFileRoute } from "@tanstack/react-router";
import { GreetingsPanel } from "@/components/GreetingsPanel";

export const Route = createFileRoute("/greetings")({
  component: GreetingsPanel,
});
