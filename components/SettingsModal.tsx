import React, { useState, useRef } from 'react';
import { 
    X, User, Shield, Sliders, AlertTriangle, Lock, Crown, 
    Camera, Image as ImageIcon, Upload, Trash2, Check, 
    Smartphone, Moon, Sun, Bell, Volume2, Globe, Mic, 
    Video, CreditCard, LogOut, Mail, ChevronRight
} from 'lucide-react';
import { AppSettings, PrivacyLevel, BannerStyle } from '../types';
import { LegalDocType } from './LegalModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  onReset: () => void;
  onShowPremium: () => void;
  onOpenLegal: (type: LegalDocType) => void;
}

type Tab = 'PROFILE' | 'ACCOUNT' | 'PRIVACY' | 'PREFERENCES' | 'LEGAL';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, settings, onUpdate, onReset, onShowPremium, onOpenLegal 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('PROFILE');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempUsername, setTempUsername] = useState(settings.nickname);
  const [usernameError, setUsernameError] = useState('');

  if (!isOpen) return null;

  const update = (key: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  // --- HANDLERS ---

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
          alert("File size too large. Max 8MB.");
          return;
      }

      // Simulate upload and moderation
      alert("Avatar uploaded! Pending AI moderation check...");
      update('avatarSeed', Math.random().toString(36).substring(7));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTempUsername(val);
      if (val.length < 3) setUsernameError("Too short");
      else if (val.length > 20) setUsernameError("Too long");
      else if (/[^a-zA-Z0-9_]/.test(val)) setUsernameError("Alphanumeric only");
      else setUsernameError("");
  };

  const saveUsername = () => {
      if (usernameError) return;
      if (settings.usernameChangesRemaining <= 0) {
          alert("You have reached the daily limit for username changes.");
          return;
      }
      update('nickname', tempUsername);
      update('usernameChangesRemaining', settings.usernameChangesRemaining - 1);
  };

  const handleClaimAccount = () => {
      const email = prompt("Enter your email to claim this account:");
      if (email && email.includes('@')) {
          update('isClaimed', true);
          update('email', email);
          alert("Account claimed! Confirmation email sent.");
      } else {
          alert("Invalid email.");
      }
  };

  const handleDeleteAccount = () => {
      const confirm = window.confirm("DANGER: Are you sure you want to permanently delete your account? This cannot be undone.");
      if (confirm) {
          alert("Account scheduled for deletion.");
          onReset();
          onClose();
      }
  };

  // --- RENDER HELPERS ---

  const renderToggle = (label: string, key: keyof AppSettings, description?: string, premiumOnly = false) => {
      const isLocked = premiumOnly && !settings.isPremium;
      return (
        <div 
            onClick={() => isLocked ? onShowPremium() : update(key, !settings[key])}
            className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 cursor-pointer group ${isLocked ? 'opacity-50' : ''}`}
        >
            <div className="flex flex-col pr-4">
                <span className="text-sm font-bold text-gray-200 flex items-center gap-2 group-hover:text-white transition-colors">
                    {label}
                    {premiumOnly && <Crown size={12} className="text-yellow-500" />}
                </span>
                {description && <span className="text-xs text-gray-500 mt-0.5">{description}</span>}
            </div>
            {/* Inner button has pointer-events-none so click bubbles to the parent div */}
            <button 
                type="button"
                className={`w-12 h-6 rounded-full relative transition-colors shrink-0 pointer-events-none ${settings[key] && !isLocked ? 'bg-violet-600' : 'bg-gray-700'}`}
            >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[key] && !isLocked ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                    {isLocked && <Lock size={10} className="text-black"/>}
                </div>
            </button>
        </div>
      );
  };

  const renderSelect = (label: string, key: keyof AppSettings, options: string[], premiumOnly = false) => {
      const isLocked = premiumOnly && !settings.isPremium;
      return (
        <div className={`flex items-center justify-between py-3 border-b border-white/5 ${isLocked ? 'opacity-50' : ''}`}>
            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                {label}
                {premiumOnly && <Crown size={12} className="text-yellow-500" />}
            </span>
            <div className="relative">
                <select 
                    value={settings[key] as string}
                    onChange={(e) => update(key, e.target.value)}
                    disabled={isLocked}
                    className="bg-black border border-white/20 rounded-lg text-xs p-2 text-white focus:outline-none focus:border-violet-500 disabled:cursor-not-allowed min-w-[120px] cursor-pointer"
                >
                    {options.map(opt => (
                        <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                    ))}
                </select>
                {isLocked && <div onClick={onShowPremium} className="absolute inset-0 cursor-pointer z-10"></div>}
            </div>
        </div>
      );
  };

  const renderBannerPreview = (style: BannerStyle) => {
      const gradients: Record<BannerStyle, string> = {
          'SIMPLE_BLUE': 'bg-blue-600',
          'SIMPLE_DARK': 'bg-gray-800',
          'GRADIENT_SUNSET': 'bg-gradient-to-r from-orange-500 to-pink-600',
          'GRADIENT_COSMIC': 'bg-gradient-to-r from-violet-600 to-indigo-900'
      };
      
      return (
          <div 
            onClick={() => update('bannerStyle', style)}
            className={`h-16 w-full rounded-lg cursor-pointer border-2 transition-all ${settings.bannerStyle === style ? 'border-white scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100'} ${gradients[style]} relative overflow-hidden`}
          >
              {settings.bannerStyle === style && (
                  <div className="absolute top-1 right-1 bg-white text-black rounded-full p-0.5">
                      <Check size={12} strokeWidth={3} />
                  </div>
              )}
          </div>
      );
  };

  // --- TABS CONTENT ---

  const renderProfile = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Avatar Section */}
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Avatar</h3>
              <div className="flex items-center gap-6">
                  <div className="relative group">
                      <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-violet-500 to-fuchsia-500">
                         <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${settings.avatarSeed}`} 
                            className="w-full h-full rounded-full bg-black object-cover"
                            alt="avatar"
                         />
                      </div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                          <Camera size={24} className="text-white mb-1"/>
                          <span className="text-[10px] font-bold text-white">CHANGE</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg"
                        onChange={handleAvatarUpload}
                      />
                  </div>
                  <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                          Recommended: 500x500px, Max 8MB.<br/>
                          <span className="text-xs text-gray-500">AI moderation enabled. Inappropriate images will be rejected.</span>
                      </p>
                      <div className="flex gap-2">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer">
                              <Upload size={14} /> Upload New
                          </button>
                          <button type="button" onClick={() => update('avatarSeed', Math.random().toString(36))} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer">
                              <Trash2 size={14} /> Randomize
                          </button>
                      </div>
                  </div>
              </div>
          </section>

          {/* Banner Section */}
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Profile Banner</h3>
              <div className="grid grid-cols-2 gap-3">
                  {renderBannerPreview('SIMPLE_BLUE')}
                  {renderBannerPreview('GRADIENT_SUNSET')}
                  {renderBannerPreview('GRADIENT_COSMIC')}
                  {renderBannerPreview('SIMPLE_DARK')}
              </div>
          </section>

          {/* Username Section */}
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Username</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={tempUsername}
                        onChange={handleUsernameChange}
                        className={`flex-1 bg-black/50 border ${usernameError ? 'border-red-500' : 'border-white/20'} rounded-lg p-3 text-white focus:outline-none focus:border-violet-500`}
                      />
                      <button 
                        type="button"
                        onClick={saveUsername}
                        disabled={!!usernameError || tempUsername === settings.nickname || settings.usernameChangesRemaining <= 0}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 rounded-lg text-sm font-bold text-white transition-colors cursor-pointer"
                      >
                          Save
                      </button>
                  </div>
                  <div className="flex justify-between mt-2">
                      <span className="text-xs text-red-400 h-4">{usernameError}</span>
                      <span className="text-xs text-gray-500">{settings.usernameChangesRemaining} changes remaining today</span>
                  </div>
              </div>
          </section>
      </div>
  );

  const renderAccount = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Account Status */}
          <section className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      {settings.isClaimed ? <Check className="text-emerald-500" size={20}/> : <AlertTriangle className="text-yellow-500" size={20}/>}
                      {settings.isClaimed ? 'Account Verified' : 'Anonymous Account'}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-sm">
                      {settings.isClaimed 
                        ? `Linked to ${settings.email}. Your progress and badges are safe.` 
                        : "You are using a temporary session. Claim your account to save your badges, friends, and chat history permanently."}
                  </p>
                  {!settings.isClaimed && (
                      <button 
                        type="button"
                        onClick={handleClaimAccount}
                        className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                          <CreditCard size={16} /> Claim Account
                      </button>
                  )}
              </div>
          </section>

          {/* Upgrade Section */}
          {!settings.isPremium && (
             <section className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-xl p-6 flex items-center justify-between">
                 <div>
                     <h3 className="text-yellow-500 font-bold mb-1 flex items-center gap-2"><Crown size={16}/> Premium Plan</h3>
                     <p className="text-xs text-gray-400">Badge visibility, Video filters, Priority matching.</p>
                 </div>
                 <button type="button" onClick={onShowPremium} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg text-xs hover:bg-yellow-400 transition-colors cursor-pointer">
                     Upgrade
                 </button>
             </section>
          )}

          {/* Danger Zone */}
          <section className="pt-8 border-t border-white/5">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Trash2 size={12}/> Danger Zone</h3>
              <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                      <div>
                          <p className="text-sm font-bold text-gray-200">Delete Account</p>
                          <p className="text-xs text-gray-500">Permanently remove all data.</p>
                      </div>
                      <button type="button" onClick={handleDeleteAccount} className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-lg text-xs font-bold transition-all cursor-pointer">
                          Delete
                      </button>
                  </div>
              </div>
          </section>
      </div>
  );

  const renderPrivacy = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={12}/> Visibility</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  {renderSelect("Who can see my badges?", "privacyBadges", ["EVERYONE", "FRIENDS", "NOBODY"], true)}
                  {renderSelect("Who can see my interests?", "privacyInterests", ["EVERYONE", "FRIENDS", "NOBODY"])}
                  {renderToggle("Show activity status", "hideActivity", "Let others see when you are online.")}
              </div>
          </section>

          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Mail size={12}/> Incoming</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  {renderToggle("Allow Friend Requests", "allowFriendRequests", "Receive requests from strangers.")}
                  {renderToggle("Allow Incoming Calls", "allowCalls", "Receive video/audio calls.")}
                  {renderToggle("Filter Abusive Messages", "filterAbusiveText", "AI automatically hides harmful text.")}
                  {renderToggle("Auto-Blur Unsafe Media", "autoBlurUnsafe", "Blur NSFW images/video by default.")}
              </div>
          </section>
      </div>
  );

  const renderPreferences = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Smartphone size={12}/> App Behavior</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                   {renderToggle("Dark Mode", "darkMode", "Switch between light and dark themes.")}
                   {renderToggle("Auto-Convert Emojis", "autoEmoji", "Convert :) to 🙂 automatically.")}
                   {renderToggle("Push Notifications", "pushNotifications", "Get notified when app is backgrounded.")}
              </div>
          </section>

          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Video size={12}/> Audio & Video</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                   {renderSelect("Camera Source", "facingMode", ["user", "environment"])}
                   {renderSelect("Video Quality", "videoQuality", ["low", "medium", "high"], true)}
                   {renderToggle("Enable Camera", "cameraEnabled")}
                   {renderToggle("Enable Microphone", "micEnabled")}
                   {renderToggle("Blur My Background", "blurVideo")}
              </div>
          </section>
          
          <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Globe size={12}/> Discovery</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                   {renderSelect("Language", "language", ["English", "Spanish", "French", "German", "Portuguese"])}
                   {renderSelect("Region", "region", ["Global", "North America", "Europe", "Asia"], true)}
                   {renderToggle("Random Fallback", "allowRandomFallback", "Search globally if no matches found.")}
              </div>
          </section>

      </div>
  );

  const tabs: {id: Tab, label: string, icon: React.ReactNode}[] = [
      { id: 'PROFILE', label: 'Profile', icon: <User size={18}/> },
      { id: 'ACCOUNT', label: 'Account', icon: <CreditCard size={18}/> },
      { id: 'PRIVACY', label: 'Privacy', icon: <Shield size={18}/> },
      { id: 'PREFERENCES', label: 'Preferences', icon: <Sliders size={18}/> },
      { id: 'LEGAL', label: 'Legal', icon: <Lock size={18}/> },
  ];

  return (
    <div 
        className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl h-[85vh] bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-black/40 border-r border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5">
                <h2 className="text-xl font-bold font-quicksand text-white">Settings</h2>
            </div>
            
            <nav className="flex-1 p-3 space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold cursor-pointer ${
                            activeTab === tab.id 
                            ? 'bg-violet-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                    </button>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-white/5">
                <button 
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <LogOut size={16}/> Close Settings
                </button>
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-600 font-mono">Build 8832 • Stable</p>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
             {/* Mobile Header */}
             <div className="p-4 border-b border-white/5 flex justify-between items-center md:hidden bg-black/50 backdrop-blur-md">
                <h3 className="font-bold text-white flex items-center gap-2">
                    {tabs.find(t => t.id === activeTab)?.icon}
                    {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <button type="button" onClick={onClose} className="p-2 text-gray-400"><X size={20}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                 <div className="max-w-2xl mx-auto">
                     <div className="mb-6">
                         <h2 className="text-2xl font-bold text-white mb-2">{tabs.find(t => t.id === activeTab)?.label}</h2>
                         <p className="text-sm text-gray-400">Manage your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings and preferences.</p>
                     </div>
                     
                     {activeTab === 'PROFILE' && renderProfile()}
                     {activeTab === 'ACCOUNT' && renderAccount()}
                     {activeTab === 'PRIVACY' && renderPrivacy()}
                     {activeTab === 'PREFERENCES' && renderPreferences()}
                     {activeTab === 'LEGAL' && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <section className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                 <button onClick={() => onOpenLegal('TERMS')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
                                     <span className="text-sm font-bold text-gray-200">Terms of Service</span>
                                     <ChevronRight size={16} className="text-gray-500" />
                                 </button>
                                 <button onClick={() => onOpenLegal('PRIVACY')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
                                     <span className="text-sm font-bold text-gray-200">Privacy Policy</span>
                                     <ChevronRight size={16} className="text-gray-500" />
                                 </button>
                                 <button onClick={() => onOpenLegal('COMMUNITY')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5">
                                     <span className="text-sm font-bold text-gray-200">Community Guidelines</span>
                                     <ChevronRight size={16} className="text-gray-500" />
                                 </button>
                                 <button onClick={() => onOpenLegal('SAFETY')} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                     <span className="text-sm font-bold text-gray-200">Trust & Safety Policy</span>
                                     <ChevronRight size={16} className="text-gray-500" />
                                 </button>
                             </section>
                             <p className="text-xs text-gray-500 px-2">
                                 Last updated: March 5, 2026. These documents govern your use of HearMe.gg.
                             </p>
                         </div>
                     )}
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;