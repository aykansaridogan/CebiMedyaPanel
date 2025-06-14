// src/routes/conversationRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import {
    getConversationsByUserId,
    createMessage,
    updateConversationLastMessage,
    createConversation,
    getConversationCountsByUserId,
    findConversationByContactPhoneNumber,
    findConversationByContactInstagramId
} from '../models/Conservation';
import { Platform, MessageType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';


const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const userId = "1"; // <<< GEÇİCİ OLARAK MOCK BİR KULLANICI ID'Sİ

    if (!userId) {
        res.status(401).json({ message: 'Kullanıcı kimliği bulunamadı.' });
        return;
    }

    try {
        const conversations = await getConversationsByUserId(userId, req.query.platform as Platform | undefined);
        res.json(conversations);
    } catch (error) {
        console.error('Konuşmalar çekilirken hata:', error);
        next(error);
    }
});

router.get('/counts', async (req: Request, res: Response, next: NextFunction) => {
    const userId = "1"; // <<< GEÇİCİ OLARAK MOCK BİR KULLANICI ID'Sİ

    if (!userId) {
        res.status(401).json({ message: 'Kullanıcı kimliği bulunamadı.' });
        return;
    }

    try {
        const counts = await getConversationCountsByUserId(userId);
        res.json(counts);
    } catch (error) {
        console.error('Konuşma sayıları çekilirken hata:', error);
        next(error);
    }
});

router.post('/:conversationId?/messages', async (req: Request, res: Response, next: NextFunction) => {
    const userId = "1"; // <<< GEÇİCİ MOCK KULLANICI ID
    const userEmail = "test@example.com"; // <<< GEÇİCİ MOCK KULLANICI E-POSTASI

    let { conversationId } = req.params;
    const { content, platform, contactName, contactPhoneNumber, contactInstagramId, type, imageUrl, audioUrl } = req.body;

    if (!userId || !content || !platform) {
        res.status(400).json({ message: 'Kullanıcı, içerik ve platform gerekli.' });
        return;
    }

    try {
        if (!conversationId) {
            if (!contactName) {
                res.status(400).json({ message: 'Yeni konuşma başlatmak için contactName gerekli.' });
                return;
            }

            if (platform === 'whatsapp' && !contactPhoneNumber) {
                res.status(400).json({ message: 'WhatsApp için contactPhoneNumber gerekli.' });
                return;
            }
            if (platform === 'instagram' && !contactInstagramId) {
                res.status(400).json({ message: 'Instagram için contactInstagramId gerekli.' });
                return;
            }

            const existingConversation =
                platform === 'whatsapp' && contactPhoneNumber
                    ? await findConversationByContactPhoneNumber(userId, contactPhoneNumber)
                    : platform === 'instagram' && contactInstagramId
                        ? await findConversationByContactInstagramId(userId, contactInstagramId)
                        : null;

            if (existingConversation) {
                conversationId = existingConversation.id;
            } else {
                conversationId = uuidv4();
                await createConversation(
                    userId,
                    conversationId,
                    platform,
                    contactName,
                    content,
                    new Date(),
                    contactPhoneNumber,
                    contactInstagramId
                );
            }
        }

        // createMessage fonksiyonunu, type, imageUrl ve audioUrl parametreleriyle çağır
        // Artık createMessage içinde veritabanı adı belirtilmiyor
        const messageId = await createMessage(
            conversationId,
            userEmail,
            content,
            true, // isOutbound: true (giden mesaj)
            platform,
            type || 'text', // type belirtilmemişse varsayılan 'text'
            imageUrl,       // imageUrl
            audioUrl        // audioUrl
        );

        // updateConversationLastMessage içinde de veritabanı adı belirtilmiyor
        await updateConversationLastMessage(conversationId, content, new Date(), true); // Unread count'ı artır

        res.status(201).json({
            id: messageId,
            conversation_id: conversationId,
            sender_name: userEmail,
            content,
            is_outbound: true,
            timestamp: new Date().toISOString(),
            platform,
            type: type || 'text',
            image_url: imageUrl || undefined,
            audio_url: audioUrl || undefined,
        });

    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        next(error);
    }
});

router.post('/instagram-incoming', async (req: Request, res: Response, next: NextFunction) => {
    const incomingData = req.body;

    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'YOUR_INSTAGRAM_VERIFY_TOKEN') {
        res.status(200).send(req.query['hub.challenge']);
        return;
    }

    try {
        const userId = '1'; // Mock user ID

        const entry = incomingData.entry?.[0];
        const messaging = entry?.messaging?.[0];
        const message = messaging?.message;
        const sender = messaging?.sender;

        if (!message || !sender || !message.text) {
            res.status(400).send('Geçersiz format');
            return;
        }

        const senderInstagramId = sender.id;
        const messageContent = message.text;
        const senderName = 'Instagram User ' + senderInstagramId;

        const existingConversation = await findConversationByContactInstagramId(userId, senderInstagramId);
        const conversationId = existingConversation?.id || uuidv4();

        if (!existingConversation) {
            await createConversation(
                userId,
                conversationId,
                'instagram',
                senderName,
                messageContent,
                new Date(),
                undefined,
                senderInstagramId
            );
        }

        // createMessage içinde veritabanı adı belirtilmiyor
        await createMessage(conversationId, senderName, messageContent, false, 'instagram', 'text', undefined, undefined);
        // updateConversationLastMessage içinde de veritabanı adı belirtilmiyor
        await updateConversationLastMessage(conversationId, messageContent, new Date(), true);

        res.status(200).send('OK');
    } catch (error) {
        console.error('Instagram mesaj işleme hatası:', error);
        next(error);
    }
});

router.post('/whatsapp-incoming', async (req: Request, res: Response, next: NextFunction) => {
    const incomingData = req.body;

    // !!! DİKKAT: WhatsApp webhook doğrulaması olmadan webhook'unuz çalışmayabilir.
    // Eğer bu satırları sildiyseniz veya silerseniz, Meta webhook'unuzu doğrulayamaz
    // ve size mesaj göndermez.
    // Webhook doğrulamayı atlamak Meta'nın beklediği bir davranış değildir.
    /*
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'YOUR_WHATSAPP_VERIFY_TOKEN') {
        res.status(200).send(req.query['hub.challenge']);
        return;
    }
    */

    // Gelen veriyi terminale yazdır
    console.log('--- WhatsApp Gelen Veri Başlangıcı ---');
    console.log(JSON.stringify(incomingData, null, 2)); // JSON formatında okunur şekilde yazdır
    console.log('--- WhatsApp Gelen Veri Sonu ---');

    try {
        const entry = incomingData.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages?.[0]; // WhatsApp mesaj objesi
        const contacts = value?.contacts?.[0];

        if (!messages || !contacts) {
            if (value?.statuses && value.statuses.length > 0) {
                console.log('WhatsApp status update received, ignoring:', JSON.stringify(value.statuses));
                res.status(200).send('OK (Status Update)');
                return;
            }
            console.warn('WhatsApp gelen veri formatı geçersiz veya beklenen mesaj/kişi bilgisi eksik:', JSON.stringify(incomingData));
            res.status(400).send('Geçersiz format veya eksik veri');
            return;
        }

        const senderPhoneNumber = messages.from;
        const senderName = contacts.profile.name || senderPhoneNumber;

        const userId = '1'; // Mock user ID

        const existingConversation = await findConversationByContactPhoneNumber(userId, senderPhoneNumber);
        const conversationId = existingConversation?.id || uuidv4();

        let messageContent: string = '';
        let messageType: MessageType = 'unknown';
        let imageUrl: string | undefined = undefined;
        let audioUrl: string | undefined = undefined;

        switch (messages.type) {
            case 'text':
                messageContent = messages.text.body;
                messageType = 'text';
                break;
            case 'image':
                messageContent = messages.image.caption || 'Resim';
                messageType = 'image';
                // Buradaki URL'lerin Meta API'den alınması gerekecektir.
                imageUrl = `https://your-media-server.com/whatsapp_images/${messages.image.id}.jpg`;
                break;
            case 'audio':
                messageContent = 'Ses Kaydı';
                messageType = 'audio';
                // Buradaki URL'lerin Meta API'den alınması gerekecektir.
                audioUrl = `https://your-media-server.com/whatsapp_audio/${messages.audio.id}.mp3`;
                break;
            default:
                messageContent = `Desteklenmeyen mesaj tipi: ${messages.type}`;
                messageType = messages.type as MessageType;
                break;
        }

        if (!existingConversation) {
            await createConversation(
                userId,
                conversationId,
                'whatsapp',
                senderName,
                messageContent,
                new Date(),
                senderPhoneNumber,
                undefined
            );
        }

        // createMessage içinde veritabanı adı belirtilmiyor
        await createMessage(
            conversationId,
            senderName,
            messageContent,
            false, // isOutbound: false (gelen mesaj)
            'whatsapp',
            messageType,
            imageUrl,
            audioUrl
        );

        // updateConversationLastMessage içinde de veritabanı adı belirtilmiyor
        await updateConversationLastMessage(conversationId, messageContent, new Date(), true); // Unread count'ı artır

        res.status(200).send('OK');
    } catch (error) {
        console.error('WhatsApp mesaj işleme hatası:', error);
        next(error);
    }
});

export default router;