import { z } from 'zod';

const CustomerCreate = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email("Invalid email address"),
  phone: z.number().int(),
});

const Customer = CustomerCreate.extend({
   id: z.string(),
});

export type ICustomerCreate = z.infer<typeof CustomerCreate>;
export type ICustomer = z.infer<typeof Customer>;

export { CustomerCreate, Customer };
