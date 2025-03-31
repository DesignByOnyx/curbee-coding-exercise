import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Appointment, AppointmentCreate, AppointmentWithDetails, AppointmentWithDetailsCreate } from "../../schemas/appointment.schema.js";
import { router, publicProcedure } from "../../trpc.js";
import { LocationRouter } from "../location.js";
import { CustomerRouter } from "../customer.js";
import { VehicleRouter } from "../vehicle.js";
import { AppointmentStore, validateAppointmentTimeOfDay, ensureNoExistingConflicts } from "./utils.js";
import { ILocationCreate } from "../../schemas/location.schema.js";
import { ICustomerCreate } from "../../schemas/customer.schema.js";
import { IVehicleCreate } from "../../schemas/vehicle.schema.js";

const AppointmentRouter = router({
   /** Gets an appointment by ID */
   get: publicProcedure
      .input(z.string())
      .output(AppointmentWithDetails)
      .query(async ({ ctx, input }) => {
         const appointment = await AppointmentStore.findOneAsync(input);
         if (!appointment) {
            throw new TRPCError({
               code: 'NOT_FOUND',
               message: `Appointment with ID ${input} not found`,
            });
         }

         const location = await getLocationById(appointment.locationId, ctx);
         const customer = await getCustomerById(appointment.customerId, ctx);
         const vehicle = await getVehicleById(appointment.vehicleId, ctx);
         return { ...appointment, location, customer, vehicle}
      }),

   /** Gets a list of appointments */
   find: publicProcedure
      .input(Appointment.partial().optional())
      .output(Appointment.array())
      .query(({ input }) => {
         return AppointmentStore.findAsync(input);
      }),
   
   /** Create an appointment with references to details (customer, vehicle, location) */
   create: publicProcedure
      .input(AppointmentCreate)
      .output(Appointment)
      .mutation(async ({ input }) => {
         validateAppointmentTimeOfDay(input.appointmentStartTime, input.appointmentEndTime);
         await ensureNoExistingConflicts(input.appointmentStartTime, input.appointmentEndTime);

         // TODO: Ensure the customer, vehicle, and location exist

         const newAppointment = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            ...input,
         };

         return AppointmentStore.createAsync(newAppointment);
      }),
   
   /** Create an appointment with nested details (customer, vehicle, location) */
   createWithDetails: publicProcedure
      .input(AppointmentWithDetailsCreate)
      .output(AppointmentWithDetails)
      .mutation(async ({ input, ctx }) => {
         validateAppointmentTimeOfDay(input.appointmentStartTime, input.appointmentEndTime);
         await ensureNoExistingConflicts(input.appointmentStartTime, input.appointmentEndTime);

         const location = await createLocation(input.location, ctx);
         const customer = await createCustomer(input.customer, ctx);
         const vehicle = await createVehicle(input.vehicle, ctx);

         const newAppointment = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            appointmentStartTime: input.appointmentStartTime,
            appointmentEndTime: input.appointmentEndTime,
            locationId: location.id,
            customerId: customer.id,
            vehicleId: vehicle.id,
         };

         const result = await AppointmentStore.createAsync(newAppointment);
         return { ...result, location, customer, vehicle };
      }),
});

const getLocationById = (id: string, ctx: object) => {
   const caller = LocationRouter.createCaller(ctx);
   return caller.get(id);
}

const createLocation = (data: ILocationCreate, ctx: object) => {
   const caller = LocationRouter.createCaller(ctx);
   return caller.create(data);
}

const getCustomerById = (id: string, ctx: object) => {
   const caller = CustomerRouter.createCaller(ctx);
   return caller.get(id);
}

const createCustomer = (data: ICustomerCreate, ctx: object) => {
   const caller = CustomerRouter.createCaller(ctx);
   return caller.create(data);
}

const getVehicleById = (id: string, ctx: object) => {
   const caller = VehicleRouter.createCaller(ctx);
   return caller.get(id);
}

const createVehicle = (data: IVehicleCreate, ctx: object) => {
   const caller = VehicleRouter.createCaller(ctx);
   return caller.create(data);
}

export { AppointmentRouter };
