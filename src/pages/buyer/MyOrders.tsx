import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BuyerLayout } from '../../components/layout/BuyerLayout';
import { getBuyerOrders, getOrderItems } from '../../firebase/firestore';
import { Order, OrderItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { 
  ShoppingBag, 
  Clock, 
  TrendingUp, 
  Building, 
  CheckCircle2, 
  X, 
  Truck, 
  Calendar,
  ArrowRight,
  Hammer
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MyOrders: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const buyerId = currentUser?.uid || 'buyer1';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const fetched = await getBuyerOrders(buyerId);
      setOrders(fetched);
    } catch (err) {
      console.error("Error loading buyer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [buyerId]);

  const handleOpenDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setModalLoading(true);
    try {
      const items = await getOrderItems(order.orderId);
      setSelectedOrderItems(items);
    } catch (err) {
      console.error("Error fetching order items:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_production':
        return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
      case 'partially_shipped':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getOrderItemStatusClass = (status: OrderItem['status']) => {
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

  const getOrderStatusTranslation = (status: Order['status']) => {
    return t(`buyer.orders.status.${status}`, status);
  };

  // Helper to calculate total completion progress across order items
  const getOrderProgress = (order: Order) => {
    if (order.status === 'completed') return 100;
    if (order.status === 'confirmed') return 0;
    if (order.status === 'in_production') return 45;
    if (order.status === 'partially_shipped') return 80;
    return 0;
  };

  // Calculate actual completion percentage in details modal
  const calculateDetailedProgress = () => {
    if (selectedOrderItems.length === 0) return 0;
    const totalAllocated = selectedOrderItems.reduce((sum, item) => sum + item.allocatedQuantity, 0);
    const totalCompleted = selectedOrderItems.reduce((sum, item) => sum + item.completedQuantity, 0);
    return Math.round((totalCompleted / totalAllocated) * 100);
  };

  return (
    <BuyerLayout>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-loom-gold" />
          {t('buyer.orders.title', 'मेरे ऑर्डर')}
        </h1>
        <p className="font-body text-base text-loom-ink-light mt-1">
          {isEn 
            ? "Monitor the complete production and fulfillment journey of your orders."
            : "अपने ऑर्डर्स की संपूर्ण उत्पादन और आपूर्ति यात्रा की निगरानी करें।"}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg text-loom-wood">
            {t('common.loading', 'लोड हो रहा है...')}
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white/60 rounded-2xl border-2 border-dashed border-loom-beige p-8">
          <ShoppingBag className="w-16 h-16 text-loom-gold/50 mx-auto mb-4" />
          <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">
            {t('buyer.orders.noOrders', 'कोई ऑर्डर नहीं मिला')}
          </h3>
          <p className="font-body text-loom-ink-light max-w-md mx-auto mb-6">
            {isEn 
              ? "You don't have any orders yet. Accept quotation coalition proposals on the RFQ Opportunities page to start your orders."
              : "आपका अभी कोई অর্ডার নেই। অর্ডার शुरू करने के लिए थोक मांग बोर्ड पर कोटेशन स्वीकार करें।"}
          </p>
        </div>
      ) : (
        /* Orders list */
        <div className="space-y-6">
          {orders.map((order) => {
            const progress = getOrderProgress(order);
            return (
              <Card key={order.orderId} className="vintage-card overflow-hidden border-2 border-loom-beige">
                <CardHeader className="bg-loom-parchment p-5 border-b border-loom-beige flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-loom-gold uppercase tracking-wider bg-loom-wood px-2 py-0.5 rounded">
                        {t('buyer.orders.orderId', 'ऑर्डर ID')}: #{order.orderId.substring(0, 8)}
                      </span>
                      <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {getOrderStatusTranslation(order.status)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-black text-loom-wood mt-2.5">
                      {isEn ? `${order.totalQuantity} Pieces ordered` : `${order.totalQuantity} पीस ऑर्डर किए गए`}
                    </CardTitle>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-bold text-loom-ink-light">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-loom-gold" />
                      {t('buyer.orders.orderDate', 'ऑर्डर दिनांक')}: {new Date(order.orderedAt).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-loom-gold" />
                      {t('buyer.orders.totalAmount', 'कुल राशि')}: ₹{order.totalAmount.toLocaleString(isEn ? 'en-US' : 'hi-IN')}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-loom-wood mb-1">
                      <span>{t('buyer.orders.progress', 'प्रगति')}</span>
                      <span>{progress}%</span>
                    </div>
                    
                    <div className="h-4 bg-loom-sand/20 border border-loom-beige rounded-full relative overflow-hidden">
                      <div 
                        className="h-full bg-loom-gold/90 transition-all duration-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${progress}%` }}
                      >
                        {progress > 5 && (
                          <div className="w-3.5 h-3.5 bg-loom-wood rounded-full border border-loom-gold rotate-45 transform translate-x-1 shrink-0 shadow-sm" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-loom-ink-light">
                      {order.rfqDescription ? (
                        <span className="italic block max-w-md truncate">
                          "{order.rfqDescription}"
                        </span>
                      ) : (
                        <span>Bulk Contract Fulfillment</span>
                      )}
                    </div>
                    
                    <Button 
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenDetails(order)}
                    >
                      {t('buyer.orders.viewDetails', 'विवरण देखें')}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-loom-beige bg-loom-wood text-loom-cream rounded-t-lg relative">
              <div className="absolute inset-0 bg-loom-wood/95 z-0 rounded-t-lg" />
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="font-heading text-xl font-bold flex items-center gap-1.5">
                    <ShoppingBag className="w-5 h-5 text-loom-gold" />
                    Order Details: #{selectedOrder.orderId.substring(0, 8)}
                  </h3>
                  <p className="text-xs text-loom-gold/90 mt-1">
                    Ordered on {new Date(selectedOrder.orderedAt).toLocaleString(isEn ? 'en-US' : 'hi-IN')}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-loom-cream/80 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Order Status Stepper */}
              <div className="border border-loom-beige bg-white p-4 rounded-xl shadow-xs">
                <h4 className="text-xs font-bold text-loom-wood uppercase tracking-wider mb-4 border-b border-loom-beige/50 pb-1.5">
                  Fulfillment Timeline
                </h4>
                
                <div className="grid grid-cols-5 text-center text-[10px] font-heading font-black tracking-wide gap-1">
                  {[
                    { key: 'confirmed', label: isEn ? 'Confirmed' : 'पुष्टि', icon: Clock },
                    { key: 'weaving', label: isEn ? 'Weaving' : 'बुनाई', icon: Hammer },
                    { key: 'qc_passed', label: isEn ? 'QC Approved' : 'गुणवत्ता पास', icon: CheckCircle2 },
                    { key: 'shipped', label: isEn ? 'Shipped' : 'शिप किया गया', icon: Truck },
                    { key: 'completed', label: isEn ? 'Delivered' : 'पूर्ण', icon: CheckCircle2 }
                  ].map((step, idx) => {
                    const statusVal = selectedOrder.status;
                    let active = false;
                    let completed = false;

                    if (statusVal === 'completed') {
                      completed = true;
                    } else if (statusVal === 'cancelled') {
                      // none
                    } else {
                      if (step.key === 'confirmed') completed = true;
                      if (step.key === 'weaving' && (statusVal === 'in_production' || statusVal === 'partially_shipped')) active = true;
                      if (step.key === 'qc_passed' && (statusVal === 'partially_shipped' || statusVal === 'in_production')) {
                        active = true;
                      }
                      if (step.key === 'shipped' && statusVal === 'partially_shipped') active = true;
                    }

                    const StepIcon = step.icon;

                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          completed || active 
                            ? 'bg-loom-wood border-loom-gold text-loom-gold' 
                            : 'bg-loom-sand/20 border-loom-beige text-loom-ink-light'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className={`mt-2 font-bold leading-tight ${
                          completed || active ? 'text-loom-wood font-extrabold' : 'text-loom-ink-light'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RFQ Description */}
              {selectedOrder.rfqDescription && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-extrabold text-loom-wood block mb-1">
                    Product Specifications
                  </h4>
                  <p className="font-body text-sm bg-white p-3 rounded-xl border border-loom-beige/50 italic text-loom-ink">
                    "{selectedOrder.rfqDescription}"
                  </p>
                </div>
              )}

              {/* Progress Summary */}
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-3 border-loom-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-loom-wood">Loading order status details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-loom-wood">
                    <span className="uppercase tracking-wider">Cooperative Production Progress</span>
                    <span className="bg-loom-wood text-loom-cream px-2 py-0.5 rounded text-[10px]">
                      {calculateDetailedProgress()}% Completed
                    </span>
                  </div>

                  {selectedOrderItems.length === 0 ? (
                    <div className="p-4 bg-white border border-loom-beige rounded-xl text-center text-xs text-loom-ink-light">
                      No fulfillment items associated.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedOrderItems.map((item) => {
                        const progressPercent = Math.round((item.completedQuantity / item.allocatedQuantity) * 100);
                        const isShipped = item.status === 'shipped';
                        
                        return (
                          <div key={item.orderItemId} className="p-4 bg-white border border-loom-beige rounded-xl shadow-2xs space-y-3">
                            <div className="flex justify-between items-start gap-2 border-b border-loom-beige/30 pb-2">
                              <div>
                                <h5 className="font-heading font-black text-base text-loom-wood flex items-center gap-1">
                                  <Building className="w-4 h-4 text-loom-gold" />
                                  {item.cooperativeName}
                                </h5>
                                {item.estimatedDelivery && (
                                  <span className="text-[10px] text-loom-ink-light flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-loom-gold" />
                                    Estimated Delivery: {new Date(item.estimatedDelivery).toLocaleDateString(isEn ? 'en-US' : 'hi-IN')}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase ${getOrderItemStatusClass(item.status)}`}>
                                {isShipped 
                                  ? (isEn ? 'Shipped' : 'শিপ করা')
                                  : item.status === 'qc_passed' 
                                  ? (isEn ? 'QC Approved' : 'गुणवत्ता पास')
                                  : item.status === 'weaving' 
                                  ? (isEn ? 'Weaving' : 'बुनाई चालू') 
                                  : (isEn ? 'Pending Assignment' : 'लंबित')}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-loom-sand/10 p-2 rounded-lg border border-loom-beige/40">
                                <span className="text-loom-ink-light block text-[10px]">Allocated</span>
                                <span className="font-bold text-loom-wood text-sm">{item.allocatedQuantity} pcs</span>
                              </div>
                              <div className="bg-purple-50/20 p-2 rounded-lg border border-purple-100">
                                <span className="text-purple-950 block text-[10px]">Weaved</span>
                                <span className="font-bold text-purple-700 text-sm">{item.completedQuantity} pcs</span>
                              </div>
                              <div className="bg-emerald-50/20 p-2 rounded-lg border border-emerald-100">
                                <span className="text-emerald-950 block text-[10px]">Shipped</span>
                                <span className="font-bold text-emerald-600 text-sm">{item.shippedQuantity} pcs</span>
                              </div>
                            </div>

                            <div>
                              <div className="h-2 bg-loom-sand/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-loom-gold/90 rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>

                            {item.trackingNumber && (
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg text-xs flex justify-between items-center">
                                <span className="font-medium flex items-center gap-1.5">
                                  <Truck className="w-4 h-4" />
                                  Tracking ID: <span className="font-mono font-black">{item.trackingNumber}</span>
                                </span>
                                <span className="font-bold uppercase text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded">
                                  In Transit
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-loom-beige bg-loom-parchment flex justify-end rounded-b-lg">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
};
