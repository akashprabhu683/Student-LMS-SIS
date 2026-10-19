import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cohort LMS | Unified Learning Portal",
  description: "Track progress, tasks, attendance, and leaderboard for your cohort.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
