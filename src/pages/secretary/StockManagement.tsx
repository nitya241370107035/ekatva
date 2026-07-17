import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getRawMaterialStock, 
  addOrUpdateStockItem, 
  updateStockQuantityManual,
  seedDefaultStock
} from '../../firebase/firestore';
import { RawMaterialStock } from '../../types';
import { Plus, Edit2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useTranslation } from 'react-i18next';

export const StockManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [stockList, setStockList] = useState<RawMaterialStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<RawMaterialStock | null>(null);

  // Form states for Add Material
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newQuantity, setNewQuantity] = useState(0);
  const [newUnit, setNewUnit] = useState('किलोग्राम');
  const [newReorderLevel, setNewReorderLevel] = useState(10);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states for Quick Update
  const [qtyChange, setQtyChange] = useState(0);

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

  const fetchStock = async () => {
    if (!userProfile?.cooperativeId) return;
    setLoading(true);
    try {
      const stock = await getRawMaterialStock(userProfile.cooperativeId);
      setStockList(stock);
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [userProfile?.cooperativeId, i18n.language]);

  const handleSeedStock = async () => {
    if (!userProfile?.cooperativeId) return;
    setLoading(true);
    try {
      await seedDefaultStock(userProfile.cooperativeId);
      setToastMessage(isEn ? 'Default stock seeded successfully!' : 'प्रारंभिक स्टॉक सफलतापूर्वक जोड़ा गया!');
      await fetchStock();
    } catch (err) {
      console.error(err);
      setToastMessage(isEn ? 'Error: Failed to seed stock.' : 'त्रुटि: स्टॉक जोड़ने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.cooperativeId || !newMaterialName.trim()) return;

    setFormSubmitting(true);
    try {
      await addOrUpdateStockItem(
        userProfile.cooperativeId,
        newMaterialName.trim(),
        Number(newQuantity),
        newUnit,
        Number(newReorderLevel)
      );
      setToastMessage(isEn ? 'Material added to stock successfully!' : 'सामग्री सफलतापूर्वक स्टॉक में जोड़ी गई!');
      setAddModalOpen(false);
      // Reset form
      setNewMaterialName('');
      setNewQuantity(0);
      setNewUnit('किलोग्राम');
      setNewReorderLevel(10);
      await fetchStock();
    } catch (err) {
      console.error(err);
      setToastMessage(isEn ? 'Error adding stock.' : 'स्टॉक जोड़ने में त्रुटि आई।');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.cooperativeId || !selectedStock) return;

    setFormSubmitting(true);
    try {
      await updateStockQuantityManual(
        userProfile.cooperativeId,
        selectedStock.stockId,
        qtyChange
      );
      setToastMessage(isEn ? 'Stock quantity updated successfully!' : 'स्टॉक मात्रा सफलतापूर्वक अपडेट की गई!');
      setUpdateModalOpen(false);
      setQtyChange(0);
      setSelectedStock(null);
      await fetchStock();
    } catch (err) {
      console.error(err);
      setToastMessage('स्टॉक अपडेट करने में त्रुटि आई।');
    } finally {
      setFormSubmitting(false);
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
            <Layers className="w-8 h-8 text-loom-gold shrink-0" />
            {isEn ? "Raw Material Stock" : "कच्चा माल स्टॉक प्रबंधन (Stock Management)"}
          </h1>
          <p className="font-body text-loom-ink/70 mt-1">
            {isEn 
              ? "Monitor stock levels of raw materials issued to cooperative weavers."
              : "समिति के बुनकरों को जारी की जाने वाली सामग्री और स्टॉक स्तर की जानकारी रखें।"}
          </p>
        </div>

        <div className="flex gap-2">
          {stockList.length === 0 && !loading && (
            <button
              onClick={handleSeedStock}
              className="bg-loom-gold hover:bg-loom-gold-light text-loom-wood px-4 py-2.5 rounded-xl font-heading font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-loom-wood/10 text-sm sm:text-base"
            >
              <RefreshCw className="w-5 h-5 shrink-0" />
              {isEn ? "Set Demo Stock" : "डेमो स्टॉक सेट करें"}
            </button>
          )}
          <button
            onClick={() => setAddModalOpen(true)}
            className="vintage-button px-4 py-2.5 text-sm sm:text-base flex items-center gap-2"
          >
            <Plus className="w-5 h-5 shrink-0" />
            {isEn ? "Add Material" : "सामग्री जोड़ें"}
          </button>
        </div>
      </div>

      {/* Stock warning box if any material is below reorder level */}
      {stockList.some(item => item.totalQuantity <= item.reorderLevel) && (
        <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="font-heading font-bold text-orange-800 text-lg">
              {isEn ? "Low Stock Alert" : "निम्न स्टॉक चेतावनी (Low Stock Alert)"}
            </h4>
            <p className="font-body text-orange-700 text-sm">
              {isEn 
                ? "Some raw materials are below their reorder levels. Please procure them soon."
                : "कुछ महत्वपूर्ण सामग्रियां पुन: ऑर्डर स्तर (Reorder Level) से नीचे हैं। कृपया समय पर व्यवस्था करें।"}
            </p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="vintage-card p-6 overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-loom-wood mt-2 animate-pulse">
              {isEn ? "Fetching stock data..." : "स्टॉक डेटा प्राप्त किया जा रहा है..."}
            </p>
          </div>
        ) : stockList.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">🧶</span>
            <h3 className="font-heading text-xl font-bold text-loom-wood">
              {isEn ? "No Raw Materials in Stock" : "स्टॉक में कोई कच्चा माल नहीं है"}
            </h3>
            <p className="font-body text-loom-ink/70 max-w-sm mx-auto mt-2 mb-6">
              {isEn 
                ? "Currently no raw materials recorded for this cooperative. You can add new stock or seed demo stock."
                : "वर्तमान में इस सहकारी समिति का कोई स्टॉक रिकॉर्ड नहीं मिला है। आप नया स्टॉक जोड़ सकते हैं या डेमो स्टॉक सेट कर सकते हैं।"}
            </p>
            <button
              onClick={handleSeedStock}
              className="bg-loom-wood hover:bg-loom-wood-light text-loom-cream px-6 py-2.5 rounded-xl font-heading font-bold transition-all shadow-md cursor-pointer text-sm"
            >
              {isEn ? "Initialize Stock" : "प्रारंभिक स्टॉक सेट करें"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-loom-beige bg-loom-sand/20">
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg">{isEn ? "Material Name" : "सामग्री (Material Name)"}</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg text-right">{isEn ? "Total Stock" : "कुल मात्रा (Total Stock)"}</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg">{isEn ? "Unit" : "इकाई (Unit)"}</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg text-right">{isEn ? "Reorder Level" : "पुनः ऑर्डर स्तर (Reorder Level)"}</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg text-center">{isEn ? "Status" : "स्थिति (Status)"}</th>
                  <th className="p-4 font-heading font-bold text-loom-wood text-lg text-center">{isEn ? "Action" : "कार्यवाही (Actions)"}</th>
                </tr>
              </thead>
              <tbody>
                {stockList.map((item) => {
                  const isLow = item.totalQuantity <= item.reorderLevel;
                  return (
                    <tr 
                      key={item.stockId} 
                      className={`border-b border-loom-beige/50 hover:bg-loom-sand/10 transition-colors ${
                        isLow ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      <td className="p-4 font-heading font-semibold text-loom-wood text-lg">
                        {item.materialName}
                      </td>
                      <td className="p-4 font-body font-bold text-right text-lg text-loom-ink">
                        {item.totalQuantity}
                      </td>
                      <td className="p-4 font-body text-loom-ink/80 text-base">
                        {getUnitLabel(item.unit)}
                      </td>
                      <td className="p-4 font-body text-right text-base text-loom-ink/70">
                        {item.reorderLevel} {getUnitLabel(item.unit)}
                      </td>
                      <td className="p-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full border border-orange-200 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {isEn ? "Low Stock" : "कम स्टॉक"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full border border-green-200 font-bold">
                            {isEn ? "Sufficient" : "पर्याप्त"}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedStock(item);
                            setUpdateModalOpen(true);
                          }}
                          className="bg-loom-sand hover:bg-loom-beige text-loom-wood px-3 py-1.5 rounded-lg font-heading text-sm font-semibold transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0" />
                          {isEn ? "Change Qty" : "मात्रा बदलें"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Material Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 relative">
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-4 pb-2 border-b-2 border-loom-beige">
              {isEn ? "Add New Raw Material" : "नया कच्चा माल जोड़ें"}
            </h3>
            
            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                  {isEn ? "Material Name *" : "सामग्री का नाम (Material Name) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. Silk Yarn, Cotton Yarn, Zari" : "जैसे: रेशम धागा, सूती सूत, जरी"}
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                    {isEn ? "Quantity" : "मात्रा (Quantity)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                    {isEn ? "Unit" : "इकाई (Unit)"}
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-heading"
                  >
                    <option value="किलोग्राम">{isEn ? "Kilogram (kg)" : "किलोग्राम (kg)"}</option>
                    <option value="ग्राम">{isEn ? "Gram (g)" : "ग्राम (g)"}</option>
                    <option value="मीटर">{isEn ? "Meter (m)" : "मीटर (m)"}</option>
                    <option value="कोन">{isEn ? "Cone" : "कोन (Cone)"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                  {isEn ? "Reorder Level" : "पुनः ऑर्डर स्तर (Reorder Level)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={newReorderLevel}
                  onChange={(e) => setNewReorderLevel(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
                <span className="text-xs text-loom-ink/60 mt-1 block">
                  {isEn 
                    ? "Low stock warning will appear if stock drops to or below this level."
                    : "यदि स्टॉक इस स्तर के बराबर या नीचे जाता है तो कम स्टॉक की चेतावनी दिखाई देगी।"}
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-loom-beige/50">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 bg-loom-beige/50 hover:bg-loom-beige text-loom-wood rounded-xl font-heading font-semibold transition-all cursor-pointer"
                >
                  {isEn ? "Cancel" : "रद्द करें"}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="vintage-button px-5 py-2.5 text-sm"
                >
                  {formSubmitting ? (isEn ? "Adding..." : "जोड़ा जा रहा है...") : (isEn ? "Save" : "सुरक्षित करें")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Quantity Update Modal */}
      {updateModalOpen && selectedStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden p-6 relative">
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2 pb-2 border-b-2 border-loom-beige">
              {isEn ? "Update Stock" : "स्टॉक अपडेट करें"}
            </h3>
            <p className="font-body text-sm text-loom-ink/70 mb-4">
              {isEn ? "Current stock of " : ""}<strong>{selectedStock.materialName}</strong>{isEn ? ": " : " का वर्तमान स्टॉक: "}<strong>{selectedStock.totalQuantity} {getUnitLabel(selectedStock.unit)}</strong>
            </p>
            
            <form onSubmit={handleUpdateStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                  {isEn ? "Quantity to Add / Subtract" : "जोड़ने/घटाने की मात्रा"}
                </label>
                <input
                  type="number"
                  required
                  placeholder={isEn ? "e.g. 10 to add, -5 to subtract" : "उदा: 10 जोड़ने के लिए, -5 घटाने के लिए"}
                  onChange={(e) => setQtyChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
                <span className="text-xs text-loom-ink/60 mt-1 block">
                  {isEn ? "New total stock: " : "नया कुल स्टॉक: "}<strong>{selectedStock.totalQuantity + qtyChange} {getUnitLabel(selectedStock.unit)}</strong>
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-loom-beige/50">
                <button
                  type="button"
                  onClick={() => {
                    setUpdateModalOpen(false);
                    setQtyChange(0);
                    setSelectedStock(null);
                  }}
                  className="px-4 py-2.5 bg-loom-beige/50 hover:bg-loom-beige text-loom-wood rounded-xl font-heading font-semibold transition-all cursor-pointer"
                >
                  {isEn ? "Cancel" : "रद्द करें"}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || (selectedStock.totalQuantity + qtyChange < 0)}
                  className="vintage-button px-5 py-2.5 text-sm"
                >
                  {formSubmitting ? (isEn ? "Updating..." : "सुरक्षित हो रहा है...") : (isEn ? "Update" : "अपडेट करें")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
