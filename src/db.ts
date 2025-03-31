import os from 'node:os';
import path from 'node:path';
import DataStore from 'nedb';

/**
 * Creates a store for type T and returns the store with async methods.
 * @param type
 */
const createStore = <T>(type: string) => {
   const env = process.env.NODE_ENV || 'development';
   const db = new DataStore<T>({ 
      filename: path.join(os.tmpdir(), `curbee-code-exercise-${env}`, `${type}.db`), 
      autoload: true 
   });

   return {
      findOneAsync: (id: string) => new Promise<T>((resolve, reject) => {
         db.findOne({ id }, (err, doc) => {
            if (err) return reject(err);
            resolve(doc);
         });
      }),
      findAsync: (query: object) => new Promise<T[]>((resolve, reject) => {
         db.find(query).exec((err, docs) => {
            if (err) return reject(err);
            resolve(docs);
         });
      }),
      createAsync: (doc: T) => new Promise<T>((resolve, reject) => {
         db.insert(doc, (err, newDoc) => {
            if (err) return reject(err);
            resolve(newDoc);
         });
      }),
      updateAsync: (id: string, update: object) => new Promise<T>((resolve, reject) => {
         const options =  { upsert: false, multi: false, returnUpdatedDocs: true };
         db.update({ id }, update, options, (err, numAffected, affectedDocument) => {
            if (err) return reject(err);
            if (numAffected === 0) return reject(new Error('No document found'));
            resolve(affectedDocument as T);
         });
      }),
      removeAsync(id: string) {
         return new Promise<void>((resolve, reject) => {
            db.remove({ id }, {}, (err, numRemoved) => {
               if (err) return reject(err);
               if (numRemoved === 0) return reject(new Error('No document found'));
               resolve();
            });
         });
      },
      removeAll() {
         return new Promise<void>((resolve, reject) => {
            db.remove({}, { multi: true }, (err) => {
               if (err) return reject(err);
               resolve();
            });
         });
      }
   }
};

export { createStore };
