import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { AppointmentRouter } from './routes/appointment/appointment.js';
import { router } from './trpc.js';

const ApiRouter = router({
  appointment: AppointmentRouter,
});

const api = new Hono();
api.use(
  '/trpc/*',
  trpcServer({
    router: ApiRouter,
  })
);

api.get('/', (c) => {
  return c.html(`
    <h1>Welcome to the API</h1>
    <p>Please view the README for how to access the API</p>
  `)
});


export default api;
export type IApiRouter = typeof ApiRouter;
