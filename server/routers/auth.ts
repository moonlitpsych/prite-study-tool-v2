import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { router, publicProcedure, protectedProcedure } from '../lib/trpc.js';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  name: z.string().min(2).max(50),
  password: z.string().min(6),
  pgyLevel: z.number().min(1).max(4).optional(),
  institution: z.string().optional(),
  specialty: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, username, password, ...userData } = input;

      // Check if user exists
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email or username already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email,
          username,
          name: userData.name || username, // Use username as fallback
          hashedPassword,
          pgyLevel: userData.pgyLevel,
          institution: userData.institution,
          specialty: userData.specialty,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          pgyLevel: true,
          institution: true,
          specialty: true,
          isPublic: true,
          contributionScore: true,
          reputation: true,
        },
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      return {
        user,
        token,
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      console.log(`🔐 Login attempt for: ${email}`);

      // Find user with password for verification
      const user = await ctx.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          hashedPassword: true,
          pgyLevel: true,
          institution: true,
          specialty: true,
          isPublic: true,
          contributionScore: true,
          reputation: true,
        },
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      console.log(`👤 User found: ${user.email} (ID: ${user.id})`);
      console.log(`🔒 Hash length: ${user.hashedPassword.length}`);
      console.log(`🔑 Password length: ${password.length}`);

      // Verify password against hashed version
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
      
      console.log(`🔓 Password validation result: ${isValidPassword}`);
      
      if (!isValidPassword) {
        console.log(`❌ Password mismatch for: ${email}`);
        console.log(`🔍 Hash starts with: ${user.hashedPassword.substring(0, 20)}...`);
        
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      console.log(`✅ Login successful for: ${email}`);

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      // Return user without password
      const { hashedPassword, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(50).optional(),
      bio: z.string().max(500).optional(),
      pgyLevel: z.number().min(1).max(4).optional(),
      targetScore: z.number().min(0).max(300).optional(),
      institution: z.string().optional(),
      specialty: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          bio: true,
          pgyLevel: true,
          targetScore: true,
          institution: true,
          specialty: true,
          isPublic: true,
          contributionScore: true,
          reputation: true,
        },
      });

      return user;
    }),
});