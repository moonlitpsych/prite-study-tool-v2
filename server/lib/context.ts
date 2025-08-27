import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export const createContext = async ({ req }: CreateExpressContextOptions) => {
  // Get user from JWT token
  const getUser = async () => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return null;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      return user;
    } catch {
      return null;
    }
  };

  const user = await getUser();

  return {
    req,
    prisma,
    user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;