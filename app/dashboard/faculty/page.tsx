"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/Sidebar";
import { CalendarCheck, FileText, CheckCircle, Clock, Plus, RefreshCw } from "lucide-react";

export default function FacultyDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mark Attendance Modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, string>>({});
  const [marking, setMarking] = useState(false);
  const [attMsg, setAttMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meRes, statsRes, assignRes, classRes, subRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/dashboard/stats"),
        fetch("/api/assignments"),
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentSessions(statsData.recentSessions || []);
      }
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignments(assignData.assignments || []);
      }
      if (classRes.ok) {
        const cData = await classRes.json();
        setClasses(cData.classes || []);
        if (cData.classes?.length > 0) setSelectedClass(cData.classes[0].id);
      }
      if (subRes.ok) {
        const sData = await subRes.json();
        setSubjects(sData.subjects || []);
        if (sData.subjects?.length > 0) setSelectedSubject(sData.subjects[0].id);
      }
    } catch (err) {
      console.error("Faculty fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch students when opening attendance modal or changing class
  const loadClassStudents = async (cid: string) => {
    try {
      const res = await fetch(`/api/admin/users?role=STUDENT`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.users || []);
        const initialMarks: Record<string, string> = {};
        (data.users || []).forEach((s: any) => {
          if (s.studentProfile) initialMarks[s.studentProfile.id] = "PRESENT";
        });
        setAttendanceMarks(initialMarks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAttendance = () => {
    setShowAttendanceModal(true);
    if (selectedClass) loadClassStudents(selectedClass);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarking(true);
    setAttMsg(null);

    try {
      const records = Object.entries(attendanceMarks).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject,
          sessionDate: new Date().toISOString(),
          startTime: "10:00",
          endTime: "11:00",
          notes: "Recorded from faculty dashboard",
          records,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record attendance");

      setAttMsg("Attendance recorded successfully!");
      setTimeout(() => {
        setShowAttendanceModal(false);
        setAttMsg(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setAttMsg(`Error: ${err.message}`);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <DashboardSidebar role="FACULTY" userName={user?.name} userEmail={user?.email} />

      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Faculty Academic Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Course delivery, attendance tracking, and assessment evaluations
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
              onClick={handleOpenAttendance}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Record Class Attendance</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Assignments</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.assignedAssignments ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Created for your subjects</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submissions to Grade</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.pendingSubmissions ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting review and evaluation</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Mentees</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-100">{stats?.menteesCount ?? "—"}</div>
            <p className="text-[11px] text-slate-500 mt-1">Students under academic guidance</p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Course Assignments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Max Marks</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No assignments published yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-slate-200 font-medium">{a.title}</td>
                      <td className="py-3 px-4 text-indigo-400">{a.subject?.name} ({a.subject?.code})</td>
                      <td className="py-3 px-4 text-slate-300">{a.maxMarks}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(a.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Record Attendance */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-100 mb-1">Record Class Attendance</h3>
            <p className="text-xs text-slate-400 mb-4">Validate student presence for the scheduled session</p>

            {attMsg && (
              <div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300">
                {attMsg}
              </div>
            )}

            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      loadClassStudents(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student list */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Enrolled Students
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.map((s) => {
                    const pid = s.studentProfile?.id;
                    if (!pid) return null;
                    return (
                      <div key={pid} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <div>
                          <p className="text-xs font-medium text-slate-200">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.studentProfile.registrationNumber}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {["PRESENT", "ABSENT", "LATE", "ON_DUTY"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setAttendanceMarks({ ...attendanceMarks, [pid]: status })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                                attendanceMarks[pid] === status
                                  ? status === "PRESENT"
                                    ? "bg-emerald-600 text-white"
                                    : status === "ABSENT"
                                    ? "bg-rose-600 text-white"
                                    : "bg-amber-600 text-white"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={marking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {marking ? "Saving Session..." : "Finalize Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
