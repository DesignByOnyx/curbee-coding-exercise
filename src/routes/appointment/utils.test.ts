import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateAppointmentTimeOfDay, ensureNoExistingConflicts } from './utils.js';
import { AppointmentStore } from './utils.js';
import { CustomerStore } from '../customer.js';
import { LocationStore } from '../location.js';
import { VehicleStore } from '../vehicle.js';

/** Helper to generate a date with a specific time */
const date = (hours: number, minutes: number) => {
   const date = new Date();
   date.setHours(hours, minutes, 0, 0);
   return date;
};

describe('Appointment Utils', () => {
   describe('validateAppointmentTimeOfDay', () => {
      it('should not throw if the appointment falls within business hours', () => {
         expect(() => validateAppointmentTimeOfDay(date(9, 0), date(10, 0))).not.toThrow();
         expect(() => validateAppointmentTimeOfDay(date(15, 0), date(17, 0))).not.toThrow();
         expect(() => validateAppointmentTimeOfDay(date(16, 0), date(17, 0))).not.toThrow();
         expect(() => validateAppointmentTimeOfDay(date(16, 30), date(17, 0))).not.toThrow();
      });

      it('should throw if the appointment falls outside of business hours', () => {
         expect(() => validateAppointmentTimeOfDay(date(1, 0), date(2, 0))).toThrow();
         expect(() => validateAppointmentTimeOfDay(date(8, 59), date(9, 0))).toThrow();
         expect(() => validateAppointmentTimeOfDay(date(15, 0), date(17, 1))).toThrow();
         expect(() => validateAppointmentTimeOfDay(date(16, 0), date(17, 1))).toThrow();
         expect(() => validateAppointmentTimeOfDay(date(16, 30), date(17, 1))).toThrow();
      });

      it('should throw if start date is after end date', () => {
         const start = date(12, 0);
         const end = date(11, 0);
         expect(() => validateAppointmentTimeOfDay(start, end)).toThrow('before end time');
      });

      it('should throw if end date is on a different day', () => {
         const end = date(12, 0);
         end.setDate(end.getDate() + 1);
         expect(() => validateAppointmentTimeOfDay(date(11, 0), end)).toThrow('same day');
      });
      it('should throw if start date is on a different day', () => {
         const start = date(11, 0);
         start.setDate(start.getDate() - 1);
         expect(() => validateAppointmentTimeOfDay(start, date(12, 0))).toThrow('same day');
      });
   });

   describe('ensureNoExistingConflicts', () => {
      beforeAll(async () => {
         const customer = await CustomerStore.createAsync({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@doe.com', phone: 1234567890 });
         const location = await LocationStore.createAsync({ id: '1', line1: '123 Main St', city: 'Anytown', state: 'CA', zipCode: '12345' });
         const vehicle = await VehicleStore.createAsync({ id: '1', vin: '12345678912345678' });
         // 10:00 AM - 11:00 AM
         await AppointmentStore.createAsync({ 
            id: '1', 
            appointmentStartTime: date(10, 0), 
            appointmentEndTime: date(11, 0), 
            locationId: location.id, 
            customerId: customer.id, 
            vehicleId: vehicle.id,
         });
         // 2:00 PM - 4:00 PM
         await AppointmentStore.createAsync({ 
            id: '2', 
            appointmentStartTime: date(14, 0), 
            appointmentEndTime: date(16, 0),
            locationId: location.id, 
            customerId: customer.id, 
            vehicleId: vehicle.id,
         });
      });

      afterAll(async () => {
         await AppointmentStore.removeAll();
         await CustomerStore.removeAll();
         await LocationStore.removeAll();
         await VehicleStore.removeAll();
      });

      it('should not throw if there are no conflicting appointments', async () => {
         await expect(ensureNoExistingConflicts(date(9, 0), date(10, 0))).resolves.not.toThrow();
         await expect(ensureNoExistingConflicts(date(14, 0), date(15, 0))).resolves.not.toThrow();
         await expect(ensureNoExistingConflicts(date(16, 0), date(16, 0))).resolves.not.toThrow();
      });

      it('should throw if there are conflicting appointments', async () => {
         await expect(ensureNoExistingConflicts(date(9, 30), date(10, 30))).rejects.toThrow();
         await expect(ensureNoExistingConflicts(date(13, 0), date(15, 0))).rejects.toThrow();
         await expect(ensureNoExistingConflicts(date(12, 30), date(17, 0))).rejects.toThrow();
      });
   });
});
