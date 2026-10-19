export const instant = false; // allow blocking prerender for cookie-based redirect

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "MENTOR") {
      redirect("/dashboard/mentor");
    } else {
      redirect("/dashboard/student");
    }
  } else {
    redirect("/login");
  }
}
