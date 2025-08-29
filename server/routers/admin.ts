import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, publicProcedure } from '../lib/trpc.js';
import { prisma } from '../lib/db.js';

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

  // Health check endpoint
  health: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});