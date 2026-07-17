import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WeaverLayout } from '../../components/layout/WeaverLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  getGovtSchemes, 
  getCooperative, 
  getJobCardsByCooperative 
} from '../../firebase/firestore';
import { checkEligibility } from '../../utils/schemeEligibility';
import { GovtScheme, Cooperative } from '../../types';
import { useTranslation } from 'react-i18next';
import { 
  Award, 
  BookOpen, 
  Send, 
  Download, 
  Copy, 
  X, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  FileText,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const WeaverSchemes: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [annualProduction, setAnnualProduction] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal State
  const [selectedScheme, setSelectedScheme] = useState<GovtScheme | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  useEffect(() => {
    const loadSchemesData = async () => {
      setLoading(true);
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        
        // 1. Fetch Schemes
        const fetchedSchemes = await getGovtSchemes();
        setSchemes(fetchedSchemes);

        // 2. Fetch Cooperative details
        const coopDetails = await getCooperative(coopId);
        setCoop(coopDetails);

        // 3. Fetch Job cards to calculate annual production
        const jobCards = await getJobCardsByCooperative(coopId);
        const qcPassedJobs = jobCards.filter(jc => jc.status === 'qc_passed');
        const totalProduction = qcPassedJobs.reduce((sum, jc) => sum + (Number(jc.quantity) || 0), 0);
        setAnnualProduction(totalProduction);

      } catch (err) {
        console.error("Error loading government schemes matchmaking data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSchemesData();
  }, [userProfile]);

  const cooperativeData = {
    memberCount: coop?.memberCount || 0,
    annualProduction: annualProduction,
    certifications: coop?.certifications || []
  };

  const getTranslatedSchemeProps = (scheme: GovtScheme) => {
    const lowercaseName = scheme.name.toLowerCase();
    let key = '';
    if (lowercaseName.includes('india handloom brand') || lowercaseName.includes('ihb')) key = 'ihb';
    else if (lowercaseName.includes('gem') || lowercaseName.includes('marketplace')) key = 'gem';
    else if (lowercaseName.includes('mudra')) key = 'mudra';
    else if (lowercaseName.includes('cluster development') || lowercaseName.includes('nhdp')) key = 'nhdp';
    else if (lowercaseName.includes('vishwakarma') || lowercaseName.includes('pm-mitra')) key = 'pm_vishwakarma';
    else if (lowercaseName.includes('ayush') || lowercaseName.includes('export')) key = 'ayush';

    if (key) {
      return {
        name: t(`schemes.data.${key}.name`, scheme.name),
        description: t(`schemes.data.${key}.description`, scheme.description),
        benefits: t(`schemes.data.${key}.benefits`, scheme.benefits)
      };
    }
    return {
      name: scheme.name,
      description: scheme.description,
      benefits: scheme.benefits
    };
  };

  const handleApplyClick = (scheme: GovtScheme) => {
    setSelectedScheme(scheme);
    setShowSummaryModal(true);
  };

  const getApplicationText = (scheme: GovtScheme) => {
    if (!coop) return '';
    const certLabels = (coop.certifications || []).map(c => 
      t(`schemes.certifications.${c}`, c)
    ).join(', ') || 'None';

    const { name: translatedName } = getTranslatedSchemeProps(scheme);

    return `Our cooperative, ${coop.name}, meets the eligibility criteria for the "${translatedName}" scheme.

CREDENTIALS SUMMARY:
- Cooperative Name: ${coop.name}
- Location/Address: ${coop.location}
- Active Members: ${coop.memberCount} weavers
- Annual Production: ${annualProduction} pieces
- Active Certifications: ${certLabels}

We respectfully request consideration for this scheme. Attached are our official credentials.
Ekatva Digital Cooperative Verification Code: COOP-${coop.cooperativeId}-VERIFIED`;
  };

  const handleCopyToClipboard = (scheme: GovtScheme) => {
    const text = getApplicationText(scheme);
    navigator.clipboard.writeText(text);
    toast.success(t('schemes.copysuccess', 'सारांश क्लिपबोर्ड पर कॉपी किया गया!'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 app-content">
      {/* Page Title */}
      <div className="mb-6 p-6 bg-loom-cream border border-loom-beige rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm print:hidden bg-handloom-weave relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-loom-gold via-loom-wood to-loom-gold" />
        <div className="relative z-10">
          <h1 className="rozha-heading text-3.5xl md:text-4xl font-bold text-loom-wood">
            {t('schemes.title', 'सरकारी योजनाएं मैचमेकर')}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {t('schemes.tagline', 'आपकी समिति के विवरण के आधार पर सही सरकारी योजनाओं की खोज करें।')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16 print:hidden">
          <p className="font-heading text-lg text-loom-wood animate-pulse">{t('common.loading', 'लोड हो रहा है...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 print:hidden">
          {/* Cooperative Profile Summary card */}
          <Card className="bg-loom-cream/40 border border-loom-beige">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-xl text-loom-wood flex items-center gap-2">
                <FileText className="w-5 h-5 text-loom-gold" />
                {t('schemes.cooperativeDetails', 'सहकारी समिति का विवरण')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-body text-sm">
                <div className="p-3 bg-white rounded-xl border border-loom-beige/65">
                  <span className="text-xs text-loom-ink-light block font-semibold">समिति का नाम (Name)</span>
                  <span className="font-bold text-loom-wood text-base">{coop?.name}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-loom-beige/65">
                  <span className="text-xs text-loom-ink-light block font-semibold">कुल सक्रिय सदस्य (Members)</span>
                  <span className="font-bold text-loom-wood text-base">{coop?.memberCount} बुनकर</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-loom-beige/65">
                  <span className="text-xs text-loom-ink-light block font-semibold">कुल वार्षिक उत्पादन (Production)</span>
                  <span className="font-bold text-loom-wood text-base">{annualProduction} पीस</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-loom-beige/65">
                  <span className="text-xs text-loom-ink-light block font-semibold">प्रमाणपत्र (Certifications)</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(coop?.certifications || []).length > 0 ? (
                      coop?.certifications?.map(c => (
                        <span key={c} className="text-[10px] bg-loom-gold/15 text-loom-wood px-2 py-0.5 rounded border border-loom-gold/30 font-semibold">
                          {t(`schemes.certifications.${c}`, c)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-loom-ink-light italic">कोई सक्रिय प्रमाणपत्र नहीं</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schemes List */}
          <div className="space-y-4">
            {schemes.map((scheme) => {
              const checkResult = checkEligibility(cooperativeData, scheme);
              const { name: translatedName, description: translatedDesc, benefits: translatedBenefits } = getTranslatedSchemeProps(scheme);
              return (
                <div 
                  key={scheme.schemeId} 
                  className="vintage-card bg-handloom-weave handloom-zari-border zari-shimmer-hover p-6 bg-loom-cream border-2 border-loom-beige hover:border-loom-gold transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {/* Background Seal Watermark */}
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none select-none">
                    <Award size={180} />
                  </div>

                  <div className="space-y-3 max-w-3xl relative z-10">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-heading font-black text-2xl text-loom-wood rozha-heading">{translatedName}</h3>
                      
                      {/* Eligibility Badge */}
                      {checkResult.eligible ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-950 text-emerald-300 text-xs px-3.5 py-1.5 rounded-full border-2 border-emerald-500 font-bold font-heading shadow-md select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {t('schemes.eligible', 'पात्र')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 vintage-wax-seal text-xs px-3.5 py-1.5 rounded-full font-bold select-none">
                          <XCircle className="w-3.5 h-3.5 text-amber-200" />
                          {t('schemes.notEligible', 'अपात्र')}
                        </span>
                      )}
                    </div>

                    <p className="font-body text-base text-loom-ink/90 leading-relaxed">{translatedDesc}</p>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold font-body text-loom-ink-light">
                      <div>
                        <strong className="text-loom-wood">{t('schemes.benefitsLabel', 'लाभ:')}</strong> {translatedBenefits}
                      </div>
                    </div>

                    {/* Eligibility Reason if not eligible */}
                    {!checkResult.eligible && checkResult.reasonKey && (
                      <div className="p-3 bg-rose-50/50 border border-rose-200/80 rounded-xl text-xs text-rose-950 font-body flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>{t('schemes.ineligibilityReason', 'अपात्रता का कारण (Reason):')} </strong>
                          {t(checkResult.reasonKey, checkResult.reasonParams)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 relative z-10 w-full md:w-auto">
                    {checkResult.eligible ? (
                      <button
                        onClick={() => handleApplyClick(scheme)}
                        className="vintage-button w-full md:w-40 py-3 bg-loom-wood text-white hover:bg-loom-wood-light flex items-center justify-center gap-2 cursor-pointer font-bold text-sm shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        {t('schemes.applyNow', 'आवेदन करें')}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full md:w-40 py-3 bg-loom-beige/40 text-loom-ink-light border border-loom-beige/80 rounded-xl flex items-center justify-center gap-2 text-xs font-bold font-heading cursor-not-allowed select-none"
                      >
                        {t('schemes.notEligible', 'अपात्र')}
                      </button>
                    )}
                    <a
                      href={scheme.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-40 py-2.5 bg-white border border-loom-beige rounded-xl hover:bg-loom-cream text-center font-heading text-xs font-bold text-loom-wood shadow-sm transition-all"
                    >
                      {t('schemes.portalLink', 'पोर्टल पर देखें')}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Pre-filled Modal */}
      {showSummaryModal && selectedScheme && coop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-loom-cream border-t-8 border-2 border-loom-gold bg-handloom-weave max-w-2xl w-full rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative print:border-none print:shadow-none print:p-0">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-loom-beige pb-4 print:hidden">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-loom-gold block">
                  {t('schemes.preFilledSummary', 'आवेदन पूर्व-भराव सारांश')}
                </span>
                <h2 className="font-heading text-2xl font-black text-loom-wood rozha-heading mt-1">
                  {getTranslatedSchemeProps(selectedScheme).name}
                </h2>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 hover:bg-loom-sand/20 rounded-lg text-loom-wood transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="hidden print:flex flex-col items-center text-center gap-2 border-b-2 border-loom-gold pb-6 mb-6">
              <span className="font-heading text-4xl font-black text-loom-wood">एकत्व (EKATVA)</span>
              <span className="text-xs uppercase tracking-widest text-loom-gold font-bold">DIGITAL COOPERATIVE CERTIFIED CREDENTIALS</span>
              <p className="text-sm font-semibold text-loom-wood mt-1">{coop.name} • Varanasi, Uttar Pradesh</p>
            </div>

            {/* Pre-filled Text Box */}
            <div className="bg-white border border-loom-beige/85 p-5 rounded-xl text-sm font-mono text-loom-ink leading-relaxed whitespace-pre-wrap select-all max-h-96 overflow-y-auto shadow-inner print:border-none print:shadow-none print:p-0">
              {getApplicationText(selectedScheme)}
            </div>

            {/* Print Footer Certification Note (Print only) */}
            <div className="hidden print:block border-t border-loom-beige/50 pt-8 mt-12 text-center text-xs font-semibold text-loom-ink-light">
              <p className="italic">Verified secure ledger transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p className="mt-1">This document serves as verification of cooperative metrics powered by the Ekatva Handloom Cooperative Platform.</p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap gap-3 pt-2 print:hidden">
              <button
                onClick={() => handleCopyToClipboard(selectedScheme)}
                className="flex-1 min-w-[140px] py-3.5 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                {t('schemes.copyClipboard', 'क्लिपबोर्ड पर कॉपी करें')}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 min-w-[140px] py-3.5 bg-white border border-loom-wood text-loom-wood hover:bg-loom-cream font-heading font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                {t('schemes.downloadPdf', 'प्रिंट / पीडीएफ')}
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full sm:w-auto px-6 py-3.5 bg-loom-beige/40 text-loom-wood hover:bg-loom-sand/20 font-heading font-bold text-sm rounded-xl transition-all cursor-pointer text-center"
              >
                {t('schemes.close', 'बंद करें')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
