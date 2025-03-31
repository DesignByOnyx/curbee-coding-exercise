import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import type { IAppointment } from "../schemas/appointment.schema.js";
import { Appointment, AppointmentCreate, AppointmentWithDetails } from "../schemas/appointment.schema.js";
import { router, publicProcedure } from "../trpc.js";
import { createStore } from "../db.js";
import { LocationRouter } from "./location.js";
import { CustomerRouter } from "./customer.js";
import { VehicleRouter } from "./vehicle.js";
import { TRPCError } from "@trpc/server";

const AppointmentStore = createStore<IAppointment>('appointments');

const AppointmentRouter = router({
   /**
    * Gets an appointment by ID
    */
   getAppointment: publicProcedure
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

   /**
    * Gets a list of appointments
    */
   getAppointments: publicProcedure
      .input(Appointment.partial())
      .output(Appointment.array())
      .query(({ input }) => {
         return AppointmentStore.findAsync(input);
      }),
   
   /**
    * Create an appointment with references to details (customer, vehicle, location)
    */
   createAppointment: publicProcedure
      .input(AppointmentCreate)
      .output(Appointment)
      .mutation(async ({ input }) => {
         validateAppointmentTimeOfDay(input.appointmentStartTime, input.appointmentEndTime);
         await ensureNoExistingConflicts(input.appointmentStartTime, input.appointmentEndTime);

         const newAppointment = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            ...input,
         };
         return AppointmentStore.createAsync(newAppointment);
      }),
});

const getZonedDateTime = (dateTime: Date) => {
   const instant = Temporal.Instant.from(dateTime.toISOString());
   return instant.toZonedDateTimeISO(Temporal.Now.timeZoneId());
}

/** Ensures the appointment falls within business hours */
const validateAppointmentTimeOfDay = (startTime: Date, endTime: Date) => {
  const start = getZonedDateTime(startTime)
  const end = getZonedDateTime(endTime);

  const startOfDay = start.with({ hour: 9, minute: 0 });
  const endOfDay = start.with({ hour: 17, minute: 0 });

  if (Temporal.ZonedDateTime.compare(start, startOfDay) < 0 || 
      Temporal.ZonedDateTime.compare(end, endOfDay) > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Appointment time must be between 9:00 AM and 5:00 PM',
    });
  }
};

/** Ensures there are no conflicting appointments in the database */
const ensureNoExistingConflicts = async (startTime: Date, endTime: Date) => {
   const start = getZonedDateTime(startTime);
   const end = getZonedDateTime(endTime);
   const allAppts = await AppointmentStore.findAsync({});
   console.log(allAppts);
   console.log( { $gt: start.toString(), $lt: end.toString() });
   const conflicts = await AppointmentStore.findAsync({
      $or: [
         { 
            appointmentStartTime: { $gt: start.toString(), $lt: end.toString() },
         },
         { 
            appointmentEndTime: { $gt: start.toString(), $lt: end.toString() },
         }
      ]
   });
   
   if (conflicts && conflicts.length > 0) {
      throw new TRPCError({
         code: 'CONFLICT',
         message: 'Appointment conflicts with existing appointment',
      });
   }
}

const getLocationById = (id: string, ctx: object) => {
   const caller = LocationRouter.createCaller(ctx);
   return caller.get(id);
}

const getCustomerById = (id: string, ctx: object) => {
   const caller = CustomerRouter.createCaller(ctx);
   return caller.get(id);
}

const getVehicleById = (id: string, ctx: object) => {
   const caller = VehicleRouter.createCaller(ctx);
   return caller.get(id);
}

export { AppointmentStore, AppointmentRouter, validateAppointmentTimeOfDay, ensureNoExistingConflicts };
