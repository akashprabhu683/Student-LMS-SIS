import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://student-lms-sis.vercel.app";

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cohort LMS | Unified Learning & Student Portal",
    template: "%s | Cohort LMS",
  },
  description:
    "A modern, focused Learning Management & Student Information System. Track tasks, attendance, grading, project submissions, and live cohort leaderboard.",
  applicationName: "Cohort LMS-SIS",
  authors: [{ name: "Cohort LMS Team" }],
  generator: "Next.js",
  keywords: [
    "LMS",
    "SIS",
    "Student Information System",
    "Learning Management System",
    "Cohort",
    "Student Leaderboard",
    "Attendance Tracking",
    "Assignment Submissions",
    "Education Portal",
  ],
  creator: "Cohort LMS",
  publisher: "Cohort LMS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Cohort LMS-SIS",
    title: "Cohort LMS | Unified Learning & Student Portal",
    description:
      "Modern cohort-based learning platform. Real-time task submissions, attendance records, mentor evaluation, and live competitive leaderboards.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cohort LMS - Unified Learning & Student Portal Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cohort LMS | Unified Learning & Student Portal",
    description:
      "Streamlined LMS for focused cohorts. Real-time tasks, mentor feedback, attendance tracking, and live leaderboards.",
    images: ["/og-image.jpg"],
    creator: "@cohort_lms",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
