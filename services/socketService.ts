import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import { getBotResponse } from './botLogic';

type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private isBotSession: boolean = false;
  private lastJoinData: any = null;

  constructor() {
    console.log('[Socket] Service Initialized');
  }

  public connect() {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin);

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.trigger('connect', {});
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.trigger('disconnect', {});
    });

    this.socket.on('ROOM_JOINED', (data) => this.trigger('ROOM_JOINED', data));
    this.socket.on('SYSTEM_MESSAGE', (data) => this.trigger('SYSTEM_MESSAGE', data));
    this.socket.on('RECEIVE_MESSAGE', (data) => this.trigger('RECEIVE_MESSAGE', data));
    this.socket.on('DRAW_LINE', (data) => this.trigger('DRAW_LINE', data));
    this.socket.on('VIDEO_SIGNAL', (data) => this.trigger('VIDEO_SIGNAL', data));
    this.socket.on('BANNED', (data) => this.trigger('BANNED', data));
    
    this.socket.on('REJOIN_QUEUE', () => {
        if (this.lastJoinData) {
            this.emit('JOIN_ROOM', this.lastJoinData);
        }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isBotSession = false;
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
    if (this.isBotSession) {
        if (event === 'SEND_MESSAGE') {
            const response = getBotResponse(data.text);
            setTimeout(() => {
                this.simulateIncomingMessage(response);
            }, 1000 + Math.random() * 1000);
        }
        return;
    }

    if (event === 'JOIN_ROOM') {
        this.lastJoinData = data;
    }

    if (this.socket) {
      this.socket.emit(event, data);
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

  private simulateIncomingMessage(text: string) {
    this.trigger('RECEIVE_MESSAGE', {
      id: Date.now().toString(),
      sender: 'OTHER',
      text,
      timestamp: new Date()
    } as Message);
  }
}

export const socketService = new SocketService();
