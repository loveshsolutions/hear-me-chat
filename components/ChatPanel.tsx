import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/mockSocket';
import { webrtcManager } from '../services/webrtcManager';
import { socialService } from '../services/socialService';
import { Message, ChatMode } from '../types';
import { Send, AlertTriangle, PenTool, Heart, Video, VideoOff, Languages, UserPlus, PhoneOff, ShieldAlert, SkipForward, Image as ImageIcon, Film, Lock } from 'lucide-react';

interface ChatPanelProps {
  isActive: boolean;
  mode: ChatMode;
  role: string | null;
  isPremium: boolean;
  onToggleCanvas?: () => void;
  isCanvasOpen?: boolean;
  onSkip?: () => void;
  onShowPremium: () => void;
  onBan?: (reason: string) => void;
  isSpectator?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isActive, mode, role, isPremium, onToggleCanvas, isCanvasOpen, onSkip, onShowPremium, onBan, isSpectator }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // New Features State
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isTranslationOn, setIsTranslationOn] = useState(false);
  const [friendAdded, setFriendAdded] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  
  // Track partner info for history
  const [partnerSeed, setPartnerSeed] = useState('stranger');
  const [partnerName, setPartnerName] = useState('Stranger');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isVideoActive]);

  // Auto-Start Video if in Video Mode
  useEffect(() => {
    if (isActive && mode === 'VIDEO') {
        startVideoSession();
    }
    // Randomize avatar on connection
    if (isActive) {
        setPartnerSeed(Math.random().toString(36).substring(7));
        setPartnerName('Anonymous ' + Math.floor(Math.random() * 1000));
        setFriendAdded(false);
    }
  }, [isActive, mode]);

  // Cleanup on unmount or skip
  useEffect(() => {
    return () => {
        if (!isActive) {
            webrtcManager.close();
            setIsVideoActive(false);
        }
    };
  }, [isActive]);

  // Socket listeners
  useEffect(() => {
    const handleReceive = (msg: Message) => {
      if (isTranslationOn && msg.sender === 'OTHER') {
        msg.originalText = msg.text;
        msg.text = `[Translated] ${msg.text}`; 
        msg.isTranslated = true;
      }
      setMessages((prev) => [...prev, msg]);
    };

    const handleSystem = (data: {text: string, sender: string}) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'SYSTEM',
            text: data.text,
            timestamp: new Date()
        }]);
    }
    
    // WebRTC Signal Handling
    const handleVideoSignal = async (data: any) => {
        await webrtcManager.handleSignal(data);
    }

    socketService.on('RECEIVE_MESSAGE', handleReceive);
    socketService.on('SYSTEM_MESSAGE', handleSystem);
    socketService.on('VIDEO_SIGNAL', handleVideoSignal);
    socketService.on('BANNED', (data: { reason: string }) => {
        onBan?.(data.reason);
    });

    return () => {
      socketService.off('RECEIVE_MESSAGE', handleReceive);
      socketService.off('SYSTEM_MESSAGE', handleSystem);
      socketService.off('VIDEO_SIGNAL', handleVideoSignal);
      socketService.off('BANNED', () => {});
    };
  }, [isTranslationOn]);

  // Setup Remote Stream Listener
  useEffect(() => {
    webrtcManager.onRemoteStream = (stream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
    };
  }, []);

  // Simulated AI Video Moderation
  useEffect(() => {
    let interval: any;
    if (isVideoActive) {
      interval = setInterval(() => {
        // In this mock, we simulate a very small chance of a false positive or detection
        // To demonstrate the feature, we'll trigger it if the user types a specific "trigger" word too
        // but for "auto" we use a random chance.
        if (Math.random() < 0.005) { // 0.5% chance every 10s for demo
          onBan?.("NSFW content detected in video stream by AI Moderation.");
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isVideoActive, onBan]);

  const startVideoSession = async () => {
      try {
          const stream = await webrtcManager.startLocalStream();
          setIsVideoActive(true);
          
          // Render local
          if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
          }

          // Initiate Call
          await webrtcManager.createOffer();
      } catch (err) {
          console.error("Video start failed", err);
          alert("Could not start video. Check permissions.");
      }
  };

  const toggleVideo = () => {
      if (isVideoActive) {
          webrtcManager.close();
          setIsVideoActive(false);
      } else {
          startVideoSession();
      }
  };

  const handleNext = () => {
      // SAVE HISTORY TO SOCIAL SERVICE
      if (messages.length > 0) {
        socialService.saveSession(partnerName, partnerSeed, messages);
      }

      webrtcManager.close();
      setIsVideoActive(false);
      setMessages([]);
      if (onSkip) onSkip();
  };

  const handleAddFriend = () => {
      setFriendAdded(true);
      socketService.emit('SYSTEM_MESSAGE', { text: 'You sent a friend request.' });
      // In real app, this sends API request
  };

  const detectHarmfulContent = (text: string): boolean => {
    const harmfulPatterns = [
        /faggot/i, /nigger/i, /retard/i, /kys/i, /kill yourself/i, 
        /hope you die/i, /die in a hole/i,
        /\bhate\b/i, /\bhurt\b/i, /\btrash\b/i, /\bkill\b/i, /\bdie\b/i
    ];
    return harmfulPatterns.some(pattern => pattern.test(text));
  };

  const sanitizeInput = (text: string): string => {
    // Basic sanitization: remove HTML tags and trim
    return text.replace(/<[^>]*>?/gm, '').trim();
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const sanitized = sanitizeInput(inputText);
    if (!sanitized) return;

    if (detectHarmfulContent(sanitized)) {
       const newCount = violationCount + 1;
       setViolationCount(newCount);
       
       if (newCount >= 3) {
         onBan?.("Repeated bullying and harassment in chat after multiple warnings.");
         return;
       }

       alert(`AI Moderation Warning (${newCount}/3): Please keep the conversation supportive. Bullying and harassment are strictly prohibited and will result in a permanent ban.`);
       return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'ME',
      text: sanitized,
      timestamp: new Date(),
    };

    if (isSpectator) {
        alert("You are in Spectator Mode. You cannot send messages.");
        setInputText('');
        return;
    }

    setMessages((prev) => [...prev, newMessage]);
    socketService.emit('SEND_MESSAGE', newMessage);
    
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl relative overflow-hidden">
      
      {/* Header */}
      <div className="h-16 md:h-20 px-4 md:px-6 bg-white/5 border-b border-white/5 flex justify-between items-center backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {isActive ? (
                         <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${partnerSeed}`} alt="Stranger" />
                    ) : (
                         <span className="text-lg">🦄</span>
                    )}
                </div>
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-yellow-500'}`}></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-lg font-quicksand leading-none truncate max-w-[100px] md:max-w-none flex items-center gap-2">
                {isActive ? partnerName : 'Waiting...'}
                {isSpectator && <span className="px-2 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-[8px] font-bold uppercase tracking-widest">Spectator</span>}
            </h3>
            <span className="text-[9px] md:text-xs text-white/40 font-mono flex items-center gap-1 mt-1">
                {isActive ? <ShieldAlert size={10} className="text-emerald-400 shrink-0"/> : null} 
                <span className="truncate">{isActive ? 'Encrypted P2P' : 'Looking for match...'}</span>
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1 md:gap-2">
            <button 
                onClick={onToggleCanvas}
                className={`w-9 h-9 md:w-auto md:h-10 md:px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold border ${
                    isCanvasOpen 
                    ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Shared Canvas"
            >
                <PenTool size={16} />
                <span className="hidden md:inline">Canvas</span>
            </button>

            {isActive && (
                <>
                <button 
                    onClick={() => setIsTranslationOn(!isTranslationOn)}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all border ${
                        isTranslationOn
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                    title="Translate Chat"
                >
                    <Languages size={18} />
                </button>

                <button 
                    onClick={handleAddFriend}
                    disabled={friendAdded}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all border ${
                        friendAdded
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                    }`}
                    title="Add Friend"
                >
                    {friendAdded ? <Heart size={18} fill="currentColor" /> : <UserPlus size={18} />}
                </button>
                
                {mode === 'TEXT' && (
                     <button 
                        onClick={isPremium ? toggleVideo : onShowPremium}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
                        title={isPremium ? "Start Video" : "Video Locked (Premium)"}
                    >
                        {isPremium ? <Video size={18} /> : <Lock size={14} className="text-yellow-500"/>}
                    </button>
                )}
                </>
            )}
            
            {/* NEXT BUTTON */}
            <button 
                onClick={handleNext}
                className="ml-2 h-10 px-6 bg-white text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:bg-gray-200 transition-all flex items-center gap-2 active:scale-95"
            >
                Next <SkipForward size={18} fill="currentColor" />
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
          
        {/* Video Area (Always visible if Video Mode is Active) */}
        {isVideoActive && (
            <div className={`shrink-0 bg-black border-b border-white/10 relative transition-all duration-300 ${mode === 'VIDEO' ? 'h-1/2' : 'h-1/3 min-h-[200px]'}`}>
                 {/* Remote Video */}
                 <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-contain bg-zinc-900"
                 />
                 
                 {!remoteVideoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-zinc-500 text-sm animate-pulse">Connecting to peer...</p>
                    </div>
                 )}

                 {/* Local Self View */}
                 <div className="absolute bottom-4 right-4 w-24 h-32 md:w-32 md:h-48 bg-black rounded-xl overflow-hidden border border-white/20 shadow-xl z-10">
                     <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 </div>
            </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            {messages.length === 0 && isActive && (
                <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                    <Heart size={48} className="mb-4 text-violet-500" />
                    <p className="text-sm font-medium">Safe Space Connected.</p>
                </div>
            )}

            {messages.map((msg) => (
            <div
                key={msg.id}
                className={`flex flex-col ${
                    msg.sender === 'ME' 
                    ? 'items-end' 
                    : msg.sender === 'SYSTEM' 
                        ? 'items-center' 
                        : 'items-start'
                }`}
            >
                {msg.sender === 'SYSTEM' ? (
                    <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-white/30 bg-white/5 px-3 py-1 rounded-full mb-2 border border-white/5 text-center">{msg.text}</span>
                ) : (
                    <div
                        className={`max-w-[90%] md:max-w-[70%] p-3 md:p-4 text-[13px] md:text-sm leading-relaxed shadow-lg ${
                            msg.sender === 'ME'
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-none border border-white/10'
                            : 'bg-white/10 backdrop-blur-md text-gray-100 rounded-2xl rounded-tl-none border border-white/5'
                        }`}
                    >
                        {msg.text}
                    </div>
                )}
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 pt-2 bg-gradient-to-t from-black/80 to-transparent shrink-0">
        <form 
            onSubmit={handleSend} 
            className="relative flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-3 shadow-2xl transition-all focus-within:bg-white/10 focus-within:border-white/20"
        >
          {/* Media Buttons (Coming Soon) */}
          <div className="flex gap-1 pr-2 border-r border-white/10 mr-1">
              <button
                type="button"
                onClick={() => alert("Image sharing feature is coming soon in the next update!")}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors relative group"
              >
                  <ImageIcon size={18} />
              </button>
              <button
                type="button"
                onClick={() => alert("Video sharing feature is coming soon in the next update!")}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 transition-colors relative group"
              >
                  <Film size={18} />
              </button>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!isActive}
            placeholder={isActive ? "Type a message..." : "Waiting..."}
            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-white/30 text-sm h-10 min-w-0"
          />
          <button
            type="submit"
            disabled={!isActive || !inputText.trim()}
            className="h-10 w-10 bg-white/10 text-white rounded-xl hover:bg-violet-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
          >
            <Send size={18} className={inputText.trim() ? 'ml-1' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;