import { Friend, FriendRequest, ChatSession, Message } from '../types';

// Mock Persistence Keys
const KEYS = {
    FRIENDS: 'hm_friends',
    REQUESTS: 'hm_requests',
    HISTORY: 'hm_chat_history',
};

class SocialService {
    private friends: Friend[] = [];
    private requests: FriendRequest[] = [];
    private history: ChatSession[] = [];

    constructor() {
        this.loadData();
    }

    private loadData() {
        try {
            this.friends = JSON.parse(localStorage.getItem(KEYS.FRIENDS) || '[]');
            this.requests = JSON.parse(localStorage.getItem(KEYS.REQUESTS) || '[]');
            this.history = JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
            
            // Seed mock data if empty (for demo)
            if (this.friends.length === 0) {
                this.friends = [
                    { userId: 'f1', name: 'Kind Panda', avatarSeed: 'Panda', status: 'ONLINE', createdAt: Date.now(), unreadCount: 2, lastMessage: 'Hey, are you there?', lastMessageTime: Date.now() - 3600000 },
                    { userId: 'f2', name: 'Calm River', avatarSeed: 'River', status: 'OFFLINE', createdAt: Date.now(), unreadCount: 0, lastMessage: 'Good night!', lastMessageTime: Date.now() - 86400000 },
                ];
                this.saveData();
            }
        } catch (e) {
            console.error('Failed to load social data', e);
        }
    }

    private saveData() {
        localStorage.setItem(KEYS.FRIENDS, JSON.stringify(this.friends));
        localStorage.setItem(KEYS.REQUESTS, JSON.stringify(this.requests));
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(this.history));
    }

    // --- ACCESSORS ---
    public getFriends() { return [...this.friends]; }
    public getRequests() { return [...this.requests]; }
    public getHistory() { return [...this.history]; }
    
    public getUnreadCount(): number {
        const msgCount = this.friends.reduce((acc, f) => acc + f.unreadCount, 0);
        const reqCount = this.requests.filter(r => r.status === 'PENDING').length;
        return msgCount + reqCount;
    }

    // --- ACTIONS ---

    // Called when a chat ends to save "Last Stranger"
    public saveSession(partnerName: string, partnerAvatar: string, messages: Message[]) {
        if (messages.length < 2) return; // Don't save empty chats

        const session: ChatSession = {
            sessionId: Date.now().toString(),
            partnerId: 'stranger-' + Math.random().toString(36).substr(2, 9),
            partnerName,
            partnerAvatar,
            isStrangerChat: true,
            startedAt: messages[0].timestamp.getTime(),
            endedAt: Date.now(),
            durationSeconds: (Date.now() - messages[0].timestamp.getTime()) / 1000,
            messages: messages.slice(-5), // Keep last 5 messages for context
            canAddFriend: true
        };

        this.history.unshift(session);
        // Limit history to 20
        if (this.history.length > 20) this.history.pop();
        this.saveData();
    }

    public sendFriendRequest(toUserId: string) {
        // Logic to send to server would go here
        console.log(`[Social] Sending request to ${toUserId}`);
    }

    public addFriendFromSession(sessionId: string) {
        const session = this.history.find(s => s.sessionId === sessionId);
        if (!session) return;

        // In a real app, this sends a request. 
        // For demo, we auto-add to "Pending" outgoing or simulated accepted
        const newFriend: Friend = {
            userId: session.partnerId,
            name: session.partnerName,
            avatarSeed: session.partnerAvatar,
            status: 'ONLINE',
            createdAt: Date.now(),
            unreadCount: 0
        };
        
        // Prevent dupes
        if (!this.friends.find(f => f.userId === newFriend.userId)) {
            this.friends.unshift(newFriend);
            session.canAddFriend = false; // Disable button
            this.saveData();
            return true;
        }
        return false;
    }

    public blockUser(sessionId: string) {
        this.history = this.history.filter(s => s.sessionId !== sessionId);
        this.saveData();
        // Add to blocklist logic...
    }
}

export const socialService = new SocialService();