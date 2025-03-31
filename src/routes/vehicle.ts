import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { IVehicle } from "../schemas/vehicle.schema.js";
import { Vehicle, VehicleCreate } from "../schemas/vehicle.schema.js";
import { router, publicProcedure } from "../trpc.js";
import { createStore } from "../db.js";

const VehicleStore = createStore<IVehicle>('vehicles');

const VehicleRouter = router({
   /**
    * Gets a vehicle by ID
    */
   get: publicProcedure
      .input(z.string())
      .output(Vehicle)
      .query(async ({ input }) => {
         const vehicle = VehicleStore.findOneAsync(input);
         if (!vehicle) {
            throw new TRPCError({
               code: 'NOT_FOUND',
               message: `Vehicle with ID ${input} not found`,
            });
         }
         return vehicle;
      }),

   /**
    * Gets a list of vehicles
    */
   find: publicProcedure
      .input(Vehicle.partial())
      .output(Vehicle.array())
      .query(({ input }) => {
         return VehicleStore.findAsync(input);
      }),
   
   /**
    * Creates a vehicle
    */
   create: publicProcedure
      .input(VehicleCreate)
      .output(Vehicle)
      .mutation((opts) => {
         const newVehicle = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            ...opts.input,
         };
         return VehicleStore.createAsync(newVehicle);
      }),
});

export { VehicleStore, VehicleRouter };
