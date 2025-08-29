import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, publicProcedure } from '../lib/trpc.js';
import { prisma } from '../lib/prisma.js';

export const adminRouter = router({
  // Emergency endpoint to reset test user credentials
  resetTestUser: publicProcedure
    .input(z.object({
      secretKey: z.string(), // Require a secret key for security
    }))
    .mutation(async ({ input }) => {
      // Check if the secret key matches environment variable
      const expectedSecret = process.env.ADMIN_SECRET || 'reset-test-user-2024';
      
      if (input.secretKey !== expectedSecret) {
        throw new Error('Invalid admin secret key');
      }

      console.log('🔧 Admin: Resetting test user credentials...');
      console.log(`🔑 Generating fresh hash for password: password123`);
      
      // Create fresh password hash
      const hashedPassword = await bcrypt.hash('password123', 12);
      console.log(`🔒 Generated hash length: ${hashedPassword.length}`);
      console.log(`🔍 Hash starts with: ${hashedPassword.substring(0, 20)}...`);
      
      // First, try to delete any existing test user to avoid conflicts
      try {
        await prisma.user.delete({
          where: { email: 'test@example.com' },
        });
        console.log('🗑️ Admin: Deleted existing test user');
      } catch (error) {
        console.log('ℹ️ Admin: No existing test user found to delete');
      }

      // Force create fresh test user
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

      console.log('✅ Admin: Test user credentials reset successfully!');
      console.log(`👤 Email: test@example.com`);
      console.log(`🔑 Password: password123`);
      console.log(`🆔 User ID: ${updatedUser.id}`);

      return {
        success: true,
        message: 'Test user credentials reset successfully',
        userId: updatedUser.id,
      };
    }),

  // Emergency endpoint to create test user (no secret required for desperate debugging)
  emergencyCreateUser: publicProcedure
    .mutation(async () => {
      console.log('🚨 EMERGENCY: Creating test user...');
      
      try {
        // Create fresh password hash
        const hashedPassword = await bcrypt.hash('password123', 12);
        console.log(`🔒 Generated hash length: ${hashedPassword.length}`);
        
        // Force delete any existing test user
        try {
          const deleted = await prisma.user.delete({
            where: { email: 'test@example.com' },
          });
          console.log(`🗑️ EMERGENCY: Deleted existing test user (ID: ${deleted.id})`);
        } catch (error) {
          console.log('ℹ️ EMERGENCY: No existing test user found to delete');
        }

        // Force create fresh test user
        const newUser = await prisma.user.create({
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

        console.log(`✅ EMERGENCY: Test user created successfully!`);
        console.log(`👤 Email: test@example.com`);
        console.log(`🔑 Password: password123`);
        console.log(`🆔 User ID: ${newUser.id}`);

        return {
          success: true,
          message: 'Emergency test user created successfully',
          userId: newUser.id,
          email: 'test@example.com',
          passwordLength: hashedPassword.length,
        };

      } catch (error: any) {
        console.error('❌ EMERGENCY: Failed to create test user:', error);
        throw new Error(`Failed to create test user: ${error.message}`);
      }
    }),

  // Health check endpoint
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});