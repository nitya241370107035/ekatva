import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WeaverLayout } from '../../components/layout/WeaverLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { 
  createProductSubmission, 
  getProductSubmissionsByWeaver 
} from '../../firebase/firestore';
import { ProductSubmission } from '../../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  PlusCircle, 
  Tag, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Trash2
} from 'lucide-react';

const IMAGE_PRESETS = [
  {
    key: "banarasiSilk",
    name: "शाही बनारसी रेशम (Banarasi)",
    url: "/banarasi_silk.png"
  },
  {
    key: "handloomCotton",
    name: "हाथकरघा सूती थान (Cotton)",
    url: "/handloom_cotton.png"
  },
  {
    key: "colorfulYarns",
    name: "रंगीन सूती धागे (Yarns)",
    url: "/colorful_yarns.png"
  },
  {
    key: "ikatPattern",
    name: "पारंपरिक इकत बुनाई (Ikat)",
    url: "/ikat_pattern.png"
  }
];

export const WeaverMyProducts: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [activeTab, setActiveTab] = useState<'list' | 'submit'>('list');
  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Image Uploads State
  const [useUpload, setUseUpload] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(IMAGE_PRESETS[0].url);
  const [uploadProgress, setUploadProgress] = useState('');

  const availableTags = ["बनारसी", "रेशम (Silk)", "सूती (Cotton)", "इकत (Ikat)", "जामदानी (Jamdani)", "खादी (Khadi)", "पश्मीना (Pashmina)", "जरी (Zari)"];

  const weaverId = userProfile?.weaverId || currentUser?.uid || '';
  const weaverName = userProfile?.displayName || '';
  const cooperativeId = userProfile?.cooperativeId || 'coop1';

  const getTagLabel = (tag: string) => {
    if (!isEn) return tag;
    const tagLabels: Record<string, string> = {
      "बनारसी": "Banarasi",
      "रेशम (Silk)": "Silk",
      "सूती (Cotton)": "Cotton",
      "इकत (Ikat)": "Ikat",
      "जामदानी (Jamdani)": "Jamdani",
      "खादी (Khadi)": "Khadi",
      "पश्मीना (Pashmina)": "Pashmina",
      "जरी (Zari)": "Zari"
    };
    return tagLabels[tag] || tag;
  };

  const fetchSubmissions = async () => {
    if (!weaverId) return;
    try {
      setLoading(true);
      const data = await getProductSubmissionsByWeaver(weaverId);
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching product submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [weaverId]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const updatedFiles = [...imageFiles];
      updatedFiles[index] = e.target.files[0];
      setImageFiles(updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...imageFiles];
    updatedFiles[index] = null;
    setImageFiles(updatedFiles);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) {
      setFormError(isEn ? 'Please fill all required fields.' : 'कृपया सभी आवश्यक फ़ील्ड भरें।');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const imageUrls: string[] = [];
      const tempId = Math.random().toString(36).substring(7);

      if (useUpload) {
        setUploadProgress(isEn ? 'Uploading images...' : t('weaverProducts.uploadingImages'));
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          if (file) {
            const storageRef = ref(storage, `products/submissions/${tempId}/image_${i}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            imageUrls.push(downloadUrl);
          }
        }

        if (imageUrls.length === 0) {
          throw new Error(isEn ? 'Please upload at least one image.' : 'कृपया कम से कम एक छवि अपलोड करें।');
        }
      } else {
        imageUrls.push(selectedPresetUrl);
      }

      await createProductSubmission({
        cooperativeId,
        weaverId,
        weaverName,
        title: title.trim(),
        description: description.trim(),
        images: imageUrls,
        skillTags: selectedTags,
        price: Number(price)
      });

      setToastMessage(t('weaverProducts.successSubmit'));
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setSelectedTags([]);
      setImageFiles([null, null, null]);
      setUseUpload(false);
      setUploadProgress('');
      
      // Switch tab and reload list
      setActiveTab('list');
      fetchSubmissions();

    } catch (err: any) {
      console.error("Error submitting product:", err);
      setFormError(err.message || (isEn ? 'Failed to submit proposal. Please try again.' : 'प्रस्ताव जमा करने में विफल। कृपया पुनः प्रयास करें।'));
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <WeaverLayout activeTab="my-products" setActiveTab={() => {}}>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-loom-wood flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-loom-gold" />
            {t('weaverProducts.title')}
          </h1>
        </div>

        {/* Tab Switches */}
        <div className="flex bg-loom-beige/25 p-1 rounded-xl border border-loom-beige/50 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-heading font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-loom-wood text-white shadow-sm' 
                : 'text-loom-ink-light hover:text-loom-ink'
            }`}
          >
            {t('weaverProducts.pendingRejected')}
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-heading font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'submit' 
                ? 'bg-loom-wood text-white shadow-sm' 
                : 'text-loom-ink-light hover:text-loom-ink'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {t('weaverProducts.submitNew')}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        /* Submissions List Tab */
        loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-loom-gold"></div>
          </div>
        ) : submissions.length === 0 ? (
          <Card className="vintage-card p-12 text-center">
            <ImageIcon className="w-16 h-16 text-loom-beige mx-auto mb-4" />
            <p className="font-heading text-xl text-loom-wood font-bold mb-2">
              {t('weaverProducts.noSubmissions')}
            </p>
            <Button
              type="button"
              onClick={() => setActiveTab('submit')}
              className="mt-4 px-6 py-2 bg-loom-wood text-white font-heading font-bold rounded-xl"
            >
              {t('weaverProducts.submitNew')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((sub) => (
              <Card key={sub.submissionId} className="vintage-card relative flex flex-col justify-between">
                <div>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    {sub.status === 'pending' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        {isEn ? "Pending" : "समीक्षा लंबित"}
                      </span>
                    )}
                    {sub.status === 'approved' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        {isEn ? "Approved" : "अनुमोदित"}
                      </span>
                    )}
                    {sub.status === 'rejected' && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        {isEn ? "Rejected" : "अस्वीकृत"}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex gap-4 items-start mt-2">
                      {/* Image Preview */}
                      <div className="w-24 h-24 rounded-lg bg-loom-cream border border-loom-beige overflow-hidden shrink-0 flex items-center justify-center">
                        {sub.images && sub.images[0] ? (
                          <img src={sub.images[0]} alt={sub.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-loom-beige" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-heading text-xl font-bold text-loom-wood">{sub.title}</h3>
                        <p className="font-body text-loom-ink-light text-sm line-clamp-2 mt-1">{sub.description}</p>
                        <p className="font-heading font-bold text-loom-wood mt-2 text-base">
                          {isEn ? "Proposed Price:" : "प्रस्तावित मूल्य:"} <span className="text-loom-gold text-lg">₹{sub.price}</span>
                        </p>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    {sub.skillTags && sub.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {sub.skillTags.map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-body font-semibold bg-loom-cream border border-loom-beige text-loom-ink-light">
                            <Tag className="w-3 h-3 text-loom-gold" />
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footnotes: Wait message or Rejection reasoning */}
                <div className="px-6 py-4 bg-loom-beige/10 border-t border-loom-beige/40 rounded-b-xl">
                  {sub.status === 'pending' && (
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1 bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
                      <Clock className="w-4 h-4" />
                      {t('weaverProducts.waitingReview')}
                    </p>
                  )}
                  {sub.status === 'approved' && (
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1 bg-green-50/50 p-2 rounded-lg border border-green-200/50">
                      <CheckCircle2 className="w-4 h-4" />
                      {isEn 
                        ? `Approved by Secretary. Live in catalog.` 
                        : `सचिव द्वारा अनुमोदित। उत्पाद कैटलॉग में लाइव है।`}
                    </p>
                  )}
                  {sub.status === 'rejected' && (
                    <div className="bg-red-50/50 border border-red-200/50 p-2.5 rounded-lg">
                      <span className="text-xs font-heading font-bold text-red-700 block mb-1">
                        ⚠️ {t('weaverProducts.rejectionReason')}:
                      </span>
                      <p className="text-xs font-body text-red-800 leading-relaxed">
                        {sub.rejectionReason || (isEn ? "No reason specified." : "कोई कारण नहीं दिया गया।")}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Submission Form Tab */
        <div className="max-w-2xl mx-auto">
          <Card className="vintage-card p-6 sm:p-8">
            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* Form Input: Title */}
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {t('weaverProducts.formTitle')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. Fine Zari Silk Dupatta" : "जैसे: बढ़िया ज़री सिल्क दुपट्टा"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              {/* Form Input: Description */}
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {t('weaverProducts.formDesc')} *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={isEn ? "Detail the pattern, weave type, materials used, yarn count..." : "पैटर्न, बुनाई के प्रकार, प्रयुक्त सामग्री, धागे की संख्या आदि का विवरण दें..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              {/* Form Input: Price */}
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {t('weaverProducts.formPrice')} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              {/* Form Input: Tags */}
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-2">
                  {t('weaverProducts.formTags')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold transition-all border cursor-pointer ${
                          isSelected 
                            ? 'bg-loom-wood text-white border-loom-wood shadow-sm' 
                            : 'bg-white border-loom-beige text-loom-ink hover:bg-loom-cream'
                        }`}
                      >
                        {getTagLabel(tag)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Input Selection */}
              <div className="border-t border-loom-beige/40 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-heading font-bold text-loom-wood">
                    {t('weaverProducts.formPhotos')}
                  </span>
                  
                  {/* Toggle Upload vs Preset */}
                  <div className="flex p-0.5 bg-loom-beige/20 border border-loom-beige/45 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setUseUpload(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        !useUpload 
                          ? 'bg-white text-loom-wood shadow-sm' 
                          : 'text-loom-ink-light'
                      }`}
                    >
                      {isEn ? "Use Presets" : "प्रीसेट चुनें"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUpload(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        useUpload 
                          ? 'bg-white text-loom-wood shadow-sm' 
                          : 'text-loom-ink-light'
                      }`}
                    >
                      {isEn ? "Upload Photos" : "फ़ोटो अपलोड करें"}
                    </button>
                  </div>
                </div>

                {!useUpload ? (
                  /* Preset Selection */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {IMAGE_PRESETS.map((preset) => {
                      const isSelected = selectedPresetUrl === preset.url;
                      return (
                        <div
                          key={preset.key}
                          onClick={() => setSelectedPresetUrl(preset.url)}
                          className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-square ${
                            isSelected 
                              ? 'border-loom-wood ring-3 ring-loom-gold/25' 
                              : 'border-loom-beige/50 hover:border-loom-gold'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/55 p-1.5 text-center">
                            <span className="text-[10px] text-white font-medium block truncate">
                              {isEn ? preset.key.replace(/([A-Z])/g, ' $1') : preset.name.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Custom File Uploads (Max 3) */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl bg-loom-cream border-2 border-dashed border-loom-beige overflow-hidden flex flex-col items-center justify-center p-3 text-center">
                          {file ? (
                            <>
                              {/* Preview uploaded image using URL.createObjectURL */}
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`upload-${idx}`} 
                                className="w-full h-full object-cover absolute inset-0"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                              <Upload className="w-6 h-6 text-loom-beige group-hover:text-loom-gold mb-2" />
                              <span className="text-xs font-semibold text-loom-ink-light">
                                {isEn ? `Photo ${idx + 1}` : `तस्वीर ${idx + 1}`}
                              </span>
                              <span className="text-[10px] text-loom-beige mt-0.5">JPG / PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(idx, e)}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Actions */}
              <div className="border-t border-loom-beige/40 pt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-6 py-2.5 border border-loom-beige text-loom-ink hover:bg-loom-cream font-heading rounded-xl cursor-pointer"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-8 py-2.5 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                      <span>{uploadProgress || t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('weaverProducts.submitBtn')}</span>
                    </>
                  )}
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}
    </WeaverLayout>
  );
};
