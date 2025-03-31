import { TRPCError } from "@trpc/server";
import { Temporal } from "@js-temporal/polyfill";
import { createStore } from "../../db.js";
import type { IAppointment } from "../../schemas/appointment.schema.js";

const AppointmentStore = createStore<IAppointment>('appointments');

/** Converts a date to a Temporal.ZonedDateTime */
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

  if (Temporal.ZonedDateTime.compare(start, end) >= 0) {
   throw new TRPCError({
     code: 'BAD_REQUEST',
     message: 'Appointment start time must be before end time',
   });
 }

  if (start.day !== end.day) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Appointment start and end times must be on the same day',
    });
  }

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
   const conflicts = await AppointmentStore.findAsync({
      $or: [
         { 
            appointmentStartTime: { $gt: startTime, $lt: endTime },
         },
         { 
            appointmentEndTime: { $gt: startTime, $lt: endTime },
         },
      ]
   });
   
   if (conflicts && conflicts.length > 0) {
      throw new TRPCError({
         code: 'CONFLICT',
         message: 'Appointment conflicts with existing appointment',
      });
   }
}

export { AppointmentStore, validateAppointmentTimeOfDay, ensureNoExistingConflicts };
