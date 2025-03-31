import { z } from 'zod';

const LocationCreate = z.object({
  line1: z.string().min(1, "Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "Zip code must be at least 5 characters long"),
});

const Location = LocationCreate.extend({
  id: z.string(),
});

export type ILocationCreate = z.infer<typeof LocationCreate>;
export type ILocation = z.infer<typeof Location>;

export { LocationCreate, Location };
