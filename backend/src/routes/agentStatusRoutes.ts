// src/routes/agentStatusRoutes.ts (Typescript 'any' hatası giderilmiş hali)
import { Router, Request, Response, NextFunction } from 'express';
// import { authenticateToken } from '../middleware/auth'; // Kimlik doğrulama gerekiyorsa aktif et

// MySQL bağlantı havuzunu getDB2() fonksiyonu üzerinden import et
import { getDB2 } from '../database'; 
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2'; // <<< YENİ İMPORTLAR BURADA!

const router = Router();

// AI'ın GLOBAL durumunu temsil eden sabit kullanıcı ID'si ve platform.
const GLOBAL_AI_USER_ID_TO_USE = 1;
const GLOBAL_AI_PLATFORM = 'whatsapp'; // Bu, GLOBAL durumu temsil eden platformdur.

// Tüm rotalar için kimlik doğrulamayı etkinleştir (gerekiyorsa aktif et)
// router.use(authenticateToken); 

// Agent durumunu çekme
router.get('/:platform', async (req: Request, res: Response, next: NextFunction) => {
  const db = getDB2(); 
  const userIdToQuery = GLOBAL_AI_USER_ID_TO_USE;
  const platformToQuery = GLOBAL_AI_PLATFORM;

  try {
    // SELECT sorgusu için RowDataPacket[] ve FieldPacket[] döndüğünü belirttik.
    // Sadece ilk elemanı (rows) almak için [rows] kullandık.
    const [rows]: [RowDataPacket[], FieldPacket[]] = await db.execute( 
      `SELECT status FROM agent_statuses WHERE user_id = ? AND platform = ?`,
      [userIdToQuery, platformToQuery]
    );

    let currentStatus: string | null = null;
    if (rows.length > 0) {
      // rows[0].status'ın doğru tipte olduğundan emin olmak için tip kontrolü
      const statusFromDb = (rows[0] as { status: string }).status; 
      currentStatus = statusFromDb;
    } else {
      currentStatus = 'inactive';
    }

    const booleanStatus = (currentStatus === 'active');

    res.json({ success: true, userId: userIdToQuery, platform: platformToQuery, status: booleanStatus });
  } catch (error) {
    console.error('Global Agent durumu çekilirken hata:', error);
    next(error);
  }
});

// Agent durumunu güncelleme
router.post('/:platform', async (req: Request, res: Response, next: NextFunction) => {
  const db = getDB2(); 
  const userIdToUpdate = GLOBAL_AI_USER_ID_TO_USE;
  const platformToUpdate = GLOBAL_AI_PLATFORM;

  const { status: booleanStatus } = req.body; 

  if (typeof booleanStatus !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Geçersiz durum bilgisi. Durum boolean (true/false) olmalı.' });
  }

  const newStatusString = booleanStatus ? 'active' : 'inactive';

  try {
    const updateQuery = `
      UPDATE agent_statuses SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND platform = ?;
    `;
    // UPDATE sorgusu için ResultSetHeader ve FieldPacket[] döndüğünü belirttik.
    const [updateResult]: [ResultSetHeader, FieldPacket[]] = await db.execute(updateQuery, [newStatusString, userIdToUpdate, platformToUpdate]); 

    if (updateResult.affectedRows === 0) {
      const insertQuery = `
        INSERT INTO agent_statuses (user_id, platform, status) VALUES (?, ?, ?);
      `;
      // INSERT sorgusu için ResultSetHeader ve FieldPacket[] döndüğünü belirttik.
      await db.execute<ResultSetHeader>(insertQuery, [userIdToUpdate, platformToUpdate, newStatusString]); // Type'ı direkt execute içine verdik.
    }

    res.json({ success: true, message: 'Agent durumu başarıyla güncellendi.', userId: userIdToUpdate, platform: platformToUpdate, status: booleanStatus });
  } catch (error) {
    console.error('Global Agent durumu güncellenirken hata:', error);
    next(error);
  }
});

export default router;