import PageHeader from "../../../shared/components/layout/PageHeader";
import StaffAvailabilityControls from "../components/StaffAvailabilityControls";

export default function StaffMenuPage() {
  return (
    <>
      <PageHeader
        title="Menu & Availability"
        description="Mark dishes as Available or Unavailable in real-time"
      />
      <StaffAvailabilityControls />
    </>
  );
}
