import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getAllBuyerRFQs, 
  getCoalitionsByRFQ, 
  addOrUpdateCooperativeQuotaInCoalition,
  submitCoalitionQuote,
  getCoalitionById
} from '../../firebase/firestore';
import { calculateCooperativeCapacity } from '../../utils/capacityEngine';
import { BuyerRFQ, Coalition, CooperativeQuota } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  Sparkles, 
  Clock, 
  PlusCircle, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Send,
  X,
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RFQOpportunities: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [rfqs, setRfqs] = useState<BuyerRFQ[]>([]);
  const [coalitions, setCoalitions] = useState<Record<string, Coalition>>({});
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal state for joining coalition
  const [selectedRFQ, setSelectedRFQ] = useState<BuyerRFQ | null>(null);
  const [committedQty, setCommittedQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [modalError, setModalError] = useState('');
  const [submittingQuota, setSubmittingQuota] = useState(false);
  
  // Selected Coalition details modal for viewing
  const [activeCoalition, setActiveCoalition] = useState<Coalition | null>(null);

  const cooperativeId = userProfile?.cooperativeId || 'coop1';
  const cooperativeName = userProfile?.displayName || t('rfqOpportunities.defaultCoopName', 'काशी हथकरघा सहकारी समिति');

  const fetchData = async () => {
    try {
      setLoading(true);
      const allRFQs = await getAllBuyerRFQs();
      setRfqs(allRFQs);
      
      const coalitionMap: Record<string, Coalition> = {};
      const capacityMap: Record<string, number> = {};
      
      for (const rfq of allRFQs) {
        // Fetch active coalition if any
        const cols = await getCoalitionsByRFQ(rfq.rfqId);
        if (cols && cols.length > 0) {
          coalitionMap[rfq.rfqId] = cols[0]; // Take the first coalition associated
        }
        
        // Calculate estimated capacity for this RFQ's deadline
        const estCap = await calculateCooperativeCapacity(cooperativeId, rfq.deadline);
        capacityMap[rfq.rfqId] = estCap;
      }
      
      setCoalitions(coalitionMap);
      setCapacities(capacityMap);
    } catch (err) {
      console.error("Error loading RFQ opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cooperativeId]);

  const handleOpenJoinModal = (rfq: BuyerRFQ) => {
    const defaultCommit = Math.min(capacities[rfq.rfqId] || 0, rfq.requiredQuantity);
    setSelectedRFQ(rfq);
    setCommittedQty(defaultCommit.toString());
    setUnitPrice(rfq.maxBudgetPerUnit ? rfq.maxBudgetPerUnit.toString() : '');
    setModalError('');
  };

  const handleJoinCoalition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRFQ) return;

    const qty = Number(committedQty);
    const price = Number(unitPrice);

    if (isNaN(qty) || qty <= 0) {
      setModalError(t('rfqOpportunities.invalidQty', 'कृपया मान्य मात्रा दर्ज करें (Please enter a valid quantity)'));
      return;
    }

    if (isNaN(price) || price <= 0) {
      setModalError(t('rfqOpportunities.invalidPrice', 'कृपया मान्य मूल्य दर्ज करें (Please enter a valid price)'));
      return;
    }

    const availableCapacity = capacities[selectedRFQ.rfqId] || 0;
    if (qty > availableCapacity) {
      setModalError(t('rfqOpportunities.capacityLimitExceeded', 'क्षमता सीमा पार! आपकी उपलब्ध क्षमता केवल {{capacity}} यूनिट है।', { capacity: availableCapacity }));
      return;
    }

    setSubmittingQuota(true);
    setModalError('');

    try {
      const quota: CooperativeQuota = {
        cooperativeId,
        cooperativeName,
        allocatedQuantity: qty,
        unitPrice: price
      };

      await addOrUpdateCooperativeQuotaInCoalition(selectedRFQ.rfqId, quota);
      
      // Reset & close
      setSelectedRFQ(null);
      fetchData();
    } catch (err) {
      console.error("Error joining coalition:", err);
      setModalError(t('rfqOpportunities.joinFailed', 'गठबंधन में शामिल होने में विफल। कृपया पुनः प्रयास करें।'));
    } finally {
      setSubmittingQuota(false);
    }
  };

  const handleSubmitQuote = async (coalitionId: string) => {
    if (window.confirm(t('rfqOpportunities.confirmQuoteSubmit', 'क्या आप खरीदार को यह एकीकृत कोटेशन भेजना चाहते हैं? (Send quotation to buyer?)'))) {
      try {
        await submitCoalitionQuote(coalitionId);
        alert(t('rfqOpportunities.quoteSubmitSuccess', 'कोटेशन खरीदार को सफलतापूर्वक भेज दिया गया है!'));
        fetchData();
      } catch (err) {
        console.error("Error submitting quote:", err);
        alert(t('rfqOpportunities.quoteSubmitError', 'कोटेशन भेजने में असमर्थ।'));
      }
    }
  };

  const getStatusText = (status: BuyerRFQ['status']) => {
    switch (status) {
      case 'open':
        return t('rfqOpportunities.statusOpen', 'खुला अवसर (Open RFQ)');
      case 'coalition_formed':
        return t('rfqOpportunities.statusFormed', 'गठबंधन बन रहा है (Forming Coalition)');
      case 'quote_submitted':
        return t('rfqOpportunities.statusSubmitted', 'कोटेशन प्रेषित (Quote Submitted)');
      case 'accepted':
        return t('rfqOpportunities.statusAccepted', 'स्वीकृत (Accepted!)');
      case 'declined':
        return t('rfqOpportunities.statusDeclined', 'अस्वीकृत (Declined)');
      default:
        return status;
    }
  };

  const getUrgencyColor = (deadlineStr: string) => {
    const days = Math.ceil((new Date(deadlineStr).getTime() - new Date().getTime()) / (1000 * 300 * 12 * 24));
    if (days <= 3) return 'border-red-500 bg-red-50/50';
    if (days <= 7) return 'border-amber-500 bg-amber-50/50';
    return 'border-loom-beige bg-white/65';
  };

  return (
    <SecretaryLayout>
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-loom-gold animate-pulse" />
          {t('rfqOpportunities.title', 'बाज़ार के अवसर एवं गठबंधन इंजन (Coalition & RFQ Board)')}
        </h1>
        <p className="font-body text-base text-loom-ink-light mt-1">
          {t('rfqOpportunities.subtitle', 'थोक खरीदारों (RFQs) से जुड़े और मांग पूरा करने के लिए अन्य हथकरघा सहकारी समितियों के साथ मिलकर गठबंधन बनाएं।')}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">{t('rfqOpportunities.loading', 'बाज़ार के अवसर लोड हो रहे हैं...')}</p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <FileText className="w-16 h-16 text-loom-gold/50 mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">{t('rfqOpportunities.noRfqsTitle', 'कोई सक्रिय आरएफक्यू (RFQ) नहीं है')}</h3>
          <p className="font-body text-loom-ink-light max-w-md mx-auto">
            {t('rfqOpportunities.noRfqsDesc', 'वर्तमान में बाज़ार में कोई सक्रिय थोक मांग उपलब्ध नहीं है। खरीदार द्वारा आरएफक्यू जमा करते ही यहाँ प्रदर्शित होगा।')}
          </p>
        </div>
      ) : (
        /* RFQ Cards Grid styled like historical scrolls */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {rfqs.map((rfq) => {
            const coalition = coalitions[rfq.rfqId];
            const capacity = capacities[rfq.rfqId] || 0;
            const isParticipating = coalition?.cooperativeQuotas.some(q => q.cooperativeId === cooperativeId);
            const myQuota = coalition?.cooperativeQuotas.find(q => q.cooperativeId === cooperativeId);
            
            // Calculate remaining pieces needed
            const committedTotal = coalition?.totalQuantity || 0;
            const remainingNeeded = Math.max(0, rfq.requiredQuantity - committedTotal);

            return (
              <Card 
                key={rfq.rfqId} 
                className={`relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl border-l-8 p-6 vintage-card ${getUrgencyColor(rfq.deadline)}`}
              >
                {/* Red Wax Seal for open high-value / urgent RFQs */}
                {rfq.status === 'open' && (
                  <div className="absolute -top-3 -right-3 w-16 h-16 bg-red-700 rounded-full border-4 border-amber-500 flex items-center justify-center shadow-lg rotate-12" title={t('rfqOpportunities.openDemandTooltip', 'खुला और सक्रिय मांग')}>
                    <span className="text-[9px] font-bold text-white tracking-widest text-center leading-none uppercase">EKATVA<br />SEAL</span>
                  </div>
                )}

                <div>
                  {/* RFQ Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-loom-gold uppercase tracking-wider bg-loom-wood px-2.5 py-1 rounded-full border border-loom-gold">
                        {t('rfqOpportunities.buyerLabel', 'मागकर्ता: {{name}}', { name: rfq.buyerName })}
                      </span>
                      <h3 className="font-heading text-2xl font-black text-loom-wood mt-2.5 leading-tight">
                        {t('rfqOpportunities.demandQuantity', '{{quantity}} हस्तनिर्मित वस्त्रों की मांग', { quantity: rfq.requiredQuantity })}
                      </h3>
                    </div>
                  </div>

                  {/* Body Scroll content */}
                  <div className="border-y border-loom-beige/50 py-3.5 my-3.5 space-y-3 font-body text-sm text-loom-ink">
                    <p className="italic text-base bg-loom-parchment/70 p-3 rounded-lg border-l-4 border-loom-gold leading-relaxed">
                      "{rfq.productDescription}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-loom-ink-light">
                        <Clock className="w-4 h-4 text-loom-gold" />
                        {t('rfqOpportunities.deadlineLabel', 'अंतिम तिथि: {{date}}', { date: new Date(rfq.deadline).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'), { year: 'numeric', month: 'long', day: 'numeric' }) })}
                      </div>
                      <div className="flex items-center gap-1.5 text-loom-ink-light">
                        <TrendingUp className="w-4 h-4 text-loom-gold" />
                        {t('rfqOpportunities.budgetLabel', 'बजट सीमा: {{budget}}', { budget: rfq.maxBudgetPerUnit ? `₹${rfq.maxBudgetPerUnit}/${t('rfqOpportunities.pieceUnit', 'पीस')}` : t('rfqOpportunities.negotiable', 'वार्तालाप योग्य') })}
                      </div>
                    </div>
                  </div>

                  {/* Coalition Capacity Engine Section */}
                  <div className="bg-loom-cream/80 border border-loom-beige rounded-xl p-4 space-y-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-loom-wood border-b border-loom-beige/60 pb-1.5">
                      <TrendingUp className="w-4 h-4 text-loom-gold" />
                      {t('rfqOpportunities.coalitionCapabilityAnalysis', 'गठबंधन क्षमता विश्लेषण (Coalition Capability):')}
                    </div>
                    
                    <div className="flex justify-between text-xs text-loom-ink-light">
                      <span>{t('rfqOpportunities.availableCapacity', 'आपकी समिति की उपलब्ध क्षमता:')}</span>
                      <span className="font-bold text-loom-wood bg-loom-gold/20 px-2 py-0.5 rounded">
                        {t('rfqOpportunities.capacityUnits', '{{capacity}} यूनिट्स (दिनांक तक)', { capacity })}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-loom-ink-light">
                      <span>{t('rfqOpportunities.committedTotal', 'कुल प्रतिबद्ध मात्रा (Allotted so far):')}</span>
                      <span className="font-bold text-loom-wood">
                        {t('rfqOpportunities.committedProgress', '{{committed}} / {{required}} पीस', { committed: committedTotal, required: rfq.requiredQuantity })}
                      </span>
                    </div>

                    {/* Progress Bar of Coalition completion */}
                    <div className="w-full bg-loom-beige/40 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-loom-wood h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (committedTotal / rfq.requiredQuantity) * 100)}%` }}
                      />
                    </div>

                    {/* Participating cooperative names list */}
                    {coalition && coalition.cooperativeQuotas.length > 0 && (
                      <div className="pt-1.5 text-xs space-y-1">
                        <div className="font-bold text-loom-wood/95">{t('rfqOpportunities.participatingCooperatives', 'सहभागी समितियां:')}</div>
                        <div className="grid grid-cols-1 gap-1">
                          {coalition.cooperativeQuotas.map((q, i) => (
                            <div key={i} className="flex justify-between items-center bg-white/70 px-2.5 py-1 rounded border border-loom-beige text-[11px]">
                              <span className="flex items-center gap-1 font-medium">
                                <Building className="w-3.5 h-3.5 text-loom-gold" />
                                {q.cooperativeName} {q.cooperativeId === cooperativeId && `(${t('rfqOpportunities.you', 'आप')})`}
                              </span>
                              <span className="font-bold text-loom-wood">
                                {t('rfqOpportunities.piecesCount', '{{count}} पीस', { count: q.allocatedQuantity })} @ ₹{q.unitPrice.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer State & Dynamic Action Buttons */}
                <div className="pt-4 border-t border-loom-beige/30 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-loom-ink-light uppercase font-bold">{t('rfqOpportunities.statusLabel', 'स्थिति (Status)')}</span>
                    <span className="text-xs font-bold text-loom-wood flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-loom-gold" />
                      {getStatusText(rfq.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Coalition detail Treaty Document viewer */}
                    {coalition && (
                      <Button
                        type="button"
                        onClick={() => setActiveCoalition(coalition)}
                        className="px-4 py-2 bg-loom-beige/20 border border-loom-beige hover:bg-loom-sand/15 text-loom-wood rounded-xl font-heading font-bold text-xs cursor-pointer transition-colors"
                      >
                        {t('rfqOpportunities.viewTreaty', 'अनुबंध देखें (View Treaty)')}
                      </Button>
                    )}

                    {/* Join Coalition Button */}
                    {(rfq.status === 'open' || rfq.status === 'coalition_formed') && (
                      <Button
                        type="button"
                        onClick={() => handleOpenJoinModal(rfq)}
                        disabled={capacity <= 0 || remainingNeeded <= 0}
                        className={`px-4 py-2 rounded-xl font-heading font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5 transition-all ${
                          isParticipating
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-loom-wood hover:bg-loom-wood-light text-white'
                        }`}
                      >
                        <Users className="w-4 h-4 text-loom-gold" />
                        {isParticipating ? t('rfqOpportunities.changeCommitment', 'प्रतिबद्धता बदलें') : t('rfqOpportunities.joinCoalition', 'गठबंधन में जुड़ें (Join)')}
                      </Button>
                    )}

                    {/* Submit Quote to Buyer Button (only if coalition is active & forming, and we have committed quotas) */}
                    {coalition && coalition.status === 'forming' && coalition.cooperativeQuotas.length > 0 && (
                      <Button
                        type="button"
                        onClick={() => handleSubmitQuote(coalition.coalitionId)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-heading font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {t('rfqOpportunities.submitToBuyer', 'खरीदार को प्रेषित करें')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Coalition Modal */}
      {selectedRFQ && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col">
            <div className="p-5 border-b border-loom-beige bg-loom-wood text-loom-cream rounded-t-lg bg-loom-pattern relative">
              <div className="absolute inset-0 bg-loom-wood/95 z-0 rounded-t-lg" />
              <div className="relative z-10">
                <h3 className="font-heading text-xl font-bold flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-loom-gold" />
                  {t('rfqOpportunities.joinModalTitle', 'सहकारी गठबंधन में शामिल हों')}
                </h3>
                <p className="text-xs text-loom-gold/90 mt-1">
                  {t('rfqOpportunities.joinModalSubtitle', 'थोक मांग को सामूहिक रूप से पूरा करने के लिए अपनी उत्पादन मात्राcommitted करें।')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRFQ(null)}
                className="absolute right-4 top-4 text-loom-cream/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinCoalition} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-loom-error/10 border border-loom-error text-loom-error p-3 rounded-xl text-xs font-semibold">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="bg-loom-parchment border border-loom-beige rounded-xl p-3 text-xs space-y-1 text-loom-ink-light">
                <div className="font-bold text-loom-wood">{t('rfqOpportunities.rfqDetails', 'आरएफक्यू विवरण:')}</div>
                <p className="italic">"{selectedRFQ.productDescription}"</p>
                <div className="flex justify-between font-bold pt-1.5 border-t border-loom-beige/50">
                  <span>{t('rfqOpportunities.totalQuantityNeeded', 'कुल आवश्यक मात्रा:')}</span>
                  <span>{t('rfqOpportunities.piecesCount', '{{count}} पीस', { count: selectedRFQ.requiredQuantity })}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>{t('rfqOpportunities.yourAvailableCapacity', 'आपकी उपलब्ध क्षमता:')}</span>
                  <span>{t('rfqOpportunities.piecesCount', '{{count}} पीस', { count: capacities[selectedRFQ.rfqId] || 0 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-loom-wood mb-1">{t('rfqOpportunities.commitQuantityLabel', 'प्रतिबद्ध मात्रा (Quantity you want to commit) *')}</label>
                <Input
                  type="number"
                  value={committedQty}
                  onChange={(e) => setCommittedQty(e.target.value)}
                  max={capacities[selectedRFQ.rfqId]}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loom-wood mb-1">{t('rfqOpportunities.quotedPriceLabel', 'प्रति पीस उद्धृत मूल्य (Unit Price per piece in ₹) *')}</label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder={selectedRFQ.maxBudgetPerUnit ? t('rfqOpportunities.unitPricePlaceholder', 'अधिकतम ₹{{max}}', { max: selectedRFQ.maxBudgetPerUnit }) : "उदा. 8500"}
                  required
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-loom-beige">
                <Button
                  type="button"
                  onClick={() => setSelectedRFQ(null)}
                  className="px-4 py-2 bg-white border border-loom-beige rounded-xl text-xs font-bold cursor-pointer hover:bg-loom-sand/10"
                >
                  {t('rfqOpportunities.cancel', 'रद्द करें')}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingQuota}
                  className="px-5 py-2 bg-loom-wood hover:bg-loom-wood-light text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingQuota ? t('rfqOpportunities.submitting', 'प्रक्रिया चालू...') : t('rfqOpportunities.signTreaty', 'अनुबंध पर हस्ताक्षर करें')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coalition detail treaty viewer (Modal) */}
      {activeCoalition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-8 border-double border-loom-wood w-full max-w-lg rounded-2xl shadow-2xl p-6 relative bg-loom-pattern">
            {/* Absolute overlay for low opacity paper effect */}
            <div className="absolute inset-0 bg-loom-parchment/95 z-0 rounded-lg" />

            <div className="relative z-10 text-center space-y-4">
              <button 
                onClick={() => setActiveCoalition(null)}
                className="absolute -top-2 -right-2 p-1 text-loom-wood/70 hover:text-loom-wood hover:bg-loom-wood/10 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center gap-1 pt-2">
                <ShieldCheck className="w-12 h-12 text-loom-gold" />
                <h3 className="font-heading text-3xl font-black text-loom-wood uppercase tracking-wide">
                  {t('rfqOpportunities.treatyTitle', 'सहकारी गठबंधन महा-अनुबंध')}
                </h3>
                <p className="text-[10px] text-loom-gold uppercase tracking-widest font-bold">
                  {t('rfqOpportunities.treatySubtitle', 'Ekatva Collective Treaty of Handloom Cooperatives')}
                </p>
              </div>

              <p className="font-body text-xs text-loom-ink leading-relaxed italic border-y border-loom-beige/60 py-3">
                {t('rfqOpportunities.treatyPreamble', '"हम, निम्नलिखित हथकरघा सहकारी समितियां, अपनी सामूहिक क्षमता, कौशल और करघों को एकीकृत करते हुए क्रेता की विशिष्ट थोक मांग को पूरा करने के लिए निष्ठापूर्वक इस अनुबंध पर हस्ताक्षर करते हैं।"')}
              </p>

              {/* Treaty Table styled as a historical document */}
              <div className="bg-white/60 border border-loom-beige rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-loom-wood/10 border-b border-loom-beige">
                      <th className="p-3 font-heading font-bold text-loom-wood">{t('rfqOpportunities.tableCooperative', 'सहकारी समिति')}</th>
                      <th className="p-3 font-heading font-bold text-loom-wood text-right">{t('rfqOpportunities.tableAllocatedQty', 'आबंटित मात्रा')}</th>
                      <th className="p-3 font-heading font-bold text-loom-wood text-right">{t('rfqOpportunities.tableUnitPrice', 'दर प्रति पीस')}</th>
                    </tr>
                  </thead>
                  <tbody className="font-body text-loom-ink font-medium">
                    {activeCoalition.cooperativeQuotas.map((quota, idx) => (
                      <tr key={idx} className="border-b border-loom-beige/40">
                        <td className="p-3 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-loom-gold" />
                          {quota.cooperativeName}
                        </td>
                        <td className="p-3 text-right font-bold">{t('rfqOpportunities.piecesCount', '{{count}} पीस', { count: quota.allocatedQuantity })}</td>
                        <td className="p-3 text-right font-bold">₹{quota.unitPrice.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}</td>
                      </tr>
                    ))}
                    <tr className="bg-loom-wood/5 font-bold text-loom-wood">
                      <td className="p-3">{t('rfqOpportunities.totalQuoteTitle', 'कुल एकीकृत कोटेशन (Total Quote)')}</td>
                      <td className="p-3 text-right text-sm">{t('rfqOpportunities.piecesCount', '{{count}} पीस', { count: activeCoalition.totalQuantity })}</td>
                      <td className="p-3 text-right text-sm">₹{activeCoalition.totalQuotePrice.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-[10px] text-loom-ink-light pt-2">
                <span>{t('rfqOpportunities.treatyCode', 'अनुबंध कूट: {{code}}', { code: activeCoalition.coalitionId })}</span>
                <span>{t('rfqOpportunities.treatyDate', 'सहमति तिथि: {{date}}', { date: new Date(activeCoalition.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN')) })}</span>
              </div>

              <div className="pt-2 flex justify-center">
                <Button 
                  onClick={() => setActiveCoalition(null)}
                  className="vintage-button px-6 py-2.5 text-xs"
                >
                  {t('rfqOpportunities.closeTreaty', 'अनुबंध बंद करें')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
