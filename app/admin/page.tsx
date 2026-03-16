import { redirect } from "next/navigation";
import { getCurrentAdminContext } from "@/lib/admin/access";
import AdminDashboardClient from "./AdminDashboardClient";

// export const dynamic = "force-dynamic"; // COST-FIX: removed
export const revalidate = 60; // COST-FIX: 1 min cache for admin

export default async function AdminPage() {
  const adminContext = await getCurrentAdminContext();

  if (!adminContext) {
    redirect("/admin/login?next=%2Fadmin");
  }

  return (
    <AdminDashboardClient
      currentRole={adminContext.role}
      currentUserId={adminContext.userId}
    />
  );
}
