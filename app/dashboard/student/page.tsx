"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  LogOut,
  Send,
  RefreshCw,
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [meRes, taskRes, attRes, leadRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/tasks"),
        fetch("/api/attendance/records"),
        fetch("/api/leaderboard"),
      ]);

      if (meRes.ok) {
        const d = await meRes.json();
        setUser(d.user);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        setTasks(d.tasks || []);
      }
      if (attRes.ok) {
        const d = await attRes.json();
        setAttendanceStats(d.stats);
      }
      if (leadRes.ok) {
        const d = await leadRes.json();
        setLeaderboard(d.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          content: submissionContent,
        }),
      });
      if (res.ok) {
        setSelectedTask(null);
        setSubmissionContent("");
        fetchStudentData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const myRank = leaderboard.findIndex((l) => l.id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Cohort Workspace</h1>
            <span className="text-[11px] text-slate-500 font-medium">Student Learning Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudentData}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900">{user?.name || "Student"}</p>
            <p className="text-[11px] text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leaderboard Rank</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {myRank > 0 ? `#${myRank} of 10` : "—"}
            </div>
            <p className="text-xs text-blue-600 font-medium mt-1">Active standing</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attendance Score</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {attendanceStats?.percentage !== undefined ? `${attendanceStats.percentage}%` : "—"}
            </div>
            <p className="text-xs text-slate-400 mt-1">{attendanceStats?.total || 0} sessions marked</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Tasks</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {tasks.filter((t) => t.submissions?.length > 0).length} / {tasks.length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Submitted or graded</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Mentor</span>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate">
              {user?.mentor ? user.mentor.name : "Alex Rivera"}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">{user?.mentor?.email || "mentor1@cohort.io"}</p>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1">Assigned Tasks & Projects</h2>
          <p className="text-xs text-slate-500 mb-4">Complete deliverables and check evaluations</p>

          <div className="space-y-4">
            {tasks.map((task) => {
              const mySub = task.submissions && task.submissions[0];
              return (
                <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-800 block">Max: {task.maxScore} pts</span>
                      <span className="text-[11px] text-slate-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {mySub ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">Submitted Work: </span>
                          <a
                            href={mySub.content}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {mySub.content}
                          </a>
                          {mySub.feedback && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              Mentor feedback: "{mySub.feedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium">Pending Submission</span>
                      )}
                    </div>

                    <div>
                      {mySub?.status === "GRADED" ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 rounded-lg text-xs">
                          {mySub.score} / {task.maxScore} pts
                        </span>
                      ) : mySub ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded text-xs">
                          Under Review
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setSubmissionContent("");
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                        >
                          Submit Work
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Leaderboard for Students */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Cohort Standings & Leaderboard</h2>
            <p className="text-xs text-slate-500">Real-time ranking among all 10 students</p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Tasks Completed</th>
                <th className="py-3 px-6">Attendance</th>
                <th className="py-3 px-6">Overall Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {leaderboard.map((item, idx) => {
                const isMe = item.id === user?.id;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isMe ? "bg-blue-50/50 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={isMe ? "text-blue-700 font-bold" : "text-slate-900"}>{item.name}</span>
                      {isMe && <span className="ml-1.5 text-[10px] text-blue-600 font-normal">(You)</span>}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{item.tasksCompleted}</td>
                    <td className="py-3.5 px-6 text-slate-600">{item.attendancePct}%</td>
                    <td className="py-3.5 px-6 font-bold text-blue-700">{item.overallScore} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* SUBMIT MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Submit Task</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedTask.title}</p>

            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Deliverable Link / Solution
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/... or project URL"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting..." : "Submit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
