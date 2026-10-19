import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding Cohort: 2 Mentors and 10 Students...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create 2 Mentors / Admins
  const mentor1 = await prisma.user.create({
    data: {
      email: "mentor1@cohort.io",
      name: "Alex Rivera",
      role: "MENTOR",
      passwordHash,
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: "mentor2@cohort.io",
      name: "Sarah Chen",
      role: "MENTOR",
      passwordHash,
    },
  });

  // 2. Create 10 Students
  const studentNames = [
    "Akash Sharma",
    "Priya Patel",
    "Rahul Verma",
    "Ananya Iyer",
    "Rohan Gupta",
    "Sneha Reddy",
    "Vikram Singh",
    "Meera Nair",
    "Karthik Kumar",
    "Pooja Joshi",
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const assignedMentor = i < 5 ? mentor1.id : mentor2.id;
    const student = await prisma.user.create({
      data: {
        email: `student${i + 1}@cohort.io`,
        name: studentNames[i],
        role: "STUDENT",
        passwordHash,
        mentorId: assignedMentor,
      },
    });
    students.push(student);
  }

  // 3. Create 2 Hands-on Tasks / Projects
  const task1 = await prisma.task.create({
    data: {
      title: "Sprint 1: Fullstack Auth & RBAC Architecture",
      description: "Implement secure JWT cookies, password hashing with bcrypt, and middleware access checks.",
      maxScore: 100,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdById: mentor1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Sprint 2: Relational Schema & State Design",
      description: "Model attendance, task grading, and leaderboard aggregation without unnecessary schemas.",
      maxScore: 100,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdById: mentor2.id,
    },
  });

  // 4. Record Attendance Session
  const session1 = await prisma.attendanceSession.create({
    data: {
      title: "Sprint Kickoff & System Architecture Review",
      sessionDate: new Date(),
      createdById: mentor1.id,
    },
  });

  for (let i = 0; i < students.length; i++) {
    await prisma.attendanceRecord.create({
      data: {
        sessionId: session1.id,
        studentId: students[i].id,
        status: i === 7 ? "ABSENT" : i === 4 ? "LATE" : "PRESENT",
        remarks: i === 4 ? "Joined 10 mins late" : undefined,
      },
    });
  }

  // 5. Populate Initial Submissions & Scores for Leaderboard
  const sampleScores = [96, 92, 88, 85, 90, 78, 84, 95, 89, 91];
  for (let i = 0; i < students.length; i++) {
    await prisma.submission.create({
      data: {
        taskId: task1.id,
        studentId: students[i].id,
        content: `https://github.com/cohort-projects/student-${i + 1}-auth-impl`,
        status: "GRADED",
        score: sampleScores[i],
        feedback: sampleScores[i] > 90 ? "Excellent code structure and clean architecture." : "Good progress, review edge case validation.",
        isLate: false,
        evaluatedAt: new Date(),
      },
    });
  }

  console.log("\n========================================================");
  console.log("✅ Cohort database seeded!");
  console.log("2 Mentors: mentor1@cohort.io, mentor2@cohort.io");
  console.log("10 Students: student1@cohort.io to student10@cohort.io");
  console.log("Password for all accounts: Password123!");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
