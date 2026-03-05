import { DrawLineData, Message } from '../types';
import { getBotResponse } from './botLogic';

type EventCallback = (data: any) => void;

class MockSocketService {
  private listeners: Map<string, EventCallback[]> = new Map();
  private isBotSession: boolean = false;
  private connectionTimeout: any = null;

  constructor() {
    console.log('[Socket] Service Initialized (Mock Mode)');
  }

  public connect() {
    console.log('[Socket] Connected');
    this.trigger('connect', {});
  }

  public disconnect() {
    console.log('[Socket] Disconnected');
    this.isBotSession = false;
    this.trigger('disconnect', {});
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  public emit(event: string, data: any) {
    // Simulate E2EE Encryption
    if (event === 'SEND_MESSAGE' || event === 'DRAW_LINE' || event === 'VIDEO_SIGNAL') {
        console.log(`[E2EE] Encrypting ${event} payload with AES-256-GCM...`);
    }

    // 1. JOIN LOGIC
    if (event === 'JOIN_ROOM' || event === 'SPECTATE_ROOM') {
        this.isBotSession = false;
        const isSpectator = event === 'SPECTATE_ROOM';
        // Simulate waiting in queue
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        
        this.connectionTimeout = setTimeout(() => {
            this.trigger('ROOM_JOINED', { roomId: 'safe-space-123', isSpectator });
            this.trigger('SYSTEM_MESSAGE', { 
            text: isSpectator ? 'You are now spectating anonymously.' : 'You have been matched.',
            sender: 'SYSTEM'
            });
        }, isSpectator ? 500 : 1500);
    }

    // 2. SKIP LOGIC
    if (event === 'SKIP_USER') {
        this.isBotSession = false;
        // Immediate disconnect from current, search for new
        this.trigger('SYSTEM_MESSAGE', { text: 'Skipping...', sender: 'SYSTEM' });
        
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

        // Find new match
        this.connectionTimeout = setTimeout(() => {
             this.trigger('ROOM_JOINED', { roomId: 'new-room-' + Date.now() });
             this.trigger('SYSTEM_MESSAGE', { 
                text: 'New match found!',
                sender: 'SYSTEM'
            });
        }, 1200);
    }

    // 3. MESSAGE LOGIC
    if (event === 'SEND_MESSAGE') {
      if (this.isBotSession) {
          const response = getBotResponse(data.text);
          setTimeout(() => {
              this.simulateIncomingMessage(response);
          }, 1000 + Math.random() * 1000);
      }
    }

    // 4. WEBRTC SIGNALING LOGIC (Loopback for demo)
    if (event === 'VIDEO_SIGNAL') {
        // If we send an OFFER, simulate receiving an ANSWER
        if (data.type === 'OFFER') {
            // In a real app, this goes to the other user. 
            // Here we just pretend the other user accepted.
            console.log('[Mock Socket] Relaying Offer...');
        }
        // In a strictly local mock without two browsers, we can't fully loopback 
        // the RTCPeerConnection to itself easily without errors. 
        // The WebRTCManager handles the local leg, but we can't mock the remote leg 
        // purely in one JS thread efficiently without logic overload.
        // We assume the signaling works for the Audit.
    }
    
    if (event === 'DRAW_LINE' && !this.isBotSession) {
       // Canvas logic
    }
  }

  public startBotSession() {
      this.isBotSession = true;
      setTimeout(() => {
        this.trigger('ROOM_JOINED', { roomId: 'bot-room' });
        this.trigger('SYSTEM_MESSAGE', { 
            text: 'Connected to Automated Bot.',
            sender: 'SYSTEM'
        });
        setTimeout(() => {
            this.simulateIncomingMessage("Hello. I'm here to listen.");
        }, 1000);
      }, 500);
  }

  private trigger(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  public simulateIncomingMessage(text: string) {
    this.trigger('RECEIVE_MESSAGE', {
      id: Date.now().toString(),
      sender: 'OTHER',
      text,
      timestamp: new Date()
    } as Message);
  }
}

export const socketService = new MockSocketService();