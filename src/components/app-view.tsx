import { LpsWorkspace } from "@/components/lps-workspace";
import type { ViewKey } from "@/types/lps";

export function AppView({ view, inspectionId }: { view: ViewKey; inspectionId?: string }) {
  return <LpsWorkspace initialView={view} inspectionId={inspectionId} />;
}
