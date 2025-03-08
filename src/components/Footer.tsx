import React, { useState } from 'react';
import { Shield, FileText, X, Info } from 'lucide-react';

export function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-green-500/30 mt-12 py-6 bg-black/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-green-400 font-bold text-lg">Mind9</div>
            <div className="text-green-500/75 text-sm">
              Autonomous AI-Driven Meme Coin Generation
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1"
            >
              <Shield size={14} />
              Privacy Policy
            </button>
            
            <button 
              onClick={() => setShowTermsModal(true)}
              className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1"
            >
              <FileText size={14} />
              Terms of Use
            </button>
            
            <div className="text-green-500/50 text-sm">
              © {currentYear} Mind9 AI
            </div>
          </div>
        </div>
        
        <div className="mt-6 border border-green-500/20 rounded-lg p-4 bg-green-500/5">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-400 font-medium text-sm">Mind9 Privacy Notice</h4>
              <p className="text-green-500/75 text-xs mt-1">
                Mind9 operates as a fully automated AI system without human administrators. We prioritize decentralization, 
                transparency, and user control. All blockchain transactions are public and immutable. By using this platform, 
                you acknowledge that wallet addresses and on-chain activities are visible to the public. We do not collect 
                personal identity data such as names or emails. For more information, please review our full Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-4xl w-full mx-auto relative">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-green-500 hover:text-green-400"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              <h2 className="text-2xl font-bold text-green-400">Privacy Policy</h2>
              <p className="text-sm text-green-500/75">Last Updated: February 28, 2025</p>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">Introduction</h3>
                <p className="text-green-500/90 mb-4">
                  Welcome to Mind9 ("Mind9", "we", "us", or "our"). This Privacy Policy explains how Mind9, an autonomous AI-driven protocol, collects, uses, and protects information when you use our platform ("Website", "Platform", or "Services").
                </p>
                <p className="text-green-500/90 mb-4">
                  Mind9 operates as a fully automated AI system without human administrators. By accessing or using the Mind9 Platform, you acknowledge and agree to this Privacy Policy.
                </p>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-400 mb-2">Key Principles:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">Decentralization – Mind9 is AI-powered and operates independently.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">Transparency – All blockchain transactions are public and immutable.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">User Control – You maintain full control over your wallet and interactions.</span>
                    </li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">1. Information We Collect</h3>
                
                <h4 className="font-semibold text-green-400 mb-2">A. Information You Provide</h4>
                <p className="text-green-500/90 mb-2">
                  Mind9 collects minimal personal data. However, when using the platform, you may provide:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-green-500/90 mb-4">
                  <li>Wallet Addresses: Used for transaction processing, liquidity allocation, and Lucky Trader selections.</li>
                  <li>Referral Engagement Data: To track wallet-based referrals and determine eligibility for rewards.</li>
                </ul>
                
                <h4 className="font-semibold text-green-400 mb-2">B. Automatically Collected Data</h4>
                <p className="text-green-500/90 mb-2">
                  When you access the Website, our AI may collect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-green-500/90 mb-4">
                  <li>Transaction History: Publicly available on the Solana blockchain.</li>
                  <li>Usage Data: Includes interactions with the Website, IP address (anonymized), and browsing activity.</li>
                  <li>Engagement Metrics: AI tracks social media interactions (retweets, likes, comments) to enhance Lucky Trader selection.</li>
                  <li>Cookies & Analytics: Used for Website functionality and performance tracking.</li>
                </ul>
                <p className="text-green-500/90">
                  Mind9 does not collect personal identity data such as names, emails, or passwords.
                </p>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">2. How We Use Your Information</h3>
                <p className="text-green-500/90 mb-2">
                  Mind9's AI system processes data solely to:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Automate meme coin creation and liquidity distribution.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Facilitate Lucky Trader wallet selection for community participation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Improve the platform's engagement strategies through AI-driven analysis.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Prevent fraud and suspicious activities using AI monitoring.</span>
                  </li>
                </ul>
                
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                  <span className="text-green-400">💡</span>
                  <span className="text-green-500/90">Mind9 does not sell, rent, or share personal data for advertising purposes.</span>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">3. Data Transparency & Blockchain Considerations</h3>
                <p className="text-green-500/90 mb-2">
                  Mind9 operates on the Solana blockchain, meaning:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">All transactions are permanently recorded and cannot be altered.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Public wallet activity remains viewable on-chain.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Mind9 has no control over personal data stored on the blockchain.</span>
                  </li>
                </ul>
                
                <p className="text-green-500/90">
                  Users should carefully consider blockchain transparency before engaging.
                </p>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">4. Contact & Support</h3>
                <p className="text-green-500/90 mb-2">
                  Mind9 is an autonomous AI-driven protocol. For inquiries, visit:
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-400">🔹</span>
                  <span className="text-green-500/90">Twitter: <a href="https://twitter.com/Mind9AI" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">@Mind9AI</a></span>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-center text-green-400 font-bold">
                    📢 Welcome to the future of AI-driven, decentralized wealth creation.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      
      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-4xl w-full mx-auto relative">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-green-500 hover:text-green-400"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              <h2 className="text-2xl font-bold text-green-400">Mind9 Terms of Use</h2>
              <p className="text-sm text-green-500/75">Last Updated: February 28, 2025</p>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">1. Introduction</h3>
                <p className="text-green-500/90 mb-4">
                  Welcome to Mind9 ("Mind9", "we", "us", or "our"). These Terms of Use govern your access to and use of the Mind9 platform, including our website, AI-driven crypto generation system, and related services ("Platform").
                </p>
                <p className="text-green-500/90 mb-4">
                  By accessing or using Mind9, you agree to these Terms of Use. If you do not agree, you must stop using the Platform immediately.
                </p>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-400 mb-2">Key Principles:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">Autonomous AI System – Mind9 operates without human administrators.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">Decentralized & Transparent – All blockchain transactions are public and immutable.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✅</span>
                      <span className="text-green-500/90">No Guarantees – Mind9 does not guarantee profits or financial returns.</span>
                    </li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">2. Eligibility & User Responsibilities</h3>
                
                <h4 className="font-semibold text-green-400 mb-2">A. Eligibility</h4>
                <p className="text-green-500/90 mb-2">
                  To use Mind9, you must:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-green-500/90 mb-4">
                  <li>Be at least 18 years old.</li>
                  <li>Have a compatible Solana wallet.</li>
                  <li>Not reside in restricted jurisdictions where crypto transactions are prohibited.</li>
                </ul>
                
                <h4 className="font-semibold text-green-400 mb-2">B. User Responsibilities</h4>
                <p className="text-green-500/90 mb-2">
                  By using Mind9, you agree to:
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Use the platform legally and not engage in fraud, hacking, or abuse.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Secure your wallet & private keys – Mind9 cannot recover lost funds.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Accept full responsibility for your investment decisions.</span>
                  </li>
                </ul>
                
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <span className="text-red-400">🚨</span>
                  <span className="text-red-400">Mind9 is not responsible for user losses or market fluctuations.</span>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">3. Risks & Disclaimers</h3>
                <p className="text-green-500/90 mb-2">
                  Mind9 is an experimental AI-driven platform, and users should be aware of the following risks:
                </p>
                
                <h4 className="font-semibold text-green-400 mb-2">A. No Financial Advice</h4>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Mind9 is not a financial institution.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Nothing on the platform should be considered financial or investment advice.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-500/90">Users are fully responsible for their own trading decisions.</span>
                  </li>
                </ul>
                
                <h4 className="font-semibold text-green-400 mb-2">B. Market Volatility & Smart Contract Risks</h4>
                <ul className="list-disc pl-6 space-y-1 text-green-500/90 mb-4">
                  <li>Crypto markets are volatile – Coins created by Mind9 may lose value quickly.</li>
                  <li>Smart contract vulnerabilities – While security measures are in place, hacks and exploits are possible.</li>
                </ul>
                
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <span className="text-red-400">🚨</span>
                  <span className="text-red-400">You assume all risks associated with using Mind9.</span>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-green-400 mb-2">4. Contact & Support</h3>
                <p className="text-green-500/90 mb-2">
                  Mind9 is an autonomous AI-driven protocol. For inquiries, visit:
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-400">🔹</span>
                  <span className="text-green-500/90">Twitter: <a href="https://twitter.com/Mind9AI" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">@Mind9AI</a></span>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-center text-green-400 font-bold">
                    📢 Mind9 is redefining decentralized AI-driven wealth creation. Engage at your own risk.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}