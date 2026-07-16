import React, { useEffect, useState } from 'react';
import { Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface ProductTraceBadgeProps {
  productId: string;
  hasTraceability?: boolean;
  showLink?: boolean;
  className?: string;
}

export const ProductTraceBadge: React.FC<ProductTraceBadgeProps> = ({
  productId,
  hasTraceability,
  showLink = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasTraceability || hasTraceability === undefined) {
      setLoading(true);
      // Query Firestore to find at least one productInstance linked to this product
      const instancesRef = collection(db, 'productInstances');
      const q = query(instancesRef, where('productId', '==', productId), limit(1));
      
      getDocs(q)
        .then((snap) => {
          if (!snap.empty) {
            setInstanceId(snap.docs[0].id);
          }
        })
        .catch((err) => {
          console.error('Error fetching product instance:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productId, hasTraceability]);

  if (!hasTraceability && !instanceId && !loading) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-1.5 p-2 bg-[#fdfaf2] border border-[#d4af37]/30 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
        <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <Award className="h-3.5 w-3.5" />
        </div>
        <span>{t('trace.verifiedFairWage', 'सत्यापित न्यायसंगत वेतन (Verified Fair Wage)')}</span>
      </div>
      
      {showLink && instanceId && (
        <a
          href={`/trace/${instanceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-[11px] font-medium text-[#c084fc] hover:text-[#a855f7] transition-colors mt-0.5"
        >
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {t('trace.viewTraceability', 'ट्रेसेबिलिटी विवरण देखें (View Traceability)')}
          </span>
          <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};
