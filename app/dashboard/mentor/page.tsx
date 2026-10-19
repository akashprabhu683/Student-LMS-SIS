"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  CalendarCheck,
  Trophy,
  Plus,
  LogOut,
  RefreshCw,
  Clock,
  Send,
} from "lucide-react";

export default function MentorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "attendance" | "leaderboard">("overview");

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & form states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", maxScore: 100, dueDate: "" });
  const [creatingTask, setCreatingTask] = useState(false);

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [gradingModalSub, setGradingModalSub] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState<number | string>("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [meRes, cohortRes, taskRes, leadRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/cohort"),
        fetch("/api/tasks"),
        fetch("/api/leaderboard"),
      ]);

      if (meRes.ok) {
        const d = await meRes.json();
        setUser(d.user);
      }
      if (cohortRes.ok) {
        const d = await cohortRes.json();
        setStudents(d.students || []);
        // Setup initial attendance marks default
        const initMarks: Record<string, string> = {};
        (d.students || []).forEach((s: any) => {
          initMarks[s.id] = "PRESENT";
        });
        setAttendanceMarks(initMarks);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        setTasks(d.tasks || []);
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
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setTaskForm({ title: "", description: "", maxScore: 100, dueDate: "" });
        fetchDashboardData();
      }
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceMarks).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sessionTitle, records }),
      });
      if (res.ok) {
        setShowAttendanceModal(false);
        setSessionTitle("");
        fetchDashboardData();
      }
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleEvaluateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalSub) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: gradingModalSub.id,
          score: gradeScore,
          feedback: gradeFeedback,
        }),
      });
      if (res.ok) {
        setGradingModalSub(null);
        setGradeScore("");
        setGradeFeedback("");
        fetchDashboardData();
      }
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Cohort Workspace</h1>
            <span className="text-[11px] text-blue-600 font-medium">Mentor / Admin Portal</span>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: "overview", label: "Overview", icon: Users },
            { id: "tasks", label: "Tasks & Grading", icon: CheckCircle2 },
            { id: "attendance", label: "Attendance", icon: CalendarCheck },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900">{user?.name || "Mentor"}</p>
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cohort Students</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{students.length} / 10</div>
                <p className="text-xs text-slate-400 mt-1">Actively enrolled</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Tasks</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{tasks.length}</div>
                <p className="text-xs text-slate-400 mt-1">Assignments & projects</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Performer</span>
                <div className="text-lg font-bold text-slate-900 mt-1 truncate">
                  {leaderboard[0]?.name || "—"}
                </div>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  {leaderboard[0] ? `${leaderboard[0].overallScore} pts` : ""}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center gap-2">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign New Task</span>
                </button>
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Mark Session Attendance</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Enrolled Cohort Roster (10 Students)</h2>
                  <p className="text-xs text-slate-500">Track mentor allocation, progress, and status</p>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Student</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Assigned Mentor</th>
                    <th className="py-3 px-5">Score (Points)</th>
                    <th className="py-3 px-5">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((student) => {
                    const lData = leaderboard.find((l) => l.id === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5 font-medium text-slate-900">{student.name}</td>
                        <td className="py-3.5 px-5 text-slate-500">{student.email}</td>
                        <td className="py-3.5 px-5 font-medium text-blue-600">
                          {student.mentor ? student.mentor.name : "Unassigned"}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {lData ? `${lData.totalScore} pts` : "0 pts"}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              (lData?.attendancePct || 0) >= 80
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {lData?.attendancePct || 0}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TASKS & GRADING TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Cohort Projects & Tasks</h2>
                <p className="text-xs text-slate-500">Review student submissions and assign marks</p>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-slate-700">Max: {task.maxScore} pts</span>
                      <span className="text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Submissions list for this task */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                      Submissions ({task.submissions?.length || 0} received)
                    </span>
                    {task.submissions?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No submissions yet for this task.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {task.submissions.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                          >
                            <div className="truncate mr-2">
                              <p className="font-semibold text-slate-900 truncate">{sub.student.name}</p>
                              <a
                                href={sub.content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline text-[11px] truncate block"
                              >
                                {sub.content}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {sub.status === "GRADED" ? (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded">
                                  {sub.score} / {task.maxScore}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setGradingModalSub({ ...sub, maxScore: task.maxScore });
                                    setGradeScore("");
                                    setGradeFeedback("");
                                  }}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition cursor-pointer"
                                >
                                  Grade
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Attendance Manager</h2>
                <p className="text-xs text-slate-500">Record session attendance and track student presence rates</p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Session</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Overall Cohort Attendance Ratios</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {leaderboard.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                    <div className="text-lg font-bold text-slate-900 mt-1">{s.attendancePct}%</div>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                        s.attendancePct >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.attendancePct >= 80 ? "Good" : "Attention"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Cohort 10-Student Leaderboard</h2>
                <p className="text-xs text-slate-500">
                  Computed live based on 70% task performance score + 30% attendance consistency
                </p>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Rank</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Assigned Mentor</th>
                    <th className="py-3 px-6">Tasks Completed</th>
                    <th className="py-3 px-6">Task Score</th>
                    <th className="py-3 px-6">Attendance</th>
                    <th className="py-3 px-6">Overall Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaderboard.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        idx === 0 ? "bg-amber-50/40" : idx === 1 ? "bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-6 text-slate-600">{item.mentorName}</td>
                      <td className="py-3.5 px-6 text-slate-600">{item.tasksCompleted}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{item.totalScore} pts</td>
                      <td className="py-3.5 px-6 font-medium text-slate-700">{item.attendancePct}%</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold border border-blue-200 rounded-md">
                          {item.overallScore} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE TASK */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign Cohort Task</h3>
            <p className="text-xs text-slate-500 mb-4">Create a task for the 10 students</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 3: API Integration"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Instructions, requirements, and deliverables..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    required
                    value={taskForm.maxScore}
                    onChange={(e) => setTaskForm({ ...taskForm, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  {creatingTask ? "Publishing..." : "Publish Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARK ATTENDANCE */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Session Attendance</h3>
            <p className="text-xs text-slate-500 mb-4">Check off presence for all 10 students</p>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint Standup & Technical Review"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Cohort Students</span>
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                    <span className="text-xs font-medium text-slate-900">{student.name}</span>
                    <div className="flex gap-1">
                      {["PRESENT", "ABSENT", "LATE"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setAttendanceMarks({ ...attendanceMarks, [student.id]: status })}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                            attendanceMarks[student.id] === status
                              ? status === "PRESENT"
                                ? "bg-emerald-600 text-white"
                                : status === "ABSENT"
                                ? "bg-red-600 text-white"
                                : "bg-amber-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAttendance}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  {savingAttendance ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRADE SUBMISSION */}
      {gradingModalSub && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Evaluate Student Submission</h3>
            <p className="text-xs text-slate-500 mb-4">{gradingModalSub.student?.name}</p>

            <form onSubmit={handleEvaluateSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Marks Awarded (Max: {gradingModalSub.maxScore})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={gradingModalSub.maxScore}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Constructive feedback for the student..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingModalSub(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  {evaluating ? "Saving..." : "Submit Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
