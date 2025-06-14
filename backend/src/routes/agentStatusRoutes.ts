// src/routes/agentStatusRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
// import { authenticateToken } from '../middleware/auth'; // <<< BU SATIRI SİLİN
import { getAgentStatusByUserIdAndPlatform, updateAgentStatus } from '../models/AgentStatus'; // Model importları
import { Platform } from '../types/types'; // Platform tipi

const router = Router();

// Tüm rotalar için kimlik doğrulamayı etkinleştir
// router.use(authenticateToken); // <<< BU SATIRI SİLİN

// Agent durumunu çekme
router.get('/:platform', async (req: Request, res: Response, next: NextFunction) => {
  // NOT: req.user artık JWT ile doldurulmadığı için
  // bu userId'yi başka bir yerden almanız gerekecek.
  // Geçici olarak mock bir ID kullanabiliriz.
  // const userId = req.user?.id; 
  const userId = "1"; // <<< GEÇİCİ OLARAK MOCK BİR KULLANICI ID'Sİ EKLEYİN

  const platform = req.params.platform as Platform;

  if (!userId) {
    res.status(401).json({ message: 'Kullanıcı kimliği bulunamadı.' });
    return;
  }

  try {
    const status = await getAgentStatusByUserIdAndPlatform(userId, platform);
    res.json({ userId, platform, status });
  } catch (error) {
    console.error('Agent durumu çekilirken hata:', error);
    next(error);
  }
});

// Agent durumunu güncelleme
router.post('/:platform', async (req: Request, res: Response, next: NextFunction) => {
  // NOT: req.user artık JWT ile doldurulmadığı için
  // bu userId'yi başka bir yerden almanız gerekecek.
  // Geçici olarak mock bir ID kullanabiliriz.
  // const userId = req.user?.id; 
  const userId = "1"; // <<< GEÇİCİ OLARAK MOCK BİR KULLANICI ID'Sİ EKLEYİN

  const platform = req.params.platform as Platform;
  const { status } = req.body; // status: boolean

  if (!userId || typeof status !== 'boolean') { // status'un boolean olduğunu kontrol et
    res.status(400).json({ message: 'Kullanıcı kimliği veya geçersiz durum bilgisi.' });
    return;
  }

  try {
    const success = await updateAgentStatus(userId, platform, status);
    if (success) {
      res.json({ message: 'Agent durumu başarıyla güncellendi.', userId, platform, status });
    } else {
      res.status(500).json({ message: 'Agent durumu güncellenirken bir hata oluştu.' });
    }
  } catch (error) {
    console.error('Agent durumu güncellenirken hata:', error);
    next(error);
  }
});

export default router;