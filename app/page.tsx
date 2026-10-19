import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleDashboardPath(user.role));
  } else {
    redirect("/login");
  }
}
