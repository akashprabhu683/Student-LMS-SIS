"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/Sidebar";
import { CheckCircle2, FileText, UserCheck, Percent, BookOpen, Clock, RefreshCw } from "lucide-react";

export default function StudentDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [mentor, setMentor] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [textResponse, setTextResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, statsRes, assignRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/dashboard/stats"),
        fetch("/api/assignments"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setMentor(statsData.mentor);
        setSubmissions(statsData.recentSubmissions || []);
      }
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(assignData.assignments || []);
      }
    } catch (err) {
      console.error("Student fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setSubmitMsg(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          textResponse,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitMsg("Assignment submitted successfully!");
      setTimeout(() => {
        setSelectedAssignment(null);
        setTextResponse("");
        setSubmitMsg(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <DashboardSidebar role="STUDENT" userName={user?.name} userEmail={user?.email} />

      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Student Academic Workspace</h1>
            <p className="text-xs text-slate-400 mt-1">
              Course materials, live attendance ratios, submissions, and verified grades
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Score</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">
              {stats?.attendancePercentage !== undefined ? `${stats.attendancePercentage}%` : "—"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Based on {stats?.totalSessions ?? 0} verified class sessions
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Tasks</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.totalSubmissions ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats?.gradedSubmissions ?? 0} tasks evaluated and graded
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Mentor</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-100 truncate">
              {mentor ? mentor.user.name : "Not Assigned"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {mentor ? `${mentor.department?.name}` : "Contact department HOD"}
            </p>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Pending & Active Assignments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No active assignments for your enrolled subjects.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => {
                    const hasSubmitted = a.submissions && a.submissions.length > 0;
                    return (
                      <tr key={a.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 text-slate-200 font-medium">{a.title}</td>
                        <td className="py-3 px-4 text-indigo-400">{a.subject?.name}</td>
                        <td className="py-3 px-4 text-slate-300">{a.maxMarks}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(a.dueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          {hasSubmitted ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedAssignment(a)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold transition cursor-pointer"
                            >
                              Submit Work
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1">Submit Assignment</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedAssignment.title}</p>

            {submitMsg && (
              <div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300">
                {submitMsg}
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">
                  Submission Notes / Text Solution
                </label>
                <textarea
                  required
                  rows={4}
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  placeholder="Enter your responses, links to repositories, or explanation..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Confirm Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
