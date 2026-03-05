import React, { useState, useEffect } from 'react';
import SharedCanvas from './components/SharedCanvas';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import PremiumModal from './components/PremiumModal';
import SocialHub from './components/SocialHub';
import LayoutFix from './components/LayoutFix';
import LegalModal, { LegalDocType } from './components/LegalModal';
import { UserRole, Tag, AppSettings, DEFAULT_SETTINGS, Gender, ChatMode } from './types';
import { socketService } from './services/socketService';
import { socialService } from './services/socialService';
import { Users, MessageCircle, Settings, Search, Ghost, Bot, Sparkles, Zap, Crown, Trophy, ChevronRight, User, Shield, ArrowRight, Globe, MapPin, SlidersHorizontal, Video, Lock, Inbox, Bell, Check, Mail, Loader2 } from 'lucide-react';

// Predefined tags for matching
const AVAILABLE_TAGS: Tag[] = [
  { id: '1', label: 'Anxiety' },
  { id: '2', label: 'Depression' },
  { id: '3', label: 'Loneliness' },
  { id: '4', label: 'Relationship' },
  { id: '5', label: 'Work Stress' },
  { id: '6', label: 'Just Chatting' },
];

const App: React.FC = () => {
  // State
  const [role, setRole] = useState<UserRole>('VENTER');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [appState, setAppState] = useState<'AUTH' | 'LANDING' | 'MATCHING' | 'ACTIVE' | 'BANNED'>('AUTH');
  const [banReason, setBanReason] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [authView, setAuthView] = useState<'MAIN' | 'EMAIL'>('MAIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('TERMS');
  const [chatMode, setChatMode] = useState<ChatMode>('TEXT');
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  
  // Settings & Premium
  const [showSettings, setShowSettings] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  
  // Social Hub State
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'INBOX' | 'FRIENDS' | 'HISTORY'>('INBOX');
  const [unreadCount, setUnreadCount] = useState(0);

  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('appSettings');
      // Merge with DEFAULT_SETTINGS to ensure new fields are present if old storage exists
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  // Poll for unread count
  useEffect(() => {
    setUnreadCount(socialService.getUnreadCount());
    const interval = setInterval(() => {
        setUnreadCount(socialService.getUnreadCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Check for Stripe success/cancel
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      updateSetting('isPremium', true);
      alert('Subscription successful! You are now a Premium member.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (query.get('canceled')) {
      alert('Subscription canceled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (query.get('creator') === 'true') {
      setIsCreatorMode(true);
    }
  }, []);

  useEffect(() => {
    socketService.on('ROOM_JOINED', (data: any) => {
      setIsSpectator(!!data?.isSpectator);
      setAppState('ACTIVE');
    });
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleGuestLogin = () => {
      if (!agreedToTerms) return;
      // Unlock premium as part of the promotional offer
      updateSetting('isPremium', true);
      setAppState('LANDING');
  };

  const handleStart = (mode: ChatMode) => {
    if (mode === 'VIDEO' && !settings.isPremium) {
        setChatMode('VIDEO'); 
        setShowPremium(true);
        return;
    }

    setChatMode(mode);
    setAppState('MATCHING');
    socketService.connect();
    socketService.emit('JOIN_ROOM', { 
        role, 
        mode,
        tags: selectedTags, 
        language: settings.language, 
        region: settings.region,
        gender: settings.gender,
        isPremium: settings.isPremium
    });
  };

  const handleSpectate = () => {
    const secret = prompt("Enter Creator Secret Key:");
    if (secret !== "kempalti2026") {
        alert("Access Denied: Invalid Creator Key.");
        return;
    }
    setRole('MODERATOR');
    setChatMode('TEXT');
    setAppState('MATCHING');
    socketService.connect();
    socketService.emit('SPECTATE_ROOM', { secret });
  };

  const handleStartBot = () => {
      setAppState('MATCHING');
      socketService.connect();
      socketService.startBotSession();
  };
  
  const handleSkip = () => {
      setAppState('MATCHING');
      socketService.emit('SKIP_USER', {});
  };

  const handleGenderSelect = (g: Gender) => {
      if (g !== 'BOTH' && !settings.isPremium) {
          setShowPremium(true);
          return;
      }
      updateSetting('gender', g);
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const newTag: Tag = { id: `custom-${Date.now()}`, label: newTagInput.trim() };
    setCustomTags([...customTags, newTag]);
    setSelectedTags([...selectedTags, newTag.id]);
    setNewTagInput('');
  };
  
  const updateSetting = (key: keyof AppSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleUpgrade = () => {
      updateSetting('isPremium', true);
      setShowPremium(false);
      alert("Welcome to Premium! Video and Filters Unlocked.");
  };

  const openSocial = (tab: 'INBOX' | 'FRIENDS' | 'HISTORY') => {
      setSocialTab(tab);
      setIsSocialOpen(true);
  };

  // --- Views ---

  const renderBanned = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
      <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Shield size={48} className="text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
      <div className="max-w-md bg-white/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-xl">
        <p className="text-gray-300 mb-4">
          Your account has been permanently banned for violating our Community Guidelines.
        </p>
        <div className="bg-black/40 rounded-lg p-4 mb-6 text-left border border-white/5">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Reason for Ban</p>
          <p className="text-sm text-white">{banReason || 'Violation of Safety Policies'}</p>
        </div>
        <p className="text-xs text-gray-500">
          If you believe this was a mistake, you can contact our safety team at <span className="text-violet-400">safety@hearme.gg</span>.
        </p>
      </div>
      <button 
        onClick={() => {
          localStorage.removeItem('hearme_banned');
          window.location.reload();
        }}
        className="mt-8 text-sm text-gray-500 hover:text-white transition-colors underline"
      >
        Debug: Clear Ban (Developer Only)
      </button>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-16 md:w-72 bg-black/20 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center md:items-start py-6 md:px-6 shrink-0 z-50 relative">
        <button 
            type="button"
            className="flex items-center gap-3 mb-10 px-2 cursor-pointer bg-transparent border-none p-0" 
            onClick={() => setAppState('LANDING')}
        >
            <div className="relative">
                <div className="absolute inset-0 bg-violet-600 blur-lg opacity-50"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    <Ghost className="text-white" size={24} />
                </div>
            </div>
            <h1 className="hidden md:block text-2xl font-bold font-quicksand text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">HearMe.gg</h1>
        </button>

        {/* User Card */}
        <div className="hidden md:block w-full mb-8 p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-lg relative overflow-hidden group">
            {/* Dynamic Banner Background */}
            <div className={`absolute inset-0 opacity-20 ${
                settings.bannerStyle === 'GRADIENT_COSMIC' ? 'bg-gradient-to-r from-violet-600 to-indigo-900' :
                settings.bannerStyle === 'GRADIENT_SUNSET' ? 'bg-gradient-to-r from-orange-500 to-pink-600' :
                settings.bannerStyle === 'SIMPLE_BLUE' ? 'bg-blue-600' : 'bg-gray-800'
            }`}></div>
            
            <div className="absolute top-0 right-0 p-2 opacity-50">
                {settings.isPremium ? <Crown size={40} className="text-yellow-500/40 rotate-12" /> : <Trophy size={40} className="text-gray-500/20 rotate-12" />}
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className={`w-12 h-12 rounded-full p-[2px] ${settings.isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-gray-700 to-gray-600'}`}>
                    <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                        <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${settings.avatarSeed}`} alt="avatar" className="w-10 h-10 rounded-full" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{settings.nickname}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold">
                        {settings.isPremium ? <span className="text-yellow-500 flex items-center gap-1"><Crown size={10}/> Premium</span> : <span className="text-gray-400">Free Plan</span>}
                    </div>
                </div>
            </div>
        </div>

        <nav className="space-y-3 w-full">
            <button 
                type="button"
                onClick={() => setAppState('LANDING')}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium border backdrop-blur-sm transition-all group ${
                    appState === 'LANDING' 
                    ? 'bg-white/10 text-white border-white/10 shadow-lg' 
                    : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                }`}
            >
                <MessageCircle size={20} className="text-violet-400 group-hover:text-violet-300" />
                <span className="hidden md:block">New Chat</span>
                <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hidden md:block" />
            </button>
             <button 
                type="button"
                onClick={() => openSocial('FRIENDS')}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
                <Users size={20} />
                <span className="hidden md:block">Friends</span>
            </button>
             <button 
                type="button"
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
                <Settings size={20} />
                <span className="hidden md:block">Settings</span>
            </button>
        </nav>

        {!settings.isPremium && (
            <div className="mt-auto hidden md:block w-full">
                <button type="button" onClick={() => setShowPremium(true)} className="w-full p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all text-left group">
                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1">
                        <Crown size={12} />
                        <span>Go Premium</span>
                    </div>
                    <p className="text-[10px] text-gray-400 group-hover:text-gray-300">Unlock video & gender filters.</p>
                </button>
            </div>
        )}
    </div>
  );

  const renderTopRightCluster = () => (
      <div className="flex items-center gap-3">
         <button type="button" onClick={() => setShowPremium(true)} className="h-9 px-3 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2 text-yellow-400 hover:bg-yellow-500/20 transition-colors backdrop-blur-md text-[10px] font-bold">
            <Crown size={12}/> PREMIUM
         </button>
         
         {/* INBOX */}
         <button type="button" onClick={() => openSocial('INBOX')} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-md relative group">
             <Inbox size={16}/>
             {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#111]">{unreadCount}</span>}
         </button>

         {/* FRIENDS */}
         <button type="button" onClick={() => openSocial('FRIENDS')} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-md relative group">
             <Users size={16}/>
         </button>

         {/* NOTIFICATIONS */}
         <button type="button" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-md relative group">
             <Bell size={16}/>
         </button>
         
         <div className="w-px h-6 bg-white/10 mx-1"></div>

         <button 
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors backdrop-blur-md"
         >
            <Settings size={16}/>
         </button>
      </div>
  );

  const handleEmailLogin = () => {
    if (!email || !password) return;
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      handleGuestLogin();
    }, 1500);
  };

  const handleGoogleLogin = () => {
    if (!agreedToTerms) return;
    setShowGoogleMock(true);
  };

  const completeGoogleLogin = () => {
    setShowGoogleMock(false);
    setIsAuthLoading(true);
    setTimeout(() => {
      setIsAuthLoading(false);
      handleGuestLogin();
    }, 1500);
  };

  const renderGoogleMock = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#202124] border border-white/10 rounded-lg w-full max-w-[360px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 flex flex-col items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <h2 className="text-xl font-medium text-white mb-1">Sign in</h2>
          <p className="text-sm text-gray-400 mb-8">to continue to HearMe.gg</p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={completeGoogleLogin}
              className="w-full flex items-center gap-3 p-3 border border-white/10 rounded-md hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                {email?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{email || 'User'}</p>
                <p className="text-xs text-gray-500">{email || 'user@example.com'}</p>
              </div>
            </button>
            
            <button 
              onClick={completeGoogleLogin}
              className="w-full text-left p-3 border border-white/10 rounded-md hover:bg-white/5 transition-colors text-sm text-gray-300"
            >
              Use another account
            </button>
          </div>
          
          <div className="w-full mt-8 flex justify-between items-center">
            <button onClick={() => setShowGoogleMock(false)} className="text-sm text-violet-400 font-medium hover:text-violet-300">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleBan = (reason: string) => {
    setBanReason(reason);
    setAppState('BANNED');
    // In a real app, this would also persist the ban on the server/local storage
    localStorage.setItem('hearme_banned', JSON.stringify({ reason, timestamp: Date.now() }));
  };

  useEffect(() => {
    const bannedData = localStorage.getItem('hearme_banned');
    if (bannedData) {
      const { reason } = JSON.parse(bannedData);
      setBanReason(reason);
      setAppState('BANNED');
    }
  }, []);

  const openLegal = (type: LegalDocType) => {
    setLegalDocType(type);
    setShowLegalModal(true);
  };

  const renderAuth = () => (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10 w-full h-full overflow-y-auto">
          {showGoogleMock && renderGoogleMock()}
          <div className="max-w-md w-full backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center my-auto">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 mb-4 md:mb-6">
                  <Ghost className="text-white" size={32} />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold font-quicksand text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">HearMe.gg</h1>
              <p className="text-gray-400 mb-6 md:mb-8 text-xs md:sm">A safe harbor for anonymous peer support and connection.</p>

              {authView === 'MAIN' ? (
                <>
                  <div className="w-full bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-3 md:p-4 mb-6 md:mb-8">
                      <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold mb-1">
                          <Sparkles size={14} />
                          <span className="text-xs md:text-sm uppercase tracking-widest">Limited Time Promotion</span>
                      </div>
                      <p className="text-[10px] md:text-[11px] text-yellow-200/70 leading-relaxed">Unlock the full HearMe experience. All Premium features are currently complimentary for a limited time.</p>
                  </div>

                  <div className="w-full mb-6">
                      <label className="flex items-start gap-3 text-left cursor-pointer group">
                          <div className="relative flex items-center justify-center mt-0.5">
                              <input 
                                  type="checkbox" 
                                  className="peer appearance-none w-4 h-4 md:w-5 md:h-5 border-2 border-gray-500 rounded bg-black/50 checked:bg-violet-600 checked:border-violet-500 transition-all cursor-pointer"
                                  checked={agreedToTerms}
                                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                              />
                              <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                          </div>
                          <span className="text-[11px] text-gray-400 leading-relaxed">
                              I agree to the <button onClick={() => openLegal('TERMS')} className="text-violet-400 hover:underline">Terms</button>, <button onClick={() => openLegal('PRIVACY')} className="text-violet-400 hover:underline">Privacy Policy</button>, <button onClick={() => openLegal('COMMUNITY')} className="text-violet-400 hover:underline">Community Guidelines</button> and <button onClick={() => openLegal('SAFETY')} className="text-violet-400 hover:underline">Trust & Safety Policy</button>.
                          </span>
                      </label>
                  </div>

                  <div className="w-full space-y-3 mb-6">
                      <button 
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={!agreedToTerms || isAuthLoading}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 border border-white/10 ${
                              agreedToTerms && !isAuthLoading
                              ? 'bg-white/5 text-white hover:bg-white/10 cursor-pointer' 
                              : 'bg-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                      >
                          {isAuthLoading ? <Loader2 className="animate-spin" size={18} /> : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          )}
                          {isAuthLoading ? 'Connecting...' : 'Continue with Google'}
                      </button>

                      <button 
                          type="button"
                          onClick={() => agreedToTerms && setAuthView('EMAIL')}
                          disabled={!agreedToTerms || isAuthLoading}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 border border-white/10 ${
                              agreedToTerms && !isAuthLoading
                              ? 'bg-white/5 text-white hover:bg-white/10 cursor-pointer' 
                              : 'bg-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                      >
                          <Mail size={18} />
                          Continue with Email
                      </button>

                      <div className="flex items-center gap-4 py-2">
                          <div className="flex-1 h-px bg-white/10"></div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest">or</span>
                          <div className="flex-1 h-px bg-white/10"></div>
                      </div>

                      <button 
                          type="button"
                          onClick={handleGuestLogin}
                          disabled={!agreedToTerms || isAuthLoading}
                          className={`w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2 ${
                              agreedToTerms && !isAuthLoading
                              ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/10 cursor-pointer' 
                              : 'bg-white/10 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                          <User size={18} />
                          Continue as Guest
                      </button>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="text-left space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="text-left space-y-1.5">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleEmailLogin}
                    disabled={isAuthLoading}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2"
                  >
                    {isAuthLoading && <Loader2 className="animate-spin" size={20} />}
                    {isAuthLoading ? 'Logging in...' : 'Login'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAuthView('MAIN')}
                    className="w-full py-2 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    Back to options
                  </button>
                </div>
              )}
          </div>
      </div>
  );

  const renderLanding = () => {
    const allTags = [...AVAILABLE_TAGS, ...customTags];

    return (
      <div className="flex-1 flex flex-col overflow-y-auto relative z-10">
          {/* Top Bar */}
          <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shrink-0">
             <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 rounded-full">
                 <Sparkles size={14} className="text-yellow-400" />
                 <span className="text-xs font-bold text-yellow-200">Exclusive: Complimentary Premium Access Active</span>
             </div>
             <div className="lg:hidden flex-1"></div>
             {renderTopRightCluster()}
          </div>

          {/* Mobile/Tablet Promo Banner */}
          <div className="lg:hidden mx-4 mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 rounded-xl text-center shadow-lg shadow-yellow-500/5">
              <Sparkles size={16} className="text-yellow-400 shrink-0" />
              <span className="text-[11px] font-bold text-yellow-200 leading-tight uppercase tracking-wider">Limited Time: Full Premium Suite Unlocked</span>
          </div>

          <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-y-auto">
             <div className="max-w-3xl w-full">
                 
                 {/* Glass Card Container */}
                 <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                     <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>
                     <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>

                     {/* GENDER SELECTOR (PREMIUM GATED) */}
                     <div className="mb-8 relative z-10">
                        <label className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                             I want to meet:
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                type="button"
                                onClick={() => handleGenderSelect('MALE')}
                                className={`relative h-14 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${settings.gender === 'MALE' ? 'bg-blue-600/30 border-blue-500 text-blue-200' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                            >
                                Male
                                {!settings.isPremium && <Lock size={12} className="text-yellow-500" />}
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleGenderSelect('BOTH')}
                                className={`h-14 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${settings.gender === 'BOTH' ? 'bg-violet-600/30 border-violet-500 text-violet-200' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                            >
                                Both
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleGenderSelect('FEMALE')}
                                className={`relative h-14 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${settings.gender === 'FEMALE' ? 'bg-pink-600/30 border-pink-500 text-pink-200' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                            >
                                Female
                                {!settings.isPremium && <Lock size={12} className="text-yellow-500" />}
                            </button>
                        </div>
                     </div>

                     {/* Interests Section */}
                     <div className="mb-8 relative z-10">
                         <div className="flex justify-between items-center mb-4">
                            <label className="text-white font-bold text-lg flex items-center gap-2">
                                <Sparkles className="text-yellow-400" size={16} />
                                Your Interests
                            </label>
                            <button type="button" className="text-xs font-bold text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">Manage</button>
                         </div>
                         
                         <div className="bg-black/20 border border-white/5 rounded-2xl p-6 min-h-[100px] relative">
                             {selectedTags.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center h-20 text-gray-500 text-sm">
                                     Select topics to find your tribe.
                                 </div>
                             ) : (
                                 <div className="flex flex-wrap gap-3">
                                     {selectedTags.map(id => {
                                         const tag = allTags.find(t => t.id === id);
                                         return tag ? (
                                             <button type="button" key={id} onClick={() => toggleTag(id)} className="group bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                                                 {tag.label} 
                                                 <span className="opacity-50 group-hover:opacity-100">✕</span>
                                             </button>
                                         ) : null
                                     })}
                                 </div>
                             )}
                             
                             <div className="mt-6 pt-5 border-t border-white/5">
                                 <div className="flex flex-wrap gap-2">
                                    {allTags.slice(0, 5).map(tag => (
                                        <button
                                            type="button"
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            selectedTags.includes(tag.id)
                                                ? 'bg-white text-black border-white'
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {tag.label}
                                        </button>
                                    ))}
                                    <form onSubmit={handleAddCustomTag} className="inline-flex">
                                        <input 
                                            type="text" 
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            placeholder="+ Custom"
                                            className="bg-transparent border border-dashed border-white/20 text-gray-300 text-xs rounded-xl px-3 py-2 w-24 focus:outline-none focus:border-violet-500"
                                        />
                                    </form>
                                 </div>
                             </div>
                         </div>
                     </div>
                     
                     {/* START ACTIONS */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                         {/* TEXT CHAT (FREE) */}
                         <button 
                            type="button"
                            onClick={() => handleStart('TEXT')}
                            className="group relative h-20 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99] border border-white/10 bg-black/40"
                         >
                             <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 group-hover:opacity-100 transition-opacity"></div>
                             <div className="relative h-full flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
                                 <MessageCircle fill="currentColor" size={24} className="text-violet-400" />
                                 START TEXT
                             </div>
                         </button>

                         {/* VIDEO CHAT (PREMIUM) */}
                         <button 
                            type="button"
                            onClick={() => handleStart('VIDEO')}
                            className="group relative h-20 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99] border border-white/10 bg-black/40"
                         >
                             <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20 group-hover:opacity-100 transition-opacity"></div>
                             <div className="relative h-full flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
                                 <Video fill="currentColor" size={24} className="text-pink-400" />
                                 START VIDEO
                                 {!settings.isPremium && <Lock size={16} className="text-yellow-500 opacity-80" />}
                             </div>
                         </button>
                     </div>

                     {/* MODERATOR ACTIONS */}
                     {isCreatorMode && (
                         <div className="mt-6 pt-6 border-t border-white/5 flex justify-center">
                             <button 
                               type="button"
                               onClick={handleSpectate}
                               className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                             >
                               <Ghost size={16} className="text-violet-400" />
                               Anonymous Moderator View
                             </button>
                         </div>
                     )}
                 </div>
             </div>
          </div>
      </div>
    );
  };

  const renderActiveRoom = () => (
    <div className="flex-1 flex flex-col overflow-hidden relative z-10">
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
         {/* Canvas Area */}
         {isCanvasOpen && (
             <div className="w-full md:w-1/2 h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-left duration-300">
                 <SharedCanvas isActive={true} onClose={() => setIsCanvasOpen(false)} />
             </div>
         )}

         {/* Chat Area */}
         <div className="flex-1 h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <ChatPanel 
                isActive={true} 
                mode={chatMode}
                role={role} 
                isPremium={settings.isPremium}
                onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)} 
                isCanvasOpen={isCanvasOpen}
                onSkip={handleSkip}
                onShowPremium={() => setShowPremium(true)}
                onBan={handleBan}
                isSpectator={isSpectator}
            />
         </div>
      </div>
    </div>
  );

  return (
    <LayoutFix>
      <div className="flex h-screen w-screen bg-[#050505] text-gray-200 overflow-hidden font-nunito selection:bg-violet-500 selection:text-white relative">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-900/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {renderSidebar()}
        {appState === 'AUTH' && renderAuth()}
        {appState === 'LANDING' && renderLanding()}
        {appState === 'BANNED' && renderBanned()}
        {appState === 'MATCHING' && (
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 border-t-violet-500 animate-spin flex items-center justify-center bg-black/20"></div>
              <h2 className="mt-8 text-3xl font-bold text-white">Finding a partner...</h2>
              {settings.priorityMatching && <span className="text-yellow-500 text-sm mt-2 font-bold flex items-center gap-1"><Zap size={12}/> Priority Matching Active</span>}
            </div>
        )}
        {appState === 'ACTIVE' && renderActiveRoom()}
        
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdate={setSettings}
          onReset={() => setSettings(DEFAULT_SETTINGS)}
          onShowPremium={() => setShowPremium(true)}
          onOpenLegal={openLegal}
        />

        <LegalModal 
          isOpen={showLegalModal} 
          onClose={() => setShowLegalModal(false)} 
          docType={legalDocType} 
        />

        <PremiumModal 
          isOpen={showPremium}
          onClose={() => setShowPremium(false)}
          onUpgrade={handleUpgrade}
        />

        <SocialHub 
            isOpen={isSocialOpen}
            onClose={() => setIsSocialOpen(false)}
            initialTab={socialTab}
        />
      </div>
    </LayoutFix>
  );
};

export default App;