export type UserRole = 'VENTER' | 'LISTENER' | 'MODERATOR' | null;

export type DrawingTool = 'BRUSH' | 'ERASER';

export type Gender = 'MALE' | 'FEMALE' | 'BOTH';
export type ChatMode = 'TEXT' | 'VIDEO';
export type PrivacyLevel = 'EVERYONE' | 'FRIENDS' | 'NOBODY';
export type BannerStyle = 'SIMPLE_BLUE' | 'GRADIENT_SUNSET' | 'GRADIENT_COSMIC' | 'SIMPLE_DARK';

export interface Point {
  x: number;
  y: number;
}

export interface DrawLineData {
  prevPoint: Point | null;
  currentPoint: Point;
  color: string;
  width: number;
}

export interface Message {
  id: string;
  sender: 'ME' | 'OTHER' | 'SYSTEM';
  text: string;
  timestamp: Date;
  isHarmful?: boolean;
  isTranslated?: boolean;
  originalText?: string;
  type?: 'TEXT' | 'IMAGE' | 'VIDEO';
}

export interface Tag {
  id: string;
  label: string;
}

// --- PART 6: DATA MODEL IMPLEMENTATION ---

export interface User {
    id: string;
    anonymousName: string;
    avatarSeed: string;
    isPremium: boolean;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    lastSeen: string;
}

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar: string;
    toUserId: string;
    status: FriendRequestStatus;
    timestamp: number;
}

export interface Friend {
    userId: string;
    name: string;
    avatarSeed: string;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    createdAt: number;
    lastMessage?: string; // For Inbox preview
    lastMessageTime?: number;
    unreadCount: number;
}

export interface ChatSession {
    sessionId: string;
    partnerId: string; // Anonymous ID or User ID
    partnerName: string;
    partnerAvatar: string;
    isStrangerChat: boolean;
    startedAt: number;
    endedAt: number;
    durationSeconds: number;
    messages: Message[]; // For history playback
    canAddFriend: boolean; // False if blocked or expired
}

// Settings Model
export interface AppSettings {
  // A. Identity & Profile
  nickname: string;
  is18Plus: boolean;
  avatarSeed: string;
  avatarUrl?: string; // For custom uploads
  bannerStyle: BannerStyle;
  usernameChangesRemaining: number;
  interests: string[]; // Enabled interest IDs

  // B. Account Status
  isClaimed: boolean; // Anonymous vs Registered
  email?: string;
  isPremium: boolean;
  gender: Gender;

  // C. Privacy
  privacyBadges: PrivacyLevel; // Premium Only
  privacyInterests: PrivacyLevel;
  allowFriendRequests: boolean;
  allowCalls: boolean;

  // D. Preferences (UI & Behavior)
  autoEmoji: boolean;
  darkMode: boolean;
  pushNotifications: boolean;
  
  // Legacy/Chat Controls (Moved to Preferences in UI)
  autoSkip: boolean;
  autoNextSeconds: number;
  typingIndicator: boolean;
  readReceipts: boolean;
  messageSound: boolean;
  matchSound: boolean;
  vibration: boolean;
  
  // Matching (Moved to Preferences in UI)
  language: string;
  region: string;
  allowRandomFallback: boolean;
  priorityMatching: boolean;

  // Audio/Video (Moved to Preferences in UI)
  cameraEnabled: boolean;
  micEnabled: boolean;
  facingMode: 'user' | 'environment';
  videoQuality: 'low' | 'medium' | 'high';
  blurVideo: boolean;

  // Safety (Moved to Privacy/Safety in UI)
  filterAbusiveText: boolean;
  autoBlurUnsafe: boolean;
  hideActivity: boolean;
  disableScreenshots: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  // Identity
  nickname: 'Anonymous',
  is18Plus: false,
  avatarSeed: 'Felix',
  bannerStyle: 'GRADIENT_COSMIC',
  usernameChangesRemaining: 3,
  interests: [],

  // Account
  isClaimed: false,
  isPremium: false,
  gender: 'BOTH',

  // Privacy
  privacyBadges: 'EVERYONE',
  privacyInterests: 'EVERYONE',
  allowFriendRequests: true,
  allowCalls: true,

  // Preferences
  autoEmoji: true,
  darkMode: true,
  pushNotifications: false,

  // Legacy defaults
  autoSkip: false,
  autoNextSeconds: 0,
  typingIndicator: true,
  readReceipts: true,
  messageSound: true,
  language: 'English',
  region: 'Global',
  allowRandomFallback: true,
  priorityMatching: false,
  cameraEnabled: true,
  micEnabled: true,
  facingMode: 'user',
  videoQuality: 'medium',
  blurVideo: false,
  filterAbusiveText: true,
  autoBlurUnsafe: true,
  hideActivity: false,
  disableScreenshots: true,
  matchSound: true,
  vibration: true,
};

export const THEME = {
  slateBlue: '#6A5ACD',
  darkBg: '#111111',
  darkCard: '#1c1c1c',
  darkInput: '#2d2d2d',
  softCream: '#F5F5DC',
  mutedSage: '#8FBC8F',
  alertRed: '#E57373',
  textLight: '#E0E0E0',
  textDark: '#4A4A4A',
  white: '#FFFFFF',
};

export const BRUSH_COLORS = [
  '#6A5ACD', '#8FBC8F', '#E57373', '#64B5F6', '#FFD54F', '#4A4A4A'
];