import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getProductsByCooperative, createProduct, deleteProduct } from '../../firebase/firestore';
import { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  ShoppingBag, 
  PlusCircle, 
  X, 
  Trash2, 
  Tag, 
  Award, 
  BookOpen, 
  Sparkles, 
  Upload, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useTranslation } from 'react-i18next';

// Premium high-quality handloom presets for quick and beautiful UI building
const IMAGE_PRESETS = [
  {
    key: "banarasiSilk",
    name: "शाही बनारसी रेशम (Banarasi Silk)",
    url: "/banarasi_silk.png"
  },
  {
    key: "handloomCotton",
    name: "हाथकरघा सूती थान (Handloom Cotton)",
    url: "/handloom_cotton.png"
  },
  {
    key: "colorfulYarns",
    name: "रंगीन सूती धागे (Colorful Yarns)",
    url: "/colorful_yarns.png"
  },
  {
    key: "ikatPattern",
    name: "पारंपरिक इकत बुनाई (Ikat Pattern)",
    url: "/ikat_pattern.png"
  }
];

const TAG_TRANSLATIONS: Record<string, string> = {
  "बनारसी": "products.tags.banarasi",
  "रेशम (Silk)": "products.tags.silk",
  "सूती (Cotton)": "products.tags.cotton",
  "इकत (Ikat)": "products.tags.ikat",
  "जामदानी (Jamdani)": "products.tags.jamdani",
  "खादी (Khadi)": "products.tags.khadi",
  "पश्मीना (Pashmina)": "products.tags.pashmina",
  "जरी (Zari)": "products.tags.zari"
};

export const CooperativeProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [handloomMark, setHandloomMark] = useState(true);
  const [weaverStory, setWeaverStory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Image handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(IMAGE_PRESETS[0].url);
  const [useUpload, setUseUpload] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const availableTags = ["बनारसी", "रेशम (Silk)", "सूती (Cotton)", "इकत (Ikat)", "जामदानी (Jamdani)", "खादी (Khadi)", "पश्मीना (Pashmina)", "जरी (Zari)"];

  const cooperativeId = userProfile?.cooperativeId || 'coop1';
  const cooperativeName = userProfile?.displayName || t('coop.defaultName', 'काशी हथकरघा सहकारी समिति');

  useEffect(() => {
    fetchProducts();
  }, [cooperativeId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProductsByCooperative(cooperativeId);
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !quantityAvailable) {
      setFormError(t('products.fillRequired', 'कृपया सभी आवश्यक फ़ील्ड भरें (Please fill all required fields)'));
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      let imageUrls: string[] = [];

      if (useUpload && imageFile) {
        setUploadProgress(t('products.uploading', 'छवि अपलोड हो रही है (Uploading image)...'));
        // Temporary ID for path
        const tempId = Math.random().toString(36).substring(7);
        const storageRef = ref(storage, `products/${tempId}/${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        imageUrls.push(downloadUrl);
      } else {
        imageUrls.push(selectedPresetUrl);
      }

      await createProduct({
        cooperativeId,
        cooperativeName,
        name,
        description,
        images: imageUrls,
        price: Number(price),
        quantityAvailable: Number(quantityAvailable),
        skillTags: selectedTags,
        handloomMark,
        weaverStory: weaverStory || t('products.defaultWeaverStory', 'यह उत्कृष्ट उत्पाद हमारी सहकारी समिति के हुनरमंद बुनकर द्वारा पूर्णतः हस्तनिर्मित है।')
      });

      setFormSuccess(t('products.successListed', 'उत्पाद सफलतापूर्वक सूचीबद्ध किया गया! (Product successfully listed!)'));
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setQuantityAvailable('');
      setHandloomMark(true);
      setWeaverStory('');
      setSelectedTags([]);
      setImageFile(null);
      setUseUpload(false);
      setUploadProgress('');
      
      // Close modal & refresh
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
        fetchProducts();
      }, 1500);

    } catch (err) {
      console.error("Error listing product:", err);
      setFormError(t('products.addError', 'उत्पाद जोड़ने में त्रुटि हुई। कृपया पुनः प्रयास करें।'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm(t('products.confirmDelete', 'क्या आप सचमुच इस उत्पाद को सूची से हटाना चाहते हैं?'))) {
      try {
        await deleteProduct(productId);
        fetchProducts();
      } catch (err) {
        console.error("Error deleting product:", err);
        alert(t('products.deleteError', 'उत्पाद हटाने में त्रुटि हुई।'));
      }
    }
  };

  return (
    <SecretaryLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-loom-gold" />
            {t('products.title', 'सहकारी उत्पाद सूची (Cooperative Products)')}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {t('products.desc', 'अपने उत्कृष्ट हथकरघा उत्पादों को सीधे वैश्विक बाज़ार और खरीदारों (Buyers) के लिए सूचीबद्ध करें।')}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          {t('products.addBtn', 'नया उत्पाद जोड़ें (Add Product)')}
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">{t('products.loading', 'उत्पाद सूची लोड हो रही है...')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <ShoppingBag className="w-16 h-16 text-loom-gold/50 mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">{t('products.empty', 'कोई उत्पाद सूचीबद्ध नहीं है')}</h3>
          <p className="font-body text-loom-ink-light max-w-md mx-auto mb-6">
            {t('products.emptyDesc', 'वर्तमान में आपकी सहकारी समिति का कोई उत्पाद प्रदर्शित नहीं है। "नया उत्पाद जोड़ें" बटन पर क्लिक करके पहला हस्तशिल्प सूचीबद्ध करें।')}
          </p>
          <Button onClick={() => setShowModal(true)} className="vintage-button">
            {t('products.listFirst', 'पहला उत्पाद सूचीबद्ध करें')}
          </Button>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.productId} className="flex flex-col justify-between overflow-hidden relative group vintage-card hover:shadow-xl transition-all border-2 border-loom-beige">
              <div>
                {/* Visual Image Banner */}
                <div className="relative aspect-video w-full bg-loom-beige/10 overflow-hidden border-b-2 border-loom-beige/30">
                  <img 
                    src={product.images[0] || IMAGE_PRESETS[0].url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    {product.handloomMark && (
                      <span className="bg-loom-gold text-loom-wood text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md border border-loom-wood flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {t('products.handloomMark', 'हैंडलूम मार्क')}
                      </span>
                    )}
                    {product.hasTraceability && (
                      <span className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md border border-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('products.fairWageVerified', 'सत्यापित निष्पक्ष मजदूरी')}
                      </span>
                    )}
                    <span className="bg-white/95 text-loom-wood text-xs font-bold px-3 py-1 rounded-full shadow-md border border-loom-beige">
                      {t('products.stockCount', 'स्टॉक: {{count}} पीस', { count: product.quantityAvailable })}
                    </span>
                  </div>
                </div>

                <CardHeader className="p-5 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold text-loom-ink font-heading line-clamp-1">
                      {product.name}
                    </CardTitle>
                    <span className="font-heading text-lg font-black text-loom-wood shrink-0">
                      ₹{product.price.toLocaleString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN'))}
                    </span>
                  </div>

                  {/* Skill tags */}
                  {product.skillTags && product.skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.skillTags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-loom-gold/15 text-loom-wood border border-loom-gold/30 px-2 py-0.5 rounded font-bold">
                          {t(TAG_TRANSLATIONS[tag] || tag, tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="px-5 pb-4 pt-0">
                  <p className="font-body text-sm text-loom-ink-light line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Weaver Story box */}
                  <div className="bg-loom-parchment/60 rounded-xl p-3 border border-loom-beige/40 text-xs text-loom-ink-light font-body">
                    <div className="flex items-center gap-1.5 text-loom-wood font-bold mb-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('products.artisanStory', 'बुनकर गाथा (Artisan Story):')}
                    </div>
                    <p className="line-clamp-2 italic leading-relaxed">"{product.weaverStory}"</p>
                  </div>
                </CardContent>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-loom-beige/30 bg-loom-cream/30 flex justify-between items-center">
                <span className="text-xs text-loom-ink-light/80 font-body">
                  {t('products.date', 'दिनांक: {{date}}', { date: new Date(product.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'bn' ? 'bn-IN' : 'hi-IN')) })}
                </span>
                <Button 
                  onClick={() => handleDelete(product.productId)}
                  className="p-2 text-loom-error hover:bg-loom-error/10 hover:text-loom-error rounded-xl cursor-pointer transition-colors"
                  title={t('common.delete', 'हटाएं')}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-loom-cream border-4 border-loom-gold w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-loom-beige flex justify-between items-center bg-loom-wood text-loom-cream relative rounded-t-lg bg-loom-pattern">
              <div className="absolute inset-0 bg-loom-wood/90 z-0 rounded-t-lg" />
              <div className="relative z-10">
                <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-loom-gold" />
                  {t('products.addModalTitle', 'उत्पाद सूची में नया उत्पाद जोड़ें')}
                </h2>
                <p className="text-xs text-loom-gold/90 mt-1">
                  {t('products.addModalDesc', 'काशी हथकरघा गुणवत्ता मापदंडों के साथ सीधे खरीदारों को प्रस्तुत करें।')}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="relative z-10 p-2 text-loom-cream/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="bg-loom-error/10 border border-loom-error text-loom-error p-3.5 rounded-xl text-sm font-semibold">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-400 text-emerald-700 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  {formSuccess}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-loom-wood mb-1">{t('products.nameLabel', 'उत्पाद का नाम (Product Name) *')}</label>
                  <Input 
                    type="text" 
                    placeholder={t('products.namePlaceholder', 'उदा. शाही बनारसी रेशमी साड़ी - लाल')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-loom-wood mb-1">{t('products.priceLabel', 'मूल्य (Price in ₹) *')}</label>
                  <Input 
                    type="number" 
                    placeholder={t('products.pricePlaceholder', 'उदा. 15400')}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-loom-wood mb-1">{t('products.descriptionLabel', 'उत्पाद विवरण (Description) *')}</label>
                <textarea
                  className="w-full p-3 bg-white border border-loom-beige rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-loom-gold min-h-[80px]"
                  placeholder={t('products.descriptionPlaceholder', 'उत्पाद की हस्तकला तकनीक, धागों की गुणवत्ता और विशिष्टताओं का विस्तृत विवरण...')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-loom-wood mb-1">{t('products.stockLabel', 'उपलब्ध मात्रा (Available Stock) *')}</label>
                  <Input 
                    type="number" 
                    placeholder={t('products.stockPlaceholder', 'उदा. 5')}
                    value={quantityAvailable}
                    onChange={(e) => setQuantityAvailable(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-loom-wood rounded border-loom-beige focus:ring-loom-gold focus:ring-2 accent-loom-wood"
                      checked={handloomMark}
                      onChange={(e) => setHandloomMark(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-loom-wood flex items-center gap-1">
                      <Award className="w-4 h-4 text-loom-gold" />
                      {t('products.certifiedHandloomLabel', 'सर्टिफाइड हैंडलूम मार्क (Certified Handloom Mark)')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Tag Selection */}
              <div>
                <label className="block text-sm font-bold text-loom-wood mb-1.5">{t('products.tagsLabel', 'कौशल / तकनीक टैग (Skill & Fabric Tags)')}</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-loom-wood text-white border-loom-wood shadow-sm' 
                            : 'bg-white text-loom-wood border-loom-beige hover:bg-loom-sand/10'
                        }`}
                      >
                        {t(TAG_TRANSLATIONS[tag] || tag, tag)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weaver Story */}
              <div>
                <label className="block text-sm font-bold text-loom-wood mb-1">{t('products.artisanStoryLabel', 'बुनकर गाथा / कारीगर कहानी (Artisan Story)')}</label>
                <textarea
                  className="w-full p-3 bg-white border border-loom-beige rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-loom-gold min-h-[60px]"
                  placeholder={t('products.artisanStoryPlaceholder', 'बुनकर कारीगर का नाम और उनकी कला के प्रति समर्पण का विवरण...')}
                  value={weaverStory}
                  onChange={(e) => setWeaverStory(e.target.value)}
                />
              </div>

              {/* Image Source Selection */}
              <div className="border-t border-loom-beige pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-loom-wood">{t('products.imageLabel', 'उत्पाद की तस्वीर (Product Image)')}</label>
                  <div className="flex gap-2 rounded-xl bg-loom-beige/25 p-0.5 border border-loom-beige text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUseUpload(false)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${!useUpload ? 'bg-white shadow-sm text-loom-wood' : 'text-loom-ink-light'}`}
                    >
                      {t('products.presetsBtn', 'सुंदर प्रीसेट (Presets)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUpload(true)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${useUpload ? 'bg-white shadow-sm text-loom-wood' : 'text-loom-ink-light'}`}
                    >
                      {t('products.uploadBtn', 'अपलोड करें (Upload)')}
                    </button>
                  </div>
                </div>

                {!useUpload ? (
                  /* Presets Selection Grid */
                  <div className="grid grid-cols-2 gap-3">
                    {IMAGE_PRESETS.map((preset) => {
                      const isSelected = selectedPresetUrl === preset.url;
                      return (
                        <div 
                          key={preset.name}
                          onClick={() => setSelectedPresetUrl(preset.url)}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            isSelected ? 'border-loom-gold ring-2 ring-loom-gold/50 scale-[0.98]' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.url} alt={t('products.preset.' + preset.key, preset.name)} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white text-center font-semibold truncate">
                            {t('products.preset.' + preset.key, preset.name)}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-loom-gold text-loom-wood p-0.5 rounded-full">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* File Upload Section */
                  <div className="border-2 border-dashed border-loom-beige rounded-xl p-6 bg-white flex flex-col items-center justify-center text-center">
                    <input 
                      type="file" 
                      id="product-image-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <label htmlFor="product-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-loom-gold/10 text-loom-gold rounded-full flex items-center justify-center mb-1">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-heading font-bold text-sm text-loom-wood">{t('products.browsePhoto', 'हथकरघा उत्पाद फोटो चुनें (Browse photo)')}</span>
                      <span className="text-xs text-loom-ink-light font-body">{t('products.uploadDesc', 'PNG, JPG, या GIF (अधिकतम 3MB)')}</span>
                    </label>
                    {imageFile && (
                      <div className="mt-4 flex items-center gap-2 bg-loom-gold/15 text-loom-wood px-3.5 py-1.5 rounded-xl border border-loom-gold/30 text-xs font-bold">
                        <ImageIcon className="w-4 h-4" />
                        {t('products.selectedFile', 'चयनित फ़ाइल: {{name}}', { name: imageFile.name })}
                      </div>
                    )}
                    {uploadProgress && (
                      <p className="mt-2 text-xs text-loom-gold font-bold animate-pulse">{uploadProgress}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-loom-beige pt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white border border-loom-beige hover:bg-loom-sand/15 text-loom-ink rounded-xl font-heading font-bold transition-all cursor-pointer"
                >
                  {t('common.cancel', 'रद्द करें')}
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-loom-gold" />
                  )}
                  {t('products.publishBtn', 'उत्पाद प्रकाशित करें')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
