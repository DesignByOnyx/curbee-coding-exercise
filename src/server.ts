import { Context, Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { AppointmentRouter } from './routes/appointment/appointment.js';
import { router } from './trpc.js';
import { IAppointmentCreate } from './schemas/appointment.schema.js';
import { TRPCError } from '@trpc/server';
import { ContentfulStatusCode } from 'hono/utils/http-status';

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

/** Mapping of tRPC error codes to HTTP status codes */
const ErrorStatus: Record<string, ContentfulStatusCode> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/** Represents an error response JSON */
type ErrorResponse = {
  error: {
    message: string;
    status: ContentfulStatusCode;
  };
};

/** Formats REST errors to a consistent JSON shape */
const formatRestError = (err: unknown): ErrorResponse => {
  if (err instanceof TRPCError) {
    return {
      error: {
        message: err.message,
        status: ErrorStatus[err.code] || 500,
      },
    };  
  }

  return {
    error: {
      message: `Unknown Server Error: ${err}`,
      status: 500,
    },
  };
};

/** Handles calling async REST middleware and consistently handling the output */
const handleRest = (fn: (c: Context) => Promise<Response>) => async (c: Context) => {
  try {
    return await fn(c);
  } catch (err) {
    const formattedError = formatRestError(err);
    return c.json(formattedError, formattedError.error.status);
  }
};

api.get('/rest/appointment', handleRest(async (c) => {
  const caller = AppointmentRouter.createCaller({} as any);
  return c.json(await caller.find());
}));

api.get('/rest/appointment/:id', handleRest(async (c) => {
  const caller = AppointmentRouter.createCaller({} as any);
  return c.json(await caller.get(c.req.param('id')));
}));

api.post('/rest/appointment', handleRest(async (c: Context) => {
  const caller = AppointmentRouter.createCaller({} as any);
  const data = await c.req.json<IAppointmentCreate>();
  return c.json(await caller.create(data));
}));

export default api;
export type IApiRouter = typeof ApiRouter;
