import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { 
  getJobCardById, 
  getJobCardStatusLog, 
  updateJobCardStatus,
  createPayment,
  updateWeaverReliabilityScore,
  createProductInstance,
  getProductsByCooperative,
  getWeaverProfile
} from '../../firebase/firestore';
import { db, storage } from '../../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { JobCard, JobCardStatusLog, ProductInstance, Product, WeaverProfile } from '../../types';
import { generateHashChain } from '../../utils/hashUtils';
import QRCode from 'react-qr-code';
import { 
  ArrowLeft, 
  Clock, 
  Hammer, 
  ClipboardCheck, 
  FileCheck2, 
  AlertOctagon, 
  Calendar, 
  IndianRupee, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Camera, 
  ChevronRight,
  User,
  QrCode,
  Printer,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Toast } from '../../components/ui/Toast';

export const JobCardDetail: React.FC = () => {
  const { jobCardId } = useParams<{ jobCardId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [statusLog, setStatusLog] = useState<JobCardStatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [qcActionLoading, setQcActionLoading] = useState(false);

  // QC Rejection modal states
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Product Traceability states
  const [productInstance, setProductInstance] = useState<ProductInstance | null>(null);
  const [qcPassModalOpen, setQcPassModalOpen] = useState(false);
  const [instProductName, setInstProductName] = useState('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [cooperativeProducts, setCooperativeProducts] = useState<Product[]>([]);
  const [weaverProfile, setWeaverProfile] = useState<WeaverProfile | null>(null);

  const fetchDetails = async () => {
    if (!jobCardId) return;
    setLoading(true);
    try {
      const card = await getJobCardById(jobCardId);
      if (card) {
        setJobCard(card);
        const log = await getJobCardStatusLog(jobCardId);
        setStatusLog(log);

        // Fetch product instance if qc_passed
        if (card.status === 'qc_passed') {
          const instancesRef = collection(db, 'productInstances');
          const q = query(instancesRef, where('jobCardId', '==', jobCardId), limit(1));
          const instSnap = await getDocs(q);
          if (!instSnap.empty) {
            setProductInstance(instSnap.docs[0].data() as ProductInstance);
          }
        }

        // Pre-fetch weaver profile and products in background
        getWeaverProfile(card.assignedTo).then(p => setWeaverProfile(p));
        getProductsByCooperative(card.cooperativeId).then(list => setCooperativeProducts(list));
      } else {
        setToastMessage(isEn ? 'Job card not found.' : 'कार्य कार्ड नहीं मिला।');
      }
    } catch (err) {
      console.error("Error fetching job card details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [jobCardId]);

  const openQcPassModal = () => {
    if (!jobCard) return;
    setInstProductName(jobCard.title);
    
    // Suggest a final price default as wage * 2.5
    const wage = jobCard.quantity * jobCard.wagePerPiece;
    setFinalPrice(Math.round(wage * 2.5));
    setQcPassModalOpen(true);
  };

  const handleQcPassAndCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCardId || !jobCard || !currentUser || finalPrice <= 0) return;
    
    setQcActionLoading(true);
    try {
      const totalWage = jobCard.quantity * jobCard.wagePerPiece;
      
      // 1. Pass QC on Job Card
      await updateJobCardStatus(
        jobCardId, 
        'qc_passed', 
        currentUser.uid, 
        isEn
          ? 'Quality control passed. Approved for wage payout.'
          : 'गुणवत्ता नियंत्रण पास। सभी मदों को स्वीकृत किया गया। मजदूरी भुगतान के लिए स्वीकृत।',
        { totalWage }
      );

      // 2. Create wage payment
      await createPayment({
        cooperativeId: jobCard.cooperativeId,
        weaverId: jobCard.assignedTo,
        weaverName: jobCard.assignedToName,
        type: 'wage',
        amount: totalWage,
        description: isEn 
          ? `Wages – ${jobCard.title} (Qty: ${jobCard.quantity} pcs, Rate: ₹${jobCard.wagePerPiece}/pcs)`
          : `मजदूरी – ${jobCard.title} (मात्रा: ${jobCard.quantity} पीस, प्रति पीस दर: ₹${jobCard.wagePerPiece})`,
        jobCardId: jobCardId,
        createdBy: currentUser.uid
      });

      // 3. Update reliability score: +2, -3 if late
      const completedLog = statusLog.find(log => log.status === 'completed');
      let isLate = false;
      if (completedLog) {
        const completedDate = new Date(completedLog.timestamp);
        const deadlineDate = new Date(jobCard.deadline);
        if (completedDate > deadlineDate) {
          isLate = true;
        }
      } else {
        const deadlineDate = new Date(jobCard.deadline);
        if (new Date() > deadlineDate) {
          isLate = true;
        }
      }
      const scoreChange = isLate ? 2 - 3 : 2;
      await updateWeaverReliabilityScore(jobCard.assignedTo, scoreChange);

      // 4. Gather timeline status logs for Hash Chain
      // Use existing statusLog state and add the current qc_passed status
      const updatedLogList = [
        ...statusLog,
        {
          logId: 'temp-qc',
          status: 'qc_passed' as const,
          timestamp: new Date().toISOString(),
          changedBy: currentUser.uid,
          remarks: isEn ? 'Quality control passed.' : 'गुणवत्ता नियंत्रण पास।'
        }
      ];

      const rawSteps = updatedLogList.map(log => ({
        step: log.status === 'assigned' ? (isEn ? 'Yarn Issued' : 'धागा जारी और कार्य आवंटित (Yarn Issued)') :
              log.status === 'in_progress' ? (isEn ? 'Weaving Started' : 'बुनाई शुरू (Weaving Started)') :
              log.status === 'completed' ? (isEn ? 'Weaving Completed' : 'बुनाई पूर्ण (Weaving Completed)') :
              log.status === 'qc_passed' ? (isEn ? 'QC Passed' : 'गुणवत्ता स्वीकृत (QC Passed)') : log.status,
        timestamp: typeof log.timestamp === 'string' ? log.timestamp : new Date().toISOString(),
        details: log.remarks || (isEn ? `Status changed to ${log.status}` : `स्थिति ${log.status} में बदली गई`)
      }));

      // Sort chronologically (earliest first)
      const sortedSteps = [...rawSteps].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Generate Cryptographic Hash Chain
      const hashedSteps = generateHashChain(sortedSteps);

      // 5. Save the product instance to Firestore
      const instanceId = await createProductInstance({
        jobCardId,
        productId: selectedProductId || null,
        cooperativeId: jobCard.cooperativeId,
        weaverId: jobCard.assignedTo,
        weaverName: jobCard.assignedToName,
        weaverPhotoURL: weaverProfile?.photoURL || '',
        productName: instProductName || jobCard.title,
        finalPrice: Number(finalPrice),
        wagePaid: totalWage,
        wagePercentage: Number(((totalWage / finalPrice) * 100).toFixed(1)),
        productionSteps: hashedSteps
      });

      setToastMessage(isEn
        ? 'QC passed successfully, wage payout recorded and digital traceability certificate (QR) generated!'
        : 'गुणवत्ता नियंत्रण (QC) स्वीकृत हुआ, मजदूरी भुगतान दर्ज किया गया और डिजिटल ट्रेसेबिलिटी प्रमाणपत्र (QR) तैयार हो गया!');
      setQcPassModalOpen(false);
      await fetchDetails();
    } catch (err) {
      console.error("Error passing QC & creating traceability:", err);
      setToastMessage(isEn 
        ? 'Error occurred while passing QC & generating traceability certificate.' 
        : 'QC और ट्रेसेबिलिटी प्रमाणपत्र बनाने में त्रुटि आई।');
    } finally {
      setQcActionLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQcRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCardId || !jobCard || !currentUser || !rejectReason.trim()) return;

    setQcActionLoading(true);
    try {
      let uploadedUrl = '';

      // Upload image to Firebase Storage if selected
      if (selectedFile) {
        try {
          const storageRef = ref(storage, `qc_photos/${jobCardId}_${Date.now()}_${selectedFile.name}`);
          const snapshot = await uploadBytes(storageRef, selectedFile);
          uploadedUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn("Storage upload failed or unauthorized, falling back to base64 preview:", storageErr);
          // Fallback to base64 so it can still display correctly in prototype
          uploadedUrl = imagePreview || '';
        }
      }

      await updateJobCardStatus(
        jobCardId,
        'qc_rejected',
        currentUser.uid,
        isEn 
          ? `Quality control rejected. Reason: ${rejectReason}`
          : `गुणवत्ता नियंत्रण अस्वीकृत। कारण: ${rejectReason}`,
        {
          qcRemarks: rejectReason,
          qcPhotoURL: uploadedUrl
        }
      );

      // Deduct 5 from reliability score
      await updateWeaverReliabilityScore(jobCard.assignedTo, -5);

      setToastMessage(isEn 
        ? 'QC rejected. Issue has been forwarded to the weaver and reliability points deducted.'
        : 'QC अस्वीकार कर दिया गया। त्रुटि बुनकर को भेज दी गई है और विश्वसनीयता अंक घटा दिए गए हैं।');
      setRejectModalOpen(false);
      setRejectReason('');
      setSelectedFile(null);
      setImagePreview('');
      await fetchDetails();
    } catch (err) {
      console.error("Error rejecting QC:", err);
      setToastMessage(isEn ? 'Error submitting QC status.' : 'QC सबमिट करने में त्रुटि आई।');
    } finally {
      setQcActionLoading(false);
    }
  };

  const handlePrintQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !productInstance) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Ekatva QR Label - ${productInstance.productName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              text-align: center;
              padding: 20px;
              color: #333;
              background: #fff;
            }
            .label-card {
              border: 3px double #d4af37;
              border-radius: 12px;
              padding: 24px;
              max-width: 320px;
              margin: 0 auto;
              background: #fdfaf2;
              box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            }
            .logo {
              font-weight: 800;
              letter-spacing: 2px;
              color: #854d0e;
              margin-bottom: 4px;
              font-size: 18px;
            }
            .subtitle {
              font-size: 10px;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .qr-holder {
              margin: 16px 0;
              display: inline-block;
              background: #fff;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .product-name {
              font-size: 15px;
              font-weight: 700;
              margin: 12px 0 4px 0;
              color: #1e293b;
            }
            .weaver-info {
              font-size: 11px;
              color: #475569;
              margin-bottom: 12px;
            }
            .fair-wage-badge {
              display: inline-block;
              font-size: 10px;
              background-color: #d1fae5;
              color: #065f46;
              padding: 4px 10px;
              border-radius: 9999px;
              font-weight: 600;
              border: 1px solid #10b981;
            }
            .footer-text {
              margin-top: 14px;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="logo">एकत्व • EKATVA</div>
            <div class="subtitle">Handloom Traceability</div>
            <div class="qr-holder" id="qr-target"></div>
            <div class="product-name">${productInstance.productName}</div>
            <div class="weaver-info">${isEn ? `Weaver: ${productInstance.weaverName}` : `बुनकर: ${productInstance.weaverName}`}</div>
            <div class="fair-wage-badge">${isEn ? `Verified Fair Wage (${productInstance.wagePercentage}%)` : `सत्यापित निष्पक्ष वेतन (${productInstance.wagePercentage}%)`}</div>
            <div class="footer-text">Scan to verify authentic fair-wage journey</div>
          </div>
          <script>
            const qrTarget = document.getElementById('qr-target');
            const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("${productInstance.qrCodeData}");
            const img = document.createElement('img');
            img.src = qrUrl;
            img.width = 150;
            img.height = 150;
            img.onload = () => {
              window.print();
              window.close();
            };
            qrTarget.appendChild(img);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusLabelAndIcon = (status: JobCard['status']) => {
    switch (status) {
      case 'assigned':
        return { label: isEn ? 'Assigned' : 'असाइन किया गया', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'in_progress':
        return { label: isEn ? 'Weaving in Progress' : 'कार्य प्रगति पर', icon: Hammer, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'completed':
        return { label: isEn ? 'Weaving Completed (Pending QC)' : 'कार्य पूर्ण (QC हेतु लंबित)', icon: ClipboardCheck, color: 'text-green-600 bg-green-50 border-green-200' };
      case 'qc_passed':
        return { label: isEn ? 'QC Passed (Approved)' : 'गुणवत्ता स्वीकृत (QC PASS)', icon: FileCheck2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
      case 'qc_rejected':
        return { label: isEn ? 'QC Rejected' : 'गुणवत्ता अस्वीकृत (QC FAIL)', icon: AlertOctagon, color: 'text-red-700 bg-red-50 border-red-300' };
    }
  };

  if (loading) {
    return (
      <SecretaryLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-loom-wood mt-2 animate-pulse font-semibold">
            {isEn ? "Retrieving job card details..." : "कार्य विवरण प्राप्त किया जा रहा है..."}
          </p>
        </div>
      </SecretaryLayout>
    );
  }

  if (!jobCard) {
    return (
      <SecretaryLayout>
        <div className="text-center py-24">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="font-heading text-2xl font-bold text-loom-wood">
            {isEn ? "Job Card Not Found" : "कार्य कार्ड नहीं मिला"}
          </h2>
          <button
            onClick={() => navigate('/secretary/production')}
            className="vintage-button mt-4 px-6 py-2"
          >
            {isEn ? "Return to Production Board" : "उत्पादन बोर्ड पर लौटें"}
          </button>
        </div>
      </SecretaryLayout>
    );
  }

  const statusMeta = getStatusLabelAndIcon(jobCard.status);
  const StatusIcon = statusMeta.icon;

  return (
    <SecretaryLayout>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Back navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/secretary/production')}
          className="flex items-center gap-1.5 text-loom-wood hover:text-loom-wood-light font-heading font-semibold transition-all cursor-pointer text-base"
        >
          <ArrowLeft className="w-5 h-5" />
          {isEn ? "Back to Production Board" : "उत्पादन बोर्ड पर वापस जाएं"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main Details and QC */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="vintage-card p-6 sm:p-8 relative overflow-hidden">
            {/* Top accent badge */}
            <div className={`absolute top-0 right-0 left-0 h-1.5 ${
              jobCard.status === 'qc_passed' ? 'bg-emerald-600' : 
              jobCard.status === 'qc_rejected' ? 'bg-red-600' : 
              jobCard.status === 'completed' ? 'bg-green-600' : 'bg-loom-gold'
            }`} />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-loom-gold uppercase">
                  {isEn ? "Job Card Details" : "कार्य कार्ड विवरण"}
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-loom-wood mt-1">
                  {jobCard.title}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-mono font-semibold bg-loom-sand text-loom-wood px-2.5 py-1 rounded border border-loom-beige">
                    {isEn ? `Design: ${jobCard.designCode}` : `डिजाइन: ${jobCard.designCode}`}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-bold flex items-center gap-1 ${statusMeta.color}`}>
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {/* Deadline Calendar Box */}
              <div className="p-3 bg-loom-sand/20 border-2 border-loom-beige rounded-xl flex items-center gap-2 text-loom-wood shrink-0">
                <Calendar className="w-6 h-6 text-loom-gold shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-loom-ink/50 leading-none">
                    {isEn ? "Deadline" : "अंतिम तिथि"}
                  </span>
                  <span className="font-body font-bold text-sm leading-tight mt-0.5">
                    {new Date(jobCard.deadline).toLocaleDateString(isEn ? 'en-US' : 'hi-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid of Key Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-y border-loom-beige/50">
              <div className="space-y-0.5">
                <span className="text-xs font-heading font-bold text-loom-ink/50 uppercase">
                  {isEn ? "Assigned Weaver" : "सौंपा गया बुनकर"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-loom-wood/10 text-loom-wood font-bold text-xs flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="font-heading text-loom-wood font-semibold text-lg leading-tight">
                    {jobCard.assignedToName}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-heading font-bold text-loom-ink/50 uppercase">
                  {isEn ? "Production Quantity" : "उत्पाद मात्रा"}
                </span>
                <p className="font-body text-xl font-bold text-loom-ink">
                  {isEn ? `${jobCard.quantity} pcs` : `${jobCard.quantity} पीस (Pieces)`}
                </p>
              </div>

              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-xs font-heading font-bold text-loom-ink/50 uppercase">
                  {isEn ? "Wage Rate / piece" : "मज़दूरी दर / पीस"}
                </span>
                <p className="font-body text-xl font-bold text-loom-ink flex items-center">
                  <IndianRupee className="w-4.5 h-4.5 text-loom-gold" />
                  {jobCard.wagePerPiece} / {isEn ? "pcs" : "पीस"}
                </p>
              </div>
            </div>

            {/* Issued Raw Materials List */}
            <div className="mt-6">
              <h3 className="font-heading text-lg font-bold text-loom-wood mb-3 flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-loom-gold" />
                {isEn ? "Issued Raw Materials" : "जारी की गई कच्ची सामग्री (Raw Materials Issued)"}
              </h3>
              <div className="bg-loom-sand/20 border border-loom-beige/50 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-loom-sand/40 border-b border-loom-beige/50 text-xs font-heading font-bold text-loom-wood">
                      <th className="p-3">{isEn ? "Material" : "सामग्री का नाम (Material)"}</th>
                      <th className="p-3 text-right">{isEn ? "Quantity" : "मात्रा (Quantity)"}</th>
                      <th className="p-3">{isEn ? "Unit" : "इकाई (Unit)"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobCard.rawMaterialsIssued.map((item, idx) => (
                      <tr key={idx} className="border-b border-loom-beige/30 last:border-b-0 font-body text-sm text-loom-ink">
                        <td className="p-3 font-semibold">
                          {isEn 
                            ? (item.materialName === 'रेसम धागा' ? 'Silk Yarn' : item.materialName === 'सूती धागा' ? 'Cotton Yarn' : item.materialName === 'जरी' ? 'Zari' : item.materialName === 'रंगाई सामग्री' ? 'Dyeing Material' : item.materialName)
                            : item.materialName}
                        </td>
                        <td className="p-3 text-right font-bold">{item.quantity}</td>
                        <td className="p-3 text-loom-ink/70">
                          {isEn ? (item.unit === 'किलोग्राम' ? 'kg' : item.unit === 'मीटर' ? 'meters' : item.unit === 'पीस' ? 'pcs' : item.unit) : item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Section (Shows wage only after passed) */}
            {jobCard.status === 'qc_passed' && !productInstance && (
              <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-emerald-800">
                    {isEn ? "Total Earned Wages" : "कुल देय मजदूरी (Total Earned Wages)"}
                  </h4>
                  <p className="font-body text-xs text-emerald-700">
                    {isEn ? "Wages approved and credited to the weaver's account upon QC pass." : "यह मजदूरी गुणवत्ता स्वीकृत होने के बाद बुनकर के खाते में स्वीकृत की गई है।"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body font-bold text-2xl text-emerald-800 flex items-center justify-end">
                    <IndianRupee className="w-6 h-6 text-emerald-600 shrink-0" />
                    {jobCard.totalWage || (jobCard.quantity * jobCard.wagePerPiece)}
                  </p>
                </div>
              </div>
            )}

            {/* Traceability certificate & QR Code display (Shows only after pass and instance fetched) */}
            {jobCard.status === 'qc_passed' && productInstance && (
              <div className="mt-6 p-6 bg-[#fdfaf2] border-2 border-[#d4af37] rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-[#d4af37]/10 text-[#854d0e] rounded-bl-xl font-heading text-[10px] font-bold uppercase tracking-wider">
                  {isEn ? "Digital Certificate" : "डिजिटल प्रमाणपत्र"}
                </div>
                
                <h4 className="font-heading text-base font-bold text-[#854d0e] mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5" />
                  {isEn ? "Handloom Authentication & Fair Wage Certificate" : "हैंडलूम सत्यता एवं निष्पक्ष मजदूरी प्रमाणपत्र"}
                </h4>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* QR code and Print button */}
                  <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-loom-beige shadow-sm shrink-0">
                    <QRCode 
                      value={productInstance.qrCodeData} 
                      size={130}
                      level="H"
                    />
                    <button
                      onClick={handlePrintQRCode}
                      className="mt-3 px-3 py-1 bg-[#854d0e] hover:bg-[#713f12] text-white rounded-lg font-heading text-[11px] font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      {isEn ? "Print QR" : "प्रिंट करें (Print)"}
                    </button>
                  </div>

                  {/* Wage Breakdown */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-loom-beige/50">
                      <div>
                        <span className="text-[11px] font-heading font-semibold text-loom-ink/60">{isEn ? "Product Name" : "उत्पाद का नाम"}</span>
                        <p className="font-heading font-bold text-loom-wood text-sm leading-tight">{productInstance.productName}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-heading font-semibold text-loom-ink/60">{isEn ? "Weaver Name" : "बुनकर का नाम"}</span>
                        <p className="font-heading font-bold text-loom-wood text-sm leading-tight">{productInstance.weaverName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-center">
                      <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-lg">
                        <span className="text-[9px] font-heading font-bold text-emerald-850 uppercase block">{isEn ? "Weaver Wage" : "बुनकर मजदूरी"}</span>
                        <p className="font-body font-bold text-base text-emerald-900 mt-0.5">₹{productInstance.wagePaid}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-1.5 rounded-lg">
                        <span className="text-[9px] font-heading font-bold text-amber-855 uppercase block">{isEn ? "Retail Price" : "रिटेल मूल्य"}</span>
                        <p className="font-body font-bold text-base text-amber-900 mt-0.5">₹{productInstance.finalPrice}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 p-1.5 rounded-lg">
                        <span className="text-[9px] font-heading font-bold text-purple-855 uppercase block">{isEn ? "Wage Ratio" : "मजदूरी हिस्सा"}</span>
                        <p className="font-body font-bold text-base text-purple-900 mt-0.5">{productInstance.wagePercentage}%</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/50 rounded-xl text-[11px] text-emerald-800 flex gap-2 items-start mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">{isEn ? "Certified Fair Wage:" : "सत्यापित निष्पक्ष मजदूरी (Certified Fair Wage):"}</span>
                        {isEn 
                          ? `Weaver received ${productInstance.wagePercentage}% of the retail value of this garment directly to their bank account.`
                          : `इस वस्त्र के कुल मूल्य का ${productInstance.wagePercentage}% सीधा बुनकर के बैंक खाते में गया है।`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-mono text-loom-ink/40">{isEn ? "Cert ID: " : "प्रमाणपत्र आईडी: "}<span className="font-bold">{productInstance.instanceId.slice(0, 8)}...</span></span>
                      <a
                        href={`/trace/${productInstance.instanceId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-heading font-bold text-[#854d0e] hover:underline"
                      >
                        {isEn ? "Open Public Tracking Page →" : "पब्लिक ट्रैकिंग पेज खोलें →"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Remarks & photo */}
            {jobCard.status === 'qc_rejected' && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
                <div>
                  <h4 className="font-heading font-bold text-red-800">
                    {isEn ? "Quality Control Rejection Details" : "गुणवत्ता अस्वीकरण का विवरण (Rejection Details)"}
                  </h4>
                  <p className="font-body text-sm text-red-700 mt-1">
                    <strong>{isEn ? "Reason:" : "कारण:"}</strong> {jobCard.qcRemarks || (isEn ? 'Rejected without comments.' : 'बिना टिप्पणी के अस्वीकृत।')}
                  </p>
                </div>
                {jobCard.qcPhotoURL && (
                  <div className="mt-2">
                    <span className="block text-xs font-heading font-bold text-red-800 mb-1">
                      {isEn ? "Fault Photo:" : "त्रुटि चित्र (Error Photo):"}
                    </span>
                    <img 
                      src={jobCard.qcPhotoURL} 
                      alt="QC Rejection Reason" 
                      className="max-w-xs h-auto rounded-lg border border-red-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QC Interactive Actions Panel (If status is completed) */}
          {jobCard.status === 'completed' && (
            <div className="vintage-card p-6 border-t-4 border-loom-gold bg-loom-cream flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-1.5">
                  <ClipboardCheck className="w-6 h-6 text-loom-gold shrink-0" />
                  {isEn ? "Quality Control Check" : "गुणवत्ता नियंत्रण जांच (Quality Control Check)"}
                </h2>
                <p className="font-body text-sm text-loom-ink/70 mt-1">
                  {isEn 
                    ? "The weaver has completed the assignment. Please inspect the weaving quality and design code compliance."
                    : "बुनकर ने कार्य पूरा कर लिया है। कृपया बुनाई की शुद्धता और डिजाइन की जांच करें।"}
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={qcActionLoading}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 text-sm"
                >
                  <XCircle className="w-5 h-5" />
                  QC अस्वीकार करें
                </button>
                <button
                  onClick={openQcPassModal}
                  disabled={qcActionLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 text-sm shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  {qcActionLoading ? 'QC पास हो रहा है...' : 'QC पास करें'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Vintage Status Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="vintage-card p-6">
            <h3 className="font-heading text-xl font-bold text-loom-wood border-b-2 border-loom-beige pb-3 mb-6">
              {isEn ? "Timeline Log" : "स्थिति घटनाक्रम (Timeline Log)"}
            </h3>

            {/* Timeline wrapper */}
            <div className="relative pl-6 border-l-2 border-loom-gold/40 space-y-8 ml-3 py-2">
              {statusLog.map((log, idx) => {
                const isLast = idx === statusLog.length - 1;
                
                // Determine icon and colors based on status
                let DotColor = 'bg-blue-500 border-blue-200';
                if (log.status === 'in_progress') DotColor = 'bg-amber-500 border-amber-200';
                if (log.status === 'completed') DotColor = 'bg-green-500 border-green-200';
                if (log.status === 'qc_passed') DotColor = 'bg-emerald-600 border-emerald-200';
                if (log.status === 'qc_rejected') DotColor = 'bg-red-600 border-red-200';

                return (
                  <div key={log.logId || idx} className="relative">
                    {/* Circle timeline bullet */}
                    <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${DotColor} z-10 flex items-center justify-center shadow-sm`} />

                    <div>
                      <span className="text-[10px] font-body text-loom-ink/50 bg-loom-sand px-2 py-0.5 rounded border border-loom-beige/50 inline-block mb-1 font-bold">
                        {new Date(log.timestamp).toLocaleString(isEn ? 'en-US' : 'hi-IN', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      <h4 className="font-heading font-bold text-loom-wood text-base capitalize">
                        {log.status === 'assigned' && (isEn ? 'Assigned' : 'असाइन किया गया')}
                        {log.status === 'in_progress' && (isEn ? 'Weaving Started' : 'बुनाई शुरू')}
                        {log.status === 'completed' && (isEn ? 'Weaving Completed' : 'कार्य पूर्ण किया गया')}
                        {log.status === 'qc_passed' && (isEn ? 'QC Approved' : 'QC पास (मंजूर)')}
                        {log.status === 'qc_rejected' && (isEn ? 'QC Rejected' : 'QC असफल (अस्वीकृत)')}
                      </h4>
                      
                      {log.remarks && (
                        <p className="font-body text-xs text-loom-ink/75 mt-1 leading-relaxed bg-white/40 p-2 rounded border border-loom-beige/20 italic">
                          "{log.remarks}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* QC Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-6 relative">
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-4 pb-2 border-b-2 border-loom-beige">
              {isEn ? "Log QC Rejection Details & Photo" : "गुणवत्ता विफलता कारण और फोटो दर्ज करें"}
            </h3>
            
            <form onSubmit={handleQcRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {isEn ? "Detailed Reason for Rejection *" : "अस्वीकृति का स्पष्ट कारण (Reason for Rejection) *"}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={isEn ? "Please detail the weaving issue/defect so the weaver knows what to fix..." : "कृपया बुनाई में पाई गई त्रुटि या दोष का सटीक विवरण दें ताकि बुनकर इसे सुधार सके..."}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              {/* Custom styled file upload */}
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1.5">
                  {isEn ? "Issue Image / Fault Photo" : "त्रुटि का चित्र (Error Photo)"}
                </label>
                <div className="border-2 border-dashed border-loom-beige hover:border-loom-gold rounded-xl p-4 flex flex-col items-center justify-center bg-white cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-8 h-8 text-loom-gold mb-1 shrink-0" />
                  <span className="font-heading text-sm text-loom-wood font-semibold">
                    {isEn ? "Select Photo" : "कैमरा / फोटो चुनें"}
                  </span>
                  <span className="text-xs text-loom-ink/50 mt-1 font-body">
                    {isEn ? "Upload an image showcasing the weaving defect" : "बुनाई दोष दिखाने के लिए एक फाइल अपलोड करें"}
                  </span>
                </div>

                {/* Local preview */}
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3 bg-loom-sand/20 p-2.5 rounded-lg border border-loom-beige">
                    <img 
                      src={imagePreview} 
                      alt="Local preview" 
                      className="w-12 h-12 object-cover rounded border border-loom-beige"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-heading font-bold text-loom-wood truncate">{isEn ? "Selected Image" : "चयनित फोटो"}</p>
                      <p className="text-[10px] font-body text-loom-ink/60 truncate">{selectedFile?.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview('');
                      }}
                      className="text-xs text-loom-error hover:underline font-heading font-bold px-2 cursor-pointer"
                    >
                      {isEn ? "Remove" : "हटाएं"}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-loom-beige/50">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectReason('');
                    setSelectedFile(null);
                    setImagePreview('');
                  }}
                  className="px-4 py-2.5 bg-loom-beige/50 hover:bg-loom-beige text-loom-wood rounded-xl font-heading font-semibold transition-all cursor-pointer"
                >
                  {isEn ? "Cancel" : "रद्द करें"}
                </button>
                <button
                  type="submit"
                  disabled={qcActionLoading || !rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-heading font-bold transition-all cursor-pointer"
                >
                  {qcActionLoading ? (isEn ? "Saving..." : 'सहेज रहे हैं...') : (isEn ? "Submit Defect" : 'त्रुटि सबमिट करें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QC Pass & Fair Wage Setup Modal */}
      {qcPassModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-loom-cream border-4 border-loom-gold rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2 pb-2 border-b-2 border-loom-beige flex items-center gap-1.5">
              <Sparkles className="w-6 h-6 text-loom-gold" />
              {isEn ? "QC Approval & Fair Wage Setup" : "QC पास और न्यायसंगत वेतन सेटअप"}
            </h3>
            <p className="text-xs text-loom-ink/75 mb-4">
              {isEn 
                ? "Enter final retail price and details before approving to generate the immutable digital traceability certificate for consumers."
                : "उत्पाद को स्वीकृत करने से पहले अंतिम रिटेल मूल्य और विवरण दर्ज करें ताकि उपभोक्ता हेतु इम्यूटेबल डिजिटल प्रमाणपत्र तैयार किया जा सके।"}
            </p>
            
            <form onSubmit={handleQcPassAndCreateInstance} className="space-y-4">
              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                  {isEn ? "Product Name *" : "उत्पाद का नाम (Product Name) *"}
                </label>
                <input
                  type="text"
                  required
                  value={instProductName}
                  onChange={(e) => setInstProductName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                />
              </div>

              <div>
                <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                  {isEn ? "Link to Storefront Product" : "सहकारी स्टोरफ्रंट उत्पाद से लिंक करें (Link to Storefront Product)"}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body"
                >
                  <option value="">{isEn ? "-- Do not link (Generic Product) --" : "-- लिंक नहीं करें (सामान्य उत्पाद) --"}</option>
                  {cooperativeProducts.map(p => (
                    <option key={p.productId} value={p.productId}>
                      {isEn ? `${p.nameEnglish || p.nameHindi} (₹${p.price})` : `${p.nameHindi} (₹${p.price})`}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-loom-ink/50 mt-1 block">
                  {isEn 
                    ? "If this product corresponds to a catalog design, select it here."
                    : "यदि यह उत्पाद किसी पूर्व-सूचीबद्ध डिजाइन से जुड़ा है, तो उसे चुनें।"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                    {isEn ? "Earned Wage Payout" : "बुनकर मजदूरी भुगतान (Earned Wage)"}
                  </label>
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-body font-bold text-emerald-800 flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {jobCard ? jobCard.quantity * jobCard.wagePerPiece : 0}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-heading font-bold text-loom-wood mb-1">
                    {isEn ? "Total Retail Price *" : "कुल खुदरा मूल्य (Retail Price) *"}
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 w-4.5 h-4.5 text-loom-gold" />
                    <input
                      type="number"
                      required
                      min={jobCard ? jobCard.quantity * jobCard.wagePerPiece + 10 : 1}
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 border-2 border-loom-beige rounded-xl focus:border-loom-gold focus:outline-none bg-white text-loom-ink font-body font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Wage Percentage Preview */}
              {finalPrice > 0 && jobCard && (
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between text-xs text-purple-800">
                  <span className="font-heading font-bold">{isEn ? "Weaver Wage Ratio:" : "कारीगर हिस्सा (Weaver Wage Ratio):"}</span>
                  <span className="font-body font-extrabold text-base">
                    {((jobCard.quantity * jobCard.wagePerPiece / finalPrice) * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-loom-beige/50">
                <button
                  type="button"
                  onClick={() => setQcPassModalOpen(false)}
                  className="px-4 py-2.5 bg-loom-beige/50 hover:bg-loom-beige text-loom-wood rounded-xl font-heading font-semibold transition-all cursor-pointer"
                >
                  {isEn ? "Cancel" : "रद्द करें"}
                </button>
                <button
                  type="submit"
                  disabled={qcActionLoading || finalPrice <= (jobCard ? jobCard.quantity * jobCard.wagePerPiece : 0)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-heading font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  {qcActionLoading ? (isEn ? "Saving..." : 'सहेज रहे हैं...') : (isEn ? "Certify & QC Pass" : 'प्रमाणित करें और QC पास करें')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
