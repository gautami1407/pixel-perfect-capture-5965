import { createFileRoute } from "@tanstack/react-router";

import { AppView } from "@/components/app-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LPS Compliance Intelligence | Inspection Workspace" },
      {
        name: "description",
        content: "Evidence-first preliminary Legal Metrology compliance screening for inspection teams.",
      },
    ],
  }),
  component: () => <AppView view="dashboard" />,
});
