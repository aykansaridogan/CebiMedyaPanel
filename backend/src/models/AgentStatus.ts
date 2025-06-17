// src/models/AgentStatus.ts (Düzeltilmiş hali - Tür güvenliği ve ENUM/Boolean dönüşümü için)
import { getDB2 } from '../database';
import { AgentStatus, Platform } from '../types/types'; // AgentStatus ve Platform import edildi
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2'; // FieldPacket import edildi

interface AgentStatusRow extends RowDataPacket, AgentStatus {}

// Belirli bir kullanıcı ve platform için agent durumunu çekme
export const getAgentStatusByUserIdAndPlatform = async (userId: string, platform: Platform): Promise<boolean> => {
  const db = getDB2();
  const query = `SELECT status FROM agent_statuses WHERE user_id = ? AND platform = ?`;
  // execute metodu [RowDataPacket[], FieldPacket[]] döndürür, sadece RowDataPacket[] kısmını alıyoruz.
  const [rows] = await db.execute<AgentStatusRow[]>(query, [userId, platform]); 

  // Açıklama: rows[0].status değeri MySQL'den 'active' veya 'inactive' stringi olarak gelir.
  // rows[0].status === 'active' ifadesi, bu stringin 'active' olup olmadığını kontrol eder.
  // Eğer 'active' ise 'true', değilse 'false' döner.
  // Bu, ENUM('active', 'inactive') tipindeki veritabanı değerini boolean (true/false) değere dönüştürmek için doğru yöntemdir.
  return rows.length > 0 ? (rows[0].status === 'active') : false;
};

// Agent durumunu güncelleme veya oluşturma
export const updateAgentStatus = async (userId: string, platform: Platform, status: boolean): Promise<boolean> => {
  const db = getDB2();
  
  // Gelen boolean status değerini veritabanındaki ENUM formatına dönüştür
  const statusString = status ? 'active' : 'inactive';

  try {
    // Önce mevcut bir satırı güncellemeye çalış
    const updateQuery = `
      UPDATE agent_statuses SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND platform = ?;
    `;
    // TypeScript tür güvenliğini artırmak için 'any' yerine daha spesifik tür kullanıldı.
    // execute metodu [ResultSetHeader, FieldPacket[]] döndürür. İlk eleman olan ResultSetHeader'ı alıyoruz.
    const [updateResult]: [ResultSetHeader, FieldPacket[]] = await db.execute(updateQuery, [statusString, userId, platform]);

    // Eğer hiçbir satır güncellenmediyse (yani o user_id ve platform kombinasyonu yoksa), yeni bir satır ekle
    if (updateResult.affectedRows === 0) {
      const insertQuery = `
        INSERT INTO agent_statuses (user_id, platform, status) VALUES (?, ?, ?);
      `;
      // TypeScript tür güvenliğini artırmak için 'any' yerine daha spesifik tür kullanıldı.
      const [insertResult]: [ResultSetHeader, FieldPacket[]] = await db.execute(insertQuery, [userId, platform, statusString]);
      return insertResult.affectedRows > 0;
    }
    
    return updateResult.affectedRows > 0; // Güncelleme başarılı olduysa true dön
  } catch (error) {
    console.error('Agent durumu güncellenirken/oluşturulurken hata:', error);
    throw error; // Hatayı çağırana ilet
  }
};