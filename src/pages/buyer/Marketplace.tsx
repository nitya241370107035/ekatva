import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BuyerLayout } from '../../components/layout/BuyerLayout';
import { getAllProducts } from '../../firebase/firestore';
import { Product } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ShoppingBag, 
  Award, 
  Tag, 
  MapPin, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmpathyLoom } from '../../components/EmpathyLoom';

export const Marketplace: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showStoryId, setShowStoryId] = useState<string | null>(null);

  // Available filters
  const tagsList = ["बनारसी", "रेशम (Silk)", "सूती (Cotton)", "इकत (Ikat)", "जामदानी (Jamdani)", "खादी (Khadi)", "जरी (Zari)"];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        console.error("Error loading marketplace products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.cooperativeName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Skill tags matching helper
    const matchesTag = !selectedTag || product.skillTags.some(tag => tag.includes(selectedTag.split(' ')[0]));
    
    return matchesSearch && matchesTag;
  });

  const toggleStory = (id: string) => {
    setShowStoryId(showStoryId === id ? null : id);
  };

  const handleRequestProductStyle = (product: Product) => {
    // Navigate to RFQs and pre-fill details
    sessionStorage.setItem('prefilled_rfq_desc', `हमें ${product.name} जैसी डिजाइन और गुणवत्ता वाले कपड़े की थोक आवश्यकता है। संदर्भ उत्पाद कूट: ${product.productId}`);
    sessionStorage.setItem('prefilled_rfq_budget', product.price.toString());
    navigate('/buyer/rfqs');
  };

  return (
    <BuyerLayout>
      {/* Premium Hero Banner */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-loom-wood text-loom-cream p-8 md:p-12 shadow-md bg-loom-pattern">
        {/* Semi-transparent dark wood overlay */}
        <div className="absolute inset-0 bg-loom-wood/90 z-0" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-loom-gold animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-loom-gold font-extrabold">100% प्रामाणिक हस्तनिर्मित हथकरघा</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tight leading-tight">
            हाथकरघा सहकारी बाज़ार (Collective Storefront)
          </h1>
          <p className="font-body text-base md:text-lg text-loom-cream/90 mt-4 max-w-2xl leading-relaxed">
            विभिन्न सहकारी समितियों से जुड़े हुनरमंद बुनकरों द्वारा सीधे करघे से बुने गए शुद्ध, जीआई और हैंडलूम मार्क प्रमाणित वस्त्रों को बिना किसी बिचौलिए के सीधे खरीदें।
          </p>
        </div>
      </div>

      {/* Interactive Empathy Loom (Reviving Connection to the Art) */}
      <div className="mb-10">
        <EmpathyLoom />
      </div>

      {/* Search and Filters panel */}
      <div className="mb-8 p-5 bg-white border border-loom-beige rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-loom-gold" />
          <input
            type="text"
            placeholder="उत्पाद का नाम, विवरण या सहकारी समिति खोजें..."
            className="w-full pl-9 pr-4 py-3 bg-loom-parchment/30 border border-loom-beige rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-loom-gold font-body"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-loom-gold shrink-0" />
          <span className="text-xs font-bold text-loom-wood uppercase tracking-wider">फिल्टर:</span>
          
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              !selectedTag 
                ? 'bg-loom-wood text-white border-loom-wood shadow-sm' 
                : 'bg-loom-parchment/45 text-loom-wood border-loom-beige hover:bg-loom-sand/10'
            }`}
          >
            सभी उत्पाद
          </button>

          {tagsList.map(tag => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-loom-wood text-white border-loom-wood shadow-sm' 
                    : 'bg-loom-parchment/45 text-loom-wood border-loom-beige hover:bg-loom-sand/10'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product list catalog header */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-black text-loom-wood">
          उत्कृष्ट हथकरघा संग्रह (Authentic Collection)
        </h2>
        <p className="font-body text-sm text-loom-ink-light">
          दिखाए गए उत्पाद सीधे पंजीकृत भारतीय बुनकर सहकारी समितियों के स्टॉक से उपलब्ध हैं।
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">हथकरघा बाज़ार सजाया जा रहा है...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <ShoppingBag className="w-16 h-16 text-loom-gold/50 mx-auto mb-4 animate-bounce" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">कोई उत्पाद नहीं मिला</h3>
          <p className="font-body text-loom-ink-light max-w-md mx-auto">
            खोजे गए शब्दों या चुने गए फिल्टर के अनुसार कोई हथकरघा उत्पाद उपलब्ध नहीं है। कृपया दूसरा फिल्टर आज़माएं।
          </p>
        </div>
      ) : (
        /* Products Display Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const isStoryOpen = showStoryId === product.productId;
            return (
              <Card 
                key={product.productId} 
                className="flex flex-col justify-between overflow-hidden relative group vintage-card hover:shadow-2xl transition-all duration-300 border-2 border-loom-beige"
              >
                <div>
                  {/* Image Canvas with woven border */}
                  <div className="relative aspect-video w-full bg-loom-beige/20 border-b border-loom-beige/30 overflow-hidden">
                    <img 
                      src={product.images[0] || "/banarasi_silk.png"} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* GI or Handloom Mark Badge */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                      {product.handloomMark && (
                        <span className="bg-loom-gold text-loom-wood text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md border border-loom-wood flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          हैंडलूम मार्क प्रमाणित
                        </span>
                      )}
                      {product.hasTraceability && (
                        <span className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-md border border-emerald-500 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          सत्यापित निष्पक्ष मजदूरी
                        </span>
                      )}
                      <span className="bg-white/95 text-loom-wood text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md border border-loom-beige">
                        स्टॉक: {product.quantityAvailable} पीस
                      </span>
                    </div>
                  </div>

                  {/* Card Info */}
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-xl font-bold text-loom-ink font-heading line-clamp-1">
                        {product.name}
                      </CardTitle>
                      <span className="font-heading text-lg font-black text-loom-wood shrink-0">
                        ₹{product.price.toLocaleString('hi-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 text-xs text-loom-gold font-bold mt-1.5 uppercase tracking-wide">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        निर्माता: <span className="text-loom-wood underline font-extrabold">{product.cooperativeName}</span>
                      </div>
                    </div>

                    {/* Skill tags */}
                    {product.skillTags && product.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {product.skillTags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-loom-gold/15 text-loom-wood border border-loom-gold/30 px-2 py-0.5 rounded font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {product.hasTraceability && (
                      <button
                        onClick={async () => {
                          try {
                            const { db } = await import('../../firebase/config');
                            const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
                            const q = query(collection(db, 'productInstances'), where('productId', '==', product.productId), limit(1));
                            const snap = await getDocs(q);
                            if (!snap.empty) {
                              const instId = snap.docs[0].id;
                              window.open(`/trace/${instId}`, '_blank');
                            } else {
                              alert('इस उत्पाद का डिजिटल प्रमाणपत्र अभी प्रक्रिया में है।');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="mt-3 text-xs font-heading font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        डिजिटल प्रमाणपत्र (Trace Certificate) →
                      </button>
                    )}
                  </CardHeader>

                  <CardContent className="px-5 pb-4 pt-1">
                    <p className="font-body text-sm text-loom-ink-light leading-relaxed mb-3">
                      {product.description}
                    </p>

                    {/* Weaver story collapsible section */}
                    <div className="border border-loom-beige/50 rounded-xl overflow-hidden bg-loom-parchment/40">
                      <button
                        onClick={() => toggleStory(product.productId)}
                        className="w-full flex justify-between items-center px-3.5 py-2.5 text-xs font-bold text-loom-wood hover:bg-loom-sand/10 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-loom-gold" />
                          बुनकर कारीगर की कहानी (Artisan Story)
                        </span>
                        {isStoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isStoryOpen && (
                        <div className="px-3.5 pb-3.5 pt-0 text-xs text-loom-ink-light font-body leading-relaxed italic border-t border-loom-beige/30">
                          "{product.weaverStory}"
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Buy / Request Action Panel */}
                <div className="p-4 border-t border-loom-beige/30 bg-loom-cream/30">
                  <button 
                    onClick={() => handleRequestProductStyle(product)}
                    className="vintage-button w-full py-2.5 flex items-center justify-center gap-1.5 font-heading text-sm font-bold shadow-sm"
                  >
                    <Tag className="w-4 h-4 text-loom-gold" />
                    इस उत्पाद जैसा थोक आर्डर करें (RFQ भेजें)
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </BuyerLayout>
  );
};
