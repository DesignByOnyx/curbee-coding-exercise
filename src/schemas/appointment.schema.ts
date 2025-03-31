import { z } from "zod";
import { Location, LocationCreate } from "./location.schema.js";
import { Customer, CustomerCreate } from "./customer.schema.js";
import { Vehicle, VehicleCreate } from "./vehicle.schema.js";

/** Represents an appointment without any of the relational data fields */
const BaseAppointment = z.object({
   appointmentStartTime: z.coerce.date(),
   appointmentEndTime: z.coerce.date(),
});

/** Schema used for creating an appointment with REFERENCES to existing details (customer, vehicle, etc) */
const AppointmentCreate = BaseAppointment.extend({
  locationId: z.string(),
  customerId: z.string(),
  vehicleId: z.string(),
});

/** Schema for an Appointment as it appears in the DB */
const Appointment = AppointmentCreate.extend({
  id: z.string(),
});

/** 
 * Schema used for creating an appointment with fully hydrated details.
 * The relational data is not referenced by ID, but is fully populated.
 * The related data will be created in the DB and then the appointment will be created.
 */
const AppointmentWithDetailsCreate = BaseAppointment.extend({
   location: LocationCreate,
   customer: CustomerCreate,
   vehicle: VehicleCreate,
 });

/** Schema for an Appointment with populated details */
const AppointmentWithDetails = Appointment.extend({
  location: Location,
  customer: Customer,
  vehicle: Vehicle,
});

export type IAppointmentCreate = z.infer<typeof AppointmentCreate>;
export type IAppointment = z.infer<typeof Appointment>;
export type IAppointmentWithDetailsCreate = z.infer<typeof AppointmentWithDetailsCreate>;
export type IAppointmentWithDetails = z.infer<typeof AppointmentWithDetails>;

export { AppointmentCreate, AppointmentWithDetailsCreate, Appointment, AppointmentWithDetails };
