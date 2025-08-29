import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetTestUser() {
  console.log('🔧 Resetting test user credentials...');
  
  // Create fresh password hash
  const hashedPassword = await bcrypt.hash('password123', 12);
  console.log(`🔒 Generated hash length: ${hashedPassword.length}`);
  
  // Force delete and recreate test user (by email AND username)
  try {
    await prisma.user.delete({
      where: { email: 'test@example.com' },
    });
    console.log('🗑️ Deleted existing test user by email');
  } catch (error) {
    console.log('ℹ️ No existing test user found by email');
  }

  try {
    await prisma.user.delete({
      where: { username: 'testuser' },
    });
    console.log('🗑️ Deleted existing test user by username');
  } catch (error) {
    console.log('ℹ️ No existing test user found by username');
  }

  const updatedUser = await prisma.user.create({
    data: {
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