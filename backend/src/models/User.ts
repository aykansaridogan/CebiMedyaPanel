// src/models/User.ts
import { getDB } from '../database';
import { User } from '../types/types'; // Güncel types'tan User'ı al
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number; // Buranın 'number' olduğundan emin ol
  email: string;
  password_hash: string; // Buranın 'password_hash' olduğundan emin ol
  created_at: string;
  database_name: string; // database_name'i de eklemeliyiz, yoksa login sırasında erişemeyiz
}

export const findUserById = async (id: number): Promise<User | undefined> => {
  const db = getDB();
  const [rows] = await db.execute<UserRow[]>('SELECT id, email, password_hash, database_name, created_at FROM users WHERE id = ?', [id]);
  if (rows.length > 0) {
    const userRow = rows[0];
    return {
      id: userRow.id,
      email: userRow.email,
      password_hash: userRow.password_hash,
      database_name: userRow.database_name, // Return değerine ekle
      created_at: userRow.created_at
    };
  }
  return undefined;
};

// Vurgu: Buradaki 'export' kelimesi çok önemli!
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const db = getDB();
  const [rows] = await db.execute<UserRow[]>('SELECT id, email, password_hash, database_name, created_at FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    const userRow = rows[0];
    return {
      id: userRow.id,
      email: userRow.email,
      password_hash: userRow.password_hash,
      database_name: userRow.database_name, // Return değerine ekle
      created_at: userRow.created_at
    };
  }
  return undefined;
};