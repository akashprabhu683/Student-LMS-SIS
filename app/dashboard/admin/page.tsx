"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/Sidebar";
import { Users, Building, BookOpen, FileCheck, Shield, Plus, RefreshCw } from "lucide-react";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "Password123!",
    role: "FACULTY",
  });
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, statsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/dashboard/stats"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentAudits(statsData.recentAudits || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setFormMsg("User provisioned successfully!");
      setNewUser({ name: "", email: "", password: "Password123!", role: "FACULTY" });
      setTimeout(() => {
        setShowUserModal(false);
        setFormMsg(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setFormMsg(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <DashboardSidebar role="SUPER_ADMIN" userName={user?.name} userEmail={user?.email} />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Super Administrator Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">
              Institution-wide governance, system metrics, and administrative audit trails
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision User</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.totalStudents ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Enrolled across all programs</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faculty & Mentors</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.totalFaculty ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active academic staff</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.totalDepartments ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active academic divisions</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Classes</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.totalClasses ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Registered class sections</p>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-200">System Audit Trail</h2>
              <p className="text-xs text-slate-400">Cryptographically verifiable actions and governance logs</p>
            </div>
            <FileCheck className="w-5 h-5 text-slate-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentAudits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  recentAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-indigo-400 font-medium">{audit.action}</td>
                      <td className="py-3 px-4 text-slate-300">{audit.entity}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {audit.performedBy?.name || audit.performedBy?.email || "System"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{audit.notes || "—"}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(audit.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Provision User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1">Provision Institutional User</h3>
            <p className="text-xs text-slate-400 mb-4">Create verified accounts with server-assigned privileges</p>

            {formMsg && (
              <div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@ait.edu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                >
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="DEPARTMENT_ADMIN">Department Administrator / HOD</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="MENTOR">Mentor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
