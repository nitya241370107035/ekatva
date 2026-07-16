import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getProcurementAdvice, consolidateIndentRequests } from '../../firebase/firestore';
import { Sparkles, RefreshCw, AlertCircle, ShoppingBag, CheckCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';

export const ProcurementAdvisorPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [adviceList, setAdviceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const getMaterialTranslation = (matName: string) => {
    const map: Record<string, string> = {
      "रेसम धागा": t('materials.silkYarn', 'रेसम धागा'),
      "सूती धागा": t('materials.cottonYarn', 'सूती धागा'),
      "जरी": t('materials.zari', 'जरी'),
      "रंगाई सामग्री": t('materials.dyeingMaterial', 'रंगाई सामग्री'),
    };
    return map[matName] || matName;
  };

  const getUnitTranslation = (unit: string) => {
    const map: Record<string, string> = {
      "किलोग्राम": t('units.kg', 'किलोग्राम'),
      "मीटर": t('units.meter', 'मीटर'),
      "पीस": t('units.pieces', 'पीस'),
    };
    return map[unit] || unit;
  };

  const translateReason = (reason: string, item: any) => {
    const stockQty = item.stockQuantity;
    const reorderLevel = item.reorderLevel || 10;
    const unit = getUnitTranslation(item.unit);
    const pendingQty = item.pendingRequestedQuantity || 0;

    if (reason.includes("त्योहारी")) {
      return t('advisor.reasonFestival', 'स्टॉक स्तर ({{stockQty}} {{unit}}) पुन: ऑर्डर स्तर ({{reorderLevel}} {{unit}}) से कम है। त्योहारी सीजन के कारण मांग 1.5 गुना अधिक है।', { stockQty, reorderLevel, unit });
    }
    if (reason.includes("आगामी मांग")) {
      return t('advisor.reasonReorderLow', 'स्टॉक स्तर ({{stockQty}} {{unit}}) पुन: ऑर्डर स्तर ({{reorderLevel}} {{unit}}) से कम है। आगामी मांग को पूरा करने के लिए तुरंत आर्डर करें।', { stockQty, reorderLevel, unit });
    }
    if (reason.includes("लंबित अनुरोधों")) {
      return t('advisor.reasonPendingHigher', 'बुनकरों के लंबित अनुरोधों की संख्या ({{pendingQty}} {{unit}}) वर्तमान स्टॉक ({{stockQty}} {{unit}}) से अधिक है।', { pendingQty, stockQty, unit });
    }
    if (reason.includes("सुरक्षित स्तर")) {
      return t('advisor.reasonNearReorder', 'स्टॉक सुरक्षित स्तर पर है परंतु पुन: ऑर्डर स्तर के निकट पहुंच रहा है। सुचारू उत्पादन के लिए बफर स्टॉक बनाएं।');
    }
    if (reason.includes("पर्याप्त मात्रा")) {
      return t('advisor.reasonOptimal', 'स्टॉक पर्याप्त मात्रा में उपलब्ध है ({{stockQty}} {{unit}})। तत्काल खरीद की आवश्यकता नहीं है।', { stockQty, unit });
    }
    if (reason.includes("नई सामग्री")) {
      return t('advisor.reasonNewMaterial', 'यह नई सामग्री वर्तमान स्टॉक में नहीं है परंतु बुनकरों ने {{pendingQty}} {{unit}} का अनुरोध किया है।', { pendingQty, unit });
    }
    return reason;
  };

  const fetchAdvice = async () => {
    if (!userProfile?.cooperativeId) return;
    try {
      setLoading(true);
      const list = await getProcurementAdvice(userProfile.cooperativeId);
      setAdviceList(list);
    } catch (err) {
      console.error("Error fetching advice:", err);
      toast.error(t('advisor.fetchError', 'सलाहकार रिपोर्ट लोड करने में त्रुटि'), { className: 'vintage-toast' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [userProfile?.cooperativeId]);

  const handleCreateAutoIndent = async (advice: any) => {
    if (!userProfile?.cooperativeId) return;
    try {
      setCreatingId(advice.materialName);
      
      // Auto create draft bulk indent with suggested quantity
      const indentId = await consolidateIndentRequests(
        userProfile.cooperativeId,
        [], // No weavers' requests selected (independent)
        advice.materialName,
        advice.suggestedQuantity,
        advice.unit
      );

      toast.success(t('advisor.indentCreateSuccess', 'सफलतापूर्वक {{material}} के लिए ड्राफ़्ट बल्क इंडेंट बनाया गया!', { material: getMaterialTranslation(advice.materialName) }), { className: 'vintage-toast' });
      
      // Refresh advice list to update calculation (if needed, or just let them know it's created)
      await fetchAdvice();
    } catch (err) {
      console.error("Error auto-creating indent:", err);
      toast.error(t('advisor.indentCreateError', 'इंडेंट बनाने में विफलता'), { className: 'vintage-toast' });
    } finally {
      setCreatingId(null);
    }
  };

  const highPriority = adviceList.filter(a => a.urgency === 'high');
  const mediumPriority = adviceList.filter(a => a.urgency === 'medium');
  const lowPriority = adviceList.filter(a => a.urgency === 'low');

  const currentMonthName = new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'), { month: 'long' });
  const isFestivalSeason = new Date().getMonth() >= 8 && new Date().getMonth() <= 10;

  return (
    <SecretaryLayout>
      <Toaster position="top-right" />
      <div className="space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 p-5 rounded-2xl border border-loom-beige/50 backdrop-blur-xs">
          <div>
            <h1 className="font-heading text-3xl font-bold text-loom-wood flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-loom-gold fill-loom-gold/20" />
              {t('advisor.title', 'पूर्वानुमान खरीद सलाहकार (Predictive Procurement Advisor)')}
            </h1>
            <p className="font-body text-sm text-loom-ink-light mt-1">
              {t('advisor.subtitle', 'मशीन विश्लेषण और वर्तमान मांग के अनुसार कच्चे माल की आवश्यकता का पूर्वानुमान और समेकित समीक्षा।')}
            </p>
          </div>
          <button
            onClick={fetchAdvice}
            className="vintage-button px-4 py-2 flex items-center gap-1.5 shrink-0 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('advisor.recalculate', 'पुनः गणना करें (Recalculate)')}
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-4 bg-loom-gold/10 border border-loom-gold/30 rounded-xl flex gap-3 text-loom-ink">
          <TrendingUp className="w-6 h-6 text-loom-gold shrink-0 mt-0.5" />
          <div className="text-sm font-body">
            <span className="font-heading font-bold text-loom-wood block text-base">{t('advisor.insightsActive', 'स्मार्ट विश्लेषण सक्रिय है (Smart Insights Active)')}</span>
            {t('advisor.bannerDesc', 'यह सलाहकार वर्तमान समय {{month}} के आधार पर त्योहारी मांग और बुनकर के व्यक्तिगत अनुरोधों का विश्लेषण करता है।', { month: currentMonthName })} 
            {isFestivalSeason ? (
              <span className="text-red-700 font-semibold block mt-1">
                {t('advisor.festivalSeasonWarning', '⚠️ वर्तमान में त्योहारों का मौसम है (सितंबर-नवंबर), इसलिए आपकी मांग में 1.5 गुणा का बफ़र फैक्टर जोड़ा गया है।')}
              </span>
            ) : (
              <span className="text-emerald-700 block mt-1">
                {t('advisor.stableSeasonInfo', '✓ वर्तमान ऋतु में मांग स्थिर है। खरीद सामान्य पुन:ऑर्डर मानकों के अनुसार सुझाई गई है।')}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-loom-wood mt-4 text-sm animate-pulse">{t('advisor.calculating', 'मशीन गणना कर रही है...')}</p>
          </div>
        ) : adviceList.length === 0 ? (
          <div className="vintage-card p-12 text-center max-w-2xl mx-auto">
            <span className="text-6xl block mb-4">😇</span>
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">{t('advisor.safeStockTitle', 'सभी स्टॉक सुरक्षित हैं')}</h3>
            <p className="font-body text-base text-loom-ink-light">
              {t('advisor.safeStockDesc', 'आपकी सहकारी समिति का सारा कच्चा माल पर्याप्त स्टॉक स्तर पर है। कोई तात्कालिक खरीद सुझाई नहीं गई है।')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 🔴 HIGH PRIORITY */}
            {highPriority.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-red-700 flex items-center gap-2 border-b border-red-200 pb-1.5">
                  <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                  {t('advisor.highPriority', '🔴 उच्च प्राथमिकता सिफारिशें (Urgent Actions Required)')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {highPriority.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="vintage-card p-5 border-t-4 border-red-600 bg-white hover:scale-101 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-heading text-lg font-bold text-loom-wood">{getMaterialTranslation(item.materialName)}</h3>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">{t('advisor.urgentBadge', 'अत्यंत आवश्यक')}</span>
                        </div>
                        
                        <p className="font-body text-xs text-loom-ink/90 italic p-3 bg-red-50/50 rounded-xl border border-red-100 mb-4 leading-relaxed">
                          "{translateReason(item.reason, item)}"
                        </p>

                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-loom-sand/10 rounded-xl border border-loom-beige/30 font-body text-xs text-center mb-4">
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.currentStock', 'वर्तमान स्टॉक')}</span>
                            <span className="font-bold text-sm text-loom-ink">{item.stockQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.pendingRequests', 'लंबित अनुरोध')}</span>
                            <span className="font-bold text-sm text-red-600">{item.pendingRequestedQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading text-loom-wood font-bold">{t('advisor.suggestedOrder', 'सुझाया गया ऑर्डर')}</span>
                            <span className="font-bold text-sm text-emerald-700">{item.suggestedQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCreateAutoIndent(item)}
                        disabled={creatingId !== null}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-heading font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {creatingId === item.materialName ? t('advisor.creatingIndent', 'इंडेंट बनाया जा रहा है...') : t('advisor.autoCreateBtn', 'ऑटो इंडेंट ड्राफ़्ट बनाएं (Auto-Create Draft)')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🟡 MEDIUM PRIORITY */}
            {mediumPriority.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-amber-700 flex items-center gap-2 border-b border-amber-200 pb-1.5">
                  <span className="w-3 h-3 bg-amber-500 rounded-full" />
                  {t('advisor.mediumPriority', '🟡 मध्यम प्राथमिकता सिफारिशें (Proactive Reordering)')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediumPriority.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="vintage-card p-5 border-t-4 border-amber-500 bg-white hover:scale-101 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-heading text-lg font-bold text-loom-wood">{getMaterialTranslation(item.materialName)}</h3>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">{t('advisor.mediumBadge', 'मध्यम')}</span>
                        </div>
                        
                        <p className="font-body text-xs text-loom-ink/90 italic p-3 bg-amber-50/50 rounded-xl border border-amber-100 mb-4 leading-relaxed">
                          "{translateReason(item.reason, item)}"
                        </p>

                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-loom-sand/10 rounded-xl border border-loom-beige/30 font-body text-xs text-center mb-4">
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.currentStock', 'वर्तमान स्टॉक')}</span>
                            <span className="font-bold text-sm text-loom-ink">{item.stockQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.pendingRequests', 'लंबित अनुरोध')}</span>
                            <span className="font-bold text-sm text-amber-600">{item.pendingRequestedQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading text-loom-wood font-bold">{t('advisor.suggestedOrder', 'सुझाया गया ऑर्डर')}</span>
                            <span className="font-bold text-sm text-emerald-700">{item.suggestedQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCreateAutoIndent(item)}
                        disabled={creatingId !== null}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-heading font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {creatingId === item.materialName ? t('advisor.creatingIndent', 'इंडेंट बनाया जा रहा है...') : t('advisor.autoCreateBtn', 'ऑटो इंडेंट ड्राफ़्ट बनाएं (Auto-Create Draft)')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🟢 LOW PRIORITY */}
            {lowPriority.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-emerald-700 flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                  {t('advisor.lowPriority', '🟢 सुरक्षित स्टॉक (Optimal Stock Levels)')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lowPriority.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="vintage-card p-5 border-t-4 border-emerald-500 bg-white flex flex-col justify-between opacity-80"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-heading text-lg font-bold text-loom-wood">{getMaterialTranslation(item.materialName)}</h3>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">{t('advisor.safeBadge', 'सुरक्षित')}</span>
                        </div>
                        
                        <p className="font-body text-xs text-loom-ink/90 italic p-3 bg-emerald-50/30 rounded-xl border border-emerald-100 mb-4 leading-relaxed">
                          "{translateReason(item.reason, item)}"
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-loom-sand/10 rounded-xl border border-loom-beige/30 font-body text-xs text-center">
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.currentStock', 'वर्तमान स्टॉक')}</span>
                            <span className="font-bold text-sm text-loom-ink">{item.stockQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading text-loom-ink-light">{t('advisor.pendingRequests', 'लंबित अनुरोध')}</span>
                            <span className="font-bold text-sm text-loom-ink">{item.pendingRequestedQuantity} {getUnitTranslation(item.unit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SecretaryLayout>
  );
};
