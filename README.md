# Cohort LMS–SIS: Unified Learning & Student Portal

A sleek, focused **Learning Management & Student Information System (LMS–SIS)** built for cohort-driven education. Designed with a clean, high-contrast light theme, robust role-based access, and direct cloud integration.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat-square)](https://student-lms-sis.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16_(Turbopack)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase_(PostgreSQL)-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

---

## 💡 Overview

Cohort LMS streamlines cohort learning by stripping away bureaucratic bloat. It focuses squarely on the essentials: **task assignment**, **project submissions & grading**, **attendance monitoring**, and a **live cohort leaderboard** combining performance with attendance consistency.

---

## ✨ Features

- **Role-Based Access Control (RBAC):** Tailored, secure dashboards for **Mentors** and **Students**.
- **Task & Project Management:** Mentors create assignments with due dates and scoring criteria; students submit deliverables with real-time feedback.
- **Attendance Tracking:** Mentors log session attendance (`PRESENT`, `ABSENT`, `LATE`, `ON_DUTY`) with live percentage metrics.
- **Dynamic Leaderboard:** Real-time cohort ranking calculated via a composite score: **70% Task Performance + 30% Attendance Consistency**.
- **Modern Light Theme UI:** Clean, distraction-free aesthetic with custom CSS variables, responsive typography, and micro-interactions.
- **Complete SEO Suite:** Dynamic sitemap, robots.txt, custom vector SVG favicon, Apple touch icons, and rich Open Graph (OG) social share banners.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend & Backend** | [Next.js 16](https://nextjs.org) (App Router, Server Actions, React 19, TypeScript) |
| **Database** | [Supabase](https://supabase.com) (Cloud PostgreSQL with Transaction Pooler) |
| **ORM** | [Prisma 5.22.0](https://www.prisma.io) |
| **Authentication** | Cryptographic JWT in `httpOnly`, `SameSite=Lax` cookies + Bcrypt |
| **Styling** | Vanilla CSS variables & Tailwind CSS |
| **Icons** | Lucide React Icons |
| **Hosting** | [Vercel](https://vercel.com) (Serverless edge deployment) |

---

## 🔑 Demo Accounts

All pre-seeded demo accounts share the password: **`Password123!`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Mentor / Admin** | `mentor1@cohort.io` | Manage tasks, review submissions, mark attendance, view cohort stats |
| **Mentor / Admin** | `mentor2@cohort.io` | Secondary mentor account with identical admin privileges |
| **Student** | `student1@cohort.io` ... `student10@cohort.io` | Submit tasks, check grades/feedback, track personal attendance & rank |

*(Quick-login demo autofill buttons are available on the login page for instant access.)*

---

## 🚀 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/akashprabhu683/Student-LMS-SIS.git
cd Student-LMS-SIS
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Supabase Transaction Pooler (Port 6543)
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# JWT Secret
JWT_SECRET="your-secure-random-jwt-secret-at-least-32-chars"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Sync Database & Seed Data
```bash
# Push schema to database
npx prisma db push

# Seed 2 mentors, 10 students, sample tasks, and attendance records
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🌐 Production Deployment

This project is optimized for zero-config deployment on **Vercel**:
1. Connect your repository to Vercel.
2. In **Project Settings → Environment Variables**, add `DATABASE_URL` (using Supabase's transaction pooler string with `?pgbouncer=true`) and `JWT_SECRET`.
3. Vercel automatically runs `prisma generate && next build` as configured in `package.json`.
