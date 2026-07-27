import { STAFF_ROLE_LABELS } from "@/lib/labels";
import { requireStaff } from "@/lib/auth/staff";
import { StaffSidebar } from "@/components/staff/sidebar";

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <StaffSidebar
        staffName={staff.nome}
        groupName={staff.group.nome}
        roleLabel={STAFF_ROLE_LABELS[staff.ruolo]}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
