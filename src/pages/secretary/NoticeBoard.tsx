import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getNoticesByCooperative, createNotice } from '../../firebase/firestore';
import { Notice } from '../../types';
import { NoticeCard } from '../../components/NoticeCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ClipboardList, PlusCircle, X, Megaphone, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoticeBoardPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchNotices = async () => {
    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      const data = await getNoticesByCooperative(coopId);
      setNotices(data);
    } catch (err) {
      console.error("Error loading notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setFormError(isEn ? 'Please fill out all fields' : 'कृपया सभी फ़ील्ड भरें (Please fill out all fields)');
      return;
    }
    
    setFormSubmitting(true);
    setFormError('');

    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      await createNotice({
        cooperativeId: coopId,
        title,
        body,
        priority,
        createdBy: userProfile?.uid || 'system'
      });
      
      // Reset form & close modal
      setTitle('');
      setBody('');
      setPriority('normal');
      setShowModal(false);
      
      // Reload notices
      setLoading(true);
      await fetchNotices();
    } catch (err) {
      console.error("Error creating notice:", err);
      setFormError(isEn ? 'Error publishing notice. Please try again.' : 'नोटिस प्रकाशित करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <SecretaryLayout>
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-loom-gold" />
            {isEn ? "Digital Notice Board" : "डिजिटल सूचना पटल (Cooperative Notice Board)"}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {isEn 
              ? "Publish important guidelines, updates, and announcements for weaver members here."
              : "समिति बुनकरों के लिए आवश्यक सूचनाएं, दिशा-निर्देश एवं घोषणाएं यहाँ प्रकाशित करें।"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          {isEn ? "Add Notice" : "नई सूचना जोड़ें (Add Notice)"}
        </Button>
      </div>

      {/* Notices List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-heading text-xl text-loom-wood animate-pulse">
              {isEn ? "Loading notices..." : "सूचनाएं लोड हो रही हैं..."}
            </p>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 vintage-card bg-loom-cream">
            <Megaphone className="w-16 h-16 text-loom-beige mb-4" />
            <h3 className="font-heading text-xl font-bold text-loom-wood">
              {isEn ? "No Notices Available" : "कोई सूचना उपलब्ध नहीं है"}
            </h3>
            <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
              {isEn 
                ? "No official notices have been issued by this cooperative yet."
                : "अभी तक इस समिति के लिए कोई सूचना पत्र जारी नहीं किया गया है।"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-3xl">
            {notices.map((notice) => (
              <NoticeCard key={notice.noticeId} notice={notice} />
            ))}
          </div>
        )}
      </div>

      {/* New Notice Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-lg w-full relative border-2 border-loom-gold shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-heading text-2xl font-bold text-loom-wood mb-2">
              {isEn ? "Publish New Cooperative Notice" : "नई सहकारी सूचना प्रकाशित करें"}
            </h2>
            <p className="font-body text-sm text-loom-ink-light mb-6 border-b border-loom-beige/30 pb-3">
              (Issue a new official cooperative notification)
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-body font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Notification Title *" : "सूचना का शीर्षक (Notification Title) *"}
                </label>
                <Input
                  id="title"
                  placeholder={isEn ? "e.g. Yarn Distribution Camp or General Meeting" : "उदा: सूत वितरण शिविर अथवा सामान्य बैठक"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Priority Selection */}
              <div>
                <label htmlFor="priority" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Priority Level" : "सूचना की प्राथमिकता (Priority Level)"}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`px-4 py-3 border rounded-xl font-heading font-bold text-sm transition-all cursor-pointer text-center ${
                      priority === 'normal'
                        ? 'bg-amber-50 text-amber-800 border-loom-gold shadow-sm'
                        : 'bg-white text-loom-ink-light border-loom-beige hover:border-loom-gold'
                    }`}
                  >
                    {isEn ? "Normal" : "सामान्य (Normal)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`px-4 py-3 border rounded-xl font-heading font-bold text-sm transition-all cursor-pointer text-center ${
                      priority === 'urgent'
                        ? 'bg-red-50 text-red-700 border-red-300 shadow-sm animate-pulse'
                        : 'bg-white text-loom-ink-light border-loom-beige hover:border-loom-gold'
                    }`}
                  >
                    {isEn ? "Urgent" : "आवश्यक / अर्ज़ेंट (Urgent)"}
                  </button>
                </div>
              </div>

              {/* Notice Body */}
              <div>
                <label htmlFor="body" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Description Details *" : "सूचना का विवरण (Description Details) *"}
                </label>
                <textarea
                  id="body"
                  rows={5}
                  placeholder={isEn ? "Dear weavers, this is to notify that..." : "सभी बुनकर भाइयों को सूचित किया जाता है कि..."}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={formSubmitting}
                  className="flex-1 font-heading font-bold py-3.5"
                >
                  {isEn ? "Cancel" : "रद्द करें (Cancel)"}
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 font-heading font-bold py-3.5 bg-loom-wood text-white hover:bg-loom-wood-light"
                >
                  {formSubmitting 
                    ? (isEn ? "Publishing..." : "प्रकाशन जारी...") 
                    : (isEn ? "Publish" : "प्रकाशित करें (Publish)")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
