// src/routes/conversationRoutes.ts - KESİN VE DOĞRU HALE GETİRİLDİ
import { Router, Request, Response, NextFunction } from 'express';
import {
    getConversationsByUserId,
    createMessage,
    updateConversationLastMessage,
    createConversation,
    getConversationCountsByUserId,
    findConversationByContactPhoneNumber,
    findConversationByContactInstagramId,
    getLastMessageContentByConversationId,
    getMessagesByConversationId // <-- BURAYA EKLENDİ!
} from '../models/Conservation'; // models/Conservation.ts dosyasının yolunu kontrol et
import { Platform, MessageType } from '../types/types'; // types/types.ts dosyasının yolunu kontrol et
import { v4 as uuidv4 } from 'uuid';


const router = Router();

// GET /api/conversations
// Kullanıcının tüm konuşmalarını platforma göre veya hepsi birden çeker.
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

// GET /api/conversations/:platform/:conversationId/messages
// Belirli bir konuşmaya ait mesajları platforma göre çeker.
router.get('/:platform/:conversationId/messages', async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId, platform } = req.params;
    
    console.log(`[Backend] Mesajlar çekiliyor. Platform: ${platform}, Conversation ID: ${conversationId}`);

    if (!conversationId || !platform) {
        return res.status(400).json({ message: 'Konuşma ID ve Platform gerekli.' });
    }

    try {
        // ! ÖNEMLİ DÜZELTME: getMessagesByConversationId fonksiyonuna hem conversationId hem de platform parametreleri geçirildi.
        const messages = await getMessagesByConversationId(conversationId, platform as Platform); 
        res.json(messages);
    } catch (error) {
        console.error(`[Backend] Mesajları çekerken hata (${platform} - ${conversationId}):`, error);
        next(error);
    }
});

// GET /api/conversations/:id/last_message_content
// Belirli bir konuşmanın son mesaj içeriğini çeker.
router.get('/:id/last_message_content', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        const lastMessage = await getLastMessageContentByConversationId(id);

        if (!lastMessage) {
            return res.status(404).json({ message: 'Mesaj bulunamadı' });
        }

        res.json({ content: lastMessage.content });
    } catch (error) {
        console.error('Son mesaj getirme hatası:', error);
        next(error);
    }
});

// GET /api/conversations/counts
// Kullanıcının platform bazında konuşma sayılarını çeker.
router.get('/counts', async (req: Request, res: Response, next: NextFunction) => {
    // ! DİKKAT: userId production ortamında kimlik doğrulama mekanizmasından (örn. JWT token) gelmelidir.
    // ! Şu an geçici olarak mock bir kullanıcı ID'si ("1") kullanılıyor.
    const userId = "1"; 

    if (!userId) {
        return res.status(401).json({ message: 'Kullanıcı kimliği bulunamadı.' });
    }

    try {
        const counts = await getConversationCountsByUserId(userId);
        res.json(counts);
    } catch (error) {
        console.error('Konuşma sayıları çekilirken hata:', error);
        next(error);
    }
});

// POST /api/conversations/:conversationId?/messages
// Yeni bir mesaj gönderir veya mevcut olmayan bir konuşma için yeni bir konuşma başlatır.
router.post('/:conversationId?/messages', async (req: Request, res: Response, next: NextFunction) => {
    // ! DİKKAT: userId ve userEmail production ortamında kimlik doğrulama mekanizmasından gelmelidir.
    const userId = "1"; 
    const userEmail = "test@example.com"; 

    let { conversationId } = req.params;
    const { content, platform, contactName, contactPhoneNumber, contactInstagramId, type, imageUrl, audioUrl } = req.body;

    if (!userId || !content || !platform) {
        return res.status(400).json({ message: 'Kullanıcı kimliği, içerik ve platform gerekli.' });
    }

    try {
        if (!conversationId) {
            // Yeni bir konuşma başlatılıyor
            if (!contactName) {
                return res.status(400).json({ message: 'Yeni konuşma başlatmak için contactName gerekli.' });
            }

            if (platform === 'whatsapp' && !contactPhoneNumber) {
                return res.status(400).json({ message: 'WhatsApp için contactPhoneNumber gerekli.' });
            }
            if (platform === 'instagram' && !contactInstagramId) {
                return res.status(400).json({ message: 'Instagram için contactInstagramId gerekli.' });
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
                conversationId = uuidv4(); // Yeni konuşma ID'si oluştur
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

        // Mesajı oluştur ve kaydet
        const messageId = await createMessage(
            conversationId,
            userEmail, // Giden mesajlarda gönderen genellikle uygulamanın kullanıcısıdır
            content,
            true, // isOutbound: true (bu bir giden mesajdır)
            platform,
            type || 'text', // type belirtilmemişse varsayılan 'text'
            imageUrl, 
            audioUrl 
        );

        // Konuşmanın son mesajını güncelle (unread_count artır)
        await updateConversationLastMessage(conversationId, content, new Date(), true); 

        // Başarılı yanıt
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

// POST /api/conversations/instagram-incoming
// Instagram'dan gelen webhook mesajlarını işler.
router.post('/instagram-incoming', async (req: Request, res: Response, next: NextFunction) => {
    const incomingData = req.body;

    // Instagram webhook doğrulaması
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'YOUR_INSTAGRAM_VERIFY_TOKEN') {
        res.status(200).send(req.query['hub.challenge']);
        return;
    }

    try {
        const userId = '1'; // Mock user ID (Gerçekte authentication'dan gelmeli)

        const entry = incomingData.entry?.[0];
        const messaging = entry?.messaging?.[0];
        const message = messaging?.message;
        const sender = messaging?.sender;

        if (!message || !sender || !message.text) {
            return res.status(400).send('Geçersiz format veya eksik mesaj/gönderen bilgisi.');
        }

        const senderInstagramId = sender.id;
        const messageContent = message.text;
        const senderName = 'Instagram User ' + senderInstagramId; // Gelen mesajlarda gönderen adı

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
                undefined, // phone number yok
                senderInstagramId
            );
        }

        // Gelen mesajı kaydet (isOutbound: false)
        await createMessage(conversationId, senderName, messageContent, false, 'instagram', 'text', undefined, undefined);
        // Konuşmanın son mesajını güncelle ve okunmamış sayısını artır
        await updateConversationLastMessage(conversationId, messageContent, new Date(), true);

        res.status(200).send('OK');
    } catch (error) {
        console.error('Instagram gelen mesaj işleme hatası:', error);
        next(error);
    }
});

// POST /api/conversations/whatsapp-incoming
// WhatsApp'tan gelen webhook mesajlarını işler.
router.post('/whatsapp-incoming', async (req: Request, res: Response, next: NextFunction) => {
    const incomingData = req.body;

    // ! DİKKAT: WhatsApp webhook doğrulaması olmadan webhook'unuz çalışmayabilir.
    // ! Bu satırları sildiyseniz veya silerseniz, Meta webhook'unuzu doğrulayamaz
    // ! ve size mesaj göndermez. Webhook doğrulamayı atlamak Meta'nın beklediği bir davranış değildir.
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'YOUR_WHATSAPP_VERIFY_TOKEN') {
        res.status(200).send(req.query['hub.challenge']);
        return;
    }
    
    console.log('--- WhatsApp Gelen Veri Başlangıcı ---');
    console.log(JSON.stringify(incomingData, null, 2)); 
    console.log('--- WhatsApp Gelen Veri Sonu ---');

    try {
        const entry = incomingData.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages?.[0]; // WhatsApp mesaj objesi
        const contacts = value?.contacts?.[0];

        // Durum güncellemelerini veya geçersiz formatı işle
        if (!messages || !contacts) {
            if (value?.statuses && value.statuses.length > 0) {
                console.log('WhatsApp durum güncellemesi alındı, yoksayılıyor:', JSON.stringify(value.statuses));
                return res.status(200).send('OK (Status Update)');
            }
            console.warn('WhatsApp gelen veri formatı geçersiz veya beklenen mesaj/kişi bilgisi eksik:', JSON.stringify(incomingData));
            return res.status(400).send('Geçersiz format veya eksik veri');
        }

        const senderPhoneNumber = messages.from;
        const senderName = contacts.profile.name || senderPhoneNumber; // Gelen mesajlarda gönderen adı
        const userId = '1'; // Mock user ID (Gerçekte authentication'dan gelmeli)

        const existingConversation = await findConversationByContactPhoneNumber(userId, senderPhoneNumber);
        const conversationId = existingConversation?.id || uuidv4();

        let messageContent: string = '';
        let messageType: MessageType = 'unknown';
        let imageUrl: string | undefined = undefined;
        let audioUrl: string | undefined = undefined;

        // Mesaj tipine göre içerik ve medya URL'lerini ayır
        switch (messages.type) {
            case 'text':
                messageContent = messages.text.body;
                messageType = 'text';
                break;
            case 'image':
                messageContent = messages.image.caption || 'Resim';
                messageType = 'image';
                // ! DİKKAT: Meta API'den medya URL'lerini çekmek için ek mantık gerekir. Bu sadece bir placeholder.
                imageUrl = `https://your-media-server.com/whatsapp_images/${messages.image.id}.jpg`; 
                break;
            case 'audio':
                messageContent = 'Ses Kaydı';
                messageType = 'audio';
                // ! DİKKAT: Meta API'den medya URL'lerini çekmek için ek mantık gerekir. Bu sadece bir placeholder.
                audioUrl = `https://your-media-server.com/whatsapp_audio/${messages.audio.id}.mp3`; 
                break;
            // Diğer mesaj tipleri için (video, document vb.) buraya case'ler eklenebilir
            default:
                messageContent = `Desteklenmeyen mesaj tipi: ${messages.type}`;
                messageType = messages.type as MessageType;
                break;
        }

        // Eğer konuşma yoksa yeni bir konuşma oluştur
        if (!existingConversation) {
            await createConversation(
                userId,
                conversationId,
                'whatsapp',
                senderName,
                messageContent,
                new Date(),
                senderPhoneNumber,
                undefined // instagram ID yok
            );
        }

        // Gelen mesajı kaydet (isOutbound: false)
        await createMessage(
            conversationId,
            senderName,
            messageContent,
            false, 
            'whatsapp',
            messageType,
            imageUrl,
            audioUrl
        );

        // Konuşmanın son mesajını güncelle ve okunmamış sayısını artır
        await updateConversationLastMessage(conversationId, messageContent, new Date(), true); 

        res.status(200).send('OK');
    } catch (error) {
        console.error('WhatsApp gelen mesaj işleme hatası:', error);
        next(error);
    }
});

export default router;