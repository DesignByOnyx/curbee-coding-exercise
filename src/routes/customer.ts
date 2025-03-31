import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { ICustomer } from "../schemas/customer.schema.js";
import { Customer, CustomerCreate } from "../schemas/customer.schema.js";
import { router, publicProcedure } from "../trpc.js";
import { createStore } from "../db.js";

const CustomerStore = createStore<ICustomer>('customers');

const CustomerRouter = router({
   /**
    * Gets a customer by ID
    */
   get: publicProcedure
      .input(z.string())
      .output(Customer)
      .query(async ({ input }) => {
         const customer = CustomerStore.findOneAsync(input);
         if (!customer) {
            throw new TRPCError({
               code: 'NOT_FOUND',
               message: `Customer with ID ${input} not found`,
            });
         }
         return customer;
      }),

   /**
    * Gets a list of customers
    */
   find: publicProcedure
      .input(Customer.partial())
      .output(Customer.array())
      .query(({ input }) => {
         return CustomerStore.findAsync(input);
      }),
   
   /**
    * Creates a customer
    */
   create: publicProcedure
      .input(CustomerCreate)
      .output(Customer)
      .mutation((opts) => {
         const newCustomer = {
            id: `${Math.ceil(Math.random() * 1000)}`,
            ...opts.input,
         };
         return CustomerStore.createAsync(newCustomer);
      }),
});

export { CustomerStore, CustomerRouter };
