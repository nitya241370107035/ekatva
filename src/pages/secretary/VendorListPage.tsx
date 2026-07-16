import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getVendors, createVendor, seedVendors } from '../../firebase/firestore';
import { Vendor } from '../../types';
import { Plus, Search, Phone, MapPin, Star, User, Layers, ShieldAlert, Truck } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export const VendorListPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Vendor Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('5');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const availableMaterials = ["रेसम धागा", "सूती धागा", "जरी", "रंगाई सामग्री"];

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Run seed first to make sure some exist
      await seedVendors();
      const list = await getVendors();
      setVendors(list);
      setFilteredVendors(list);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error("विक्रेता सूची लोड करने में त्रुटि हुई", { className: 'vintage-toast' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter vendors based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = vendors.filter(v => 
      v.name.toLowerCase().includes(term) ||
      v.contactPerson.toLowerCase().includes(term) ||
      v.materials.some(m => m.toLowerCase().includes(term))
    );
    setFilteredVendors(filtered);
  }, [searchTerm, vendors]);

  const handleMaterialToggle = (material: string) => {
    if (selectedMaterials.includes(material)) {
      setSelectedMaterials(selectedMaterials.filter(m => m !== material));
    } else {
      setSelectedMaterials([...selectedMaterials, material]);
    }
  };

  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !contactPerson || !phone || !address) {
      toast.error("कृपया सभी आवश्यक फ़ील्ड भरें", { className: 'vintage-toast' });
      return;
    }

    if (selectedMaterials.length === 0) {
      toast.error("कृपया कम से कम एक सामग्री चुनें जो वे प्रदान करते हैं", { className: 'vintage-toast' });
      return;
    }

    try {
      setSubmitting(true);
      await createVendor({
        name,
        contactPerson,
        phone,
        address,
        materials: selectedMaterials,
        rating: parseFloat(rating),
        cooperativeId: userProfile?.cooperativeId || ''
      });

      toast.success("नया विक्रेता सफलतापूर्वक पंजीकृत किया गया!", { className: 'vintage-toast' });
      
      // Reset form
      setName('');
      setContactPerson('');
      setPhone('');
      setAddress('');
      setRating('5');
      setSelectedMaterials([]);
      setAddModalOpen(false);
      
      // Refresh list
      fetchVendors();
    } catch (err) {
      console.error("Error adding vendor:", err);
      toast.error("विक्रेता जोड़ने में विफलता", { className: 'vintage-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SecretaryLayout>
      <Toaster position="top-right" />
      <div className="space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 p-5 rounded-2xl border border-loom-beige/50 backdrop-blur-xs">
          <div>
            <h1 className="font-heading text-3xl font-bold text-loom-wood flex items-center gap-2">
              <Truck className="w-8 h-8 text-loom-gold" />
              स्वीकृत विक्रेता सूची (Approved Vendors)
            </h1>
            <p className="font-body text-sm text-loom-ink-light mt-1">
              सहकारी समिति के लिए कच्चे माल (सूत, जरी, रेशम) की आपूर्ति करने वाले पंजीकृत थोक विक्रेताओं का प्रबंधन करें।
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="vintage-button px-5 py-2.5 flex items-center gap-1.5 shrink-0 text-sm"
          >
            <Plus className="w-4 h-4" />
            नया विक्रेता जोड़ें (Add Vendor)
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-loom-beige shadow-xs">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-loom-ink-light" />
            <input
              type="text"
              placeholder="विक्रेता का नाम, संपर्क व्यक्ति या सामग्री खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-loom-cream/40 border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body"
            />
          </div>
          <span className="text-xs font-body text-loom-ink-light sm:ml-auto">
            कुल: <strong className="text-loom-wood font-bold">{filteredVendors.length}</strong> विक्रेता सक्रिय हैं
          </span>
        </div>

        {/* Vendors Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-loom-wood mt-4 text-sm animate-pulse">डेटा प्राप्त किया जा रहा है...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="vintage-card p-12 text-center max-w-2xl mx-auto">
            <span className="text-6xl block mb-4">🚛</span>
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">कोई विक्रेता नहीं मिला</h3>
            <p className="font-body text-base text-loom-ink-light">
              पंजीकृत विक्रेताओं में कोई परिणाम नहीं मिला। कृपया अपनी खोज बदलें या एक नया विक्रेता जोड़ें।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div 
                key={vendor.vendorId} 
                className="vintage-card p-5 hover:scale-101 transition-all duration-200 border-t-4 border-loom-gold flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-heading text-lg font-bold text-loom-wood line-clamp-2">
                      {vendor.name}
                    </h3>
                    {vendor.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {vendor.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-loom-beige/40 pt-3 mb-4 font-body text-xs">
                    <div className="flex items-center gap-2 text-loom-ink">
                      <User className="w-4 h-4 text-loom-gold shrink-0" />
                      <div>
                        <span className="text-[10px] text-loom-ink-light block leading-none font-bold">संपर्क व्यक्ति</span>
                        <span className="text-sm font-semibold">{vendor.contactPerson}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-loom-ink">
                      <Phone className="w-4 h-4 text-loom-gold shrink-0" />
                      <div>
                        <span className="text-[10px] text-loom-ink-light block leading-none font-bold">फ़ोन नंबर</span>
                        <span className="font-mono text-sm">{vendor.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-loom-ink">
                      <MapPin className="w-4 h-4 text-loom-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-loom-ink-light block leading-none font-bold">कार्यालय पता</span>
                        <span className="text-xs text-loom-ink-light">{vendor.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-loom-beige/40 pt-3 mt-auto">
                  <span className="block text-[10px] font-heading font-bold text-loom-wood mb-1.5 uppercase tracking-wider">आपूर्ति की जाने वाली सामग्री:</span>
                  <div className="flex flex-wrap gap-1">
                    {vendor.materials.map((m, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] font-body bg-loom-sand/20 border border-loom-beige text-loom-ink px-2 py-0.5 rounded-md"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Vendor Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="vintage-card w-full max-w-lg bg-loom-parchment overflow-hidden border-t-8 border-loom-gold relative">
              <form onSubmit={handleAddVendorSubmit}>
                {/* Modal Header */}
                <div className="p-5 border-b border-loom-beige bg-loom-sand/10 flex justify-between items-center">
                  <h3 className="font-heading text-xl font-bold text-loom-wood">नया विक्रेता पंजीकृत करें</h3>
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="p-1 rounded-full text-loom-wood hover:bg-loom-sand/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Vendor Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-heading font-bold text-loom-wood">
                      विक्रेता / दुकान का नाम (Vendor/Business Name) <span className="text-loom-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="जैसे: कबीर यार्न डिपो"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full vintage-input text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Person */}
                    <div className="space-y-1">
                      <label className="block text-xs font-heading font-bold text-loom-wood">
                        संपर्क व्यक्ति (Contact Person) <span className="text-loom-error">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="सुरेश कुमार"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full vintage-input text-sm"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-xs font-heading font-bold text-loom-wood">
                        फ़ोन नंबर (Phone Number) <span className="text-loom-error">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full vintage-input text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Materials Multi-select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold text-loom-wood">
                      आपूर्ति की जाने वाली सामग्री (Supplied Materials) <span className="text-loom-error">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableMaterials.map((material) => {
                        const isSelected = selectedMaterials.includes(material);
                        return (
                          <button
                            type="button"
                            key={material}
                            onClick={() => handleMaterialToggle(material)}
                            className={`p-2 rounded-xl text-xs font-body text-left border transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-loom-gold/10 border-loom-gold text-loom-wood font-bold'
                                : 'bg-white border-loom-beige text-loom-ink/75 hover:border-loom-beige-dark'
                            }`}
                          >
                            <span>{material}</span>
                            {isSelected && <span className="text-loom-gold font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="block text-xs font-heading font-bold text-loom-wood">
                        रेटिंग (Rating)
                      </label>
                      <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="w-full vintage-input text-sm h-11"
                      >
                        <option value="5">5.0 (उत्कृष्ट)</option>
                        <option value="4.5">4.5 (बहुत अच्छा)</option>
                        <option value="4">4.0 (अच्छा)</option>
                        <option value="3.5">3.5 (मध्यम)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-heading font-bold text-loom-wood">
                        कार्यालय / दुकान का पता (Address) <span className="text-loom-error">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="चौक बाजार, वाराणसी"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full vintage-input text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-loom-beige bg-loom-sand/10 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-heading font-semibold text-loom-wood hover:bg-loom-sand/30 transition-all border border-loom-beige"
                  >
                    रद्द करें (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="vintage-button px-5 py-2.5 flex items-center gap-1.5 shrink-0 text-sm"
                  >
                    {submitting ? 'सहेज रहे हैं...' : 'पंजीकृत करें (Register)'}
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
