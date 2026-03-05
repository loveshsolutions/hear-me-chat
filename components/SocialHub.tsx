import React, { useState, useEffect } from 'react';
import { X, Users, Inbox, Clock, UserPlus, MessageCircle, MoreVertical, Trash2, Check, Shield } from 'lucide-react';
import { socialService } from '../services/socialService';
import { Friend, ChatSession, FriendRequest } from '../types';

interface SocialHubProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'INBOX' | 'FRIENDS' | 'HISTORY';
}

const SocialHub: React.FC<SocialHubProps> = ({ isOpen, onClose, initialTab = 'INBOX' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [history, setHistory] = useState<ChatSession[]>([]);
    // Force re-render
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setFriends(socialService.getFriends());
            setHistory(socialService.getHistory());
        }
    }, [isOpen, tick]);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    if (!isOpen) return null;

    const handleAddFriend = (sessionId: string) => {
        if (socialService.addFriendFromSession(sessionId)) {
            setTick(t => t + 1);
            alert("Friend added!");
        } else {
            alert("Already friends or request sent.");
        }
    };

    const handleBlock = (sessionId: string) => {
        if(confirm("Block this user? You won't see them again.")) {
            socialService.blockUser(sessionId);
            setTick(t => t + 1);
        }
    }

    const renderInbox = () => (
        <div className="space-y-2">
            {friends.filter(f => f.lastMessage).map(friend => (
                <button type="button" key={friend.userId} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors group text-left">
                    <div className="relative">
                        <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${friend.avatarSeed}`} 
                            className="w-12 h-12 rounded-full bg-black/50" 
                            alt={friend.name}
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111] ${friend.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-white text-sm truncate">{friend.name}</h4>
                            <span className="text-[10px] text-gray-500">
                                {friend.lastMessageTime ? new Date(friend.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                        </div>
                        <p className={`text-xs truncate ${friend.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {friend.lastMessage}
                        </p>
                    </div>
                    {friend.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {friend.unreadCount}
                        </div>
                    )}
                </button>
            ))}
            {friends.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">No active chats.</p>}
        </div>
    );

    const renderFriends = () => (
        <div className="space-y-2">
            <div className="flex gap-2 mb-4">
                <button type="button" className="flex-1 py-1.5 rounded-lg bg-violet-600 text-xs font-bold text-white">All Friends</button>
                <button type="button" className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400">Pending</button>
                <button type="button" className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400">Blocked</button>
            </div>
            {friends.map(friend => (
                 <div key={friend.userId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                     <div className="flex items-center gap-3">
                        <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${friend.avatarSeed}`} 
                            className="w-10 h-10 rounded-full bg-black/50" 
                            alt={friend.name}
                        />
                        <div>
                            <h4 className="font-bold text-white text-sm">{friend.name}</h4>
                            <span className={`text-[10px] font-bold ${friend.status === 'ONLINE' ? 'text-emerald-400' : 'text-gray-500'}`}>
                                {friend.status}
                            </span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                         <button type="button" className="p-2 rounded-lg bg-white/10 hover:bg-violet-600 hover:text-white transition-colors">
                             <MessageCircle size={16} />
                         </button>
                         <button type="button" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 transition-colors">
                             <MoreVertical size={16} />
                         </button>
                     </div>
                 </div>
            ))}
        </div>
    );

    const renderHistory = () => (
        <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                <p className="text-xs text-blue-200 flex gap-2">
                    <Shield size={14} className="shrink-0"/>
                    Recent strangers are stored locally. Add them as friends to keep chatting.
                </p>
            </div>
            {history.map(session => (
                <div key={session.sessionId} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 p-[1px]">
                                <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${session.partnerAvatar}`} className="w-full h-full rounded-full bg-black" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{session.partnerName}</h4>
                                <p className="text-[10px] text-gray-400">
                                    {Math.floor(session.durationSeconds / 60)}m {Math.floor(session.durationSeconds % 60)}s duration • {new Date(session.endedAt).toLocaleTimeString()}
                                </p>
                            </div>
                         </div>
                    </div>
                    {/* Snippet */}
                    <div className="bg-black/30 p-2 rounded-lg mb-3 text-xs text-gray-400 italic truncate">
                        "{session.messages[session.messages.length-1]?.text || 'No messages'}"
                    </div>
                    
                    <div className="flex gap-2">
                        {session.canAddFriend ? (
                            <button 
                                type="button"
                                onClick={() => handleAddFriend(session.sessionId)}
                                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2"
                            >
                                <UserPlus size={14}/> Add Friend
                            </button>
                        ) : (
                            <button type="button" disabled className="flex-1 py-2 bg-white/5 rounded-lg text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
                                <Check size={14}/> Added
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={() => handleBlock(session.sessionId)}
                            className="px-3 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 transition-colors"
                        >
                            <Trash2 size={14}/>
                        </button>
                    </div>
                </div>
            ))}
            {history.length === 0 && <p className="text-gray-500 text-center py-8 text-sm">No recent history.</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1200] pointer-events-none overflow-hidden">
            <div 
                className={`absolute top-0 right-0 h-full w-full max-w-sm bg-[#111] border-l border-white/10 shadow-2xl transform transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
                    <h2 className="text-lg font-bold font-quicksand text-white">Social Hub</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-1 border-b border-white/5">
                    <button 
                        type="button"
                        onClick={() => setActiveTab('INBOX')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'INBOX' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Inbox size={14} /> Inbox
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('FRIENDS')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'FRIENDS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Users size={14} /> Friends
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'HISTORY' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Clock size={14} /> History
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'INBOX' && renderInbox()}
                    {activeTab === 'FRIENDS' && renderFriends()}
                    {activeTab === 'HISTORY' && renderHistory()}
                </div>
            </div>
            
            {/* Overlay Backtrop */}
            {isOpen && (
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm -z-10 pointer-events-auto"
                    onClick={onClose}
                ></div>
            )}
        </div>
    );
};

export default SocialHub;