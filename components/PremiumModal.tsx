import React from 'react';
import { X, Crown, Zap, Video, Image, Sliders, Check, Sparkles } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  const features = [
    { icon: <Video className="text-pink-500" size={20} />, text: "Unlimited Video Chat", desc: "Connect face-to-face securely." },
    { icon: <Sliders className="text-blue-500" size={20} />, text: "Gender & Region Filters", desc: "Control who you match with." },
    { icon: <Image className="text-emerald-500" size={20} />, text: "Send Photos & Videos", desc: "Share media in text chat." },
    { icon: <Zap className="text-yellow-500" size={20} />, text: "Priority Matching", desc: "Skip the queue. Get matched faster." },
  ];

    return (
        <div 
            className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-yellow-500/30 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden relative pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Glow Effect */}
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(234,179,8,0.1)_0%,transparent_70%)] animate-pulse pointer-events-none"></div>

                <div className="relative p-6 md:p-8">
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer z-50">
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg mb-4">
                            <Crown size={32} className="text-white fill-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white font-quicksand mb-2">Premium Unlocked</h2>
                        <p className="text-sm text-gray-400">Enjoy full access to our elite suite during this promotion.</p>
                    </div>

                    <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold mb-1">
                            <Sparkles size={16} />
                            <span className="text-sm uppercase tracking-widest">Launch Promotion Active</span>
                        </div>
                        <p className="text-[11px] text-center text-yellow-200/70 leading-relaxed">All premium features are currently complimentary. Access will return to standard tiers once the offer concludes.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors pointer-events-none">
                                <div className="p-2 bg-[#111] rounded-lg">{f.icon}</div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{f.text}</h4>
                                    <p className="text-xs text-gray-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                    >
                        Awesome!
                    </button>
                    
                    <p className="text-[10px] text-center text-gray-600 mt-4">
                        Secure payment via PayPal. Cancel anytime. <br/> By upgrading you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;