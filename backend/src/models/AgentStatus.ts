// src/models/AgentStatus.ts (Örnek bir yapılandırma)
import { getDB2 } from '../database';
import { AgentStatus, Platform } from '../types/types'; // AgentStatus ve Platform import edildi
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AgentStatusRow extends RowDataPacket, AgentStatus {}

// Belirli bir kullanıcı ve platform için agent durumunu çekme
export const getAgentStatusByUserIdAndPlatform = async (userId: string, platform: Platform): Promise<boolean> => {
  const db = getDB2();
  const query = `SELECT status FROM agent_statuses WHERE user_id = ? AND platform = ?`;
  const [rows] = await db.execute<AgentStatusRow[]>(query, [userId, platform]);
  return rows.length > 0 ? Boolean(rows[0].status) : false; // Boolean olarak döndür
};

// Agent durumunu güncelleme veya oluşturma
export const updateAgentStatus = async (userId: string, platform: Platform, status: boolean): Promise<boolean> => {
  const db = getDB2();
  const existingStatus = await getAgentStatusByUserIdAndPlatform(userId, platform);

  if (existingStatus !== undefined) { // Durum zaten varsa güncelle
    const query = `UPDATE agent_statuses SET status = ? WHERE user_id = ? AND platform = ?`;
    const [result] = await db.execute<ResultSetHeader>(query, [status, userId, platform]);
    return result.affectedRows > 0;
  } else { // Durum yoksa oluştur
    const query = `INSERT INTO agent_statuses (user_id, platform, status) VALUES (?, ?, ?)`;
    const [result] = await db.execute<ResultSetHeader>(query, [userId, platform, status]);
    return result.affectedRows > 0;
  }
};