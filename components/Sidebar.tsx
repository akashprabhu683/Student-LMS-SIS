"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Building,
  BookOpen,
  CalendarCheck,
  FileText,
  UserCheck,
  Bell,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  role: "SUPER_ADMIN" | "DEPARTMENT_ADMIN" | "FACULTY" | "MENTOR" | "STUDENT";
  userName?: string;
  userEmail?: string;
}

export default function DashboardSidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const getLinks = () => {
    switch (role) {
      case "SUPER_ADMIN":
        return [
          { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
          { name: "User Directory", href: "/dashboard/admin/users", icon: Users },
          { name: "Departments", href: "/dashboard/admin/departments", icon: Building },
          { name: "Classes & Batches", href: "/dashboard/admin/classes", icon: BookOpen },
          { name: "Audit Logs", href: "/dashboard/admin/audits", icon: FileText },
        ];
      case "DEPARTMENT_ADMIN":
        return [
          { name: "Overview", href: "/dashboard/department", icon: LayoutDashboard },
          { name: "Department Faculty", href: "/dashboard/department/faculty", icon: Users },
          { name: "Student Records", href: "/dashboard/department/students", icon: GraduationCap },
          { name: "Mentor Allocation", href: "/dashboard/department/mentors", icon: UserCheck },
          { name: "Attendance Overview", href: "/dashboard/department/attendance", icon: CalendarCheck },
        ];
      case "FACULTY":
      case "MENTOR":
        return [
          { name: "Overview", href: role === "MENTOR" ? "/dashboard/mentor" : "/dashboard/faculty", icon: LayoutDashboard },
          { name: "Mark Attendance", href: "/dashboard/faculty/attendance", icon: CalendarCheck },
          { name: "Assignments", href: "/dashboard/faculty/assignments", icon: FileText },
          { name: "Submissions & Grades", href: "/dashboard/faculty/submissions", icon: BookOpen },
          ...(role === "MENTOR" ? [{ name: "My Mentees", href: "/dashboard/mentor/mentees", icon: UserCheck }] : []),
        ];
      case "STUDENT":
        return [
          { name: "My Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
          { name: "My Attendance", href: "/dashboard/student/attendance", icon: CalendarCheck },
          { name: "Assignments", href: "/dashboard/student/assignments", icon: FileText },
          { name: "Grades & Progress", href: "/dashboard/student/grades", icon: BookOpen },
          { name: "My Mentor", href: "/dashboard/student/mentor", icon: UserCheck },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-slate-100 tracking-tight">EduPulse LMS</span>
          <span className="block text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
            {role.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{userName || "User"}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail || "user@institution.edu"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
