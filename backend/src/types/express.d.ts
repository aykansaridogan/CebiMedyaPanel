// src/types/express.d.ts
import { User } from '../types'; // src/types.ts'ten User'ı import et

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}