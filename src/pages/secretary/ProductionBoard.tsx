import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getJobCardsByCooperative } from '../../firebase/firestore';
import { JobCard } from '../../types';
import { Plus, Hammer, Eye, FileCheck2, Calendar, ClipboardCheck, Clock } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';

import { useTranslation } from 'react-i18next';

export const ProductionBoard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in_progress' | 'completed' | 'qc_passed' | 'qc_rejected'>('all');
  const [toastMessage, setToastMessage] = useState('');

  const fetchJobCards = async () => {
    if (!userProfile?.cooperativeId) return;
    setLoading(true);
    try {
      const cards = await getJobCardsByCooperative(userProfile.cooperativeId);
      setJobCards(cards);
    } catch (err) {
      console.error("Error fetching job cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, [userProfile?.cooperativeId, i18n.language]);

  const filteredCards = jobCards.filter((card) => {
    if (activeTab === 'all') return true;
    return card.status === activeTab;
  });

  const getStatusBadge = (status: JobCard['status']) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full border border-blue-200 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {isEn ? "Assigned" : "असाइन"}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full border border-amber-200 font-bold">
            <Hammer className="w-3.5 h-3.5" />
            {isEn ? "In Progress" : "प्रगति पर"}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full border border-green-200 font-bold">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {isEn ? "Completed" : "पूर्ण"}
          </span>
        );
      case 'qc_passed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-sm px-3 py-1 rounded-full border border-emerald-800 font-bold">
            <FileCheck2 className="w-3.5 h-3.5" />
            {isEn ? "QC Passed" : "QC पास"}
          </span>
        );
      case 'qc_rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full border border-red-200 font-bold">
            {isEn ? "QC Failed" : "❌ QC असफल"}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isEn ? 'en-US' : 'hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <SecretaryLayout>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Hero Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-loom-wood flex items-center gap-2">
            <Hammer className="w-8 h-8 text-loom-gold shrink-0 animate-pulse" />
            उत्पादन ट्रैकिंग बोर्ड (Production Board)
          </h1>
          <p className="font-body text-loom-ink/70 mt-1">
            समिति के बुनकरों के चल रहे बुनाई कार्यों की स्थिति देखें और गुणवत्ता नियंत्रण (QC) संचालित करें।
          </p>
        </div>

        <button
          onClick={() => navigate('/secretary/production/new')}
          className="vintage-button px-5 py-3 flex items-center gap-2 text-base shrink-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5 shrink-0" />
          नया कार्य कार्ड (New Job Card)
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-loom-beige/50 pb-4">
        {[
          { key: 'all', label: 'सभी कार्य' },
          { key: 'assigned', label: 'असाइन किया गया' },
          { key: 'in_progress', label: 'प्रगति पर' },
          { key: 'completed', label: 'पूर्ण कार्य' },
          { key: 'qc_passed', label: 'QC पास' },
          { key: 'qc_rejected', label: 'QC असफल' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-base font-heading font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-loom-wood text-loom-cream shadow-md font-bold'
                : 'bg-loom-cream hover:bg-loom-sand/20 text-loom-wood border border-loom-beige/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Production List Table */}
      <div className="vintage-card p-6 overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-loom-wood mt-2 animate-pulse font-semibold">कार्य कार्ड लोड हो रहे हैं...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📋</span>
            <h3 className="font-heading text-xl font-bold text-loom-wood">कोई कार्य कार्ड नहीं मिला</h3>
            <p className="font-body text-loom-ink/70 max-w-md mx-auto mt-2">
              चयनित श्रेणी में इस सहकारी समिति के अंतर्गत कोई उत्पादन कार्य कार्ड उपलब्ध नहीं है।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-loom-beige bg-loom-sand/20">
                  <th className="p-4 font-heading font-bold text-loom-wood text-base">शीर्षक और डिजाइन कोड</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-base">सौंपा गया बुनकर</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-base text-center">मात्रा (पीस)</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-base text-center">स्थिति</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-base">अंतिम तिथि</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-base text-center">कार्यवाही</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => (
                  <tr 
                    key={card.jobCardId} 
                    className="border-b border-loom-beige/50 hover:bg-loom-sand/10 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-loom-wood text-lg">{card.title}</span>
                        <span className="text-xs font-mono bg-loom-sand text-loom-wood px-2 py-0.5 rounded w-max mt-1 border border-loom-beige">
                          {card.designCode}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-heading text-loom-wood font-semibold">
                      {card.assignedToName}
                    </td>
                    <td className="p-4 font-body font-bold text-center text-lg text-loom-ink">
                      {card.quantity}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(card.status)}
                    </td>
                    <td className="p-4 font-body text-loom-ink/80">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4 text-loom-gold shrink-0" />
                        {formatDate(card.deadline)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/secretary/production/${card.jobCardId}`}
                          className="bg-loom-sand hover:bg-loom-beige text-loom-wood px-3 py-1.5 rounded-lg font-heading text-sm font-bold transition-all flex items-center gap-1 border border-loom-beige/50"
                        >
                          <Eye className="w-4 h-4" />
                          विवरण
                        </Link>
                        {card.status === 'completed' && (
                          <Link
                            to={`/secretary/production/${card.jobCardId}`}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-heading text-sm font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            QC करें
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SecretaryLayout>
  );
};
