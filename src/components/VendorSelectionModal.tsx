import React, { useEffect, useState } from 'react';
import { getVendors } from '../firebase/firestore';
import { Vendor } from '../types';
import { X, Search, Phone, MapPin, Star, DollarSign } from 'lucide-react';

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  onSelect: (vendor: Vendor, quotePrice?: number) => void;
}

export const VendorSelectionModal: React.FC<VendorSelectionModalProps> = ({
  isOpen,
  onClose,
  materialName,
  onSelect
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    async function fetchVendorsList() {
      try {
        setLoading(true);
        const list = await getVendors();
        setVendors(list);
        
        // Filter vendors who can supply this material
        const filtered = list.filter(v => 
          v.materials.some(m => m.trim().toLowerCase() === materialName.trim().toLowerCase())
        );
        setFilteredVendors(filtered);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVendorsList();
  }, [isOpen, materialName]);

  // Filter based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = vendors.filter(v => {
      const matchMaterial = v.materials.some(m => m.trim().toLowerCase() === materialName.trim().toLowerCase());
      const matchSearch = v.name.toLowerCase().includes(term) || v.contactPerson.toLowerCase().includes(term);
      return matchMaterial && matchSearch;
    });
    setFilteredVendors(filtered);
  }, [searchTerm, vendors, materialName]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedVendorId) return;
    const selectedVendor = vendors.find(v => v.vendorId === selectedVendorId);
    if (selectedVendor) {
      onSelect(selectedVendor, quotePrice ? parseFloat(quotePrice) : undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="vintage-card w-full max-w-lg bg-loom-parchment overflow-hidden border-t-8 border-loom-gold relative flex flex-col max-h-[90vh]"
        id="vendor-selection-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-loom-beige flex justify-between items-center bg-loom-sand/20">
          <div>
            <h3 className="font-heading text-xl font-bold text-loom-wood">विक्रेता का चयन करें (Select Vendor)</h3>
            <p className="font-body text-xs text-loom-ink-light mt-0.5">
              सामग्री: <span className="font-semibold text-loom-gold">{materialName}</span> के स्वीकृत आपूर्तिकर्ता
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-loom-wood hover:bg-loom-sand/30 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-loom-ink-light" />
            <input
              type="text"
              placeholder="विक्रेता या संपर्क व्यक्ति का नाम खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body"
            />
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
              <p className="font-heading text-loom-wood mt-2 text-xs">विक्रेताओं की सूची लोड हो रही है...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-dashed border-loom-beige/80 p-6">
              <span className="text-4xl block mb-2">🚛</span>
              <p className="font-heading font-semibold text-loom-wood">कोई विक्रेता नहीं मिला</p>
              <p className="font-body text-xs text-loom-ink-light mt-1">
                सामग्री "{materialName}" के लिए कोई विक्रेता पंजीकृत नहीं है। कृपया पहले नया विक्रेता जोड़ें।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-heading font-bold text-loom-wood">उपलब्ध आपूर्तिकर्ता सूची:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredVendors.map((vendor) => (
                  <label
                    key={vendor.vendorId}
                    className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedVendorId === vendor.vendorId
                        ? 'bg-loom-gold/10 border-loom-gold shadow-xs'
                        : 'bg-white border-loom-beige hover:border-loom-gold/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selectedVendor"
                        checked={selectedVendorId === vendor.vendorId}
                        onChange={() => setSelectedVendorId(vendor.vendorId)}
                        className="mt-1 text-loom-gold focus:ring-loom-gold h-4 w-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-heading font-bold text-loom-wood text-sm truncate">
                            {vendor.name}
                          </h4>
                          {vendor.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 shrink-0">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {vendor.rating}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-loom-ink/80 mt-1 flex items-center gap-1">
                          <span className="font-semibold text-loom-wood">संपर्क:</span> {vendor.contactPerson}
                        </p>
                        <p className="font-body text-xs text-loom-ink-light mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-loom-gold" /> {vendor.phone}
                        </p>
                        <p className="font-body text-[11px] text-loom-ink-light mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-loom-gold" /> {vendor.address}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quote fields if vendor selected */}
          {selectedVendorId && (
            <div className="p-3.5 bg-loom-sand/30 rounded-xl border border-loom-beige/50 animate-fade-in space-y-2">
              <label className="block text-xs font-heading font-bold text-loom-wood flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-loom-gold" />
                कोटेशन मूल्य (Quoted Price - Optional):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-loom-ink-light font-bold">₹</span>
                <input
                  type="number"
                  placeholder="कुल कोटेशन दर दर्ज करें..."
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-loom-beige rounded-lg focus:outline-none focus:ring-1 focus:ring-loom-gold font-body"
                  min="0"
                />
              </div>
              <p className="text-[10px] text-loom-ink-light font-body italic">
                (विक्रेता द्वारा दी गई अनुमानित या अंतिम दर यहाँ दर्ज कर सकते हैं।)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-loom-beige flex gap-3 justify-end bg-loom-sand/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-heading font-semibold text-loom-wood hover:bg-loom-sand/30 transition-all cursor-pointer border border-loom-beige"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedVendorId}
            className={`px-5 py-2 rounded-xl text-sm font-heading font-bold transition-all shadow-sm flex items-center gap-1 ${
              selectedVendorId
                ? 'bg-loom-gold text-loom-wood hover:bg-loom-gold/90 hover:scale-102 cursor-pointer'
                : 'bg-loom-beige text-loom-ink-light/50 cursor-not-allowed'
            }`}
          >
            इंडेंट भेजें (Send Indent)
          </button>
        </div>
      </div>
    </div>
  );
};
