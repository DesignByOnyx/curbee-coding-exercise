import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { AppointmentRouter } from './routes/appointment.js';
import { trpc } from './trpc.js';

const apiRouter = trpc.mergeRouters(
  AppointmentRouter,
)

const api = new Hono();
api.use(
  '/api/*',
  trpcServer({
    router: apiRouter,
  })
);

export default api;
export type IApiRouter = typeof apiRouter;
