import { AppView } from "@/components/app-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: () => <AppView view="dashboard" />,
});
