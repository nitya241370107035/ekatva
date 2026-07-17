import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getWeaversByCooperative, 
  getRawMaterialStock, 
  createJobCard 
} from '../../firebase/firestore';
import { WeaverProfile, RawMaterialStock, RawMaterialIssued } from '../../types';
import { ArrowLeft, Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';

import { useTranslation } from 'react-i18next';

export const CreateJobCard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [loading, setLoading] = useState(false);
  const [weavers, setWeavers] = useState<WeaverProfile[]>([]);
  const [stockList, setStockList] = useState<RawMaterialStock[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [designCode, setDesignCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [wagePerPiece, setWagePerPiece] = useState(0);

  // Dynamic Raw Materials issued list
  const [rawMaterialsIssued, setRawMaterialsIssued] = useState<RawMaterialIssued[]>([
    { materialName: '', quantity: 1, unit: 'किलोग्राम' }
  ]);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.cooperativeId) return;
      try {
        const [weaversData, stockData] = await Promise.all([
          getWeaversByCooperative(userProfile.cooperativeId),
          getRawMaterialStock(userProfile.cooperativeId)
        ]);
        setWeavers(weaversData);
        setStockList(stockData);
        if (weaversData.length > 0) {
          setAssignedTo(weaversData[0].weaverId);
        }
      } catch (err) {
        console.error("Error fetching form requirements:", err);
      }
    };
    fetchData();
  }, [userProfile?.cooperativeId, i18n.language]);

  const handleAddMaterialRow = () => {
    setRawMaterialsIssued([
      ...rawMaterialsIssued,
      { materialName: '', quantity: 1, unit: 'किलोग्राम' }
    ]);
  };

  const handleRemoveMaterialRow = (idx: number) => {
    const updated = [...rawMaterialsIssued];
    updated.splice(idx, 1);
    setRawMaterialsIssued(updated);
  };

  const handleMaterialChange = (idx: number, field: keyof RawMaterialIssued, value: any) => {
    const updated = [...rawMaterialsIssued];
    if (field === 'materialName') {
      updated[idx].materialName = value;
      // Auto fill the unit if we have it in stock
      const stockItem = stockList.find(s => s.materialName.toLowerCase() === value.toLowerCase());
      if (stockItem) {
        updated[idx].unit = stockItem.unit;
      }
    } else if (field === 'quantity') {
      updated[idx].quantity = Number(value);
    } else {
      updated[idx].unit = value;
    }
    setRawMaterialsIssued(updated);
  };

  // Quick lookup to check if a specific material row has enough stock
  const getStockAvailability = (row: RawMaterialIssued) => {
    if (!row.materialName) return null;
    const stockItem = stockList.find(
      s => s.materialName.trim().toLowerCase() === row.materialName.trim().toLowerCase()
    );
    if (!stockItem) return { exists: false, available: 0, enough: false };
    return {
      exists: true,
      available: stockItem.totalQuantity,
      enough: stockItem.totalQuantity >= row.quantity
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!userProfile?.cooperativeId || !currentUser?.uid) return;
    if (!assignedTo) {
      setErrorMessage(isEn ? 'Please select a weaver for the job.' : 'कृपया कार्य के लिए एक बुनकर चुनें।');
      return;
    }

    // Filter out rows with empty material names
    const materialsToIssue = rawMaterialsIssued.filter(row => row.materialName.trim() !== '');
    if (materialsToIssue.length === 0) {
      setErrorMessage(isEn ? 'Please add at least one raw material.' : 'कृपया कम से कम एक कच्चा माल दर्ज करें।');
      return;
    }

    setLoading(true);

    try {
      const selectedWeaver = weavers.find(w => w.weaverId === assignedTo);
      const assignedToName = selectedWeaver ? selectedWeaver.displayName : (isEn ? 'Weaver' : 'बुनकर');

      await createJobCard({
        cooperativeId: userProfile.cooperativeId,
        title: title.trim(),
        designCode: designCode.trim().toUpperCase(),
        quantity: Number(quantity),
        assignedTo,
        assignedToName,
        rawMaterialsIssued: materialsToIssue,
        deadline,
        wagePerPiece: Number(wagePerPiece)
      }, currentUser.uid);

      setToastMessage(isEn ? 'Job card created successfully and stock deducted!' : 'कार्य कार्ड सफलतापूर्वक बनाया और स्टॉक से काटा गया!');
      setTimeout(() => {
        navigate('/secretary/production');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (isEn ? 'Failed to create job card. Please try again.' : 'कार्य कार्ड बनाने में विफल। कृपया पुनः प्रयास करें।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SecretaryLayout>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Header and Go Back */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/secretary/production')}
          className="flex items-center gap-1.5 text-loom-wood hover:text-loom-wood-light font-heading font-semibold transition-all cursor-pointer text-base"
        >
          <ArrowLeft className="w-5 h-5" />
          {isEn ? "Back to Production Board" : "उत्पादन बोर्ड पर वापस जाएं"}
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="vintage-card p-6 sm:p-8">
          <div className="border-b-2 border-loom-beige pb-4 mb-6 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-loom-gold shrink-0" />
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-loom-wood">
                {isEn ? "Issue New Job Card" : "नया कार्य कार्ड जारी करें (Create Job Card)"}
              </h1>
              <p className="font-body text-loom-ink/70 text-sm mt-0.5">
                {isEn 
                  ? "Fill details to assign a new job to a weaver and issue raw materials."
                  : "बुनकर को नया कार्य सौंपने और सामग्री जारी करने के लिए विवरण भरें।"}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grid 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {isEn ? "Job Title *" : "शीर्षक (Job Title) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. Banarasi Saree - Design #102" : "जैसे: बनारसी साड़ी - डिजाइन #102"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {isEn ? "Design Code *" : "डिज़ाइन कोड (Design Code) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. BN-102" : "जैसे: BN-102"}
                  value={designCode}
                  onChange={(e) => setDesignCode(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body uppercase"
                />
              </div>
            </div>

            {/* Grid 2: Weaver Selection and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {isEn ? "Assign Weaver *" : "बुनकर चुनें (Assign Weaver) *"}
                </label>
                {weavers.length === 0 ? (
                  <div className="p-3 bg-loom-sand/20 border-2 border-dashed border-loom-beige rounded-xl text-sm font-body text-loom-ink/70">
                    {isEn ? "No weaver members found in this cooperative." : "सहकारी समिति में कोई बुनकर नहीं मिला।"}
                  </div>
                ) : (
                  <select
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-heading"
                  >
                    {weavers.map((w) => (
                      <option key={w.weaverId} value={w.weaverId}>
                        {w.displayName} ({w.skillTags.slice(0, 2).join(', ')})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {isEn ? "Quantity (Qty / Pieces) *" : "मात्रा (Qty / Pieces) *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                    {isEn ? "Wages per Piece (₹) *" : "मज़दूरी प्रति पीस (₹) *"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={wagePerPiece}
                    onChange={(e) => setWagePerPiece(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-loom-gold" />
                {isEn ? "Completion Deadline *" : "कार्य पूरा करने की अंतिम तिथि (Deadline) *"}
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
              />
            </div>

            {/* Raw Material Selection */}
            <div className="border-t-2 border-dashed border-loom-beige pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-heading text-lg font-bold text-loom-wood">
                  {isEn ? "Issue Raw Materials" : "कच्चा माल जारी करें (Issue Raw Materials)"}
                </h4>
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  className="bg-loom-sand hover:bg-loom-beige text-loom-wood px-3 py-1.5 rounded-lg font-heading text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-loom-beige/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isEn ? "Add Material" : "और जोड़ें (Add Material)"}
                </button>
              </div>

              <div className="space-y-4">
                {rawMaterialsIssued.map((row, idx) => {
                  const check = getStockAvailability(row);
                  return (
                    <div 
                      key={idx} 
                      className="p-4 bg-loom-sand/10 border border-loom-beige/50 rounded-xl space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5">
                          <label className="block text-xs font-heading font-bold text-loom-wood mb-1">
                            {isEn ? "Select Stock Material" : "सामग्री का नाम (Select Stock Material)"}
                          </label>
                          {stockList.length === 0 ? (
                            <input
                              type="text"
                              required
                              placeholder={isEn ? "e.g. Silk Yarn" : "जैसे: रेशम धागा"}
                              value={row.materialName}
                              onChange={(e) => handleMaterialChange(idx, 'materialName', e.target.value)}
                              className="w-full px-3 py-2 border border-loom-beige rounded-lg focus:outline-none focus:border-loom-gold bg-white text-sm text-loom-ink font-body"
                            />
                          ) : (
                            <select
                              required
                              value={row.materialName}
                              onChange={(e) => handleMaterialChange(idx, 'materialName', e.target.value)}
                              className="w-full px-3 py-2 border border-loom-beige rounded-lg focus:outline-none focus:border-loom-gold bg-white text-sm text-loom-ink font-body"
                            >
                              <option value="">{isEn ? "-- Select Material --" : "-- सामग्री चुनें --"}</option>
                              {stockList.map(s => (
                                <option key={s.stockId} value={s.materialName}>
                                  {s.materialName} ({s.totalQuantity} {getUnitLabel(s.unit)} {isEn ? "available" : "उपलब्ध"})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-heading font-bold text-loom-wood mb-1">
                            {isEn ? "Quantity to Issue" : "जारी की जाने वाली मात्रा"}
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={row.quantity}
                            onChange={(e) => handleMaterialChange(idx, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-loom-beige rounded-lg focus:outline-none focus:border-loom-gold bg-white text-sm text-loom-ink font-body"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-heading font-bold text-loom-wood mb-1">
                            {isEn ? "Unit" : "इकाई (Unit)"}
                          </label>
                          <select
                            value={row.unit}
                            onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-loom-beige rounded-lg focus:outline-none focus:border-loom-gold bg-white text-sm text-loom-ink font-heading"
                          >
                            <option value="किलोग्राम">{isEn ? "Kilogram (kg)" : "किलोग्राम (kg)"}</option>
                            <option value="ग्राम">{isEn ? "Gram (g)" : "ग्राम (g)"}</option>
                            <option value="मीटर">{isEn ? "Meter (m)" : "मीटर (m)"}</option>
                            <option value="कोन">{isEn ? "Cone" : "कोन (Cone)"}</option>
                          </select>
                        </div>

                        <div className="md:col-span-1 text-center md:pb-1">
                          {rawMaterialsIssued.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialRow(idx)}
                              className="p-2 text-loom-error hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title={isEn ? "Delete" : "हटाएं"}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stock availability sub-panel */}
                      {check && (
                        <div className="text-xs font-body">
                          {!check.exists ? (
                            <span className="text-red-600 font-bold">{isEn ? "⚠️ Material not found in stock records!" : "⚠️ यह सामग्री स्टॉक रिकॉर्ड में मौजूद नहीं है!"}</span>
                          ) : !check.enough ? (
                            <span className="text-red-600 font-bold">
                              {isEn 
                                ? `❌ Insufficient stock! Available: ${check.available} ${getUnitLabel(row.unit)}, required: ${row.quantity} ${getUnitLabel(row.unit)}.`
                                : `❌ अपर्याप्त स्टॉक! उपलब्ध मात्रा: ${check.available} ${row.unit} है, जबकि आपको ${row.quantity} ${row.unit} की आवश्यकता है।`}
                            </span>
                          ) : (
                            <span className="text-green-700 font-medium">
                              {isEn 
                                ? `✓ Sufficient stock available (Total: ${check.available} ${getUnitLabel(row.unit)})`
                                : `✓ स्टॉक में पर्याप्त है (कुल उपलब्ध: ${check.available} ${row.unit})`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission buttons */}
            <div className="border-t-2 border-loom-beige pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/secretary/production')}
                className="px-6 py-2.5 bg-loom-beige/40 hover:bg-loom-beige/70 text-loom-wood rounded-xl font-heading font-semibold transition-all cursor-pointer text-base"
              >
                {isEn ? "Cancel" : "रद्द करें"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="vintage-button px-8 py-2.5 text-base"
              >
                {loading ? (isEn ? "Issuing Job Card..." : "कार्य कार्ड जारी किया जा रहा है...") : (isEn ? "Issue Job Card" : "कार्य कार्ड जारी करें")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </SecretaryLayout>
  );
};
