// src/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3001;

export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_DATABASE = process.env.DB_DATABASE || 'messaging_dashboard_db';
export const DB_Medya = process.env.DB_Medya || 'cebimedya';
