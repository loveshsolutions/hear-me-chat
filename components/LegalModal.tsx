import React from 'react';
import { X, Shield } from 'lucide-react';

export type LegalDocType = 'TERMS' | 'PRIVACY' | 'COMMUNITY' | 'SAFETY';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: LegalDocType;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, docType }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (docType) {
      case 'COMMUNITY':
        return (
          <div className="space-y-6 text-gray-300">
            <h1 className="text-2xl font-bold text-white">Community Guidelines</h1>
            <p className="text-sm text-gray-400 italic">Effective Date: March 5, 2026</p>
            
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">1. Be Respectful</h2>
              <p>Users must treat others with respect. The following behaviors are not allowed:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Harassment</li>
                <li>Bullying</li>
                <li>Personal attacks</li>
                <li>Threats or intimidation</li>
                <li>Repeated unwanted contact</li>
                <li>Creating a hostile environment for other users</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">2. No Hate Speech or Discrimination</h2>
              <p>HearMe.gg does not tolerate discrimination or hate speech. Users may not post content that attacks or discriminates against individuals or groups based on: Race, Religion, Gender, Sexual orientation, Nationality, Disability, Ethnicity.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">3. No NSFW or Adult Content</h2>
              <p>HearMe.gg is intended to be a safe environment for users. The following content is strictly prohibited:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pornographic material</li>
                <li>Sexually explicit messages</li>
                <li>Sexual solicitation</li>
                <li>Sharing nude or explicit images</li>
                <li>Links to adult websites</li>
                <li>Sexual roleplay involving minors</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">4. No Illegal Activity</h2>
              <p>Users may not use HearMe.gg for illegal activities. Prohibited actions include: Fraud or scams, Distribution of illegal content, Drug trafficking, Sharing pirated or stolen material, Hacking or cybercrime, Threatening violence.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">5. No Spam or Scams</h2>
              <p>Users may not use the platform for spam or deceptive activities including mass messaging, phishing attempts, fake giveaways, investment scams, or malicious links.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">6. Protect Your Privacy</h2>
              <p>Users should avoid sharing sensitive personal information such as home addresses, phone numbers, financial information, or passwords.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">7. Reporting Violations</h2>
              <p>If you encounter behavior that violates these guidelines, you may report it through the platform or contact: <a href="mailto:futuretechinquiries@proton.me" className="text-violet-400 hover:underline">futuretechinquiries@proton.me</a></p>
            </section>
          </div>
        );
      case 'SAFETY':
        return (
          <div className="space-y-6 text-gray-300">
            <h1 className="text-2xl font-bold text-white">Trust & Safety Policy</h1>
            <p className="text-sm text-gray-400 italic">Effective Date: March 5, 2026</p>
            
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">1. Platform Safety Commitment</h2>
              <p>HearMe.gg strives to create a platform where users can communicate safely. We aim to reduce harassment, fraud, abuse, illegal content, and harmful behavior.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">2. Content Moderation</h2>
              <p>HearMe.gg may review content that appears to violate platform rules. Moderation actions may include removing content, issuing warnings, restricting account functionality, or suspending accounts.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">3. Abuse Prevention</h2>
              <p>HearMe.gg may monitor platform activity to prevent abuse, including detecting spam patterns, identifying suspicious behavior, and preventing automated abuse.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">4. Reporting System</h2>
              <p>Users may report content or accounts that violate platform rules. Reports are reviewed by the moderation team.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">5. Law Enforcement Requests</h2>
              <p>HearMe.gg may comply with lawful requests from law enforcement authorities when required by applicable law.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">6. Emergency Situations</h2>
              <p>If a user appears to be in immediate danger or threatening harm, HearMe.gg may take urgent action including account suspension or notification of authorities if legally required.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">7. Platform Integrity</h2>
              <p>Users may not attempt to disrupt or manipulate the platform. Prohibited actions include bot activity, automated scraping, account farming, or exploiting vulnerabilities.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-violet-400">8. Contact</h2>
              <p>For safety concerns or policy questions, contact: <a href="mailto:futuretechinquiries@proton.me" className="text-violet-400 hover:underline">futuretechinquiries@proton.me</a></p>
            </section>
          </div>
        );
      case 'TERMS':
        return (
          <div className="space-y-6 text-gray-300">
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
            <p>By using HearMe.gg, you agree to abide by our Community Guidelines and respect the privacy and safety of all users. This platform is for peer support and connection. We do not provide professional medical or mental health advice.</p>
            <p>You must be at least 13 years old to use this service. We reserve the right to terminate access for any user who violates our rules.</p>
          </div>
        );
      case 'PRIVACY':
        return (
          <div className="space-y-6 text-gray-300">
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p>HearMe.gg is designed with privacy in mind. We minimize the collection of personal data. Guest access is anonymous. For registered users, we store only necessary account information.</p>
            <p>We do not sell your personal information to third parties. We use industry-standard security measures to protect your data.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-bottom border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="text-violet-500" size={20} />
            <span className="font-bold text-white tracking-wide">Legal Information</span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>
        
        <div className="p-6 border-t border-white/5 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
