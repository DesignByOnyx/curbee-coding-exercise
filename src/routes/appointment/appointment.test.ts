import { describe, it, expect, afterEach } from 'vitest';
import { IAppointment } from '../../schemas/appointment.schema.js';
import { AppointmentRouter } from './appointment.js';
import { AppointmentStore } from './utils.js';

/** Creates an appointment by combining default data with any passed input data */
const createAppointment = async (input: Partial<IAppointment> = {}) => {
   return await AppointmentRouter.createCaller({}).create({
      appointmentStartTime: new Date('2023-09-01T16:00:00Z'),
      appointmentEndTime: new Date('2023-09-01T18:00:00Z'),
      locationId: '1',
      customerId: '1',
      vehicleId: '1',
      ...input,
   });
};

/** Helper to generate a date with a specific time */
const date = (hours: number, minutes: number) => {
   const date = new Date();
   date.setHours(hours, minutes, 0, 0);
   return date;
};

describe('Appointment API', () => {
   afterEach(async () => {
      await AppointmentStore.removeAll();
   });

   it('should create an appointment successfully', async () => {
      const input = {
         appointmentStartTime: date(14, 0),
         appointmentEndTime: date(15, 0),
      };

      // Call the create appointment function
      const result = await createAppointment(input)

      // Check the result
      expect(result).toHaveProperty('id');
      expect(result.appointmentStartTime).toEqual(input.appointmentStartTime);
      expect(result.appointmentEndTime).toEqual(input.appointmentEndTime);
      expect(result.locationId).toEqual('1');
      expect(result.customerId).toEqual('1');
      expect(result.vehicleId).toEqual('1');
   });

   it('should return an error if the date is before business hours', async () => {
      const input = {
         appointmentStartTime: date(8, 0),
         appointmentEndTime: date(9, 0),
      };

      // Call the create appointment function
      await expect(() => createAppointment(input)).rejects.toThrow();
   });

   it('should return an error if the date is after business hours', async () => {
      const input = {
         appointmentStartTime: date(16, 0),
         appointmentEndTime: date(18, 0),
      };

      // Call the create appointment function
      try {
         await createAppointment(input);
         throw new Error('Should not have succeeded');
      } catch (error) {
         console.log(error);
         expect(error).toBeDefined();
      }
   });
});
