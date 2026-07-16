import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ProductInstance } from '../../types';
import { verifyHashChain } from '../../utils/hashUtils';
import { 
  Award, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Fingerprint,
  RotateCw,
  Cpu
} from 'lucide-react';
import { EkatvaLogo } from '../../components/EkatvaLogo';
import { useTranslation } from 'react-i18next';

export const TracePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { instanceId } = useParams<{ instanceId: string }>();
  const [instance, setInstance] = useState<ProductInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
    checked: boolean;
  }>({ verified: false, message: '', checked: false });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!instanceId) return;

    const fetchInstance = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'productInstances', instanceId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setInstance(snap.data() as ProductInstance);
        }
      } catch (err) {
        console.error('Error fetching product instance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstance();
  }, [instanceId]);

  const handleVerifyChain = () => {
    if (!instance || !instance.productionSteps) return;
    setVerifying(true);
    
    // Simulate slight lag for delightful cryptography calculation vibe
    setTimeout(() => {
      const isValid = verifyHashChain(instance.productionSteps);
      if (isValid) {
        setVerificationResult({
          verified: true,
          message: t('trace.cryptoChainSuccessMessage', 'क्रिप्टोग्राफिक श्रृंखला सत्यापित: अपरिवर्तनीय डेटा (Cryptographic Chain Verified: Immutable Data)'),
          checked: true
        });
      } else {
        setVerificationResult({
          verified: false,
          message: t('trace.cryptoChainErrorMessage', 'चेतावनी: श्रृंखला अखंडता टूटी हुई है (Warning: Hash chain integrity compromised)'),
          checked: true
        });
      }
      setVerifying(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-heading text-lg font-bold text-loom-wood animate-pulse">{t('trace.loadingCertificate', 'डिजिटल प्रमाणपत्र प्राप्त किया जा रहा है...')}</p>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center p-6 text-center">
        <div className="vintage-card p-8 max-w-md">
          <span className="text-6xl block mb-4">📜</span>
          <h1 className="font-heading text-2xl font-bold text-loom-wood mb-2">{t('trace.notFound', 'प्रमाणपत्र नहीं मिला')}</h1>
          <p className="font-body text-sm text-loom-ink/75 mb-6">
            {t('trace.notFoundDesc', 'क्षमा करें, यह उत्पाद ट्रैकिंग आईडी सिस्टम में दर्ज नहीं है। कृपया क्यूआर कोड फिर से स्कैन करें।')}
          </p>
          <a href="/" className="vintage-button inline-block px-6 py-2">
            {t('trace.goHome', 'मुख्य पृष्ठ पर जाएं')}
          </a>
        </div>
      </div>
    );
  }

  const wagePercent = instance.wagePercentage || Math.round((instance.wagePaid / instance.finalPrice) * 100);

  return (
    <div className="min-h-screen bg-[#faf6ee] text-loom-ink py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center text-center gap-2 pb-2">
          <div className="transform scale-90">
            <EkatvaLogo />
          </div>
          <span className="text-xs font-heading font-bold tracking-[0.2em] text-[#c8a45c] uppercase mt-1">
            {t('trace.brandingSlogan', 'सच्चाई • निष्पक्षता • आत्मनिर्भरता')}
          </span>
        </div>

        {/* Certificate Shell */}
        <div className="relative p-1 bg-[#fffbf4] rounded-3xl shadow-xl border-4 border-double border-[#d4af37]/60 overflow-hidden">
          <div className="p-6 sm:p-10 space-y-8 bg-[radial-gradient(#fdfbf7_1px,transparent_1px)] [background-size:16px_16px]">
            
            {/* Stamp / Decorative Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b-2 border-dashed border-loom-beige pb-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start text-emerald-800 font-bold text-sm tracking-wider">
                  <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Award className="h-4 w-4" />
                  </div>
                  {t('trace.authenticHandloom', 'सत्यापित हैंडलूम मूल प्रमाण (Verified Authentic Handloom)')}
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#5c3e21] tracking-tight mt-1">
                  {instance.productName}
                </h1>
                <p className="text-xs font-mono text-loom-ink/50 tracking-wider">
                  {t('trace.certificateId', 'प्रमाणपत्र आईडी: {{id}}', { id: instance.instanceId })}
                </p>
              </div>

              {/* Verified Badge */}
              <div className="flex flex-col items-center gap-1.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm text-center">
                <span className="text-xs font-heading font-extrabold text-emerald-850 uppercase tracking-wider block">
                  {t('trace.fairWageShare', 'निष्पक्ष वेतन हिस्सा')}
                </span>
                <span className="font-body text-4xl font-extrabold text-emerald-950 block">
                  {wagePercent}%
                </span>
                <span className="text-[10px] font-semibold text-emerald-800">
                  {t('trace.directWeaverPay', 'सीधा बुनकर को भुगतान')}
                </span>
              </div>
            </div>

            {/* Part 1: Ethical Pricing & Fair Wage Breakdown */}
            <div className="space-y-4">
              <h3 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-loom-gold" />
                {t('trace.ethicalEconomics', 'पारदर्शी वित्तीय विवरण (Transparent Ethical Economics)')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 bg-white border border-loom-beige rounded-2xl flex flex-col justify-center">
                  <span className="text-xs font-heading font-semibold text-loom-ink/60">{t('trace.weaverWages', 'बुनकर की शुद्ध कमाई (Weaver Wages)')}</span>
                  <p className="font-body text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-1">
                    ₹{instance.wagePaid.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}
                  </p>
                  <p className="text-[10px] text-loom-ink/50 mt-1 leading-normal font-body">
                    {t('trace.weaverWagesDesc', 'सिलाई और मेहनत का मूल्य, सीधे कारीगर को हस्तांतरित।')}
                  </p>
                </div>

                <div className="p-4 bg-white border border-loom-beige rounded-2xl flex flex-col justify-center">
                  <span className="text-xs font-heading font-semibold text-loom-ink/60">{t('trace.retailPrice', 'खुदरा विक्रय मूल्य (Retail Price)')}</span>
                  <p className="font-body text-2xl font-bold text-loom-wood mt-1 flex items-center gap-1">
                    ₹{instance.finalPrice.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}
                  </p>
                  <p className="text-[10px] text-loom-ink/50 mt-1 leading-normal font-body">
                    {t('trace.retailPriceDesc', 'इस उत्पाद का सहकारी मंच पर अंतिम सूचीबद्ध खुदरा मूल्य।')}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl flex flex-col justify-center">
                  <span className="text-xs font-heading font-semibold text-emerald-850">{t('trace.wageRatio', 'नैतिक वेतन अनुपात (Wage Ratio)')}</span>
                  <p className="font-body text-2xl font-bold text-[#854d0e] mt-1">
                    {wagePercent}%
                  </p>
                  <p className="text-[10px] text-emerald-800/80 mt-1 leading-normal font-body font-medium">
                    {t('trace.wageRatioDesc', 'इस खरीद का {{wagePercent}}% हिस्सा सीधा कारीगर बुनकर के खाते में गया है।', { wagePercent })}
                  </p>
                </div>

              </div>

              {/* Progress visual bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-heading font-bold text-loom-wood">
                  <span>{t('trace.weaverShare', 'बुनकर हिस्सा ({{percent}}%)', { percent: wagePercent })}</span>
                  <span>{t('trace.cooperativeShare', 'सहकारी संचालन / धागा लागत ({{percent}}%)', { percent: 100 - wagePercent })}</span>
                </div>
                <div className="h-4 w-full bg-amber-100/60 rounded-full border border-amber-200 overflow-hidden flex shadow-inner">
                  <div 
                    style={{ width: `${wagePercent}%` }} 
                    className="h-full bg-emerald-600 transition-all duration-500 relative"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem] animate-pulse" />
                  </div>
                  <div className="h-full bg-amber-500/30 flex-1" />
                </div>
                <p className="text-[10.5px] font-body text-center text-loom-ink/60 leading-relaxed pt-1 max-w-2xl mx-auto">
                  {t('trace.ekatvaModelExplanation', '* एकत्व मॉडल यह सुनिश्चित करता है कि मध्यस्थ कमीशन समाप्त हो, जिससे बाजार के सामान्य 10-15% कारीगर पारिश्रमिक के मुकाबले एकत्व बुनकरों को 2 से 3 गुना अधिक आय मिलती है।')}
                </p>
              </div>
            </div>

            {/* Part 2: Weaver Profile Connections */}
            <div className="p-5 sm:p-6 bg-[#fdf8ee] rounded-2xl border border-loom-beige/80 flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-loom-gold overflow-hidden bg-white shrink-0 shadow">
                {instance.weaverPhotoURL ? (
                  <img 
                    src={instance.weaverPhotoURL} 
                    alt={instance.weaverName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f3efe4] text-loom-wood flex items-center justify-center font-heading text-2xl font-bold">
                    {instance.weaverName.slice(0, 1)}
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left space-y-1 flex-1">
                <span className="text-[10px] font-heading font-extrabold text-loom-gold uppercase tracking-wider">
                  {t('trace.meetTheArtisan', 'कारीगर बुनकर की कहानी (MEET THE ARTISAN)')}
                </span>
                <h4 className="font-heading text-lg font-bold text-loom-wood">
                  {instance.weaverName}
                </h4>
                <p className="text-xs text-loom-ink/80 leading-relaxed font-body">
                  {t('trace.artisanStoryText', 'वाराणसी सहकारी समिति के सम्मानित सदस्य। आपकी इस खरीद से {{name}} के घर की आर्थिक समृद्धि सुनिश्चित होती है तथा हमारी पारंपरिक बनारसी बुनाई कला जीवित रहती है।', { name: instance.weaverName })}
                </p>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start text-[11px] font-medium text-loom-ink/50 pt-1">
                  <MapPin className="h-3 w-3 text-loom-gold" />
                  <span>{t('trace.artisanLocation', 'वाराणसी हाथकरघा संकुल, उत्तर प्रदेश')}</span>
                </div>
              </div>
            </div>

            {/* Part 3: Real-Time Hash Chain / Blockchain Timeline */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-loom-beige/50 pt-6">
                <h3 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-loom-gold" />
                  {t('trace.immutableLedger', 'अपरिवर्तनीय डिजिटल पदचिह्न (Immutable Ledger History)')}
                </h3>

                <button
                  onClick={handleVerifyChain}
                  disabled={verifying}
                  className="px-4 py-2 bg-[#854d0e] hover:bg-[#713f12] text-white text-xs font-heading font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-80"
                >
                  {verifying ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cpu className="w-3.5 h-3.5" />
                  )}
                  {verifying ? t('trace.verifyingCrypto', 'क्रिप्टोग्राफी जांच...') : t('trace.verifyChain', 'चेन सत्यापित करें')}
                </button>
              </div>

              {/* Cryptographic checkmark result */}
              {verificationResult.checked && (
                <div className={`p-4 rounded-xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  verificationResult.verified 
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-850' 
                    : 'bg-red-50/80 border-red-300 text-red-850'
                }`}>
                  <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${
                    verificationResult.verified ? 'text-emerald-600' : 'text-red-600'
                  }`} />
                  <div>
                    <span className="font-heading font-bold block">
                      {verificationResult.verified ? t('trace.verificationSuccess', 'सत्यापन सफल!') : t('trace.verificationError', 'त्रुटि मिली!')}
                    </span>
                    <span className="text-xs font-body leading-relaxed block mt-0.5">
                      {verificationResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Timeline Steps with Hashes */}
              <div className="relative pl-6 border-l-2 border-loom-beige space-y-6 ml-3 py-1">
                {instance.productionSteps?.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Bullet */}
                    <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full border-2 border-loom-gold bg-white z-10 flex items-center justify-center shadow-sm" />
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="font-heading font-bold text-loom-wood text-sm sm:text-base">
                          {step.step}
                        </h4>
                        <span className="text-[10px] font-body text-loom-ink/50">
                          {new Date(step.timestamp).toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'), {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-loom-ink/75 font-body leading-relaxed">
                        {step.details}
                      </p>

                      <div className="bg-[#f9f5eb]/50 p-2 rounded border border-loom-beige/40 font-mono text-[9px] text-loom-ink/40 flex items-start gap-1">
                        <span className="font-bold shrink-0">HASH:</span>
                        <span className="break-all">{step.hash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Home Link */}
        <div className="text-center">
          <Link 
            to="/" 
            className="font-heading font-bold text-sm text-[#854d0e] hover:text-[#713f12] transition-colors flex items-center justify-center gap-1"
          >
            {t('trace.returnToPortal', 'एकत्व मुख्य पोर्टल पर लौटें')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
