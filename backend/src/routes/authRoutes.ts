// src/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
// import jwt from 'jsonwebtoken'; // <<< BU SATIRI SİLİN
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '../models/User';
// import { JWT_SECRET } from '../config'; // <<< BU SATIRI SİLİN
import { User } from '../types/types';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.warn(`[AUTH] Geçersiz giriş denemesi: E-posta veya şifre eksik. (IP: ${req.ip})`);
    return res.status(400).json({ message: 'E-posta ve şifre gerekli.' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      console.warn(`[AUTH] Başarısız giriş denemesi: Kullanıcı bulunamadı. E-posta: ${email} (IP: ${req.ip})`);
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.warn(`[AUTH] Başarısız giriş denemesi: Hatalı şifre. E-posta: ${email} (IP: ${req.ip})`);
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    // JWT token oluşturma kısmı kaldırıldı
    // const token = jwt.sign(
    //   { id: user.id, email: user.email },
    //   JWT_SECRET,
    //   { expiresIn: '1h' }
    // );

    const userResponse: Partial<User> = {
      id: user.id,
      email: user.email,
      // password_hash'i kesinlikle göndermeyin!
      database_name: user.database_name, // Bu bilgiyi de göndermek isteyebilirsiniz
      created_at: user.created_at
    };

    console.info(`[AUTH] Başarılı giriş: Kullanıcı ${user.email} giriş yaptı. (ID: ${user.id}, IP: ${req.ip})`);
    // Token göndermek yerine sadece kullanıcı bilgilerini gönderiyoruz.
    res.json({ message: 'Giriş başarılı!', user: userResponse }); // <<< ', token' kaldırıldı
  } catch (error) {
    console.error(`[AUTH] Giriş işlemi sırasında sunucu hatası. E-posta: ${email}, Hata:`, error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

export default router;