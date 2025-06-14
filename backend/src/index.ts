// src/index.ts
import express, { Request, Response } from 'express'; // NextFunction'ı ekledik
import cors from 'cors';
import { PORT } from './config';
import { connectDB }  from './database';

// Rotalar
import authRoutes from './routes/authRoutes';
import conversationRoutes from './routes/conservationRoutes';
import agentStatusRoutes from './routes/agentStatusRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl} (IP: ${req.ip})`);
    next();
});

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/agent-status', agentStatusRoutes);

// --- GLOBAL HATA YAKALAMA MIDDLEWARE'İ ---
// Hata yakalama middleware'ine `next: NextFunction` parametresini ekledik
app.use((err: Error, req: Request, res: Response) => {
    console.error(`[ERROR] Sunucu hatası: ${req.method} ${req.originalUrl} (IP: ${req.ip}), Hata:`, err);

    if (process.env.NODE_ENV === 'development') {
        res.status(500).json({
            message: err.message,
            stack: err.stack,
        });
    } else {
        res.status(500).json({ message: 'Bir sunucu hatası oluştu.' });
    }
});


app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
} ) ;