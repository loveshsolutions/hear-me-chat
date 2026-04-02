import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Vite needs inline scripts for HMR etc. in dev
    crossOriginEmbedderPolicy: false,
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);

  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Hear Me Chat Premium',
                description: 'Unlock unlimited video chat, filters, and more.',
              },
              unit_amount: 499, // $4.99
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Socket.io Logic ---
  
  interface User {
    id: string;
    socketId: string;
    role: 'VENTER' | 'LISTENER' | 'MODERATOR' | null;
    mode: 'TEXT' | 'VIDEO';
    tags: string[];
    gender: string;
    isPremium: boolean;
    roomId?: string;
    violationCount: number;
    lastMessageTime: number;
  }

  const users = new Map<string, User>();
  const queue: User[] = [];
  const rooms = new Map<string, { users: string[], messages: any[] }>();

  const detectHarmfulContent = (text: string): boolean => {
    const harmfulPatterns = [
        /faggot/i, /nigger/i, /retard/i, /kys/i, /kill yourself/i, 
        /hope you die/i, /die in a hole/i,
        /\bhate\b/i, /\bhurt\b/i, /\btrash\b/i, /\bkill\b/i, /\bdie\b/i
    ];
    return harmfulPatterns.some(pattern => pattern.test(text));
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('JOIN_ROOM', (data) => {
      // Prevent duplicate joins
      if (users.has(socket.id)) {
          socket.emit('SYSTEM_MESSAGE', { text: 'Already in queue or room.', sender: 'SYSTEM' });
          return;
      }

      const user: User = {
        id: uuidv4(),
        socketId: socket.id,
        role: data.role,
        mode: data.mode,
        tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [], // Limit tags
        gender: data.gender || 'BOTH',
        isPremium: !!data.isPremium,
        violationCount: 0,
        lastMessageTime: 0
      };
      users.set(socket.id, user);

      // Enhanced matching logic with tags
      const matchIndex = queue.findIndex(qUser => {
        // 1. Role matching (Venter vs Listener)
        // If one is VENTER and other is LISTENER, it's a match.
        // If both are null (Just Chatting), it's a match.
        if (user.role && qUser.role && user.role === qUser.role) return false;
        
        // 2. Mode matching (Text vs Video)
        if (user.mode !== qUser.mode) return false;
        
        // 3. Tag matching (at least one common tag if tags are provided)
        if (user.tags.length > 0 && qUser.tags.length > 0) {
            const hasCommonTag = user.tags.some(tag => qUser.tags.includes(tag));
            if (!hasCommonTag) return false;
        }

        return true;
      });

      if (matchIndex !== -1) {
        const partner = queue.splice(matchIndex, 1)[0];
        const roomId = uuidv4();
        
        user.roomId = roomId;
        partner.roomId = roomId;
        
        rooms.set(roomId, { users: [user.socketId, partner.socketId], messages: [] });
        
        socket.join(roomId);
        io.to(partner.socketId).socketsJoin(roomId);
        
        io.to(roomId).emit('ROOM_JOINED', { roomId });
        io.to(roomId).emit('SYSTEM_MESSAGE', { text: 'You have been matched.', sender: 'SYSTEM' });
      } else {
        queue.push(user);
        socket.emit('SYSTEM_MESSAGE', { text: 'Waiting for a match...', sender: 'SYSTEM' });
      }
    });

    socket.on('SEND_MESSAGE', (data) => {
      const user = users.get(socket.id);
      if (!user || !user.roomId) return;

      // 1. Rate Limiting (1 message per 500ms)
      const now = Date.now();
      if (now - user.lastMessageTime < 500) {
          socket.emit('SYSTEM_MESSAGE', { text: 'You are sending messages too fast.', sender: 'SYSTEM' });
          return;
      }
      user.lastMessageTime = now;

      // 2. Length Validation
      if (!data.text || data.text.length > 1000) {
          socket.emit('SYSTEM_MESSAGE', { text: 'Message too long or empty.', sender: 'SYSTEM' });
          return;
      }

      // 3. Server-side Banned Words Check
      if (detectHarmfulContent(data.text)) {
          user.violationCount++;
          if (user.violationCount >= 3) {
              socket.emit('BANNED', { reason: 'Repeated harmful content detected.' });
              socket.disconnect();
              return;
          }
          socket.emit('SYSTEM_MESSAGE', { text: `Warning (${user.violationCount}/3): Harmful content detected.`, sender: 'SYSTEM' });
          return;
      }

      socket.to(user.roomId).emit('RECEIVE_MESSAGE', {
        id: uuidv4(),
        sender: 'OTHER',
        text: data.text,
        timestamp: new Date()
      });
    });

    socket.on('SKIP_USER', () => {
      const user = users.get(socket.id);
      if (user?.roomId) {
        const roomId = user.roomId;
        socket.to(roomId).emit('SYSTEM_MESSAGE', { text: 'The other user has left.', sender: 'SYSTEM' });
        socket.leave(roomId);
        
        const room = rooms.get(roomId);
        if (room) {
          room.users = room.users.filter(id => id !== socket.id);
          if (room.users.length === 0) rooms.delete(roomId);
        }
        
        user.roomId = undefined;
        socket.emit('SYSTEM_MESSAGE', { text: 'Finding new match...', sender: 'SYSTEM' });
        socket.emit('REJOIN_QUEUE');
      }
    });

    socket.on('DRAW_LINE', (data) => {
        const user = users.get(socket.id);
        if (user?.roomId) {
            socket.to(user.roomId).emit('DRAW_LINE', data);
        }
    });

    socket.on('VIDEO_SIGNAL', (data) => {
        const user = users.get(socket.id);
        if (user?.roomId) {
            socket.to(user.roomId).emit('VIDEO_SIGNAL', data);
        }
    });

    socket.on('SPECTATE_ROOM', (data) => {
        // Server-side Secret Key Check
        if (data.secret !== 'kempalti2026') {
            socket.emit('SYSTEM_MESSAGE', { text: 'Unauthorized access.', sender: 'SYSTEM' });
            return;
        }

        // Join the first active room with at least 2 people
        const activeRoomId = Array.from(rooms.keys()).find(id => rooms.get(id)?.users.length === 2);
        if (activeRoomId) {
            socket.join(activeRoomId);
            socket.emit('ROOM_JOINED', { roomId: activeRoomId, isSpectator: true });
            socket.emit('SYSTEM_MESSAGE', { text: 'You are now spectating anonymously.', sender: 'SYSTEM' });
        } else {
            socket.emit('SYSTEM_MESSAGE', { text: 'No active rooms to spectate.', sender: 'SYSTEM' });
        }
    });

    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        if (user.roomId) {
          socket.to(user.roomId).emit('SYSTEM_MESSAGE', { text: 'The other user has disconnected.', sender: 'SYSTEM' });
          rooms.delete(user.roomId);
        }
        const qIndex = queue.findIndex(u => u.socketId === socket.id);
        if (qIndex !== -1) queue.splice(qIndex, 1);
        users.delete(socket.id);
      }
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
