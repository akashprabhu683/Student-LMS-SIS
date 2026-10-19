import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const mentors = await prisma.user.findMany({ where: { role: 'MENTOR' }, select: { email: true } });
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { email: true } });
  const tasks = await prisma.task.count();

  console.log('\n✅ Supabase Cloud DB — Connection Verified!');
  console.log('==========================================');
  console.log(`Total users : ${userCount}`);
  console.log(`Mentors (${mentors.length}):`, mentors.map(m => m.email).join(', '));
  console.log(`Students (${students.length}):`, students.map(s => s.email).join(', '));
  console.log(`Tasks in DB : ${tasks}`);
  console.log('==========================================\n');
}

main()
  .catch(e => { console.error('❌ DB Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
