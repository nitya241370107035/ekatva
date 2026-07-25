import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getCooperativeOrderItems, markOrderItemShipped, getJobCardsByCooperative } from '../../firebase/firestore';
import { OrderItem, JobCard } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { 
  Truck, 
  Clock, 
  Building, 
  X, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OrderFulfillment: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Shipping Modal State
  const [shippingItem, setShippingItem] = useState<OrderItem | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);

  const cooperativeId = userProfile?.cooperativeId || 'coop1';

  const fetchData = async () => {
    if (!cooperativeId) return;
    try {
      setLoading(true);
      const [items, cards] = await Promise.all([
        getCooperativeOrderItems(cooperativeId),
        getJobCardsByCooperative(cooperativeId)
      ]);
      setOrderItems(items);
      setJobCards(cards);
    } catch (err) {
      console.error("Error loading cooperative order items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cooperativeId]);

  const handleOpenShipModal = (item: OrderItem) => {
    setShippingItem(item);
    setTrackingNumber('');
    setShowShipModal(true);
  };

  const handleMarkShippedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingItem || !trackingNumber.trim()) return;

    setShippingLoading(true);
    try {
      await markOrderItemShipped(
        shippingItem.orderId,
        shippingItem.orderItemId,
        trackingNumber.trim()
      );
      
      setToastMessage(isEn ? 'Order item successfully marked as Shipped!' : 'ऑर्डर आइटम सफलतापूर्वक शिप किया गया मार्क कर दिया गया!');
      setShowShipModal(false);
      fetchData();
    } catch (err) {
      console.error("Error marking item shipped:", err);
    } finally {
      setShippingLoading(false);
    }
  };

  const getStatusBadgeClass = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'weaving':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'qc_passed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'shipped':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusTranslation = (status: OrderItem['status']) => {
    return t(`secretary.orderItem.${status}`, status);
  };

  // Helper to find job cards linked to this order item
  const getLinkedJobCards = (orderItemId: string) => {
    return jobCards.filter(jc => jc.orderItemId === orderItemId);
  };

  return (
    <SecretaryLayout>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
          <Truck className="w-8 h-8 text-loom-gold" />
          {t('secretary.orders.title', 'ऑर्डर पूर्ति')}
        </h1>
        <p className="font-body text-base text-loom-ink/70 mt-1">
          {isEn 
            ? "Manage allocated bulk order quotas, monitor weaving, and dispatch completed items."
            : "आवंटित थोक ऑर्डर कोटा प्रबंधित करें, बुनाई की निगरानी करें और पूर्ण हो चुके सामानों को शिप करें।"}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">
            {t('common.loading', 'लोड हो रहा है...')}
          </p>
        </div>
      ) : orderItems.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <Building className="w-16 h-16 text-loom-gold/50 mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">
            {t('secretary.orders.noOrders', 'कोई आवंटित ऑर्डर नहीं')}
          </h3>
          <p className="font-body text-loom-ink/70 max-w-md mx-auto">
            {isEn 
              ? "Your cooperative currently has no allocated bulk order items to fulfill."
              : "वर्तमान में आपकी सहकारी समिति के पास पूरा करने के लिए कोई आवंटित थोक ऑर्डर नहीं है।"}
          </p>
        </div>
      ) : (
        /* Order Items List */
        <div className="space-y-6">
          {orderItems.map((item) => {
            const linkedJobs = getLinkedJobCards(item.orderItemId);
            const progressPercent = Math.round((item.completedQuantity / item.allocatedQuantity) * 100);
            
            return (
              <Card key={item.orderItemId} className="vintage-card overflow-hidden border-2 border-loom-beige">
                <CardHeader className="bg-loom-parchment p-5 border-b border-loom-beige flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-loom-gold uppercase tracking-wider bg-loom-wood px-2 py-0.5 rounded">
                        Order: #{item.orderId.substring(0, 8)}
                      </span>
                      <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full uppercase ${getStatusBadgeClass(item.status)}`}>
                        {getStatusTranslation(item.status)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-black text-loom-wood mt-2.5">
                      {isEn 
                        ? `${item.allocatedQuantity} Units Allocated` 
                        : `${item.allocatedQuantity} यूनिट आवंटित`}
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-loom-ink-light">
                    {item.estimatedDelivery && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-loom-gold" />
                        {isEn ? "Target Date:" : "लक्षित तिथि:"} {new Date(item.estimatedDelivery).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                  {/* Progress Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-loom-sand/15 p-3 rounded-xl border border-loom-beige/50 text-center">
                      <span className="text-[10px] uppercase font-bold text-loom-ink-light block">Allocated Quota</span>
                      <span className="text-xl font-heading font-black text-loom-wood">{item.allocatedQuantity} pcs</span>
                    </div>
                    <div className="bg-purple-50/20 p-3 rounded-xl border border-purple-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-purple-950 block">Weaving Completed</span>
                      <span className="text-xl font-heading font-black text-purple-700">{item.completedQuantity} pcs</span>
                    </div>
                    <div className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-950 block">Shipped Quantity</span>
                      <span className="text-xl font-heading font-black text-emerald-600">{item.shippedQuantity} pcs</span>
                    </div>
                  </div>

                  {/* Progress Shuttle Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-loom-wood mb-1">
                      <span>Production Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-3.5 bg-loom-sand/20 border border-loom-beige rounded-full relative overflow-hidden">
                      <div 
                        className="h-full bg-loom-gold/90 transition-all rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Linked Job Cards list */}
                  <div className="border-t border-loom-beige/40 pt-4">
                    <h5 className="text-xs font-bold text-loom-wood uppercase tracking-wider mb-2.5">
                      {t('secretary.orders.jobCards', 'संबद्ध जॉब कार्ड')} ({linkedJobs.length})
                    </h5>
                    
                    {linkedJobs.length === 0 ? (
                      <div className="p-3 bg-loom-sand/5 border border-dashed border-loom-beige rounded-xl text-center text-xs text-loom-ink-light">
                        {t('secretary.orders.noJobCards', 'अभी तक कोई जॉब कार्ड संबद्ध नहीं है')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {linkedJobs.map(jc => (
                          <div 
                            key={jc.jobCardId}
                            className="p-3 bg-white border border-loom-beige rounded-xl flex justify-between items-center hover:border-loom-gold transition-colors cursor-pointer"
                            onClick={() => navigate(`/secretary/jobcard/${jc.jobCardId}`)}
                          >
                            <div>
                              <span className="font-bold text-loom-wood block">{jc.title}</span>
                              <span className="text-[10px] text-loom-ink-light">Assigned to: {jc.assignedToName}</span>
                            </div>
                            <span className="font-bold uppercase text-[9px] bg-loom-sand/30 text-loom-wood px-2 py-0.5 rounded border border-loom-beige">
                              {jc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Shipment Tracking details if dispatched */}
                  {item.status === 'shipped' && item.trackingNumber && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs flex justify-between items-center">
                      <span className="font-medium flex items-center gap-1.5">
                        <Truck className="w-5 h-5" />
                        {t('secretary.orders.trackingNumber', 'ट्रैकिंग नंबर')}: <span className="font-mono font-black">{item.trackingNumber}</span>
                      </span>
                      <span className="font-bold uppercase text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded">
                        {t('secretary.orders.shipped', 'शिप')}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {item.status === 'qc_passed' && (
                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenShipModal(item)}
                      >
                        <Truck className="w-4 h-4" />
                        {t('secretary.orders.markShipped', 'शिप के रूप में चिह्नित करें')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shipping Modal */}
      {showShipModal && shippingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold w-full max-w-md rounded-2xl shadow-2xl relative">
            <div className="p-5 border-b border-loom-beige bg-loom-wood text-loom-cream rounded-t-lg relative">
              <div className="absolute inset-0 bg-loom-wood/95 z-0 rounded-t-lg" />
              <div className="relative z-10 flex justify-between items-center">
                <h3 className="font-heading text-lg font-bold flex items-center gap-1.5">
                  <Truck className="w-5 h-5 text-loom-gold" />
                  {t('secretary.orders.markShipped', 'शिप के रूप में चिह्नित करें')}
                </h3>
                <button 
                  onClick={() => setShowShipModal(false)}
                  className="text-loom-cream/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleMarkShippedSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-loom-gold shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t('secretary.orders.shipConfirm', 'क्या आप वाकई इस आइटम को शिप किया गया मार्क करना चाहते हैं?')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-loom-wood mb-1">
                  {t('secretary.orders.trackingNumber', 'ट्रैकिंग नंबर')} *
                </label>
                <Input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. IN102930219" : "जैसे: IN102930219"}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-loom-beige">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowShipModal(false)}
                >
                  {t('common.cancel', 'रद्द करें')}
                </Button>
                <Button 
                  type="submit" 
                  variant="success" 
                  size="sm"
                  disabled={shippingLoading}
                >
                  {shippingLoading ? (isEn ? "Processing..." : "प्रक्रिया चालू...") : (isEn ? "Mark Shipped" : "शिप मार्क करें")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
