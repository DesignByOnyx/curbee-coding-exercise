import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { ILocation } from "../schemas/location.schema.js";
import { Location, LocationCreate } from "../schemas/location.schema.js";
import { router, publicProcedure } from "../trpc.js";
import { createStore } from "../db.js";

const LocationStore = createStore<ILocation>('locations');

const LocationRouter = router({
   /**
    * Gets a location by ID
    */
   get: publicProcedure
      .input(z.string())
      .output(Location)
      .query(async ({ input }) => {
         const location = LocationStore.findOneAsync(input);
         if (!location) {
            throw new TRPCError({
               code: 'NOT_FOUND',
               message: `Customer with ID ${input} not found`,
            });
         }
         return location;
      }),

   /**
    * Gets a list of locations
    */
   find: publicProcedure
      .input(Location.partial())
      .output(Location.array())
      .query(({ input }) => {
         return LocationStore.findAsync(input);
      }),
   
   /**
    * Creates a location
    */
   create: publicProcedure
      .input(LocationCreate)
      .output(Location)
      .mutation((opts) => {
         const newLocation = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            ...opts.input,
         };
         return LocationStore.createAsync(newLocation);
      }),
});

export { LocationStore, LocationRouter };
