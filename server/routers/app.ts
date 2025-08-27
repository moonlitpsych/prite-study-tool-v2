import { router } from '../lib/trpc';
import { authRouter } from './auth';
import { questionRouter } from './questions';
import { studyRouter } from './study';
import { communityRouter } from './community';
import { userRouter } from './user';
import { uploadRouter } from './upload';

export const appRouter = router({
  auth: authRouter,
  questions: questionRouter,
  study: studyRouter,
  community: communityRouter,
  user: userRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;