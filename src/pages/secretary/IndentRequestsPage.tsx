import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getIndentRequestsByCooperative, 
  getBulkIndents, 
  consolidateIndentRequests, 
  updateBulkIndentStatus 
} from '../../firebase/firestore';
import { IndentRequest, BulkIndent, Vendor } from '../../types';
import { VendorSelectionModal } from '../../components/VendorSelectionModal';
import { 
  Layers, 
  ShoppingBag, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  FileText 
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { useTranslation } from 'react-i18next';

export const IndentRequestsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [activeTab, setActiveTab] = useState<'pending' | 'bulk'>('pending');
  const [pendingRequests, setPendingRequests] = useState<IndentRequest[]>([]);
  const [bulkIndents, setBulkIndents] = useState<BulkIndent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search / Filters
  const [materialFilter, setMaterialFilter] = useState('');
  
  // Consolidation State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMaterialName, setSelectedMaterialName] = useState<string | null>(null);

  // Vendor Modal State
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [activeBulkIndent, setActiveBulkIndent] = useState<BulkIndent | null>(null);

  // Quote Dialog State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quotingIndent, setQuotingIndent] = useState<BulkIndent | null>(null);

  const getUnitLabel = (u: string) => {
    if (!isEn) return u;
    const map: Record<string, string> = {
      'किलोग्राम': 'kg',
      'ग्राम': 'g',
      'मीटर': 'm',
      'कोन': 'Cone'
    };
    return map[u] || u;
  };

  const loadData = async () => {
    if (!userProfile?.cooperativeId) return;
    try {
      setLoading(true);
      const reqs = await getIndentRequestsByCooperative(userProfile.cooperativeId);
      // Filter only 'pending' for Tab 1, but we can fetch all. Let's keep pending separately.
      setPendingRequests(reqs.filter(r => r.status === 'pending'));
      
      const bulks = await getBulkIndents(userProfile.cooperativeId);
      setBulkIndents(bulks);
    } catch (err) {
      console.error("Error loading indents data:", err);
      toast.error(isEn ? "Error loading data" : "डेटा लोड करने में त्रुटि हुई", { className: 'vintage-toast' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile?.cooperativeId, i18n.language]);

  // Handle select checkbox
  const handleSelectRequest = (req: IndentRequest) => {
    if (selectedIds.includes(req.requestId)) {
      const updated = selectedIds.filter(id => id !== req.requestId);
      setSelectedIds(updated);
      if (updated.length === 0) {
        setSelectedMaterialName(null);
      }
    } else {
      // If we already selected another material, we shouldn't allow (disabled via UI, but double-check)
      if (selectedMaterialName && selectedMaterialName !== req.materialName) {
        toast.error(isEn ? "Only requests of the same material type can be consolidated" : "केवल एक ही प्रकार की सामग्री का समेकन किया जा सकता है", { className: 'vintage-toast' });
        return;
      }
      setSelectedIds([...selectedIds, req.requestId]);
      setSelectedMaterialName(req.materialName);
    }
  };

  // Consolidate Selected
  const handleConsolidate = async () => {
    if (selectedIds.length === 0 || !selectedMaterialName || !userProfile?.cooperativeId) return;
    
    // Find unit from selected requests
    const sampleReq = pendingRequests.find(r => r.requestId === selectedIds[0]);
    const unit = sampleReq?.unit || 'किलोग्राम';
    
    // Sum quantity
    const totalQuantity = pendingRequests
      .filter(r => selectedIds.includes(r.requestId))
      .reduce((sum, r) => sum + r.quantity, 0);

    try {
      await consolidateIndentRequests(
        userProfile.cooperativeId,
        selectedIds,
        selectedMaterialName,
        totalQuantity,
        unit
      );

      toast.success(isEn ? "Bulk indent created successfully!" : "बल्क इंडेंट सफलतापूर्वक बनाया गया!", { className: 'vintage-toast' });
      
      // Clear selection
      setSelectedIds([]);
      setSelectedMaterialName(null);
      
      // Reload and switch to Bulk tab
      await loadData();
      setActiveTab('bulk');
    } catch (err) {
      console.error("Error consolidating:", err);
      toast.error(isEn ? "Consolidation process failed" : "समेकन प्रक्रिया विफल रही", { className: 'vintage-toast' });
    }
  };

  // Vendor selection handler
  const handleVendorSelect = async (vendor: Vendor, quote?: number) => {
    if (!activeBulkIndent) return;
    try {
      const extraFields: Partial<BulkIndent> = {
        vendorId: vendor.vendorId,
        vendorName: vendor.name,
      };
      if (quote !== undefined) {
        extraFields.vendorQuote = quote;
      }
      
      await updateBulkIndentStatus(activeBulkIndent.indentId, 'sent_to_vendor', extraFields);
      toast.success(isEn ? `Indent request sent to ${vendor.name}!` : `सामग्री मांग पत्र ${vendor.name} को भेजा गया!`, { className: 'vintage-toast' });
      
      setVendorModalOpen(false);
      setActiveBulkIndent(null);
      await loadData();
    } catch (err) {
      console.error("Error sending to vendor:", err);
      toast.error(isEn ? "Error sending to vendor" : "विक्रेता को भेजने में त्रुटि", { className: 'vintage-toast' });
    }
  };

  // Status transitions
  const handleMarkAsOrdered = async (indent: BulkIndent) => {
    try {
      await updateBulkIndentStatus(indent.indentId, 'ordered');
      toast.success(isEn ? "Successfully marked as 'Ordered'" : "सफलतापूर्वक 'ऑर्डर किया गया' चिह्नित किया गया", { className: 'vintage-toast' });
      await loadData();
    } catch (err) {
      console.error("Error transition to ordered:", err);
      toast.error(isEn ? "Unable to mark as ordered" : "ऑर्डर चिह्नित करने में असमर्थ", { className: 'vintage-toast' });
    }
  };

  const handleMarkAsReceived = async (indent: BulkIndent) => {
    try {
      await updateBulkIndentStatus(indent.indentId, 'received');
      toast.success(isEn ? "Material received! Stock levels updated." : "सामग्री प्राप्त हुई! स्टॉक मात्रा बढ़ाई गई है।", { className: 'vintage-toast' });
      await loadData();
    } catch (err) {
      console.error("Error transition to received:", err);
      toast.error(isEn ? "Unable to mark as received" : "सामग्री प्राप्त चिह्नित करने में असमर्थ", { className: 'vintage-toast' });
    }
  };

  // Add/Update quote price directly
  const handleOpenQuoteDialog = (indent: BulkIndent) => {
    setQuotingIndent(indent);
    setQuotePrice(indent.vendorQuote ? indent.vendorQuote.toString() : '');
    setQuoteModalOpen(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotingIndent || !quotePrice) return;
    try {
      await updateBulkIndentStatus(quotingIndent.indentId, quotingIndent.status, {
        vendorQuote: parseFloat(quotePrice)
      });
      toast.success(isEn ? "Quoted price saved successfully." : "कोटेशन मूल्य सहेज लिया गया है।", { className: 'vintage-toast' });
      setQuoteModalOpen(false);
      setQuotingIndent(null);
      await loadData();
    } catch (err) {
      console.error("Error updating quote:", err);
      toast.error(isEn ? "Failed to update quoted price" : "कोटेशन मूल्य अद्यतन करने में विफल", { className: 'vintage-toast' });
    }
  };

  // Filter requests by material
  const filteredPending = pendingRequests.filter(r => 
    r.materialName.toLowerCase().includes(materialFilter.toLowerCase()) ||
    r.weaverName.toLowerCase().includes(materialFilter.toLowerCase())
  );

  return (
    <SecretaryLayout>
      <Toaster position="top-right" />
      <div className="space-y-6 animate-fade-in">
        
        {/* Header Title */}
        <div className="bg-white/40 p-5 rounded-2xl border border-loom-beige/50 backdrop-blur-xs">
          <h1 className="font-heading text-3xl font-bold text-loom-wood flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-loom-gold" />
            {isEn ? "Bulk Procurement & Indent" : "सामूहिक खरीद एवं इंडेंट प्रबंधन (Bulk Procurement & Indent)"}
          </h1>
          <p className="font-body text-sm text-loom-ink-light mt-1">
            {isEn 
              ? "Consolidate individual weaver raw material requests, issue bulk orders to vendors, and manage stock."
              : "बुनकरों के व्यक्तिगत धागे/जरी अनुरोधों को समेकित करें, बल्क आर्डर जारी करें और स्टॉक अपडेट करें।"}
          </p>
        </div>

        {/* Customized Vintage Tabs */}
        <div className="flex border-b border-loom-beige gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-3 font-heading font-bold text-base transition-all rounded-t-xl border-t-2 border-x ${
              activeTab === 'pending'
                ? 'bg-white border-loom-gold text-loom-wood border-x-loom-beige -mb-[1px]'
                : 'bg-loom-sand/10 border-transparent text-loom-ink/60 hover:bg-loom-sand/20 hover:text-loom-ink'
            }`}
          >
            {isEn ? "Pending Requests" : "लंबित अनुरोध"} ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-5 py-3 font-heading font-bold text-base transition-all rounded-t-xl border-t-2 border-x ${
              activeTab === 'bulk'
                ? 'bg-white border-loom-gold text-loom-wood border-x-loom-beige -mb-[1px]'
                : 'bg-loom-sand/10 border-transparent text-loom-ink/60 hover:bg-loom-sand/20 hover:text-loom-ink'
            }`}
          >
            {isEn ? "Consolidated Bulk Indents" : "समेकित बल्क इंडेंट"} ({bulkIndents.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-loom-wood mt-4 text-sm animate-pulse">
              {isEn ? "Loading..." : "लोड हो रहा है..."}
            </p>
          </div>
        ) : activeTab === 'pending' ? (
          /* TAB 1: PENDING REQUESTS */
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-loom-beige shadow-xs">
              <input
                type="text"
                placeholder={isEn ? "Search weaver or material..." : "बुनकर का नाम या सामग्री खोजें..."}
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full sm:max-w-md vintage-input py-1.5 px-3 text-sm"
              />
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 sm:ml-auto bg-loom-gold/10 p-2 px-4 rounded-xl border border-loom-gold/30">
                  <span className="text-xs font-body text-loom-wood font-semibold">
                    {isEn 
                      ? `Selected: ${selectedIds.length} request(s) (${selectedMaterialName})`
                      : `चयनित: ${selectedIds.length} अनुरोध (${selectedMaterialName})`}
                  </span>
                  <button
                    onClick={handleConsolidate}
                    className="vintage-button px-4 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isEn ? "Consolidate Bulk" : "समेकित करें (Consolidate Bulk)"}
                  </button>
                </div>
              )}
            </div>

            {filteredPending.length === 0 ? (
              <div className="vintage-card p-12 text-center max-w-2xl mx-auto">
                <span className="text-5xl block mb-2">📦</span>
                <p className="font-heading font-semibold text-loom-wood">
                  {isEn ? "No pending requests found" : "कोई लंबित अनुरोध नहीं है"}
                </p>
                <p className="font-body text-xs text-loom-ink-light mt-1">
                  {isEn 
                    ? "All weaver demands have been consolidated or there are no requests at present."
                    : "सभी बुनकरों की मांगें पहले से समेकित की जा चुकी हैं या वर्तमान में कोई अनुरोध नहीं है।"}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-loom-beige rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left font-body text-sm">
                    <thead>
                      <tr className="bg-loom-wood text-white font-heading">
                        <th className="p-4 w-12 text-center">{isEn ? "Select" : "चयन"}</th>
                        <th className="p-4">{isEn ? "Weaver Name" : "बुनकर का नाम"}</th>
                        <th className="p-4">{isEn ? "Raw Material" : "कच्चा माल"}</th>
                        <th className="p-4 text-right">{isEn ? "Quantity" : "मात्रा"}</th>
                        <th className="p-4">{isEn ? "Needed By Date" : "आवश्यकता तिथि"}</th>
                        <th className="p-4">{isEn ? "Request Date" : "अनुरोध दिनांक"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-loom-beige/50">
                      {filteredPending.map((req) => {
                        const isSelected = selectedIds.includes(req.requestId);
                        const isDisabled = selectedMaterialName !== null && selectedMaterialName !== req.materialName;
                        
                        return (
                          <tr 
                            key={req.requestId}
                            className={`hover:bg-loom-cream/40 transition-colors ${
                              isSelected ? 'bg-loom-gold/5' : ''
                            } ${isDisabled ? 'opacity-40' : ''}`}
                          >
                            <td className="p-4 text-center">
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={() => handleSelectRequest(req)}
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  isDisabled ? 'cursor-not-allowed text-gray-300' : 'text-loom-wood hover:bg-loom-sand/20'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-loom-wood fill-loom-gold/20" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                            <td className="p-4 font-bold text-loom-wood">{req.weaverName}</td>
                            <td className="p-4">
                              <span className="bg-loom-sand/20 border border-loom-beige px-2.5 py-0.5 rounded-md text-xs font-semibold text-loom-ink">
                                {req.materialName}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-loom-ink">
                              {req.quantity} {getUnitLabel(req.unit)}
                            </td>
                            <td className="p-4 text-loom-ink-light text-xs">
                              {req.requiredByDate ? new Date(req.requiredByDate).toLocaleDateString(isEn ? 'en-US' : 'hi-IN') : (isEn ? 'Urgent' : 'शीघ्र ही')}
                            </td>
                            <td className="p-4 text-loom-ink-light text-xs">
                              {new Date(req.createdAt).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: BULK INDENTS LIST */
          <div className="space-y-4">
            {bulkIndents.length === 0 ? (
              <div className="vintage-card p-12 text-center max-w-2xl mx-auto">
                <span className="text-5xl block mb-2">📝</span>
                <p className="font-heading font-semibold text-loom-wood">
                  {isEn ? "No bulk indents available" : "कोई बल्क इंडेंट उपलब्ध नहीं है"}
                </p>
                <p className="font-body text-xs text-loom-ink-light mt-1">
                  {isEn 
                    ? "Go to the 'Pending Requests' tab to select and consolidate your first bulk indent."
                    : "लंबित बुनकर अनुरोधों को चुनकर पहला समेकित बल्क इंडेंट बनाने के लिए \"लंबित अनुरोध\" टैब पर जाएं।"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bulkIndents.map((indent) => (
                  <div 
                    key={indent.indentId}
                    className="vintage-card p-5 bg-white hover:border-loom-gold/80 transition-all border-l-4"
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      
                      {/* Left: Metadata & Material Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-loom-ink-light">ID: {indent.indentId.substring(0,8).toUpperCase()}</span>
                          <span className="text-xs text-loom-ink-light">•</span>
                          <span className="text-xs text-loom-ink-light flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-loom-gold" /> {new Date(indent.createdAt).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <h3 className="font-heading text-lg font-bold text-loom-wood">{indent.materialName}</h3>
                          <span className="font-body text-sm text-loom-ink-light">{isEn ? "Total Qty:" : "कुल मात्रा:"}</span>
                          <span className="font-mono font-bold text-base text-loom-ink bg-loom-sand/15 px-2.5 py-0.5 rounded-md border border-loom-beige/50">
                            {indent.totalQuantity} {getUnitLabel(indent.unit)}
                          </span>
                        </div>

                        {indent.vendorName ? (
                          <div className="p-3 bg-loom-cream/40 rounded-xl border border-loom-beige/40 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="font-body text-loom-ink flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-loom-gold" />
                              <strong className="text-loom-wood">{isEn ? "Vendor:" : "विक्रेता:"}</strong> {indent.vendorName}
                            </span>
                            {indent.vendorQuote !== undefined && (
                              <span className="font-body text-loom-ink flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-loom-gold" />
                                <strong className="text-loom-wood">{isEn ? "Quote:" : "कोटेशन:"}</strong> ₹{indent.vendorQuote.toLocaleString(isEn ? 'en-US' : 'en-IN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-body text-amber-600 italic">{isEn ? "⚠️ No vendor assigned" : "⚠️ कोई विक्रेता असाइन नहीं किया गया है"}</p>
                        )}

                        <div className="text-xs font-body text-loom-ink-light">
                          {isEn ? "Consolidated weaver requests count:" : "समेकित बुनकर अनुरोधों की संख्या:"} <strong className="text-loom-wood">{indent.requestIds.length}</strong>
                        </div>
                      </div>

                      {/* Right: Actions & Current Status Badge */}
                      <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-end gap-3 shrink-0 border-t sm:border-t-0 lg:border-t-0 pt-3 sm:pt-0 lg:pt-0 border-loom-beige/30">
                        
                        {/* Status Badge */}
                        <div>
                          {indent.status === 'draft' && (
                            <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {isEn ? "Draft" : "ड्राफ्ट (Draft)"}
                            </span>
                          )}
                          {indent.status === 'sent_to_vendor' && (
                            <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 animate-pulse" /> {isEn ? "Sent to Vendor" : "विक्रेता को भेजा गया"}
                            </span>
                          )}
                          {indent.status === 'ordered' && (
                            <span className="px-3 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? "Ordered" : "आर्डर किया गया"}
                            </span>
                          )}
                          {indent.status === 'received' && (
                            <span className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? "Material Received" : "सामग्री प्राप्त हुई"}
                            </span>
                          )}
                        </div>

                        {/* Direct Workflow Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {indent.status === 'draft' && (
                            <button
                              onClick={() => {
                                setActiveBulkIndent(indent);
                                setVendorModalOpen(true);
                              }}
                              className="vintage-button px-4 py-1.5 text-xs flex items-center gap-1 cursor-pointer bg-loom-gold border-loom-gold/80 hover:bg-loom-gold/90 text-loom-wood"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              {isEn ? "Send to Vendor" : "विक्रेता को भेजें (Send)"}
                            </button>
                          )}

                          {indent.status === 'sent_to_vendor' && (
                            <>
                              <button
                                onClick={() => handleOpenQuoteDialog(indent)}
                                className="bg-white border border-loom-beige hover:bg-loom-sand/15 text-loom-wood px-4 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer"
                              >
                                {isEn ? "Add Quotation Rate" : "कोटेशन दर जोड़ें"}
                              </button>
                              <button
                                onClick={() => handleMarkAsOrdered(indent)}
                                className="vintage-button px-4 py-1.5 text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isEn ? "Mark Ordered" : "आर्डर करें (Mark Ordered)"}
                              </button>
                            </>
                          )}

                          {indent.status === 'ordered' && (
                            <button
                              onClick={() => handleMarkAsReceived(indent)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isEn ? "Mark Received" : "प्राप्त हुआ (Received)"}
                            </button>
                          )}

                          {indent.status === 'received' && (
                            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                              {isEn ? "✓ Stock updated" : "✓ स्टॉक बढ़ा दिया गया है"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vendor Selection Modal */}
        <VendorSelectionModal
          isOpen={vendorModalOpen}
          onClose={() => {
            setVendorModalOpen(false);
            setActiveBulkIndent(null);
          }}
          materialName={activeBulkIndent?.materialName || ''}
          onSelect={handleVendorSelect}
        />

        {/* Add Quote Dialog Popup */}
        {quoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="vintage-card w-full max-w-sm bg-loom-parchment overflow-hidden border-t-8 border-loom-gold relative">
              <form onSubmit={handleSubmitQuote}>
                <div className="p-5 border-b border-loom-beige bg-loom-sand/10 flex justify-between items-center">
                  <h3 className="font-heading text-lg font-bold text-loom-wood">{isEn ? "Enter Quotation Price" : "कोटेशन मूल्य दर्ज करें"}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      setQuotingIndent(null);
                    }}
                    className="p-1 rounded-full text-loom-wood hover:bg-loom-sand/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-heading font-bold text-loom-wood">
                      {isEn ? "Total Quoted Value (₹) *" : "कुल कोटेशन मूल्य (₹) *"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-loom-ink-light">₹</span>
                      <input
                        type="number"
                        placeholder={isEn ? "e.g. 15000" : "जैसे: 15000"}
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold font-body"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-loom-beige bg-loom-sand/10 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      setQuotingIndent(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold text-loom-wood hover:bg-loom-sand/20 transition-all border border-loom-beige"
                  >
                    {isEn ? "Cancel" : "रद्द करें"}
                  </button>
                  <button
                    type="submit"
                    className="vintage-button px-4 py-2 text-xs"
                  >
                    {isEn ? "Save" : "सहेजें (Save)"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SecretaryLayout>
  );
};
