// src/database.ts
import mysql from 'mysql2/promise'; // promise tabanlı mysql2 kullanıyoruz
import { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } from './config';

let pool: mysql.Pool;

export const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: 'Z', // MySQL'e UTC zaman dilimi kullandığınızı belirtir
      // veya timezone: '+00:00', // Aynı anlamda
      // veya sunucunuzun zaman dilimiyle uyumlu olacak şekilde: timezone: 'local'
    });
    console.log('MySQL veritabanına başarıyla bağlanıldı!');
  } catch (error) {
    console.error('MySQL bağlantı hatası:', error);
    process.exit(1); // Bağlantı hatası olursa uygulamayı sonlandır
  }
};

export const getDB = () => {
  if (!pool) {
    throw new Error('Veritabanı bağlantısı kurulmadı. Önce connectDB() çağırın.');
  }
  return pool;
};