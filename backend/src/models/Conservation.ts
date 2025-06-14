// src/models/Conservation.ts
import { getDB } from '../database';
import { Conversation, Message, Platform, MessageType } from '../types/types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid'; // uuid import edildi

// MySQL'den dönen RowDataPacket'ı kendi tiplerimize dönüştürmek için yardımcı arayüzler
interface ConversationRow extends RowDataPacket, Conversation {}
interface MessageRow extends RowDataPacket, Message {}

// Sabit veritabanı isimleri
const CEBIMEDYA_DB = 'cebimedya';

// Kullanıcının tüm konuşmalarını platforma göre veya hepsi birden çekme
export const getConversationsByUserId = async (userId: string, platform?: Platform): Promise<Conversation[]> => {
    const db = getDB();
    // Konuşmalar her zaman ana dashboard veritabanında tutulur
    let query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (platform) {
        query += ' AND platform = ?';
        params.push(platform);
    }
    query += ' ORDER BY updated_at DESC'; // En son güncellenenler başta olsun

    const [rows] = await db.execute<ConversationRow[]>(query, params);
    return rows.map(row => ({
        id: row.id,
        user_id: row.user_id as unknown as number,
        platform: row.platform as Platform,
        contact_name: row.contact_name,
        contact_phone_number: row.contact_phone_number,
        contact_instagram_id: row.contact_instagram_id,
        last_message_content: row.last_message_content,
        last_message_timestamp: row.last_message_timestamp,
        unread_count: row.unread_count,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }));
};

// Belirli bir konuşmaya ait mesajları çekme
// Bu fonksiyon messaging_dashboard_db'deki messages_whatsapp tablosunu kullanır
export const getMessagesByConversationId = async (conversationId: string): Promise<Message[]> => { // userDatabaseName parametresi kaldırıldı
    const db = getDB();
    const query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.messages_whatsapp WHERE conversation_id = ? ORDER BY timestamp ASC`;
    const [rows] = await db.execute<MessageRow[]>(query, [conversationId]);
    return rows.map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_name: row.sender_name,
        content: row.content,
        timestamp: row.timestamp,
        is_outbound: Boolean(row.is_outbound),
        platform: row.platform as Platform,
        message_type: row.type as MessageType, // 'type' kolonunu 'message_type' olarak eşle
        image_url: row.media_url, // 'media_url' kolonunu 'image_url' olarak eşle
        audio_url: row.media_url, // 'media_url' kolonunu 'audio_url' olarak eşle (eğer backend tek bir media_url döndürüyorsa)
    }));
};

// Yeni mesaj oluşturma fonksiyonu (hem messaging_dashboard_db hem de cebimedya.message_buffer için)
export const createMessage = async (
    conversationId: string,
    senderName: string,
    content: string,
    isOutbound: boolean,
    platform: Platform,
    messageType: MessageType = 'text',
    imageUrl: string | null = null,
    audioUrl: string | null = null
): Promise<string> => {
    const db = getDB();
    const messageId = uuidv4(); // Mesaj için benzersiz bir ID oluştur
    const now = new Date(); // Doğrudan Date objesi kullanıyoruz

    let mediaUrl: string | null = null;
    if (messageType === 'image' && imageUrl) {
        mediaUrl = imageUrl;
    } else if (messageType === 'audio' && audioUrl) {
        mediaUrl = audioUrl;
    }

    // messages_whatsapp tablosuna mesajı kaydet (her zaman ana dashboard DB'ye)
    const insertMessageQuery = `
        INSERT INTO \`${CEBIMEDYA_DB}\`.messages_whatsapp
        (id, conversation_id, sender_name, content, is_outbound, timestamp, platform, type, media_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertMessageParams = [
        messageId,
        conversationId,
        senderName,
        content,
        isOutbound,
        now, // Doğrudan Date objesi parametre olarak geçiliyor
        platform,
        messageType,
        mediaUrl
    ];
    await db.execute<ResultSetHeader>(insertMessageQuery, insertMessageParams);

    // Eğer platform 'whatsapp' ise, cebimedya.message_buffer tablosuna da kaydet
    if (platform === 'whatsapp') {
        const cebimedyaDb = getDB(); // Aynı veritabanı bağlantı havuzunu kullanabiliriz
        const insertBufferQuery = `
            INSERT INTO \`${CEBIMEDYA_DB}\`.message_buffer
            (id, session_id, message_type, message_text, image_url, audio_url, timestamp, is_processed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertBufferParams = [
            uuidv4(), // Buffer mesajı için ayrı bir ID
            conversationId, // session_id olarak conversation_id kullanıldı
            messageType,
            content,
            imageUrl,
            audioUrl,
            now, // Aynı Date objesini buffer için de kullanıyoruz
            false // is_processed varsayılan olarak false
        ];
        await cebimedyaDb.execute<ResultSetHeader>(insertBufferQuery, insertBufferParams);
    }

    return messageId; // Oluşturulan mesajın ID'sini döndür
};

// Konuşmanın son mesajını güncelle
export const updateConversationLastMessage = async (
    conversationId: string,
    lastMessageContent: string,
    lastMessageTimestamp: Date,
    incrementUnreadCount: boolean = false
): Promise<boolean> => { // userDatabaseName parametresi kaldırıldı
    const db = getDB();
    // Konuşmalar her zaman ana dashboard veritabanında güncellenir
    let query = `UPDATE \`${CEBIMEDYA_DB}\`.conversations SET last_message_content = ?, last_message_timestamp = ?, updated_at = NOW()`;
    const params: (string | Date | number)[] = [lastMessageContent, lastMessageTimestamp];

    if (incrementUnreadCount) {
        query += ', unread_count = unread_count + 1';
    }
    query += ' WHERE id = ?';
    params.push(conversationId);

    const [result] = await db.execute<ResultSetHeader>(query, params);
    return result.affectedRows > 0;
};


// Yeni bir konuşma oluşturma
export const createConversation = async (
    userId: string,
    conversationId: string,
    platform: Platform,
    contactName: string,
    lastMessageContent: string,
    lastMessageTimestamp: Date,
    contactPhoneNumber?: string,
    contactInstagramId?: string
): Promise<string> => {
    const db = getDB();
    // Konuşmalar her zaman ana dashboard veritabanında oluşturulur
    const query = `
        INSERT INTO \`${CEBIMEDYA_DB}\`.conversations
        (id, user_id, platform, contact_name, contact_phone_number, contact_instagram_id, last_message_content, last_message_timestamp, unread_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
        conversationId,
        userId,
        platform,
        contactName,
        contactPhoneNumber || null, // undefined yerine null gönder
        contactInstagramId || null, // undefined yerine null gönder
        lastMessageContent,
        lastMessageTimestamp, // Direkt Date objesi geçiliyor
        1 // Yeni konuşma başlatıldığında okunmamış mesaj sayısı 1 olabilir
    ];

    await db.execute<ResultSetHeader>(query, params);
    return conversationId;
};

// Kullanıcının konuşma sayılarını platforma göre çekme
export const getConversationCountsByUserId = async (userId: string): Promise<{ platform: Platform; count: number }[]> => {
    const db = getDB();
    // Konuşma sayıları her zaman ana dashboard veritabanından çekilir
    const query = `SELECT platform, COUNT(id) as count FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? GROUP BY platform`;
    const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
    return rows.map(row => ({
        platform: row.platform as Platform,
        count: row.count,
    }));
};

// Telefon numarasına göre konuşma bulma
export const findConversationByContactPhoneNumber = async (userId: string, phoneNumber: string): Promise<Conversation | undefined> => {
    const db = getDB();
    // Konuşmalar her zaman ana dashboard veritabanında aranır
    const query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? AND contact_phone_number = ? AND platform = 'whatsapp'`;
    const [rows] = await db.execute<ConversationRow[]>(query, [userId, phoneNumber]);
    return rows[0] ? {
        id: rows[0].id,
        user_id: rows[0].user_id as unknown as number,
        platform: rows[0].platform as Platform,
        contact_name: rows[0].contact_name,
        contact_phone_number: rows[0].contact_phone_number,
        contact_instagram_id: rows[0].contact_instagram_id,
        last_message_content: rows[0].last_message_content,
        last_message_timestamp: rows[0].last_message_timestamp,
        unread_count: rows[0].unread_count,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
    } : undefined;
};

// Instagram ID'sine göre konuşma bulma
export const findConversationByContactInstagramId = async (userId: string, instagramId: string): Promise<Conversation | undefined> => {
    const db = getDB();
    // Konuşmalar her zaman ana dashboard veritabanında aranır
    const query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? AND contact_instagram_id = ? AND platform = 'instagram'`;
    const [rows] = await db.execute<ConversationRow[]>(query, [userId, instagramId]);
    return rows[0] ? {
        id: rows[0].id,
        user_id: rows[0].user_id as unknown as number,
        platform: rows[0].platform as Platform,
        contact_name: rows[0].contact_name,
        contact_phone_number: rows[0].contact_phone_number,
        contact_instagram_id: rows[0].contact_instagram_id,
        last_message_content: rows[0].last_message_content,
        last_message_timestamp: rows[0].last_message_timestamp,
        unread_count: rows[0].unread_count,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
    } : undefined;
};