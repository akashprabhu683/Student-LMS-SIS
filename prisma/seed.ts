import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting LMS-SIS Database Seed...");

  // 1. Institution
  const institution = await prisma.institution.upsert({
    where: { code: "AIT" },
    update: {},
    create: {
      name: "Apex Institute of Technology",
      code: "AIT",
      timezone: "Asia/Kolkata",
    },
  });
  console.log(`✓ Institution created/ready: ${institution.name}`);

  // 2. Academic Year & Term
  const academicYear = await prisma.academicYear.upsert({
    where: {
      institutionId_name: {
        institutionId: institution.id,
        name: "2024-2025",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "2024-2025",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2025-06-30"),
      isCurrent: true,
    },
  });

  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: academicYear.id,
      name: "Fall Semester 2024",
      startDate: new Date("2024-07-01"),
      endDate: new Date("2024-12-31"),
      isCurrent: true,
    },
  });
  console.log(`✓ Academic Year & Term configured`);

  // 3. Departments
  const deptCS = await prisma.department.upsert({
    where: {
      institutionId_code: {
        institutionId: institution.id,
        code: "CSE",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Computer Science & Engineering",
      code: "CSE",
    },
  });

  const deptECE = await prisma.department.upsert({
    where: {
      institutionId_code: {
        institutionId: institution.id,
        code: "ECE",
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      name: "Electronics & Communication Engineering",
      code: "ECE",
    },
  });
  console.log(`✓ Departments created: CSE, ECE`);

  // 4. Program & Classes
  const btechCS = await prisma.program.upsert({
    where: {
      departmentId_code: {
        departmentId: deptCS.id,
        code: "BTECH-CS",
      },
    },
    update: {},
    create: {
      departmentId: deptCS.id,
      name: "Bachelor of Technology in Computer Science",
      code: "BTECH-CS",
      durationYears: 4,
    },
  });

  const classCSA = await prisma.class.create({
    data: {
      departmentId: deptCS.id,
      programId: btechCS.id,
      academicYearId: academicYear.id,
      name: "CSE-3A (2022-2026)",
      section: "A",
      semester: 5,
      batch: "2022-2026",
    },
  });
  console.log(`✓ Program & Class established: ${classCSA.name}`);

  // 5. Subjects
  const subjectAlgo = await prisma.subject.upsert({
    where: {
      departmentId_code: {
        departmentId: deptCS.id,
        code: "CS501",
      },
    },
    update: {},
    create: {
      departmentId: deptCS.id,
      name: "Design and Analysis of Algorithms",
      code: "CS501",
      credits: 4,
      description: "Advanced algorithmic paradigms, complexity classes, and graph algorithms.",
    },
  });

  const subjectDB = await prisma.subject.upsert({
    where: {
      departmentId_code: {
        departmentId: deptCS.id,
        code: "CS502",
      },
    },
    update: {},
    create: {
      departmentId: deptCS.id,
      name: "Database Management Systems",
      code: "CS502",
      credits: 3,
      description: "Relational algebra, SQL, normalization, concurrency control and transaction processing.",
    },
  });
  console.log(`✓ Subjects registered: CS501, CS502`);

  // Common password for demo accounts
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 6. Users & Roles
  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@ait.edu" },
    update: {},
    create: {
      email: "admin@ait.edu",
      name: "Dr. Arthur Pendelton",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      institutionId: institution.id,
    },
  });

  // Department Admin / HOD
  const hodUser = await prisma.user.upsert({
    where: { email: "hod.cse@ait.edu" },
    update: {},
    create: {
      email: "hod.cse@ait.edu",
      name: "Prof. Sarah Connor",
      passwordHash,
      role: "DEPARTMENT_ADMIN",
      status: "ACTIVE",
      institutionId: institution.id,
    },
  });
  const hodProfile = await prisma.facultyProfile.upsert({
    where: { userId: hodUser.id },
    update: {},
    create: {
      userId: hodUser.id,
      departmentId: deptCS.id,
      employeeId: "FAC-001",
      designation: "Professor & Head of Department",
      isMentor: true,
    },
  });
  await prisma.department.update({
    where: { id: deptCS.id },
    data: { hodId: hodProfile.id },
  });

  // Faculty & Mentor
  const mentorUser = await prisma.user.upsert({
    where: { email: "mentor.alan@ait.edu" },
    update: {},
    create: {
      email: "mentor.alan@ait.edu",
      name: "Dr. Alan Turing",
      passwordHash,
      role: "MENTOR",
      status: "ACTIVE",
      institutionId: institution.id,
    },
  });
  const mentorProfile = await prisma.facultyProfile.upsert({
    where: { userId: mentorUser.id },
    update: {},
    create: {
      userId: mentorUser.id,
      departmentId: deptCS.id,
      employeeId: "FAC-002",
      designation: "Associate Professor",
      isMentor: true,
    },
  });

  // Assign Faculty to Subjects
  await prisma.subjectClassAssignment.upsert({
    where: {
      subjectId_classId: {
        subjectId: subjectAlgo.id,
        classId: classCSA.id,
      },
    },
    update: {},
    create: {
      subjectId: subjectAlgo.id,
      classId: classCSA.id,
      facultyId: mentorProfile.id,
    },
  });

  // Students
  const student1User = await prisma.user.upsert({
    where: { email: "student.akash@ait.edu" },
    update: {},
    create: {
      email: "student.akash@ait.edu",
      name: "Akash Sharma",
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      institutionId: institution.id,
    },
  });
  const student1Profile = await prisma.studentProfile.upsert({
    where: { userId: student1User.id },
    update: {},
    create: {
      userId: student1User.id,
      departmentId: deptCS.id,
      programId: btechCS.id,
      registrationNumber: "REG2022CS001",
      batch: "2022-2026",
      currentSemester: 5,
    },
  });

  const student2User = await prisma.user.upsert({
    where: { email: "student.priya@ait.edu" },
    update: {},
    create: {
      email: "student.priya@ait.edu",
      name: "Priya Patel",
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      institutionId: institution.id,
    },
  });
  const student2Profile = await prisma.studentProfile.upsert({
    where: { userId: student2User.id },
    update: {},
    create: {
      userId: student2User.id,
      departmentId: deptCS.id,
      programId: btechCS.id,
      registrationNumber: "REG2022CS002",
      batch: "2022-2026",
      currentSemester: 5,
    },
  });

  // Enroll students in class
  await prisma.enrollment.upsert({
    where: {
      studentId_classId: {
        studentId: student1Profile.id,
        classId: classCSA.id,
      },
    },
    update: {},
    create: {
      studentId: student1Profile.id,
      classId: classCSA.id,
    },
  });
  await prisma.enrollment.upsert({
    where: {
      studentId_classId: {
        studentId: student2Profile.id,
        classId: classCSA.id,
      },
    },
    update: {},
    create: {
      studentId: student2Profile.id,
      classId: classCSA.id,
    },
  });
  console.log(`✓ Enrolled demo students in class ${classCSA.name}`);

  // 7. Mentor Allocation
  await prisma.mentorAllocation.create({
    data: {
      studentId: student1Profile.id,
      mentorId: mentorProfile.id,
      allocatedById: superAdmin.id,
      notes: "Assigned for academic guidance and capstone project.",
    },
  });
  console.log(`✓ Allocated mentor Dr. Alan Turing to student Akash Sharma`);

  // 8. Attendance Session
  const session = await prisma.attendanceSession.create({
    data: {
      classId: classCSA.id,
      subjectId: subjectAlgo.id,
      facultyId: mentorProfile.id,
      sessionDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      isFinalized: true,
      notes: "Lecture on Dynamic Programming and Bellman-Ford algorithm.",
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        sessionId: session.id,
        studentId: student1Profile.id,
        status: "PRESENT",
      },
      {
        sessionId: session.id,
        studentId: student2Profile.id,
        status: "LATE",
        remarks: "Arrived 10 minutes late due to transit.",
      },
    ],
  });
  console.log(`✓ Attendance session & records recorded for ${classCSA.name}`);

  // 9. Assignment & Submission
  const assignment = await prisma.assignment.create({
    data: {
      facultyId: mentorProfile.id,
      subjectId: subjectAlgo.id,
      title: "Problem Set 1: Dynamic Programming Analysis",
      description: "Implement Bellman-Ford and analyze edge relaxation on DAGs with negative weights.",
      maxMarks: 100,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "PUBLISHED",
      targets: {
        create: [{ classId: classCSA.id }],
      },
    },
  });

  const submission = await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: student1Profile.id,
      status: "GRADED",
      textResponse: "Detailed analysis with mathematical proofs attached in the PDF.",
      submittedAt: new Date(),
    },
  });

  await prisma.grade.create({
    data: {
      submissionId: submission.id,
      studentId: student1Profile.id,
      marksAwarded: 94.5,
      feedback: "Exemplary solution with thorough time complexity breakdown.",
      status: "PUBLISHED",
      gradedAt: new Date(),
      gradedById: mentorProfile.id,
      publishedAt: new Date(),
    },
  });
  console.log(`✓ Assignment, submission, and published grade configured`);

  // 10. Announcement
  await prisma.announcement.create({
    data: {
      institutionId: institution.id,
      departmentId: deptCS.id,
      facultyId: mentorProfile.id,
      title: "Welcome to Fall 2024 Academic Term",
      content: "All classes have commenced. Please review your subject syllabus and attendance prerequisites.",
      isPublished: true,
      publishedAt: new Date(),
    },
  });
  console.log(`✓ Initial announcement published`);

  console.log("\n============================================================");
  console.log("🎉 Database seeding completed successfully!");
  console.log("Demo credentials created (Password for all: Password123!):");
  console.log("- Super Admin:      admin@ait.edu");
  console.log("- Department HOD:   hod.cse@ait.edu");
  console.log("- Faculty / Mentor: mentor.alan@ait.edu");
  console.log("- Student 1:        student.akash@ait.edu");
  console.log("- Student 2:        student.priya@ait.edu");
  console.log("============================================================");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
