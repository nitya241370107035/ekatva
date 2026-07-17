import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Bot, 
  User, 
  HelpCircle, 
  Compass, 
  Volume2, 
  ArrowRight,
  ShieldAlert,
  Settings
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EkatvaHumsafarProps {
  role: 'weaver' | 'secretary' | 'buyer';
  userName?: string;
}

export const EkatvaHumsafar: React.FC<EkatvaHumsafarProps> = ({ role, userName }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('ekatva_gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#humsafar-trigger')) return;
      setIsExpanded(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isExpanded]);

  // Suggested queries based on user role
  const weaverPresets = [
    { 
      label: t('humsafar.presets.weaver.tension.label', 'करघा धागा तनाव'), 
      query: t('humsafar.presets.weaver.tension.query', 'करघा बुनते समय ताने (warp) का सही तनाव कैसे निर्धारित करें? धागा बार-बार क्यों टूटता है?') 
    },
    { 
      label: t('humsafar.presets.weaver.vishwakarma.label', 'पीएम विश्वकर्मा योजना'), 
      query: t('humsafar.presets.weaver.vishwakarma.query', 'पीएम विश्वकर्मा योजना (PM Vishwakarma) के तहत बुनकरों को क्या ऋण और सहायता मिलती है?') 
    },
    { 
      label: t('humsafar.presets.weaver.dye.label', 'सूती धागा पक्का रंग'), 
      query: t('humsafar.presets.weaver.dye.query', 'सूती या रेशम के धागे में पक्का रंग चढ़ाने की सबसे उत्तम प्राकृतिक विधि कौन सी है?') 
    }
  ];

  const secretaryPresets = [
    { 
      label: t('humsafar.presets.secretary.meeting.label', 'बैठक आमंत्रण ड्राफ्ट'), 
      query: t('humsafar.presets.secretary.meeting.query', 'सहकारी समिति के बुनकर सदस्यों की मासिक बैठक के लिए हिंदी में एक औपचारिक आमंत्रण सूचना का मसौदा (Notice Draft) तैयार करें।') 
    },
    { 
      label: t('humsafar.presets.secretary.stock.label', 'त्योहारी स्टॉक बफ़र'), 
      query: t('humsafar.presets.secretary.stock.query', 'आने वाले त्योहारी सीजन के लिए धागे और रंगाई सामग्री का बफर स्टॉक स्तर (Buffer Stock Level) तय करने के मुख्य नियम क्या हैं?') 
    },
    { 
      label: t('humsafar.presets.secretary.coalition.label', 'थोक ऑर्डर आबंटन'), 
      query: t('humsafar.presets.secretary.coalition.query', 'एक बड़ा सरकारी थोक ऑर्डर (RFQ) प्राप्त हुआ है। इसे पूरा करने के लिए तीन सहकारी समितियों के बीच आबंटन (Coalition arrangement) कैसे व्यवस्थित करें?') 
    },
    { 
      label: t('humsafar.presets.secretary.pricing.label', 'उत्पाद मूल्य निर्धारण'), 
      query: t('humsafar.presets.secretary.pricing.query', 'हथकरघा उत्पादों की प्रतिस्पर्धी मूल्य निर्धारण (Product Pricing Strategy) कैसे करें ताकि बुनकरों को उचित मजदूरी भी मिले और उत्पाद बाज़ार में बिक सके?') 
    }
  ];

  const presets = role === 'secretary' ? secretaryPresets : weaverPresets;

  // Initial greeting
  useEffect(() => {
    const greeting = role === 'secretary' 
      ? t('humsafar.greeting.secretary', 'प्रणाम सचिव महोदय {{userName}}! एकत्व एआई हमसफ़र में आपका स्वागत है। मैं यहाँ आपको सहकारी नोटिस ड्राफ्ट करने, आगामी स्टॉक के विश्लेषण, बुनकरों के शिकायतों के निवारण और थोक आरएफक्यू के गठबंधन की रूपरेखा तय करने में सहयोग दे सकता हूँ। आप क्या जानना चाहेंगे?', { userName: userName || '' })
      : t('humsafar.greeting.weaver', 'नमस्ते बुनकर भाई {{userName}}! एकत्व एआई हमसफ़र में आपका स्वागत है। मैं यहाँ आपको करघा तनाव दुरुस्त करने, धागों के काउंट समझने, प्राकृतिक रंगाई की विधियों या पीएम विश्वकर्मा जैसी सरकारी योजनाओं की जानकारी देने के लिए प्रस्तुत हूँ। मुझसे कोई भी सवाल पूछें।', { userName: userName || '' });
    
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [role, userName, t]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey.trim()) {
        headers['x-gemini-api-key'] = apiKey.trim();
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          role: role
        })
      });

      if (!response.ok) {
        throw new Error('AI Server responded with an error');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      console.error("Humsafar AI Error:", err);
      setError("सलाहकार से जुड़ने में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          if (!isExpanded) {
            e.stopPropagation();
            setIsExpanded(true);
          } else {
            setIsOpen(true);
          }
        }}
        aria-label={t('humsafar.open', 'Open AI Co-pilot')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        style={{
          transform: isExpanded ? 'translateX(-16px)' : 'translateX(28px)',
          transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, box-shadow 0.2s'
        }}
        className={`fixed ${
          role === 'weaver' ? 'bottom-24 sm:bottom-24 right-0' : 'bottom-4 sm:bottom-6 right-0'
        } z-40 h-14 bg-loom-wood hover:bg-loom-wood-light text-white px-4 rounded-l-2xl rounded-r-none shadow-2xl flex items-center justify-center gap-2.5 border-2 border-r-0 border-loom-gold cursor-pointer`}
        id="humsafar-trigger"
      >
        <Sparkles className="w-6 h-6 shrink-0 text-loom-gold animate-pulse" />
        <span 
          style={{
            transition: 'max-width 350ms ease-in-out, opacity 300ms ease-in-out, margin 350ms ease-in-out',
            maxWidth: isExpanded ? '200px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
          className="font-heading font-black text-sm pr-1 overflow-hidden whitespace-nowrap block"
        >
          एआई हमसफ़र (AI Co-pilot)
        </span>
      </button>

      {/* Slide-over Drawer Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={handleClose} />

          {/* Drawer Body styled with deep vintage parchment aesthetic */}
          <div className="relative w-full sm:max-w-md h-full bg-loom-cream border-l-0 sm:border-l-4 border-loom-gold flex flex-col shadow-2xl animate-slide-in">
            
            {/* Header */}
            <div className="p-5 bg-loom-wood text-loom-cream border-b-2 border-loom-gold flex justify-between items-center bg-loom-pattern relative">
              {/* Absolute dark overlay */}
              <div className="absolute inset-0 bg-loom-wood/95 z-0" />
              
              <div className="relative z-10 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-loom-gold/20 border border-loom-gold flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-loom-gold" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold flex items-center gap-1">
                    एकत्व एआई हमसफ़र
                  </h3>
                  <span className="text-[10px] text-loom-gold font-extrabold uppercase tracking-widest block leading-none">
                    Ekatva AI Intelligent Co-Pilot
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showSettings 
                      ? 'text-loom-gold bg-white/10' 
                      : 'text-loom-cream/80 hover:text-white hover:bg-white/5'
                  }`}
                  title={t('humsafar.settings', 'सेटिंग्स (Settings)')}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 text-loom-cream/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  title="छोटा करें"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-loom-wood text-loom-cream p-4 border-b border-loom-gold flex flex-col gap-3 animate-fade-in relative z-20 bg-loom-pattern">
                <div className="absolute inset-0 bg-loom-wood/95 z-0" />
                <div className="relative z-10">
                  <h4 className="font-heading text-sm font-bold text-loom-gold flex items-center gap-1.5 mb-2">
                    <Settings className="w-4 h-4 text-loom-gold" />
                    हमसफ़र एआई सेटिंग्स (AI Co-pilot Settings)
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-loom-cream/70 font-semibold uppercase tracking-wider">
                      Gemini API Key:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-1 p-2 bg-white/10 border border-white/20 focus:border-loom-gold rounded-lg text-base sm:text-xs text-white focus:outline-none focus:ring-1 focus:ring-loom-gold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('ekatva_gemini_api_key', tempKey);
                          setApiKey(tempKey);
                          setShowSettings(false);
                        }}
                        className="bg-loom-gold hover:bg-loom-gold-light text-loom-wood px-3.5 py-1.5 rounded-lg font-heading text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        सहेजें
                      </button>
                    </div>
                    <p className="text-[9px] text-loom-cream/60 leading-normal mt-1">
                      आप अपनी Gemini API Key यहाँ दर्ज कर सकते हैं। यह कुंजी आपके ब्राउज़र में सुरक्षित रूप से स्थानीय (localStorage) सहेजी जाती है।
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning when API is missing (handled elegantly) */}
            {!apiKey.trim() ? (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-col items-start gap-1.5 text-[11px] text-amber-800 font-medium">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>एकत्व एआई: ऑफ़लाइन डेमो मोड सक्रिय है (API Key अनुपस्थित)।</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(true);
                  }}
                  className="text-[10px] text-loom-gold bg-loom-wood px-2 py-1 rounded-md font-bold hover:bg-loom-wood-light transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3 text-loom-gold animate-spin-slow" />
                  यहाँ क्लिक कर Gemini API Key सेट करें →
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>एकत्व एआई: सुरक्षित सर्वर-साइड जेमिनी विश्लेषण सक्रिय है।</span>
              </div>
            )}

            {/* Message Thread Panel */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-loom-parchment/30">
              {messages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                      isAssistant 
                        ? 'bg-loom-wood text-loom-gold border-loom-gold' 
                        : 'bg-white text-loom-wood border-loom-beige'
                    }`}>
                      {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`p-3.5 rounded-2xl text-sm font-body leading-relaxed border shadow-xs ${
                      isAssistant 
                        ? 'bg-white text-loom-ink border-loom-beige rounded-tl-none' 
                        : 'bg-loom-wood text-white border-loom-wood rounded-tr-none'
                    }`}>
                      {/* Preserving double spaces or markdown headings */}
                      <p className="whitespace-pre-line font-medium">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* Loader bubble */}
              {loading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-loom-wood text-loom-gold border border-loom-gold flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="p-3.5 bg-white text-loom-ink border border-loom-beige rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                    <span className="w-2 h-2 bg-loom-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-loom-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-loom-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-loom-ink-light font-heading pl-1">हमसफ़र सोच रहा है...</span>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Presets Grid Panel */}
            <div className="px-4 py-3 bg-loom-cream border-t border-loom-beige/50">
              <span className="text-[10px] font-heading font-bold text-loom-wood uppercase tracking-wider block mb-2 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-loom-gold" />
                सुझाए गए प्रश्न (Click to ask Humsafar):
              </span>
              <div className="flex sm:grid overflow-x-auto sm:grid-cols-2 gap-2 pb-1 sm:pb-0 scrollbar-thin">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(preset.query)}
                    className="text-left text-xs bg-white hover:bg-loom-sand/10 border border-loom-beige p-2.5 rounded-xl font-medium text-loom-wood shadow-2xs cursor-pointer hover:border-loom-gold hover:-translate-y-0.5 transition-all shrink-0 w-[160px] sm:w-auto truncate sm:whitespace-normal"
                    title={preset.query}
                  >
                    {preset.label} →
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-4 bg-white border-t-2 border-loom-beige flex gap-2.5 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="हमसफ़र से कुछ पूछें (उदा. योजनाएं)..."
                disabled={loading}
                className="flex-1 p-3.5 bg-loom-parchment/20 border border-loom-beige focus:border-loom-gold rounded-xl text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-loom-gold font-body"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3.5 bg-loom-wood text-white rounded-xl hover:bg-loom-wood-light transition-all shadow-md disabled:opacity-50 cursor-pointer"
                title="पूछें"
              >
                <Send className="w-4 h-4 text-loom-gold" />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};
