import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getGrievanceById, 
  updateGrievanceStatus, 
  addGrievanceMessage, 
  listenGrievanceMessages 
} from '../../firebase/firestore';
import { Grievance, GrievanceMessage } from '../../types';
import { GrievanceMessageThread } from '../../components/GrievanceMessageThread';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GrievanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [messages, setMessages] = useState<GrievanceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchGrievance = async () => {
      try {
        const docData = await getGrievanceById(id);
        setGrievance(docData);
      } catch (err) {
        console.error("Error loading grievance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrievance();

    // Subscribe to messages real-time stream
    const unsubscribe = listenGrievanceMessages(id, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [id]);

  const handleStatusChange = async (newStatus: 'open' | 'in_progress' | 'resolved') => {
    if (!id || !grievance) return;
    try {
      await updateGrievanceStatus(id, newStatus);
      setGrievance({
        ...grievance,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Auto-post system message about status change
      let statusSystemText = '';
      if (newStatus === 'in_progress') {
        statusSystemText = isEn 
          ? '🛠️ [System Notification]: Grievance status updated to "In Progress" by the Secretary.'
          : '🛠️ [सिस्टम सूचना]: सचिव द्वारा शिकायत की स्थिति "प्रगति पर" अद्यतन की गई है।';
      } else if (newStatus === 'resolved') {
        statusSystemText = isEn
          ? '✅ [System Notification]: Grievance resolved and marked as "Resolved" by the Secretary.'
          : '✅ [सिस्टम सूचना]: सचिव द्वारा शिकायत का निवारण कर इसे "हल" चिह्नित किया गया है।';
      }

      await addGrievanceMessage(id, {
        senderId: 'system',
        senderName: isEn ? 'Committee System' : 'समिति प्रणाली',
        senderRole: 'secretary',
        text: statusSystemText
      });

    } catch (err) {
      console.error("Error updating grievance status:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !replyText.trim() || !userProfile) return;

    setSubmittingReply(true);
    try {
      await addGrievanceMessage(id, {
        senderId: userProfile.uid,
        senderName: userProfile.displayName || (isEn ? 'Secretary' : 'सचिव साहब'),
        senderRole: 'secretary',
        text: replyText.trim()
      });
      setReplyText('');
    } catch (err) {
      console.error("Error posting message:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getCategoryText = (category: string) => {
    if (isEn) {
      switch (category) {
        case 'payment':
          return 'Payment Related';
        case 'raw material':
          return 'Raw Material Related';
        case 'other':
          return 'Other Subjects';
        default:
          return category;
      }
    }
    switch (category) {
      case 'payment':
        return 'भुगतान संबंधी (Payment)';
      case 'raw material':
        return 'कच्चा माल संबंधी (Raw Material)';
      case 'other':
        return 'अन्य विषय (Other)';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <SecretaryLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-heading text-2xl text-loom-wood animate-pulse">
            {isEn ? "Loading grievance details..." : "शिकायत विवरणी लोड हो रही है..."}
          </p>
        </div>
      </SecretaryLayout>
    );
  }

  if (!grievance) {
    return (
      <SecretaryLayout>
        <div className="p-8 text-center vintage-card">
          <AlertCircle className="w-16 h-16 text-loom-error mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-loom-wood">
            {isEn ? "Grievance Ticket Not Found" : "शिकायत टिकट नहीं मिला"}
          </h2>
          <button 
            onClick={() => navigate('/secretary/grievances')} 
            className="mt-4 inline-flex items-center gap-2 font-heading font-bold text-loom-wood underline"
          >
            <ArrowLeft className="w-4 h-4" /> {isEn ? "Go back to grievance list" : "शिकायत सूची में वापस जाएं"}
          </button>
        </div>
      </SecretaryLayout>
    );
  }

  return (
    <SecretaryLayout>
      {/* Header Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/secretary/grievances')}
          className="inline-flex items-center gap-2 text-loom-wood hover:text-loom-gold font-heading font-bold text-base mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {isEn ? "Back to List" : "शिकायत निवारण पटल पर वापस जाएं (Back to List)"}
        </button>
        <h1 className="font-heading text-3xl font-bold text-loom-wood">
          {isEn ? "Resolve Grievance" : "शिकायत समाधान संवाद (Resolve Grievance)"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Grievance summary & Control actions */}
        <div className="space-y-6">
          <div className="vintage-card p-6 bg-loom-cream border-t-4 border-t-loom-wood shadow-md">
            <span className="text-xs text-loom-gold font-bold font-heading uppercase tracking-widest block mb-2">
              {isEn ? "Grievance Details" : "शिकायत विवरण (Grievance Details)"}
            </span>
            <h2 className="font-heading text-2xl font-black text-loom-wood mb-3 leading-tight">{grievance.subject}</h2>
            
            <div className="border-t border-b border-loom-beige/30 py-3.5 my-4 space-y-2.5 font-body text-base text-loom-ink">
              <div>
                <span className="text-xs text-loom-ink-light font-bold block">{isEn ? "Weaver:" : "शिकायतकर्ता (Weaver):"}</span>
                <span className="font-semibold text-loom-wood">{grievance.weaverName}</span>
              </div>
              <div>
                <span className="text-xs text-loom-ink-light font-bold block">{isEn ? "Grievance Category:" : "शिकायत श्रेणी (Category):"}</span>
                <span className="font-semibold">{getCategoryText(grievance.category)}</span>
              </div>
              <div>
                <span className="text-xs text-loom-ink-light font-bold block">{isEn ? "Date Created:" : "दर्ज करने की तिथि (Date Created):"}</span>
                <span className="font-mono text-sm">
                  {new Date(grievance.createdAt).toLocaleDateString(isEn ? 'en-US' : 'hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-xs text-loom-ink-light font-bold">{isEn ? "Status:" : "स्थिति (Status):"}</span>
                <StatusBadge status={grievance.status} />
              </div>
            </div>

            {/* Status Change Buttons */}
            <div>
              <span className="text-xs text-loom-ink-light font-bold font-heading block mb-2.5 uppercase tracking-wide">
                {isEn ? "Update Status" : "शिकायत की स्थिति बदलें (Update Status)"}
              </span>
              <div className="flex flex-col gap-2">
                {grievance.status !== 'in_progress' && grievance.status !== 'resolved' && (
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('in_progress')}
                    className="flex items-center justify-center gap-2 py-3 bg-white text-loom-wood border-2 border-loom-wood font-heading font-bold"
                  >
                    <Clock className="w-5 h-5" />
                    {isEn ? "Mark In Progress" : "प्रगति पर चिह्नित करें (Mark In Progress)"}
                  </Button>
                )}
                {grievance.status !== 'resolved' && (
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('resolved')}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-700 text-white hover:bg-emerald-800 font-heading font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {isEn ? "Mark Resolved" : "निवारण पूर्ण / हल करें (Mark Resolved)"}
                  </Button>
                )}
                {grievance.status === 'resolved' && (
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('open')}
                    className="flex items-center justify-center gap-2 py-3 bg-red-100 text-red-800 hover:bg-red-200 border border-red-200 font-heading font-bold"
                  >
                    <AlertCircle className="w-5 h-5" />
                    {isEn ? "Re-open Grievance" : "शिकायत पुनः खोलें (Re-open Grievance)"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Conversation stream & Reply input */}
        <div className="lg:col-span-2">
          <div className="vintage-card p-6 bg-loom-cream border-t-4 border-t-loom-gold shadow-md flex flex-col h-[580px]">
            <h3 className="font-heading text-lg font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/30 pb-3 mb-4">
              <MessageSquare className="w-5 h-5 text-loom-gold" />
              {isEn ? "Conversation Thread" : "बुनकर के साथ संवाद सूत्र (Conversation Thread)"}
            </h3>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto mb-4">
              <GrievanceMessageThread 
                messages={messages} 
                currentUserId={userProfile?.uid || ''} 
              />
            </div>

            {/* Reply Input Form */}
            {grievance.status === 'resolved' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 font-body text-sm font-semibold">
                {isEn 
                  ? "✓ This grievance has been resolved. Re-open to discuss further if needed."
                  : "✓ यह शिकायत हल हो चुकी है। अधिक चर्चा के लिए आवश्यकतानुसार दोबारा खोलें।"}
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-loom-beige/30">
                <textarea
                  placeholder={isEn ? "Type your reply..." : "अपना उत्तर लिखें... (Type your reply...)"}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={submittingReply}
                  rows={2}
                  className="flex-1 px-4 py-2.5 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-5 bg-loom-wood hover:bg-loom-wood-light disabled:bg-loom-beige text-white hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </SecretaryLayout>
  );
};
