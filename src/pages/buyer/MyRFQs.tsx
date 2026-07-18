import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BuyerLayout } from '../../components/layout/BuyerLayout';
import { 
  createBuyerRFQ, 
  getBuyerRFQs, 
  getCoalitionsByRFQ,
  updateRFQStatus,
  updateCoalitionStatus
} from '../../firebase/firestore';
import { BuyerRFQ, Coalition } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  ClipboardCheck, 
  PlusCircle, 
  X, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Building, 
  FileText, 
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MyRFQs: React.FC = () => {
  const { currentUser } = useAuth();
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [rfqs, setRfqs] = useState<BuyerRFQ[]>([]);
  const [coalitions, setCoalitions] = useState<Record<string, Coalition>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [productDescription, setProductDescription] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('');
  const [maxBudgetPerUnit, setMaxBudgetPerUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const buyerId = currentUser?.uid || 'buyer1';
  const buyerName = currentUser?.displayName || (isEn ? 'Wholesale Fabric Distributor' : 'थोक वस्त्र वितरक');

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedRFQs = await getBuyerRFQs(buyerId);
      setRfqs(fetchedRFQs);

      const coalitionMap: Record<string, Coalition> = {};
      for (const rfq of fetchedRFQs) {
        const cols = await getCoalitionsByRFQ(rfq.rfqId);
        if (cols && cols.length > 0) {
          coalitionMap[rfq.rfqId] = cols[0];
        }
      }
      setCoalitions(coalitionMap);
    } catch (err) {
      console.error("Error loading buyer RFQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for sessionStorage prefilled values
    const prefilledDesc = sessionStorage.getItem('prefilled_rfq_desc');
    const prefilledBudget = sessionStorage.getItem('prefilled_rfq_budget');
    if (prefilledDesc) {
      setProductDescription(prefilledDesc);
      if (prefilledBudget) setMaxBudgetPerUnit(prefilledBudget);
      setShowModal(true);
      sessionStorage.removeItem('prefilled_rfq_desc');
      sessionStorage.removeItem('prefilled_rfq_budget');
    }
  }, [buyerId]);

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productDescription.trim() || !requiredQuantity || !deadline) {
      setFormError(isEn ? 'Please fill out all required fields' : 'कृपया सभी आवश्यक फ़ील्ड भरें (Please fill out all required fields)');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      await createBuyerRFQ({
        buyerId,
        buyerName,
        productDescription,
        requiredQuantity: Number(requiredQuantity),
        maxBudgetPerUnit: maxBudgetPerUnit ? Number(maxBudgetPerUnit) : undefined,
        deadline
      });

      setFormSuccess(isEn ? 'RFQ Submitted successfully!' : 'थोक मांग अनुरोध (RFQ) सफलतापूर्वक जमा किया गया! (RFQ Submitted!)');
      setProductDescription('');
      setRequiredQuantity('');
      setMaxBudgetPerUnit('');
      setDeadline('');

      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
        fetchData();
      }, 1500);

    } catch (err) {
      console.error("Error creating RFQ:", err);
      setFormError(isEn ? 'Error submitting RFQ. Please try again.' : 'आरएफक्यू सबमिट करने में त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAcceptQuote = async (rfqId: string, coalitionId: string) => {
    const confirmMsg = isEn 
      ? 'Do you want to accept this integrated quotation from the coalition?' 
      : 'क्या आप गठबंधन के इस एकीकृत कोटेशन को स्वीकार करना चाहते हैं? (Accept this quotation?)';
    
    if (window.confirm(confirmMsg)) {
      try {
        await updateRFQStatus(rfqId, 'accepted');
        await updateCoalitionStatus(coalitionId, 'accepted');
        alert(isEn 
          ? 'Quotation accepted! Contract allocation sent to the cooperatives.' 
          : 'कोटेशन स्वीकार किया गया! सहकारी समितियों को अनुबंध आवंटन भेज दिया गया है।');
        fetchData();
      } catch (err) {
        console.error("Error accepting quote:", err);
        alert(isEn ? 'Error processing acceptance.' : 'स्वीकृति प्रसंस्करण में त्रुटि।');
      }
    }
  };

  const handleDeclineQuote = async (rfqId: string, coalitionId: string) => {
    const confirmMsg = isEn 
      ? 'Do you want to decline this quotation from the coalition?' 
      : 'क्या आप गठबंधन के इस कोटेशन को अस्वीकार करना चाहते हैं?';
    
    if (window.confirm(confirmMsg)) {
      try {
        await updateRFQStatus(rfqId, 'declined');
        await updateCoalitionStatus(coalitionId, 'declined');
        alert(isEn ? 'Quotation has been declined.' : 'कोटेशन अस्वीकार कर दिया गया है।');
        fetchData();
      } catch (err) {
        console.error("Error declining quote:", err);
        alert(isEn ? 'Error processing declination.' : 'अस्वीकृति प्रसंस्करण में त्रुटि।');
      }
    }
  };

  const getStatusBadgeClass = (status: BuyerRFQ['status']) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coalition_formed':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'quote_submitted':
        return 'bg-purple-100 text-purple-800 border-purple-200 font-extrabold ring-2 ring-purple-400/50';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: BuyerRFQ['status']) => {
    if (isEn) {
      switch (status) {
        case 'open':
          return 'Open';
        case 'coalition_formed':
          return 'Forming Coalition';
        case 'quote_submitted':
          return 'Quote Received!';
        case 'accepted':
          return 'Contract Accepted';
        case 'declined':
          return 'Declined';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'open':
          return 'जांच जारी (Open)';
        case 'coalition_formed':
          return 'गठबंधन बन रहा है (Forming)';
        case 'quote_submitted':
          return 'कोटेशन प्राप्त (Quote Received!)';
        case 'accepted':
          return 'अनुबंध स्वीकृत (Accepted)';
        case 'declined':
          return 'अस्वीकृत (Declined)';
        default:
          return status;
      }
    }
  };

  return (
    <BuyerLayout>
      {/* Page Title */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-loom-gold" />
            {isEn ? "My RFQs & Quote Board" : "थोक कोटेशन मांग बोर्ड (My RFQs & Quote Board)"}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {isEn 
              ? "Submit your bulk order specifications and review quotes submitted by joint cooperative coalitions."
              : "अपने थोक ऑर्डर विवरण जमा करें, और सहकारी समितियों द्वारा बनाई गई साझा उत्पादन क्षमता (Coalitions) के कोटेशन स्वीकृत करें।"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          {isEn ? "Post New RFQ" : "नया आरएफक्यू जमा करें (New RFQ)"}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">
            {isEn ? "Loading RFQ dashboard..." : "आरएफक्यू डैशबोर्ड लोड हो रहा है..."}
          </p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <FileText className="w-16 h-16 text-loom-gold/50 mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">
            {isEn ? "No Bulk Requests Submitted" : "कोई थोक मांग अनुरोध जमा नहीं है"}
          </h3>
          <p className="font-body text-loom-ink-light max-w-md mx-auto mb-6">
            {isEn 
              ? "You have not submitted any bulk requests yet. Click the button to post your custom order specifications."
              : "वर्तमान में आपने कोई थोक मांग अनुरोध दर्ज नहीं किया है। \"नया आरएफक्यू जमा करें\" बटन दबाकर विशिष्ट ऑर्डर पोस्ट करें।"}
          </p>
          <Button onClick={() => setShowModal(true)} className="vintage-button">
            {isEn ? "Create Bulk RFQ" : "थोक मांग (RFQ) बनाएं"}
          </Button>
        </div>
      ) : (
        /* RFQs Table/List structure */
        <div className="space-y-6">
          {rfqs.map((rfq) => {
            const coalition = coalitions[rfq.rfqId];
            return (
              <Card key={rfq.rfqId} className="vintage-card overflow-hidden border-2 border-loom-beige">
                <CardHeader className="bg-loom-parchment p-5 border-b border-loom-beige flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-loom-gold uppercase tracking-wider bg-loom-wood px-2 py-0.5 rounded">
                        {isEn ? `RFQ ID: ${rfq.rfqId}` : `आरएफक्यू कूट: ${rfq.rfqId}`}
                      </span>
                      <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(rfq.status)}`}>
                        {getStatusDisplay(rfq.status)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-black text-loom-wood mt-2.5">
                      {isEn ? `Required Quantity: ${rfq.requiredQuantity} pcs` : `आवश्यक मात्रा: ${rfq.requiredQuantity} पीस`}
                    </CardTitle>
                  </div>

                  <div className="flex gap-4 text-xs font-bold text-loom-ink-light">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-loom-gold" />
                      {isEn ? "Deadline:" : "अंतिम तिथि:"} {new Date(rfq.deadline).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-loom-gold" />
                      {isEn ? "Target Budget: " : "लक्षित बजट: "}
                      {rfq.maxBudgetPerUnit ? (isEn ? `₹${rfq.maxBudgetPerUnit}/pc` : `₹${rfq.maxBudgetPerUnit}/पीस`) : (isEn ? 'Negotiable' : 'संवाद योग्य')}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Product description request */}
                  <div>
                    <span className="text-xs uppercase tracking-wider font-extrabold text-loom-wood block mb-1">
                      {isEn ? "Required Specifications:" : "वांछित उत्पाद विवरण (Required Specifications):"}
                    </span>
                    <p className="font-body text-sm bg-white p-3 rounded-xl border border-loom-beige/50 leading-relaxed italic text-loom-ink">
                      "{rfq.productDescription}"
                    </p>
                  </div>

                  {/* Dynamic Coalition Offer details */}
                  {coalition ? (
                    <div className="mt-4 border border-purple-200 bg-purple-50/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <span className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                          <Users className="w-5 h-5 text-loom-gold" />
                          {isEn ? "Collective Coalition Proposal:" : "सहकारी गठबंधन की एकीकृत पेशकश (Collective Coalition Proposal):"}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full border border-purple-200">
                          {isEn 
                            ? `Collective Quantity: ${coalition.totalQuantity} / ${rfq.requiredQuantity} pcs` 
                            : `एकीकृत मात्रा: ${coalition.totalQuantity} / ${rfq.requiredQuantity} पीस`}
                        </span>
                      </div>

                      {/* Quota Distribution table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        {coalition.cooperativeQuotas.map((quota, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-loom-beige shadow-2xs">
                            <span className="font-bold text-loom-wood flex items-center gap-1">
                              <Building className="w-4 h-4 text-loom-gold" />
                              {quota.cooperativeName}
                            </span>
                            <span className="font-bold text-loom-ink">
                              {isEn 
                                ? `${quota.allocatedQuantity} pcs @ ₹${quota.unitPrice}/pc` 
                                : `${quota.allocatedQuantity} पीस @ ₹${quota.unitPrice}/पीस`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Cumulative Pricing */}
                      <div className="bg-purple-100/40 p-3 rounded-xl border border-purple-200 flex justify-between items-center text-sm">
                        <span className="font-extrabold text-purple-950">
                          {isEn ? "Total Collective Price:" : "कुल एकीकृत उद्धरण मूल्य (Total Collective Price):"}
                        </span>
                        <span className="font-black text-lg text-loom-wood">
                          ₹{coalition.totalQuotePrice.toLocaleString(isEn ? 'en-US' : 'hi-IN')}
                        </span>
                      </div>

                      {/* Quotation acceptance buttons for quote_submitted state */}
                      {rfq.status === 'quote_submitted' && (
                        <div className="flex justify-end gap-3 pt-3">
                          <Button
                            type="button"
                            onClick={() => handleDeclineQuote(rfq.rfqId, coalition.coalitionId)}
                            className="px-5 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl font-heading font-bold text-xs cursor-pointer flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            {isEn ? "Decline" : "कोटेशन अस्वीकार करें (Decline)"}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleAcceptQuote(rfq.rfqId, coalition.coalitionId)}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-heading font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4 text-loom-gold" />
                            {isEn ? "Accept Proposal" : "कोटेशन स्वीकार करें (Accept Proposal)"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4 text-xs flex items-center gap-2.5 text-blue-900 font-body">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-blue-600 animate-spin-slow" />
                      </div>
                      <p className="leading-relaxed">
                        {isEn 
                          ? "Cooperatives are analyzing your bulk specifications and forming a collaborative coalition to meet the demand. Quotes will appear here shortly."
                          : "सहकारी समितियां आपकी थोक आवश्यकता का विश्लेषण कर रही हैं। वे सामूहिक मांग पूरी करने के लिए एक गठबंधन (Coalition) बना रहे हैं। कोटेशन जल्द ही यहाँ दिखाई देगा।"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New RFQ Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col">
            <div className="p-5 border-b border-loom-beige bg-loom-wood text-loom-cream rounded-t-lg bg-loom-pattern relative">
              <div className="absolute inset-0 bg-loom-wood/95 z-0 rounded-t-lg" />
              <div className="relative z-10">
                <h3 className="font-heading text-xl font-bold flex items-center gap-1.5">
                  <PlusCircle className="w-5 h-5 text-loom-gold" />
                  {isEn ? "Post Bulk RFQ" : "नया थोक मांग अनुरोध (Post Bulk RFQ)"}
                </h3>
                <p className="text-xs text-loom-gold/90 mt-1">
                  {isEn 
                    ? "Submit your desired product design and required quantity to receive collective quotes directly from the handloom cooperative network."
                    : "इच्छित उत्पाद डिजाइन और आवश्यक मात्रा जमा करके सीधे हथकरघा सहकारी नेटवर्क से कोटेशन प्राप्त करें।"}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-loom-cream/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRFQ} className="p-6 space-y-4">
              {formError && (
                <div className="bg-loom-error/10 border border-loom-error text-loom-error p-3 rounded-xl text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-400 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-loom-wood mb-1">
                  {isEn ? "Product Specifications *" : "उत्पाद विवरण एवं विशेषताएं (Specifications) *"}
                </label>
                <textarea
                  className="w-full p-3 bg-white border border-loom-beige rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-loom-gold min-h-[100px] font-body"
                  placeholder={isEn 
                    ? "Describe your required fabrics, yarn type, weaving style (e.g., Zari border, Banarasi cotton), patterns, and quality standards clearly..."
                    : "वांछित वस्त्र, धागे की किस्म, बुनाई तकनीक (उदा. जरी बॉर्डर, बनारसी सूती कपड़ा), पैटर्न और गुणवत्ता मानक स्पष्ट रूप से लिखें..."}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-loom-wood mb-1">
                    {isEn ? "Quantity in Pieces *" : "आवश्यक मात्रा (Quantity in Pieces) *"}
                  </label>
                  <Input
                    type="number"
                    value={requiredQuantity}
                    onChange={(e) => setRequiredQuantity(e.target.value)}
                    required
                    min="1"
                    placeholder={isEn ? "e.g., 200" : "उदा. 200"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-loom-wood mb-1">
                    {isEn ? "Target Price per Unit (₹/Piece)" : "अधिकतम दर प्रति यूनिट (Target Price/Piece ₹)"}
                  </label>
                  <Input
                    type="number"
                    value={maxBudgetPerUnit}
                    onChange={(e) => setMaxBudgetPerUnit(e.target.value)}
                    placeholder={isEn ? "Optional" : "वैकल्पिक (Optional)"}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-loom-wood mb-1">
                  {isEn ? "Required Delivery Deadline *" : "आपूर्ति की अंतिम तिथि (Required Deadline) *"}
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-loom-beige">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-loom-beige rounded-xl text-xs font-bold cursor-pointer hover:bg-loom-sand/10"
                >
                  {isEn ? "Cancel" : "रद्द करें"}
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-loom-wood hover:bg-loom-wood-light text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (isEn ? "Processing..." : 'प्रक्रिया चालू...') : (isEn ? "Publish Demand Request" : 'मांग अनुरोध प्रकाशित करें')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
};
