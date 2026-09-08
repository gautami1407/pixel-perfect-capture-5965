import { AppView } from "@/components/app-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/inspections/$inspectionId")({
  component: InspectionDetail,
});

function InspectionDetail() {
  const { inspectionId } = Route.useParams();
  return <AppView view="inspection" inspectionId={inspectionId} />;
}
