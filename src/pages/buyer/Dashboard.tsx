import React from 'react';
import { BuyerLayout } from '../../components/layout/BuyerLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ShoppingBag, Award, Tag, MapPin, Sparkles, Compass } from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  // Sample handloom catalog of authentic products
  const featuredProducts = [
    {
      title: "शाही बनारसी रेशम साड़ी",
      category: "बनारसी",
      price: "₹ 18,500",
      origin: "वाराणसी, उत्तर प्रदेश",
      weaver: "रमेश कुमार",
      description: "शुद्ध रेशम और सोने के जरी धागे से उत्कृष्ट हाथ से बुनी हुई उत्कृष्ट कृति।"
    },
    {
      title: "पारंपरिक पोचमपल्ली इकत थान",
      category: "इकत",
      price: "₹ 4,200",
      origin: "पोचमपल्ली, तेलंगाना",
      weaver: "सीता राव",
      description: "पारंपरिक ज्यामितीय आकृतियों और जीवंत रंगों वाला शुद्ध सूती इकत वस्त्र।"
    },
    {
      title: "महीन जामदानी सूती दुपट्टा",
      category: "जामदानी",
      price: "₹ 3,500",
      origin: "वाराणसी, उत्तर प्रदेश",
      weaver: "नूर जहां",
      description: "उत्कृष्ट और पारभासी मलमल के कपड़े पर बारीक पुष्प आकृतियों की बुनाई।"
    }
  ];

  return (
    <BuyerLayout>
      {/* Banner Area with woven texture pattern background */}
      <div className="relative mb-10 overflow-hidden rounded-2xl bg-loom-wood text-loom-cream p-8 md:p-12 shadow-md bg-loom-pattern">
        {/* Semi-transparent wood overlay */}
        <div className="absolute inset-0 bg-loom-wood/90 z-0" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-loom-gold animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-loom-gold font-bold">100% प्रामाणिक हथकरघा</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            प्रामाणिक हथकरघा उत्पाद खोजें
          </h1>
          <p className="font-body text-lg md:text-xl text-loom-cream/90 mt-4 max-w-2xl">
            भारत के सुदूर बुनकर समुदायों द्वारा सीधे करघे से बुने गए शुद्ध, पर्यावरण-अनुकूल और प्रामाणिक हथकरघा उत्पादों का विश्वसनीय डिजिटल बाज़ार।
          </p>
        </div>
      </div>

      {/* Featured Catalog Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-loom-wood">
            समिति के प्रमुख उत्पाद (Featured Collection)
          </h2>
          <p className="font-body text-base text-loom-ink-light">
            सीधे सहकारी बुनकरों द्वारा निर्मित कलाकृतियाँ।
          </p>
        </div>
        <div className="p-2.5 bg-loom-gold/15 text-loom-wood border border-loom-gold/30 rounded-xl font-heading font-bold flex items-center gap-1.5 text-base">
          <Compass className="w-5 h-5" />
          वाराणसी हब
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredProducts.map((product, idx) => (
          <Card key={idx} className="flex flex-col justify-between">
            <div>
              <div className="relative aspect-video w-full rounded-xl bg-loom-beige/25 flex items-center justify-center border-b border-loom-beige/30 overflow-hidden group">
                {/* Visual Ikat/weaving placeholder background */}
                <div className="absolute inset-0 bg-loom-pattern opacity-10 group-hover:scale-110 transition-transform duration-500" />
                <div className="relative flex flex-col items-center text-center p-4">
                  <ShoppingBag className="w-12 h-12 text-loom-gold mb-2" />
                  <span className="font-heading text-sm font-bold bg-loom-wood text-loom-cream px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
              </div>

              <CardHeader className="pt-4 pb-2 border-b-0">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-bold text-loom-ink line-clamp-1">
                    {product.title}
                  </CardTitle>
                  <span className="font-heading text-lg font-black text-loom-wood shrink-0">
                    {product.price}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-loom-gold font-bold mt-1 uppercase tracking-wide">
                  <Award className="w-3.5 h-3.5" />
                  जीआई प्रमाणित (GI Tagged)
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4 text-sm text-loom-ink-light font-body leading-relaxed">
                <p className="line-clamp-2">{product.description}</p>
                <div className="mt-4 pt-4 border-t border-loom-beige/20 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-1 text-loom-ink font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-loom-gold shrink-0" />
                    मूल उत्पत्ति: {product.origin}
                  </div>
                  <div className="text-loom-ink-light">
                    बुनकर कारीगर: <span className="font-bold text-loom-wood">{product.weaver}</span>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="p-4 border-t border-loom-beige/20 bg-loom-cream/30">
              <button className="vintage-button w-full py-2 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80" disabled>
                <Tag className="w-4 h-4" />
                उत्पाद उपलब्ध नहीं (Stage 1)
              </button>
            </div>
          </Card>
        ))}
      </div>
    </BuyerLayout>
  );
};
