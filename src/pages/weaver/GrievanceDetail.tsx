import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WeaverLayout } from '../../components/layout/WeaverLayout';
import { 
  getGrievanceById, 
  addGrievanceMessage, 
  listenGrievanceMessages 
} from '../../firebase/firestore';
import { Grievance, GrievanceMessage } from '../../types';
import { GrievanceMessageThread } from '../../components/GrievanceMessageThread';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const WeaverGrievanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [activeTab, setActiveTab] = useState('grievances'); // Keep on grievances tab
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
        
        // Security check: ensure this grievance belongs to current weaver
        if (docData && docData.weaverId !== currentUser?.uid) {
          console.warn("Security block: Weaver attempting to access another weaver's grievance.");
          setGrievance(null);
        } else {
          setGrievance(docData);
        }
      } catch (err) {
        console.error("Error loading grievance for weaver:", err);
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
  }, [id, currentUser]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !replyText.trim() || !userProfile || !currentUser) return;

    setSubmittingReply(true);
    try {
      await addGrievanceMessage(id, {
        senderId: currentUser.uid,
        senderName: userProfile.displayName || (isEn ? 'Weaver' : 'बुनकर'),
        senderRole: 'weaver',
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
    switch (category) {
      case 'payment':
        return isEn ? 'Payment Related' : 'भुगतान संबंधी (Payment)';
      case 'raw material':
        return isEn ? 'Raw Material Related' : 'कच्चा माल संबंधी (Raw Material)';
      case 'other':
        return isEn ? 'Other Issues' : 'अन्य विषय (Other)';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <WeaverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-heading text-2xl text-loom-wood animate-pulse">
            {isEn ? 'Loading grievance details...' : 'शिकायत विवरण लोड हो रहा है...'}
          </p>
        </div>
      </WeaverLayout>
    );
  }

  if (!grievance) {
    return (
      <WeaverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="p-8 text-center vintage-card bg-loom-cream max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-loom-error mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-loom-wood">
            {isEn ? 'Grievance Details Not Found' : 'शिकायत विवरण नहीं मिला'}
          </h2>
          <Button 
            onClick={() => navigate('/weaver')} 
            className="mt-6 w-full font-heading font-bold"
          >
            {isEn ? 'Back to Dashboard' : 'डैशबोर्ड पर वापस जाएं'}
          </Button>
        </div>
      </WeaverLayout>
    );
  }

  return (
    <WeaverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Header with Back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/weaver')}
          className="inline-flex items-center gap-2 text-loom-wood hover:text-loom-gold font-heading font-bold text-base mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 
          {isEn ? 'Back to List' : 'मेरी शिकायतों पर वापस जाएं (Back to List)'}
        </button>
        <h1 className="font-heading text-3xl font-bold text-loom-wood">
          {isEn ? 'My Grievance Ticket' : 'शिकायत एवं सहायता संवाद (My Grievance Ticket)'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Summary info Card */}
        <div className="vintage-card p-6 bg-loom-cream border-t-4 border-t-loom-wood shadow-md">
          <span className="text-xs text-loom-gold font-bold font-heading uppercase tracking-widest block mb-2">
            {isEn ? 'Grievance Summary' : 'शिकायत विवरण (Grievance Summary)'}
          </span>
          <h2 className="font-heading text-2xl font-black text-loom-wood mb-3 leading-tight">{grievance.subject}</h2>
          
          <div className="border-t border-loom-beige/30 pt-3.5 mt-4 space-y-3 font-body text-base text-loom-ink">
            <div>
              <span className="text-xs text-loom-ink-light font-bold block">
                {isEn ? 'Category:' : 'शिकायत श्रेणी (Category):'}
              </span>
              <span className="font-semibold text-loom-wood">{getCategoryText(grievance.category)}</span>
            </div>
            <div>
              <span className="text-xs text-loom-ink-light font-bold block">
                {isEn ? 'Date Created:' : 'दर्ज करने की तिथि (Date Created):'}
              </span>
              <span className="font-mono text-sm">
                {new Date(grievance.createdAt).toLocaleDateString(isEn ? 'en-US' : 'hi-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1.5">
              <span className="text-xs text-loom-ink-light font-bold">
                {isEn ? 'Status:' : 'स्थिति (Status):'}
              </span>
              <StatusBadge status={grievance.status} />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-amber-50/50 border border-loom-gold/20 rounded-xl text-xs text-loom-ink-light leading-relaxed font-body">
            {isEn 
              ? '💡 If the secretary has changed the status to "In Progress" or "Resolved", it will be displayed here along with details in the chat.'
              : '💡 यदि सचिव साहब ने स्थिति "प्रगति पर" या "हल" में बदल दी है, तो वह आपको यहाँ चैट में विवरण के साथ दिखाई देगी।'}
          </div>
        </div>

        {/* Right Side: Conversation stream & Reply box */}
        <div className="lg:col-span-2">
          <div className="vintage-card p-6 bg-loom-cream border-t-4 border-t-loom-gold shadow-md flex flex-col h-[520px]">
            <h3 className="font-heading text-lg font-bold text-loom-wood flex items-center gap-2 border-b border-loom-beige/30 pb-3 mb-4">
              <MessageSquare className="w-5 h-5 text-loom-gold" />
              {isEn ? 'Message Board' : 'सचिव साहब के साथ बातचीत सूत्र (Message Board)'}
            </h3>

            {/* Discussion Thread */}
            <div className="flex-1 overflow-y-auto mb-4">
              <GrievanceMessageThread 
                messages={messages} 
                currentUserId={currentUser?.uid || ''} 
              />
            </div>

            {/* Reply form */}
            {grievance.status === 'resolved' ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 font-body text-sm font-semibold">
                {isEn 
                  ? '✓ This grievance has been resolved. If the problem persists, please contact the Secretary.'
                  : '✓ यह शिकायत हल हो चुकी है। यदि समस्या बनी हुई है, तो कृपया सचिव से संपर्क करें।'}
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-loom-beige/30">
                <textarea
                  placeholder={isEn ? 'Type your message...' : 'सचिव साहब को उत्तर लिखें... (Type your message...)'}
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
    </WeaverLayout>
  );
};
