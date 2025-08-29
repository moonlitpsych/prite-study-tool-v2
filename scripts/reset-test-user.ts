import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetTestUser() {
  console.log('🔧 Resetting test user credentials...');
  
  // Create fresh password hash
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Update the test user with fresh hash
  const updatedUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      hashedPassword, // Update with fresh hash
    },
    create: {
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      hashedPassword,
      pgyLevel: 2,
      targetScore: 200,
      institution: 'Test Hospital',
      specialty: 'Adult Psychiatry',
    },
  });

  console.log('✅ Test user credentials reset successfully!');
  console.log(`👤 Email: test@example.com`);
  console.log(`🔑 Password: password123`);
  console.log(`🆔 User ID: ${updatedUser.id}`);
}

resetTestUser()
  .catch((e) => {
    console.error('❌ Failed to reset test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });