# EduPulse LMS–SIS: Unified Learning Management & Student Information System

An enterprise-ready, role-governed **Learning Management System and Student Information System (LMS–SIS)** built with **Next.js (App Router)**, **PostgreSQL**, **Prisma ORM**, **Tailwind CSS**, and **TypeScript**.

---

## 🏛️ System Architecture & Roles

EduPulse provides tailored, server-enforced interfaces for five institutional tiers:

1. **Super Administrator**
   - Governance over institutions, departments, academic years, terms, and classes.
   - User account provisioning with cryptographic role assignments.
   - Immutable audit logging of all grading modifications and attendance corrections.

2. **Department Administrator / Head of Department (HOD)**
   - Management of departmental faculty, students, courses, and classes.
   - Faculty-to-mentor allocation and student cohort assignments.
   - Department-wide attendance and submission performance summaries.

3. **Faculty Member**
   - Subject delivery, timetable sessions, and verified attendance logging.
   - Publishing assignments, quizzes, and learning materials.
   - Reviewing submissions, awarding validated marks, and providing student feedback.

4. **Academic Mentor**
   - Direct mentorship oversight for allocated students and cohorts.
   - Tracking academic progress, attendance percentages, and early interventions.

5. **Student**
   - Attendance percentage tracking derived strictly from verified sessions.
   - Reviewing published assignments, deadlines, and submission requirements.
   - Uploading assignments with revision and late-submission policy enforcement.
   - Accessing released grades, feedback, and academic mentor contact details.

---

## ⚙️ Tech Stack

- **Framework**: Next.js 16 (React 19, TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma (Normalized relational schema with strict foreign keys & transactions)
- **Authentication**: JWT stored in `httpOnly`, `SameSite=Lax` cookies with server-side RBAC validation
- **Validation**: Zod schema validation on every operational endpoint
- **Design & Icons**: Tailwind CSS + Lucide Icons

---

## 🚀 Quickstart & Setup Guide

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL `DATABASE_URL` is set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_sis?schema=public"
JWT_SECRET="your-secure-random-jwt-secret-at-least-32-characters"
ADMIN_REGISTRATION_TOKEN="SETUP-SUPER-ADMIN-2026"
```

### 2. Generate Prisma Client & Push Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Realistic Academic Data
Run the comprehensive seed script to populate institutions, departments, classes, subjects, faculty, students, attendance sessions, and assignments:
```bash
npm run prisma:seed
```

#### Demo Credentials (Password for all: `Password123!`):
- **Super Admin**: `admin@ait.edu`
- **Department HOD**: `hod.cse@ait.edu`
- **Faculty / Mentor**: `mentor.alan@ait.edu`
- **Student 1**: `student.akash@ait.edu`
- **Student 2**: `student.priya@ait.edu`

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Integrity Highlights

- **Server-Enforced RBAC**: Endpoint protections check JWT session roles directly on the server.
- **Deadline Verification**: Due dates and late flags are derived exclusively from server timestamps.
- **Grade Ceiling Constraints**: Marks awarded cannot exceed defined assignment maximums.
- **Strict Privacy**: Students are isolated to their own submissions and enrolled classes.
- **Audit Trails**: Critical actions (grading, attendance corrections, user creation) generate structured audit entries.
