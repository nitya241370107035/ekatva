import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getWeaverProfile } from '../../firebase/firestore';
import { WeaverProfile } from '../../types';
import { Button } from '../../components/ui/Button';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Hammer, 
  Building2, 
  MapPin, 
  Eye, 
  EyeOff, 
  IdCard, 
  Printer, 
  X,
  CreditCard
} from 'lucide-react';
import QRCode from 'react-qr-code';

export const WeaverProfilePage: React.FC = () => {
  const { weaverId } = useParams<{ weaverId: string }>();
  const navigate = useNavigate();
  const [weaver, setWeaver] = useState<WeaverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!weaverId) return;
      try {
        const data = await getWeaverProfile(weaverId);
        setWeaver(data);
      } catch (err) {
        console.error("Error loading weaver profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [weaverId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <SecretaryLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-heading text-2xl text-loom-wood animate-pulse">प्रोफ़ाइल लोड हो रही है...</p>
        </div>
      </SecretaryLayout>
    );
  }

  if (!weaver) {
    return (
      <SecretaryLayout>
        <div className="p-8 text-center vintage-card">
          <X className="w-16 h-16 text-loom-error mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-loom-wood">बुनकर प्रोफ़ाइल नहीं मिली</h2>
          <button 
            onClick={() => navigate('/secretary/members')} 
            className="mt-4 inline-flex items-center gap-2 font-heading font-bold text-loom-wood underline"
          >
            <ArrowLeft className="w-4 h-4" /> सदस्य सूची में वापस जाएं
          </button>
        </div>
      </SecretaryLayout>
    );
  }

  return (
    <SecretaryLayout>
      {/* Header with back button */}
      <div className="mb-6 print:hidden">
        <button
          onClick={() => navigate('/secretary/members')}
          className="inline-flex items-center gap-2 text-loom-wood hover:text-loom-gold font-heading font-bold text-base mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> सदस्य पंजी में वापस जाएं (Back to Registry)
        </button>
        <h1 className="font-heading text-3xl font-bold text-loom-wood">
          बुनकर विस्तृत प्रोफ़ाइल (Weaver Detailed Profile)
        </h1>
      </div>

      {/* Main Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Left Column: Avatar and Quick stats */}
        <div className="vintage-card p-6 bg-loom-cream flex flex-col items-center text-center border-t-4 border-t-loom-wood shadow-md">
          {/* Avatar Container */}
          <div className="w-32 h-32 rounded-full border-4 border-loom-gold bg-loom-sand/20 flex items-center justify-center text-loom-wood mb-4 relative overflow-hidden bg-loom-pattern">
            {weaver.photoURL ? (
              <img src={weaver.photoURL} alt={weaver.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-16 h-16" />
            )}
          </div>

          <h2 className="font-heading text-2xl font-bold text-loom-wood mb-1">{weaver.displayName}</h2>
          <span className="bg-loom-gold/25 text-loom-wood text-xs font-bold font-heading tracking-wider px-3 py-1 rounded-full border border-loom-gold/40 mb-4">
            🧶 बुनकर सदस्य (Weaver)
          </span>

          <div className="w-full border-t border-loom-beige/30 pt-4 mt-2 space-y-3.5 text-left font-body text-base">
            <div className="flex items-center gap-2.5 text-loom-ink">
              <Phone className="w-4 h-4 text-loom-gold shrink-0" />
              <span>{weaver.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-loom-ink">
              <Mail className="w-4 h-4 text-loom-gold shrink-0" />
              <span className="truncate">{weaver.aadharNumber ? `आधार: XXXX-XXXX-${weaver.aadharNumber.substring(8)}` : 'ईमेल: उपलब्ध नहीं'}</span>
            </div>
          </div>

          {/* Generate ID Card Button */}
          <Button
            type="button"
            onClick={() => setShowIdCard(true)}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-loom-gold text-loom-ink border border-loom-wood font-heading font-bold"
          >
            <IdCard className="w-5 h-5" />
            डिजिटल परिचय पत्र (Digital ID Card)
          </Button>
        </div>

        {/* Right Column: Experience, Bank & Postal address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work details card */}
          <div className="vintage-card p-6 bg-loom-cream border-l-8 border-l-loom-wood shadow-sm">
            <h3 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/30 pb-3 mb-4">
              <Award className="w-5 h-5 text-loom-gold" />
              कार्य एवं बुनाई क्षमता (Work & Capacity)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-body">
              <div className="p-4 bg-white rounded-xl border border-loom-beige/40">
                <span className="text-xs text-loom-ink-light font-bold block mb-1">कुल अनुभव (Experience)</span>
                <span className="font-heading text-2xl font-bold text-loom-wood">{weaver.experience} वर्ष</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-loom-beige/40">
                <span className="text-xs text-loom-ink-light font-bold block mb-1">करघों की संख्या (Looms)</span>
                <span className="font-heading text-2xl font-bold text-loom-wood">{weaver.numberOfLooms} करघे</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-loom-beige/40">
                <span className="text-xs text-loom-ink-light font-bold block mb-1">दैनिक क्षमता (Daily Capacity)</span>
                <span className="font-heading text-2xl font-bold text-loom-wood">{weaver.dailyCapacity} थान/दिन</span>
              </div>
            </div>

            {/* Skill tags */}
            <div className="mt-6">
              <span className="text-sm font-bold text-loom-ink-light block mb-2 font-heading">बुनाई शैलियाँ (Specializations)</span>
              <div className="flex flex-wrap gap-2">
                {weaver.skillTags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-loom-wood text-white px-4 py-1.5 rounded-full font-heading text-sm font-bold tracking-wide shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Postal Address card */}
          <div className="vintage-card p-6 bg-loom-cream border-l-8 border-l-loom-gold shadow-sm">
            <h3 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/30 pb-3 mb-4">
              <MapPin className="w-5 h-5 text-loom-gold" />
              पता विवरणी (Postal Address)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-base">
              <div>
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">ग्राम / गली / वार्ड</span>
                <span className="text-loom-ink font-semibold">{weaver.address?.street}</span>
              </div>
              <div>
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">शहर / जिला (City)</span>
                <span className="text-loom-ink font-semibold">{weaver.address?.city}</span>
              </div>
              <div className="mt-3">
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">राज्य (State)</span>
                <span className="text-loom-ink font-semibold">{weaver.address?.state}</span>
              </div>
              <div className="mt-3">
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">पिनकोड (Pincode)</span>
                <span className="text-loom-ink font-mono font-bold tracking-wider">{weaver.address?.pincode}</span>
              </div>
            </div>
          </div>

          {/* Bank Account card with secure toggle */}
          <div className="vintage-card p-6 bg-loom-cream border-l-8 border-l-emerald-700 shadow-sm">
            <div className="flex items-center justify-between border-b border-loom-beige/30 pb-3 mb-4">
              <h3 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                बैंक विवरण (Bank Credentials)
              </h3>
              <button
                type="button"
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="flex items-center gap-1.5 font-heading text-xs font-bold text-loom-wood hover:text-loom-gold cursor-pointer"
              >
                {showBankDetails ? (
                  <>
                    <EyeOff className="w-4 h-4 text-loom-wood" /> विवरण छिपाएं (Hide)
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-loom-wood" /> विवरण दिखाएं (Show)
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body text-base">
              <div>
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">बैंक का नाम (Bank Name)</span>
                <span className="text-loom-ink font-semibold">{weaver.bankAccount?.bankName}</span>
              </div>
              <div>
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">खाता संख्या (Account Number)</span>
                <span className="text-loom-ink font-mono font-bold">
                  {showBankDetails ? weaver.bankAccount?.accountNumber : `XXXX-XXXX-${weaver.bankAccount?.accountNumber?.slice(-4) || 'XXXX'}`}
                </span>
              </div>
              <div>
                <span className="text-xs text-loom-ink-light font-bold block mb-0.5">आईएफएससी कोड (IFSC Code)</span>
                <span className="text-loom-ink font-mono font-bold">
                  {showBankDetails ? weaver.bankAccount?.ifsc : weaver.bankAccount?.ifsc?.substring(0, 4) + 'XXXXXXX'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive ID Card Drawer / Dialog Modal */}
      {showIdCard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:relative print:inset-auto">
          <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-md w-full relative border-2 border-loom-gold shadow-2xl print:shadow-none print:border-0 print:p-0">
            {/* Close Button - hidden in print */}
            <button
              onClick={() => setShowIdCard(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer print:hidden"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-heading text-2xl font-bold text-loom-wood text-center mb-6 print:hidden">
              बुनकर डिजिटल पहचान पत्र
            </h2>

            {/* Printable ID Card Body */}
            <div id="weaver-printable-id-card" className="border-4 border-double border-loom-gold p-6 bg-loom-cream text-loom-ink rounded-xl font-body relative overflow-hidden bg-loom-pattern print:border-4 print:border-black print:rounded-none">
              
              {/* Header */}
              <div className="text-center border-b border-loom-gold/40 pb-3 mb-4 print:border-black">
                <h3 className="font-heading text-xl font-extrabold text-loom-wood uppercase tracking-wide print:text-black">बुनकर सहकारी समिति</h3>
                <p className="text-[10px] text-loom-gold font-bold tracking-widest print:text-black">एकत्व डिजिटल सहकारी पहचान पत्र</p>
              </div>

              {/* Grid content */}
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                {/* Photo */}
                <div className="w-24 h-24 rounded-lg border-2 border-loom-gold bg-loom-sand/20 flex items-center justify-center text-loom-wood overflow-hidden print:border-black">
                  {weaver.photoURL ? (
                    <img src={weaver.photoURL} alt={weaver.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-12 h-12" />
                  )}
                </div>

                {/* Info List */}
                <div className="flex-1 space-y-2 text-center sm:text-left text-sm">
                  <div>
                    <span className="text-[9px] text-loom-ink-light font-bold block uppercase print:text-black">नाम (Name)</span>
                    <span className="font-heading text-lg font-black text-loom-wood print:text-black">{weaver.displayName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-loom-ink-light font-bold block uppercase print:text-black">सदस्य संख्या (ID)</span>
                    <span className="font-mono text-xs font-semibold">{weaver.weaverId?.substring(0, 12)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-loom-ink-light font-bold block uppercase print:text-black">फ़ोन (Phone)</span>
                    <span className="font-mono font-bold text-xs">{weaver.phone}</span>
                  </div>
                </div>
              </div>

              {/* QR and skills footer */}
              <div className="mt-5 pt-3 border-t border-loom-gold/40 flex items-center justify-between gap-4 print:border-black">
                <div className="space-y-1.5 flex-1">
                  <div>
                    <span className="text-[8px] text-loom-ink-light font-bold block print:text-black">अनुभव (Experience)</span>
                    <span className="text-xs font-bold text-loom-wood print:text-black">{weaver.experience} वर्ष</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-loom-ink-light font-bold block print:text-black">बुनाई कौशल (Skills)</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {weaver.skillTags?.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="bg-loom-gold/20 text-loom-wood px-1.5 py-0.5 rounded text-[9px] font-heading font-black border border-loom-gold/30 print:border-black print:text-black">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white p-1.5 rounded-lg border border-loom-gold/30 flex items-center justify-center shrink-0 print:border-black">
                  <QRCode 
                    value={weaver.weaverId} 
                    size={75} 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                  />
                </div>
              </div>

            </div>

            {/* Actions Panel - hidden in print */}
            <div className="mt-6 flex gap-4 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIdCard(false)}
                className="flex-1 font-heading font-bold"
              >
                बंद करें (Close)
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 font-heading font-bold bg-loom-wood text-white hover:bg-loom-wood-light"
              >
                <Printer className="w-5 h-5" />
                प्रिंट करें (Print)
              </Button>
            </div>

          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
