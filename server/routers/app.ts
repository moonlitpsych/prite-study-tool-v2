import { router } from '../lib/trpc.js';
import { authRouter } from './auth.js';
import { questionRouter } from './questions.js';
import { studyRouter } from './study.js';
import { communityRouter } from './community.js';
import { userRouter } from './user.js';
import { uploadRouter } from './upload.js';

export const appRouter = router({
  auth: authRouter,
  questions: questionRouter,
  study: studyRouter,
  community: communityRouter,
  user: userRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;