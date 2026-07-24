import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { 
  getProductSubmissionsByCooperative, 
  updateProductSubmissionStatus, 
  createProduct 
} from '../../firebase/firestore';
import { ProductSubmission } from '../../types';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Clock, 
  Tag, 
  User, 
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';

export const SecretaryProductReview: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  // Modals state
  const [selectedSub, setSelectedSub] = useState<ProductSubmission | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Approve form state
  const [publishPrice, setPublishPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [handloomMark, setHandloomMark] = useState(true);
  const [weaverStory, setWeaverStory] = useState('');
  const [approveDescription, setApproveDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Reject form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const cooperativeId = userProfile?.cooperativeId || 'coop1';
  const cooperativeName = userProfile?.displayName || (isEn ? 'Kashi Handloom Cooperative Society' : 'काशी हथकरघा सहकारी समिति');

  const fetchSubmissions = async () => {
    if (!cooperativeId) return;
    try {
      setLoading(true);
      const data = await getProductSubmissionsByCooperative(cooperativeId);
      // Filter for pending submissions only
      const pending = data.filter(sub => sub.status === 'pending');
      setSubmissions(pending);
    } catch (err) {
      console.error("Error fetching cooperative product submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [cooperativeId]);

  const getTagLabel = (tag: string) => {
    if (!isEn) return tag;
    const tagLabels: Record<string, string> = {
      "बनारसी": "Banarasi",
      "रेशम (Silk)": "Silk",
      "सूती (Cotton)": "Cotton",
      "इकত (Ikat)": "Ikat",
      "जामदानी (Jamdani)": "Jamdani",
      "खादी (Khadi)": "Khadi",
      "पश्मीना (Pashmina)": "Pashmina",
      "जरी (Zari)": "Zari"
    };
    return tagLabels[tag] || tag;
  };

  const handleOpenApprove = (sub: ProductSubmission) => {
    setSelectedSub(sub);
    setPublishPrice(String(sub.price));
    setQuantity('1');
    setHandloomMark(true);
    setApproveDescription(sub.description);
    setWeaverStory(isEn 
      ? `This exquisite piece is handcrafted by master weaver ${sub.weaverName}, whose family has preserved the unique handloom heritage for decades.` 
      : `यह उत्कृष्ट उत्पाद मुख्य बुनकर ${sub.weaverName} द्वारा हस्तनिर्मित है, जिनका परिवार कई पीढ़ियों से इस पारंपरिक कला को संजोए हुए है।`
    );
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !currentUser) return;

    setFormSubmitting(true);

    try {
      // 1. Create product in products collection
      await createProduct({
        cooperativeId,
        cooperativeName,
        name: selectedSub.title,
        description: approveDescription,
        images: selectedSub.images,
        price: Number(publishPrice),
        quantityAvailable: Number(quantity),
        skillTags: selectedSub.skillTags,
        handloomMark,
        weaverStory
      });

      // 2. Update status of submission in productSubmissions
      await updateProductSubmissionStatus(selectedSub.submissionId, 'approved', {
        reviewedBy: currentUser.uid
      });

      setToastMessage(t('secretaryReview.successApprove'));
      setShowApproveModal(false);
      setSelectedSub(null);
      fetchSubmissions();

    } catch (err) {
      console.error("Error approving product submission:", err);
      alert(isEn ? "Failed to approve product proposal." : "उत्पाद प्रस्ताव स्वीकृत करने में विफल।");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenReject = (sub: ProductSubmission) => {
    setSelectedSub(sub);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !rejectionReason.trim() || !currentUser) return;

    setRejectSubmitting(true);

    try {
      await updateProductSubmissionStatus(selectedSub.submissionId, 'rejected', {
        reviewedBy: currentUser.uid,
        rejectionReason: rejectionReason.trim()
      });

      setToastMessage(t('secretaryReview.successReject'));
      setShowRejectModal(false);
      setSelectedSub(null);
      fetchSubmissions();

    } catch (err) {
      console.error("Error rejecting product submission:", err);
      alert(isEn ? "Failed to reject product proposal." : "प्रस्ताव अस्वीकार करने में विफल।");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString(isEn ? 'en-US' : 'hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SecretaryLayout>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-loom-gold" />
          {t('secretaryReview.title')}
        </h1>
        <p className="font-body text-base text-loom-ink-light mt-1">
          {t('secretaryReview.desc')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-loom-gold"></div>
        </div>
      ) : submissions.length === 0 ? (
        <Card className="vintage-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600/70 mx-auto mb-4" />
          <p className="font-heading text-xl text-loom-wood font-bold">
            {t('secretaryReview.noPending')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {submissions.map((sub) => (
            <Card key={sub.submissionId} className="vintage-card p-6">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                
                <div className="flex flex-col sm:flex-row gap-6 flex-1">
                  {/* Photo Display Grid */}
                  <div className="w-full sm:w-40 shrink-0 aspect-square sm:h-40 rounded-xl bg-loom-cream border border-loom-beige overflow-hidden flex items-center justify-center">
                    {sub.images && sub.images[0] ? (
                      <img src={sub.images[0]} alt={sub.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-loom-beige" />
                    )}
                  </div>

                  {/* Submission Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-loom-gold bg-loom-cream border border-loom-beige px-2.5 py-1 rounded-full">
                        <User className="w-3.5 h-3.5" />
                        {t('secretaryReview.weaver')}: {sub.weaverName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-loom-ink-light bg-loom-beige/10 border border-loom-beige/30 px-2.5 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-loom-gold" />
                        {formatDate(sub.createdAt)}
                      </span>
                    </div>

                    <h2 className="font-heading text-2xl font-bold text-loom-wood leading-tight">{sub.title}</h2>
                    <p className="font-body text-loom-ink-light text-base leading-relaxed">{sub.description}</p>
                    
                    {sub.skillTags && sub.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {sub.skillTags.map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-semibold bg-loom-cream border border-loom-beige text-loom-ink-light">
                            <Tag className="w-3 h-3 text-loom-gold" />
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Price */}
                <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-4 border-t md:border-t-0 border-loom-beige/40 pt-4 md:pt-0 self-stretch md:self-auto">
                  <div className="text-left md:text-right">
                    <span className="text-xs uppercase tracking-wider text-loom-ink-light font-bold block">
                      {t('secretaryReview.proposedPrice')}
                    </span>
                    <span className="font-heading text-2xl font-bold text-loom-wood">₹{sub.price}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleOpenReject(sub)}
                      className="px-5 py-2.5 border-2 border-loom-error/65 text-loom-error hover:bg-loom-error/5 font-heading font-bold rounded-xl cursor-pointer"
                    >
                      <X className="w-4 h-4 mr-1.5 inline" />
                      {t('secretaryReview.reject')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleOpenApprove(sub)}
                      className="px-5 py-2.5 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                      {t('secretaryReview.approve')}
                    </Button>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApproveModal && selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-2 border-loom-gold/50 rounded-2xl w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowApproveModal(false)}
              className="absolute top-4 right-4 text-loom-ink-light hover:text-loom-ink cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <form onSubmit={handleConfirmApprove}>
              <div className="p-6 border-b border-loom-beige/40">
                <h3 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-loom-gold" />
                  {t('secretaryReview.approveModalTitle')}
                </h3>
                <p className="text-xs text-loom-ink-light mt-1">
                  {t('secretaryReview.approveModalDesc')}
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Proposed Title Display */}
                <div>
                  <span className="text-xs uppercase font-bold text-loom-gold block">
                    {isEn ? "Product Name" : "उत्पाद का नाम"}
                  </span>
                  <span className="font-heading text-lg font-bold text-loom-wood">{selectedSub.title}</span>
                </div>

                {/* Approve Form: Publish Price */}
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {t('secretaryReview.priceAdjust')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={publishPrice}
                    onChange={(e) => setPublishPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>

                {/* Quantity Available */}
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {isEn ? "Quantity Available *" : "उपलब्ध मात्रा (Quantity) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>

                {/* Handloom Mark Checkbox */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="handloomMark"
                    checked={handloomMark}
                    onChange={(e) => setHandloomMark(e.target.checked)}
                    className="w-5 h-5 accent-loom-gold rounded cursor-pointer"
                  />
                  <label htmlFor="handloomMark" className="text-sm font-heading font-bold text-loom-wood cursor-pointer">
                    {t('secretaryReview.handloomMark')}
                  </label>
                </div>

                {/* Edit Description */}
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {isEn ? "Adjust Description *" : "उत्पाद विवरण समायोजित करें *"}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={approveDescription}
                    onChange={(e) => setApproveDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>

                {/* Weaver Story */}
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {t('secretaryReview.weaverStory')} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={weaverStory}
                    onChange={(e) => setWeaverStory(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-loom-beige/10 border-t border-loom-beige/40 rounded-b-2xl flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-5 py-2.5 border border-loom-beige text-loom-ink hover:bg-loom-cream font-heading rounded-xl cursor-pointer"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-7 py-2.5 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('secretaryReview.confirmApprove')}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectModal && selectedSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-2 border-loom-error/30 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 text-loom-ink-light hover:text-loom-ink cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <form onSubmit={handleConfirmReject}>
              <div className="p-6 border-b border-loom-beige/40">
                <h3 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-loom-error" />
                  {t('secretaryReview.rejectModalTitle')}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs uppercase font-bold text-loom-gold block">
                    {isEn ? "Product Proposal" : "उत्पाद प्रस्ताव"}
                  </span>
                  <span className="font-heading text-lg font-bold text-loom-wood">{selectedSub.title}</span>
                </div>

                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {t('secretaryReview.rejectReasonLabel')}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t('secretaryReview.rejectReasonPlaceholder')}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-loom-beige/10 border-t border-loom-beige/40 rounded-b-2xl flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2.5 border border-loom-beige text-loom-ink hover:bg-loom-cream font-heading rounded-xl cursor-pointer"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={rejectSubmitting}
                  className="px-7 py-2.5 bg-loom-error hover:bg-red-700 text-white font-heading font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {rejectSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>{t('secretaryReview.confirmReject')}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
