import { z } from 'zod';

/** Schema for creating a Vehicle */
const VehicleCreate = z.object({
   //   make: z.string().min(1, "Make is required"),
   //   model: z.string().min(1, "Model is required"),
   //   year: z.number().int().min(1886, "Year must be a valid year"), // The first car was made in 1886
   vin: z.string().length(17, "VIN must be exactly 17 characters long"),
});

/** Schema for a Vehicle as it appears in the DB */
const Vehicle = VehicleCreate.extend({
   id: z.string(),
});

export type IVehicleCreate = z.infer<typeof VehicleCreate>;
export type IVehicle = z.infer<typeof Vehicle>;

export { VehicleCreate, Vehicle };
