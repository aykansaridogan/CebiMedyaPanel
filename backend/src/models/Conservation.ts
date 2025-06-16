// src/models/Conservation.ts - KESİN VE DOĞRU HALE GETİRİLDİ
import { getDB2 } from '../database'; // database bağlantısının yolunu kontrol et
import { Conversation, Message, Platform, MessageType } from '../types/types'; // tiplerin yolunu kontrol et
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

// MySQL'den dönen RowDataPacket'ı kendi tiplerimize dönüştürmek için yardımcı arayüzler
interface ConversationRow extends RowDataPacket, Conversation {}
// MessageRow'da veritabanından gelen sütun isimlerine göre eşleme yapıyoruz
interface MessageRow extends RowDataPacket {
    id: string;
    conversation_id: string;
    sender_name: string;
    content: string;
    timestamp: Date; // MySQL'den Date objesi olarak gelebilir
    is_outbound: number; // MySQL'de boolean genelde tinyint(1) olarak tutulur (0 veya 1)
    platform: string;
    type: string; // Veritabanındaki 'type' kolonu (örn: 'text', 'image', 'audio')
    media_url?: string | null; // Veritabanındaki 'media_url' kolonu, null veya undefined olabilir
}

// Sabit veritabanı ismi
const CEBIMEDYA_DB = 'cebimedya';

// Yardımcı fonksiyon: Platforma göre doğru mesaj tablosu adını döndürür
const getMessageTableName = (platform: Platform): string => {
    switch (platform) {
        case 'whatsapp':
            return 'messages_whatsapp';
        case 'instagram':
            return 'messages_instagram';
        case 'messenger': 
            return 'messages_messenger';
        default:
            throw new Error(`Desteklenmeyen platform: ${platform}`);
    }
};

// Kullanıcının tüm konuşmalarını platforma göre veya hepsi birden çeker
export const getConversationsByUserId = async (userId: string, platform?: Platform): Promise<Conversation[]> => {
    const db = getDB2();
    let query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (platform) {
        query += ' AND platform = ?';
        params.push(platform);
    }
    query += ' ORDER BY updated_at DESC'; // Son güncellenen en üstte olacak

    const [rows] = await db.execute<ConversationRow[]>(query, params);
    return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    platform: row.platform as Platform,
    contact_name: row.contact_name,
    contact_phone_number: row.contact_phone_number,
    contact_instagram_id: row.contact_instagram_id,
    last_message_content: row.last_message_content,
    last_message_timestamp: row.last_message_timestamp || new Date(row.last_message_timestamp).toISOString(),
    unread_count: row.unread_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
}));
};

// Belirli bir konuşmanın son mesaj içeriğini çeker
export async function getLastMessageContentByConversationId(conversationId: string): Promise<{ content: string } | null> {
    const db = getDB2();
    interface ContentRow extends RowDataPacket {
        content: string;
    }

    const [rows] = await db.query<ContentRow[]>(
        `SELECT last_message_content AS content
         FROM \`${CEBIMEDYA_DB}\`.conversations
         WHERE id = ? 
         LIMIT 1`,
        [conversationId]
    );

    return rows.length > 0 ? rows[0] : null;
}

// Belirli bir konuşmaya ait mesajları platforma göre çeker
export const getMessagesByConversationId = async (conversationId: string, platform: Platform): Promise<Message[]> => {
    const db = getDB2();
    const tableName = getMessageTableName(platform); // Platforma göre doğru tabloyu seç

    const query = `
        SELECT 
            id, 
            conversation_id, 
            sender_name, 
            content, 
            timestamp, 
            is_outbound, 
            platform, 
            type, 
            media_url 
        FROM \`${CEBIMEDYA_DB}\`.${tableName} 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC`; 

    const [rows] = await db.execute<MessageRow[]>(query, [conversationId]);

    return rows.map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_name: row.sender_name,
        content: row.content,
        timestamp: new Date(row.timestamp).toISOString(), // ISO string formatına dönüştür
        is_outbound: Boolean(row.is_outbound), // Tinyint(1)'den boolean'a dönüştür
        platform: row.platform as Platform,
        message_type: row.type as MessageType,
        image_url: row.media_url || undefined, // null ise undefined yap
        audio_url: row.media_url || undefined, // null ise undefined yap
    }));
};

// Yeni mesaj oluşturma fonksiyonu (hem ilgili mesaj tablosu hem de message_buffer için)
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
    const db = getDB2();
    const messageId = uuidv4();
    const now = new Date();

    // Medya URL'ini mesaj tipine göre belirle
    let mediaUrl: string | null = null;
    if (messageType === 'image' && imageUrl) {
        mediaUrl = imageUrl;
    } else if (messageType === 'audio' && audioUrl) {
        mediaUrl = audioUrl;
    }

    const tableName = getMessageTableName(platform); // Platforma göre doğru tabloyu seç

    // Ana mesaj tablosuna ekleme
    const insertMessageQuery = `
        INSERT INTO \`${CEBIMEDYA_DB}\`.${tableName}
        (id, conversation_id, sender_name, content, is_outbound, timestamp, platform, type, media_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertMessageParams = [
        messageId,
        conversationId,
        senderName,
        content,
        isOutbound,
        now,
        platform,
        messageType,
        mediaUrl
    ];
    await db.execute<ResultSetHeader>(insertMessageQuery, insertMessageParams);

    // Eğer platform WhatsApp ise, message_buffer tablosuna da ekle
    if (platform === 'whatsapp') {
        const insertBufferQuery = `
            INSERT INTO \`${CEBIMEDYA_DB}\`.message_buffer
            (id, session_id, message_type, message_text, image_url, audio_url, timestamp, is_processed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertBufferParams = [
            uuidv4(), // Buffer için yeni bir UUID oluştur
            conversationId,
            messageType,
            content,
            imageUrl,
            audioUrl,
            now,
            false // Başlangıçta işlenmedi olarak işaretle
        ];
        await db.execute<ResultSetHeader>(insertBufferQuery, insertBufferParams);
    }

    return messageId;
};

// Konuşmanın son mesajını ve zaman damgasını günceller, okunmamış sayısını artırır
export const updateConversationLastMessage = async (
    conversationId: string,
    lastMessageContent: string,
    lastMessageTimestamp: Date,
    incrementUnreadCount: boolean = false
): Promise<boolean> => {
    const db = getDB2();
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

// Yeni bir konuşma oluşturur
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
    const db = getDB2();
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
        contactPhoneNumber || null, // null olarak kaydet eğer boşsa
        contactInstagramId || null, // null olarak kaydet eğer boşsa
        lastMessageContent,
        lastMessageTimestamp,
        1 // Yeni konuşma başlatıldığında başlangıçta 1 okunmamış mesaj
    ];

    await db.execute<ResultSetHeader>(query, params);
    return conversationId;
};

// Kullanıcının konuşma sayılarını platforma göre çeker
export const getConversationCountsByUserId = async (userId: string): Promise<{ platform: Platform; count: number }[]> => {
    const db = getDB2();
    const query = `SELECT platform, COUNT(id) as count FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? GROUP BY platform`;
    const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
    return rows.map(row => ({
        platform: row.platform as Platform,
        count: row.count,
    }));
};

// Telefon numarasına göre konuşma bulur (WhatsApp için)
export const findConversationByContactPhoneNumber = async (userId: string, phoneNumber: string): Promise<Conversation | undefined> => {
    const db = getDB2();
    const query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? AND contact_phone_number = ? AND platform = 'whatsapp'`;
    const [rows] = await db.execute<ConversationRow[]>(query, [userId, phoneNumber]);
    return rows[0] ? {
        id: rows[0].id,
        user_id: rows[0].user_id,
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

// Instagram ID'sine göre konuşma bulur (Instagram için)
export const findConversationByContactInstagramId = async (userId: string, instagramId: string): Promise<Conversation | undefined> => {
    const db = getDB2();
    const query = `SELECT * FROM \`${CEBIMEDYA_DB}\`.conversations WHERE user_id = ? AND contact_instagram_id = ? AND platform = 'instagram'`;
    const [rows] = await db.execute<ConversationRow[]>(query, [userId, instagramId]);
    return rows[0] ? {
        id: rows[0].id,
        user_id: rows[0].user_id,
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