import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WeaverLayout } from '../../components/layout/WeaverLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { WeaverProfile, Notice, Grievance, JobCard, Payment } from '../../types';
import { NoticeCard } from '../../components/NoticeCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { ReliabilityScore } from '../../components/ReliabilityScore';
import { 
  getNoticesByCooperative, 
  getGrievancesByWeaver, 
  createGrievance,
  addGrievanceMessage,
  getJobCardsByWeaver,
  updateJobCardStatus,
  getIndentRequestsByWeaver,
  createIndentRequest,
  updateWeaverReliabilityScore,
  getPaymentsByWeaver,
  getGovtSchemes,
  getCooperative,
  getJobCardsByCooperative
} from '../../firebase/firestore';
import { 
  User, 
  Phone, 
  Briefcase, 
  Layers, 
  Compass, 
  MapPin, 
  FileText, 
  Bell, 
  TrendingUp, 
  Landmark,
  MessageSquare,
  PlusCircle,
  X,
  AlertCircle,
  ChevronRight,
  Calendar,
  IndianRupee,
  Award
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EkatvaHumsafar } from '../../components/EkatvaHumsafar';
import { JobSakhi } from '../../components/JobSakhi';
import { EmpathyLoom } from '../../components/EmpathyLoom';
import { checkEligibility } from '../../utils/schemeEligibility';

const formatDate = (dateStr: any) => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (date && typeof date.toDate === 'function') {
    // Handle Firestore Timestamp if needed
    return date.toDate().toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('hi-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getCategoryText = (category: string) => {
  switch (category) {
    case 'payment':
      return 'भुगतान (Payment)';
    case 'raw_material':
      return 'कच्चा माल (Raw Material)';
    case 'quality':
      return 'गुणवत्ता (Quality)';
    default:
      return 'अन्य (Other)';
  }
};

export const WeaverDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [eligibleSchemesCount, setEligibleSchemesCount] = useState<number>(0);

  // Check state from location navigation
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location]);

  // Fetch government schemes statistics
  useEffect(() => {
    const fetchSchemesStats = async () => {
      if (!userProfile?.cooperativeId) return;
      try {
        const coopId = userProfile.cooperativeId;
        const [fetchedSchemes, coopDetails, jobCards] = await Promise.all([
          getGovtSchemes(),
          getCooperative(coopId),
          getJobCardsByCooperative(coopId)
        ]);

        if (coopDetails) {
          const qcPassedJobs = jobCards.filter(jc => jc.status === 'qc_passed');
          const totalProduction = qcPassedJobs.reduce((sum, jc) => sum + (Number(jc.quantity) || 0), 0);
          
          const coopData = {
            memberCount: coopDetails.memberCount || 0,
            annualProduction: totalProduction,
            certifications: coopDetails.certifications || []
          };

          let count = 0;
          for (const scheme of fetchedSchemes) {
            const check = checkEligibility(coopData, scheme);
            if (check.eligible) {
              count++;
            }
          }
          setEligibleSchemesCount(count);
        }
      } catch (err) {
        console.error("Error loading schemes stats in weaver dashboard:", err);
      }
    };

    fetchSchemesStats();
  }, [userProfile]);
  
  // Profile state
  const [weaverProfile, setWeaverProfile] = useState<WeaverProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  // Grievance state
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loadingGrievances, setLoadingGrievances] = useState(true);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);

  // Grievance Form State
  const [gSubject, setGSubject] = useState('');
  const [gCategory, setGCategory] = useState<'payment' | 'raw material' | 'other'>('payment');
  const [gDescription, setGDescription] = useState('');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [gError, setGError] = useState('');

  // Job Cards & Toast State
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Raw Material Requests States
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqMaterialName, setReqMaterialName] = useState('सूती धागा');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqRequiredByDate, setReqRequiredByDate] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [reqError, setReqError] = useState('');

  // Earnings & Digital Passbook States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Fetch Weaver Profile Function
  const fetchWeaverProfile = async () => {
    if (currentUser) {
      try {
        const docRef = doc(db, 'weavers', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWeaverProfile(docSnap.data() as WeaverProfile);
        }
      } catch (error) {
        console.error("Error fetching weaver details:", error);
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  // Fetch Weaver Profile
  useEffect(() => {
    fetchWeaverProfile();
  }, [currentUser]);

  // Fetch Payments Data
  const fetchPaymentsData = async () => {
    if (!currentUser) return;
    setLoadingPayments(true);
    try {
      const fetchedPayments = await getPaymentsByWeaver(currentUser.uid);
      setPayments(fetchedPayments);
      // Also refresh profile to get latest reliabilityScore
      await fetchWeaverProfile();
    } catch (err) {
      console.error("Error loading payments for weaver:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'earnings' || activeTab === 'dashboard') {
      fetchPaymentsData();
    }
  }, [activeTab, currentUser]);

  // Fetch Notices when Notices Tab is Active
  useEffect(() => {
    const fetchNoticesData = async () => {
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        const fetchedNotices = await getNoticesByCooperative(coopId);
        // Display only the 5 most recent notices
        setNotices(fetchedNotices.slice(0, 5));
      } catch (err) {
        console.error("Error loading notices for weaver:", err);
      } finally {
        setLoadingNotices(false);
      }
    };

    if (activeTab === 'notices') {
      fetchNoticesData();
    }
  }, [activeTab, userProfile]);

  // Fetch Grievances when Grievances Tab is Active
  const fetchGrievancesData = async () => {
    if (!currentUser) return;
    try {
      const fetchedGrievances = await getGrievancesByWeaver(currentUser.uid);
      setGrievances(fetchedGrievances);
    } catch (err) {
      console.error("Error loading grievances for weaver:", err);
    } finally {
      setLoadingGrievances(false);
    }
  };

  const fetchRequestsData = async () => {
    if (!currentUser) return;
    setLoadingRequests(true);
    try {
      const fetched = await getIndentRequestsByWeaver(currentUser.uid);
      setMaterialRequests(fetched);
    } catch (err) {
      console.error("Error loading raw material requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'material_requests') {
      fetchRequestsData();
    }
  }, [activeTab, currentUser]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqQuantity || parseFloat(reqQuantity) <= 0) {
      setReqError('कृपया वैध मात्रा दर्ज करें');
      return;
    }
    if (!reqRequiredByDate) {
      setReqError('कृपया आवश्यकता की तिथि दर्ज करें');
      return;
    }

    setSubmittingRequest(true);
    setReqError('');

    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      const weaverName = userProfile?.displayName || 'बुनकर';
      const unit = reqMaterialName === "रंगाई सामग्री" ? "लीटर" : "किलोग्राम";

      await createIndentRequest({
        weaverId: currentUser?.uid || '',
        weaverName,
        cooperativeId: coopId,
        materialName: reqMaterialName,
        quantity: parseFloat(reqQuantity),
        unit,
        requiredByDate: reqRequiredByDate
      });

      setReqQuantity('');
      setReqRequiredByDate('');
      setShowRequestModal(false);
      setToastMessage('कच्चे माल का अनुरोध सफलतापूर्वक दर्ज किया गया!');
      await fetchRequestsData();
    } catch (err) {
      console.error("Error submitting material request:", err);
      setReqError('अनुरोध दर्ज करने में असमर्थ। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmittingRequest(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'grievances') {
      fetchGrievancesData();
    }
  }, [activeTab, currentUser]);

  const fetchJobCardsData = async () => {
    if (!currentUser) return;
    setLoadingJobCards(true);
    try {
      const fetchedCards = await getJobCardsByWeaver(currentUser.uid);
      setJobCards(fetchedCards);
    } catch (err) {
      console.error("Error loading job cards for weaver:", err);
    } finally {
      setLoadingJobCards(false);
    }
  };

  useEffect(() => {
    fetchJobCardsData();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'jobs' || activeTab === 'earnings' || activeTab === 'dashboard') {
      fetchJobCardsData();
    }
  }, [activeTab]);

  const handleStatusUpdate = async (jobCardId: string, newStatus: 'in_progress' | 'completed', remarks: string) => {
    if (!currentUser) return;
    try {
      const card = jobCards.find(c => c.jobCardId === jobCardId);
      let isLate = false;
      if (newStatus === 'completed' && card) {
        const deadlineDate = new Date(card.deadline);
        if (new Date() > deadlineDate) {
          isLate = true;
        }
      }

      await updateJobCardStatus(jobCardId, newStatus, currentUser.uid, remarks);
      
      if (isLate) {
        await updateWeaverReliabilityScore(currentUser.uid, -3);
        setToastMessage('बुनाई सफलतापूर्वक पूरी की गई! (समय सीमा समाप्त होने के कारण विश्वसनीयता अंक -3 किए गए हैं)');
      } else {
        setToastMessage(newStatus === 'in_progress' ? 'बुनाई सफलतापूर्वक शुरू हुई!' : 'बुनाई सफलतापूर्वक पूरी की गई!');
      }
      
      await fetchJobCardsData();
    } catch (err) {
      console.error("Error updating status:", err);
      setToastMessage('स्थिति अपडेट करने में त्रुटि आई।');
    }
  };

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gSubject.trim() || !gDescription.trim()) {
      setGError('कृपया सभी आवश्यक फ़ील्ड भरें (Please fill all fields)');
      return;
    }

    setSubmittingGrievance(true);
    setGError('');

    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      const weaverName = userProfile?.displayName || 'बुनकर';

      // 1. Create the grievance ticket
      const newGId = await createGrievance({
        cooperativeId: coopId,
        weaverId: currentUser?.uid || '',
        weaverName,
        subject: gSubject.trim(),
        category: gCategory,
        status: 'open'
      });

      // 2. Add description as the first message inside the subcollection
      await addGrievanceMessage(newGId, {
        senderId: currentUser?.uid || '',
        senderName: weaverName,
        senderRole: 'weaver',
        text: gDescription.trim()
      });

      // Reset form & close
      setGSubject('');
      setGCategory('payment');
      setGDescription('');
      setShowGrievanceModal(false);

      // Reload
      setLoadingGrievances(true);
      await fetchGrievancesData();
    } catch (err) {
      console.error("Error submitting grievance:", err);
      setGError('शिकायत दर्ज करने में असमर्थ। कृपया पुनः प्रयास करें।');
    } finally {
      setSubmittingGrievance(false);
    }
  };

  const renderTabContent = () => {
    if (loadingProfile && activeTab === 'dashboard') {
      return (
        <div className="flex justify-center items-center py-12">
          <p className="font-heading text-lg text-loom-wood animate-pulse">प्रोफाइल लोड हो रही है...</p>
        </div>
      );
    }

    // Calculate balance, total wages, total advances, total deductions
    const totalWages = payments
      .filter(p => p.type === 'wage')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAdvances = payments
      .filter(p => p.type === 'advance')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDeductions = payments
      .filter(p => p.type === 'deduction')
      .reduce((sum, p) => sum + p.amount, 0);

    const currentBalance = totalWages - totalAdvances - totalDeductions;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Interactive Empathy Loom (Heritage pride and connection) */}
            <div className="lg:col-span-3">
              <EmpathyLoom />
            </div>

            {/* Left Column - Core Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 font-heading text-xl text-loom-wood">
                    <User className="text-loom-gold w-6 h-6" />
                    बुनकर प्रोफ़ाइल विवरण (Profile Details)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">पूरा नाम (Full Name)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block">
                        {userProfile?.displayName || 'रमेश कुमार'}
                      </span>
                    </div>

                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">संपर्क सूत्र (Mobile Phone)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-loom-gold" />
                        {weaverProfile?.phone || '9876543210'}
                      </span>
                    </div>

                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">अनुभव (Experience)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-loom-gold" />
                        {weaverProfile?.experience ? `${weaverProfile.experience} वर्ष` : '15 वर्ष'}
                      </span>
                    </div>

                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">कार्यरत करघे (Looms Owned)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-loom-gold" />
                        {weaverProfile?.numberOfLooms ? `${weaverProfile.numberOfLooms} करघा` : '2 करघा'}
                      </span>
                    </div>

                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">दैनिक क्षमता (Daily Capacity)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-loom-gold" />
                        {weaverProfile?.dailyCapacity ? `${weaverProfile.dailyCapacity} थान प्रतिदिन` : '1 थान'}
                      </span>
                    </div>

                    <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40">
                      <span className="text-sm text-loom-ink-light block font-semibold">संबद्ध सहकारी समिति (Cooperative)</span>
                      <span className="font-heading text-xl font-bold text-loom-wood mt-1 block">
                        बुनकर सहकारी समिति ({weaverProfile?.cooperativeId || 'coop1'})
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="pt-4 border-t border-loom-beige/30">
                    <span className="text-sm text-loom-ink-light block font-bold mb-3">विशेष बुनाई शैलीयाँ (Skill tags)</span>
                    <div className="flex flex-wrap gap-2.5">
                      {weaverProfile?.skillTags && weaverProfile.skillTags.length > 0 ? (
                        weaverProfile.skillTags.map((tag, idx) => (
                           <span key={idx} className="bg-loom-gold/25 border border-loom-gold/50 px-3.5 py-1.5 rounded-full font-heading text-base font-bold text-loom-ink">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="bg-loom-gold/25 border border-loom-gold/50 px-3.5 py-1.5 rounded-full font-heading text-base font-bold text-loom-ink">
                          बनारसी
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address detail */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 font-heading text-xl text-loom-wood">
                    <MapPin className="text-loom-gold w-6 h-6" />
                    निवास स्थान का पता (Address)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-lg">
                  <div className="p-4 bg-loom-cream/40 rounded-xl border border-loom-beige/40 font-body">
                    <p className="font-semibold text-loom-ink">{weaverProfile?.address?.street || 'वार्ड नं 4, पीली कोठी'}</p>
                    <p className="text-loom-ink-light">
                      {weaverProfile?.address?.city || 'वाराणसी'}, {weaverProfile?.address?.state || 'उत्तर प्रदेश'} - {weaverProfile?.address?.pincode || '221001'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Financial Account */}
            <div className="space-y-6">
              {/* Reliability Score Widget */}
              <ReliabilityScore score={weaverProfile?.reliabilityScore ?? 100} showDetails={true} />

              {/* Government Schemes Matchmaker Card */}
              <Card className="border-t-4 border-loom-gold bg-loom-cream/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 font-heading text-xl text-loom-wood">
                    <Award className="text-loom-gold w-5 h-5 animate-pulse" />
                    {t('schemes.title', 'सरकारी योजनाएं')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-loom-gold/10 rounded-2xl border border-loom-gold/20 text-center font-body">
                    <span className="text-xs text-loom-ink-light font-bold block">समिति के लिए योग्य सरकारी योजनाएं</span>
                    <span className="font-heading text-4xl font-black block mt-1 text-loom-wood">
                      {eligibleSchemesCount}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/weaver/schemes')}
                    className="w-full py-3 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md transition-colors text-sm cursor-pointer"
                  >
                    योजनाएं देखें (View Schemes)
                  </button>
                </CardContent>
              </Card>

              {/* Quick passbook summary */}
              <Card className="border-t-4 border-loom-wood">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 font-heading text-xl text-loom-wood">
                    <IndianRupee className="text-loom-gold w-5 h-5" />
                    डिजिटल पासबुक संक्षेप (Passbook Summary)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-loom-wood/5 rounded-2xl border border-loom-wood/10 text-center">
                    <span className="text-sm text-loom-ink-light font-bold block">कुल बकाया राशि (Outstanding Balance)</span>
                    <span className={`font-heading text-3xl font-black block mt-1 ${currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      ₹{currentBalance.toLocaleString('hi-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                      <span className="block text-[10px] text-emerald-600 uppercase font-bold">अर्जित</span>
                      <span className="font-heading text-sm font-bold block mt-0.5">₹{totalWages}</span>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
                      <span className="block text-[10px] text-amber-600 uppercase font-bold">अग्रिम</span>
                      <span className="font-heading text-sm font-bold block mt-0.5">₹{totalAdvances}</span>
                    </div>
                    <div className="p-2 bg-rose-50 text-rose-800 rounded-lg border border-rose-100">
                      <span className="block text-[10px] text-rose-600 uppercase font-bold">कटौती</span>
                      <span className="font-heading text-sm font-bold block mt-0.5">₹{totalDeductions}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="w-full py-3 bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold rounded-xl shadow-md transition-colors text-sm cursor-pointer"
                  >
                    पूरा डिजिटल पासबुक देखें (View Full Passbook)
                  </button>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card className="border-t-4 border-loom-wood">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 font-heading text-xl text-loom-wood">
                    <Briefcase className="text-loom-gold w-5 h-5" />
                    बैंक विवरण (Bank Details)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 font-body text-base">
                  <div className="p-4 rounded-xl border border-loom-beige bg-loom-cream/40 space-y-3">
                    <div>
                      <span className="text-xs text-loom-ink-light font-bold block">बैंक का नाम</span>
                      <span className="font-heading text-lg font-bold text-loom-wood">{weaverProfile?.bankAccount?.bankName || 'State Bank of India'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-loom-ink-light font-bold block">खाता संख्या</span>
                      <span className="font-heading text-lg font-bold text-loom-wood">{weaverProfile?.bankAccount?.accountNumber || '30123456789'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-loom-ink-light font-bold block">आईएफएससी (IFSC)</span>
                      <span className="font-heading text-lg font-bold text-loom-wood">{weaverProfile?.bankAccount?.ifsc || 'SBIN0001234'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'jobs':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-4">
              <h2 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                <FileText className="w-6 h-6 text-loom-gold" />
                मेरी कार्य सूची (My Job Cards)
              </h2>
              <p className="font-body text-sm text-loom-ink-light mt-1">
                सचिव द्वारा आपको सौंपे गए डिजिटल कार्य कार्ड देखें, बुनाई शुरू करें और पूरा होने पर सचिव को भेजें।
              </p>
            </div>

            {loadingJobCards ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
                <p className="font-heading text-loom-wood mt-2 animate-pulse text-sm">कार्य प्राप्त किए जा रहे हैं...</p>
              </div>
            ) : jobCards.length === 0 ? (
              <Card className="min-h-[300px] flex items-center justify-center text-center">
                <CardContent className="max-w-md flex flex-col items-center justify-center p-8">
                  <span className="text-5xl block mb-4">📋</span>
                  <h3 className="font-heading text-2xl font-bold text-loom-wood mb-2">कोई कार्य असाइन नहीं है</h3>
                  <p className="font-body text-base text-loom-ink/80">
                    अभी तक सचिव द्वारा आपको कोई भी बुनाई कार्य नहीं सौंपा गया है।
                  </p>
                  <p className="font-body text-xs text-loom-ink-light mt-2">
                    (Your loom has no active assigned jobs at the moment.)
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobCards.map((card) => {
                  return (
                    <div 
                      key={card.jobCardId} 
                      className="vintage-card p-5 relative flex flex-col justify-between border-t-4 border-loom-gold"
                    >
                      <div>
                        {/* Title & Design Code */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <h3 className="font-heading font-bold text-loom-wood text-lg">{card.title}</h3>
                            <span className="text-xs font-mono bg-loom-sand text-loom-wood px-2 py-0.5 rounded border border-loom-beige/50 mt-1 inline-block uppercase">
                              डिजाइन: {card.designCode}
                            </span>
                          </div>
                          
                          {/* Custom local badge */}
                          {card.status === 'assigned' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">असाइन</span>
                          )}
                          {card.status === 'in_progress' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">प्रगति पर</span>
                          )}
                          {card.status === 'completed' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 font-bold">पूर्ण (समीक्षाधीन)</span>
                          )}
                          {card.status === 'qc_passed' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-700 text-white border border-emerald-800 font-bold">QC पास ✓</span>
                          )}
                          {card.status === 'qc_rejected' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold">QC असफल ❌</span>
                          )}
                        </div>

                        {/* Quantity & wage */}
                        <div className="grid grid-cols-2 gap-2 my-4 p-2.5 bg-loom-sand/20 rounded-lg border border-loom-beige/50 text-xs font-body text-loom-ink/80">
                          <div>
                            <span className="block text-[10px] font-heading font-bold text-loom-wood">कुल मात्रा</span>
                            <span className="font-bold text-sm text-loom-ink">{card.quantity} पीस</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-heading font-bold text-loom-wood">मजदूरी / पीस</span>
                            <span className="font-bold text-sm text-loom-ink">₹ {card.wagePerPiece}</span>
                          </div>
                        </div>

                        {/* Raw materials list */}
                        <div className="mb-4">
                          <span className="block text-xs font-heading font-bold text-loom-wood mb-1.5">जारी कच्चा माल (Issued Stock):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {card.rawMaterialsIssued.map((m, idx) => (
                              <span key={idx} className="text-[11px] font-body bg-white border border-loom-beige text-loom-ink px-2 py-1 rounded-lg">
                                {m.materialName}: {m.quantity} {m.unit}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center gap-1.5 text-xs text-loom-ink/70 font-body mb-4">
                          <Calendar className="w-3.5 h-3.5 text-loom-gold shrink-0" />
                          <span>अंतिम तिथि: <strong>{new Date(card.deadline).toLocaleDateString('hi-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                        </div>

                        {/* QC Remarks if rejected */}
                        {card.status === 'qc_rejected' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-body text-red-700 mb-4 space-y-1.5">
                            <p className="font-semibold">⚠️ गुणवत्ता विफलता का विवरण:</p>
                            <p className="italic">"{card.qcRemarks || 'त्रुटि पाई गई। कृपया सचिव से संपर्क करें।'}"</p>
                            {card.qcPhotoURL && (
                              <img 
                                src={card.qcPhotoURL} 
                                alt="QC error" 
                                className="w-full max-h-32 object-cover rounded mt-1 border border-red-100" 
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Interactive Actions for weaver */}
                      <div className="pt-3 border-t border-loom-beige/50 mt-auto flex flex-col gap-2">
                        {card.status === 'assigned' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(card.jobCardId, 'in_progress', 'बुनकर ने करघे पर कार्य प्रारंभ किया।')}
                            className="w-full bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold py-2 rounded-xl text-sm shadow-sm transition-all cursor-pointer text-center"
                          >
                            बुनाई कार्य शुरू करें (Start Weaving)
                          </button>
                        )}
                        {card.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(card.jobCardId, 'completed', 'बुनकर ने बुनाई कार्य पूर्ण किया। सचिव गुणवत्ता समीक्षा हेतु तत्पर है।')}
                            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-heading font-bold py-2 rounded-xl text-sm shadow-sm transition-all cursor-pointer text-center"
                          >
                            कार्य पूर्ण चिह्नित करें (Mark Completed)
                          </button>
                        )}
                        {card.status === 'qc_rejected' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(card.jobCardId, 'in_progress', 'बुनकर ने विफलता विवरण के अनुसार सुधार कार्य शुरू किया।')}
                            className="w-full bg-loom-wood hover:bg-loom-wood-light text-white font-heading font-bold py-2 rounded-xl text-sm shadow-sm transition-all cursor-pointer text-center"
                          >
                            सुधार कार्य शुरू करें (Restart/Fix)
                          </button>
                        )}
                        {card.status === 'completed' && (
                          <p className="text-center text-xs text-amber-600 font-heading font-bold bg-amber-50 py-1.5 rounded-lg border border-amber-100">
                            ⏳ गुणवत्ता समीक्षा (QC Inspection) की प्रतीक्षा है...
                          </p>
                        )}
                        {card.status === 'qc_passed' && (
                          <p className="text-center text-xs text-emerald-700 font-heading font-bold bg-emerald-50 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-center gap-1">
                            ✓ कार्य स्वीकृत एवं भुगतान के लिए सफल!
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'notices':
        return (
          <div className="space-y-6 max-w-3xl animate-fade-in">
            <div className="mb-4">
              <h2 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                <Bell className="w-6 h-6 text-loom-gold" />
                सहकारी सूचनाएं (Latest Cooperative Notices)
              </h2>
              <p className="font-body text-sm text-loom-ink-light mt-1">
                सचिव द्वारा जारी की गई ताज़ा 5 सूचनाएँ यहाँ देखें।
              </p>
            </div>

            {loadingNotices ? (
              <div className="flex justify-center items-center py-12">
                <p className="font-heading text-lg text-loom-wood animate-pulse">सूचनाएं लोड हो रही हैं...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 vintage-card bg-loom-cream">
                <Bell className="w-16 h-16 text-loom-beige mb-4" />
                <h3 className="font-heading text-xl font-bold text-loom-wood">कोई सक्रिय सूचना नहीं</h3>
                <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                  वर्तमान में समिति द्वारा कोई सार्वजनिक नोटिस जारी नहीं किया गया है।
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <NoticeCard key={notice.noticeId} notice={notice} />
                ))}
              </div>
            )}
          </div>
        );

      case 'earnings':
        const qcPassedJobs = jobCards.filter(c => c.status === 'qc_passed');
        const totalEarned = qcPassedJobs.reduce((acc, c) => acc + (c.totalWage || (c.quantity * c.wagePerPiece)), 0);
        const totalPieces = qcPassedJobs.reduce((acc, c) => acc + c.quantity, 0);
        const pendingJobsCount = jobCards.filter(c => c.status === 'completed').length;

        return (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-loom-gold bg-loom-cream">
                <CardContent className="p-6">
                  <span className="text-sm font-semibold text-loom-ink-light block">स्वीकृत कुल कमाई (Approved Earnings)</span>
                  <span className="font-heading text-3xl font-bold text-loom-wood block mt-1">₹ {totalEarned.toLocaleString('hi-IN')}.00</span>
                  <span className="text-xs text-loom-gold block mt-2 font-medium">खाता विवरण स्वीकृत और सुरक्षित है</span>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-loom-wood bg-loom-cream">
                <CardContent className="p-6">
                  <span className="text-sm font-semibold text-loom-ink-light block">समीक्षाधीन कार्य (Pending QC)</span>
                  <span className="font-heading text-3xl font-bold text-loom-wood block mt-1">{pendingJobsCount} कार्य (Jobs)</span>
                  <span className="text-xs text-loom-ink-light block mt-2">गुणवत्ता जांच के बाद भुगतान स्वीकृत होगा</span>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-loom-beige bg-loom-cream">
                <CardContent className="p-6">
                  <span className="text-sm font-semibold text-loom-ink-light block">कुल स्वीकृत बुनाई (Weaving Output)</span>
                  <span className="font-heading text-3xl font-bold text-loom-wood block mt-1">{totalPieces} थान/पीस</span>
                  <span className="text-xs text-loom-ink-light block mt-2">सफलतापूर्वक पास हुए पीस</span>
                </CardContent>
              </Card>
            </div>

            {/* Approved job earnings list */}
            <div>
              <h3 className="font-heading text-xl font-bold text-loom-wood mb-4">स्वीकृत भुगतान बहीखाता (Wages Ledger History)</h3>
              
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  {qcPassedJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      <TrendingUp className="w-16 h-16 text-loom-beige mb-4 stroke-[1.5]" />
                      <h4 className="font-heading text-lg font-bold text-loom-wood mb-1">कोई स्वीकृत भुगतान इतिहास नहीं</h4>
                      <p className="font-body text-sm text-loom-ink-light">
                        वर्तमान में गुणवत्ता जांच द्वारा स्वीकृत कोई भुगतान कार्य उपलब्ध नहीं है।
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>कार्य शीर्षक (Job Card)</TableHead>
                          <TableHead>डिजाइन कोड</TableHead>
                          <TableHead className="text-center">मात्रा</TableHead>
                          <TableHead className="text-right font-body">मजदूरी दर</TableHead>
                          <TableHead className="text-right font-body">कुल कमाई</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {qcPassedJobs.map((c) => (
                          <TableRow key={c.jobCardId}>
                            <TableCell className="font-heading font-bold text-base text-loom-wood">
                              {c.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-loom-gold uppercase">
                              {c.designCode}
                            </TableCell>
                            <TableCell className="font-body text-center font-bold text-sm text-loom-ink">
                              {c.quantity} पीस
                            </TableCell>
                            <TableCell className="font-body text-right text-loom-ink/80 text-sm">
                              ₹ {c.wagePerPiece}
                            </TableCell>
                            <TableCell className="font-body text-right font-bold text-emerald-800 text-base">
                              ₹ {(c.totalWage || (c.quantity * c.wagePerPiece)).toLocaleString('hi-IN')}.00
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'grievances':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header section with Submit Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-loom-gold" />
                  शिकायत एवं सुझाव निवारण (My Grievances)
                </h2>
                <p className="font-body text-sm text-loom-ink-light mt-1">
                  सहकारी सचिव से किसी भी प्रकार की सहायता, भुगतान अथवा कच्चे माल की शिकायत यहाँ दर्ज करें।
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setShowGrievanceModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                शिकायत दर्ज करें (File Grievance)
              </Button>
            </div>

            {/* Grievances List */}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {loadingGrievances ? (
                  <div className="flex justify-center items-center py-12">
                    <p className="font-heading text-lg text-loom-wood animate-pulse">आपकी शिकायतें लोड हो रही हैं...</p>
                  </div>
                ) : grievances.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <MessageSquare className="w-16 h-16 text-loom-beige mb-4" />
                    <h3 className="font-heading text-xl font-bold text-loom-wood">कोई शिकायत दर्ज नहीं है</h3>
                    <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                      आपने अभी तक कोई शिकायत दर्ज नहीं कराई है। नया टिकट खोलने के लिए ऊपर दिए गए बटन का उपयोग करें।
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>विषय (Subject)</TableHead>
                        <TableHead>श्रेणी (Category)</TableHead>
                        <TableHead>स्थिति (Status)</TableHead>
                        <TableHead>दिनांक (Date)</TableHead>
                        <TableHead className="text-right">कार्रवाई (Action)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grievances.map((g) => (
                        <TableRow 
                          key={g.grievanceId}
                          className="hover:bg-loom-cream/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/weaver/grievances/${g.grievanceId}`)}
                        >
                          <TableCell className="font-heading font-bold text-base text-loom-wood max-w-[200px] truncate">
                            {g.subject}
                          </TableCell>
                          <TableCell className="font-body text-sm font-semibold text-loom-gold">
                            {getCategoryText(g.category)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={g.status} />
                          </TableCell>
                          <TableCell className="font-mono text-xs text-loom-ink-light">
                            {formatDate(g.createdAt)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => navigate(`/weaver/grievances/${g.grievanceId}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-loom-wood text-white hover:bg-loom-wood-light text-xs font-heading font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              चर्चा देखें (View thread) <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Grievance Submission Modal Form */}
            {showGrievanceModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-lg w-full relative border-2 border-loom-gold shadow-2xl">
                  {/* Close button */}
                  <button
                    onClick={() => setShowGrievanceModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h2 className="font-heading text-2xl font-bold text-loom-wood mb-2">
                    नयी शिकायत दर्ज करें
                  </h2>
                  <p className="font-body text-sm text-loom-ink-light mb-6 border-b border-loom-beige/30 pb-3">
                    (File a new assistance/grievance ticket to cooperative committee)
                  </p>

                  <form onSubmit={handleGrievanceSubmit} className="space-y-5">
                    {gError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-body font-semibold">
                        ⚠️ {gError}
                      </div>
                    )}

                    {/* Subject */}
                    <div>
                      <label htmlFor="g-subject" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                        शिकायत का मुख्य विषय (Grievance Subject) *
                      </label>
                      <Input
                        id="g-subject"
                        placeholder="उदा: जून महीने का भुगतान शेष है"
                        value={gSubject}
                        onChange={(e) => setGSubject(e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label htmlFor="g-category" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                        शिकायत की श्रेणी (Select Category)
                      </label>
                      <select
                        id="g-category"
                        value={gCategory}
                        onChange={(e) => setGCategory(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base text-loom-ink shadow-inner"
                      >
                        <option value="payment">भुगतान संबंधी (Payment)</option>
                        <option value="raw material">कच्चा माल संबंधी (Raw Material)</option>
                        <option value="other">अन्य विषय (Other)</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="g-description" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                        विस्तृत विवरण (Detailed Description of Issue) *
                      </label>
                      <textarea
                        id="g-description"
                        rows={4}
                        placeholder="अपनी समस्या का पूरा विवरण यहाँ लिखें, ताकि सचिव उस पर तुरंत संज्ञान ले सकें..."
                        value={gDescription}
                        onChange={(e) => setGDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                      />
                    </div>

                    {/* Submit actions */}
                    <div className="flex gap-4 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowGrievanceModal(false)}
                        disabled={submittingGrievance}
                        className="flex-1 font-heading font-bold py-3.5"
                      >
                        रद्द करें (Cancel)
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingGrievance}
                        className="flex-1 font-heading font-bold py-3.5 bg-loom-wood text-white hover:bg-loom-wood-light"
                      >
                        {submittingGrievance ? 'दर्ज किया जा रहा है...' : 'दर्ज करें (Submit Ticket)'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'material_requests':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header section with Create Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 p-5 rounded-2xl border border-loom-beige/50 backdrop-blur-xs">
              <div>
                <h2 className="font-heading text-2xl font-bold text-loom-wood flex items-center gap-2">
                  <Layers className="w-6 h-6 text-loom-gold" />
                  कच्चे माल की मांग/अनुरोध (Raw Material Requests)
                </h2>
                <p className="font-body text-sm text-loom-ink-light mt-1">
                  उत्पादन शुरू करने के लिए आवश्यक धागे, जरी या रंगों की मांग समिति को भेजें।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(true)}
                className="vintage-button flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                नया अनुरोध भेजें (Request Material)
              </button>
            </div>

            {/* List of Material Requests */}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {loadingRequests ? (
                  <div className="flex justify-center items-center py-12">
                    <p className="font-heading text-lg text-loom-wood animate-pulse">आपके अनुरोध लोड हो रहे हैं...</p>
                  </div>
                ) : materialRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <Layers className="w-16 h-16 text-loom-beige mb-4 stroke-[1.5]" />
                    <h3 className="font-heading text-xl font-bold text-loom-wood">कोई अनुरोध दर्ज नहीं है</h3>
                    <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                      आपने अभी तक कच्चे माल के लिए कोई अनुरोध नहीं किया है। नया अनुरोध जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें।
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>सामग्री का नाम</TableHead>
                        <TableHead className="text-right">मात्रा</TableHead>
                        <TableHead>आवश्यकता तिथि</TableHead>
                        <TableHead>अनुरोध दिनांक</TableHead>
                        <TableHead className="text-center">स्थिति (Status)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialRequests.map((req) => (
                        <TableRow key={req.requestId} className="hover:bg-loom-cream/40 transition-colors">
                          <TableCell className="font-heading font-bold text-base text-loom-wood">
                            {req.materialName}
                          </TableCell>
                          <TableCell className="font-body text-right font-bold text-sm text-loom-ink">
                            {req.quantity} {req.unit}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-loom-ink-light">
                            {formatDate(req.requiredByDate)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-loom-ink-light">
                            {formatDate(req.createdAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            {req.status === 'pending' && (
                              <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200 font-bold">
                                ⏳ लंबित (Pending)
                              </span>
                            )}
                            {req.status === 'consolidated' && (
                              <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                                📦 समेकित (Consolidated)
                              </span>
                            )}
                            {req.status === 'fulfilled' && (
                              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200 font-bold">
                                ✓ प्राप्त/वितरित (Fulfilled)
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Material Request Modal Form */}
            {showRequestModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-lg w-full relative border-2 border-loom-gold shadow-2xl">
                  {/* Close button */}
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h2 className="font-heading text-2xl font-bold text-loom-wood mb-2">
                    नया कच्चा माल अनुरोध दर्ज करें
                  </h2>
                  <p className="font-body text-sm text-loom-ink-light mb-6 border-b border-loom-beige/30 pb-3">
                    (Request raw materials from the cooperative's inventory)
                  </p>

                  <form onSubmit={handleRequestSubmit} className="space-y-5">
                    {reqError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-body font-semibold">
                        ⚠️ {reqError}
                      </div>
                    )}

                    {/* Material Selection */}
                    <div>
                      <label htmlFor="req-material" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                        कच्ची सामग्री का प्रकार (Select Raw Material) *
                      </label>
                      <select
                        id="req-material"
                        value={reqMaterialName}
                        onChange={(e) => setReqMaterialName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base text-loom-ink shadow-inner"
                      >
                        <option value="सूती धागा">सूती धागा (Cotton Yarn)</option>
                        <option value="रेसम धागा">रेसम धागा (Silk Yarn)</option>
                        <option value="जरी">जरी (Zari Thread)</option>
                        <option value="रंगाई सामग्री">रंगाई सामग्री (Dyeing Colors)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Quantity */}
                      <div>
                        <label htmlFor="req-qty" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                          आवश्यक मात्रा ({reqMaterialName === 'रंगाई सामग्री' ? 'लीटर' : 'किलोग्राम'}) *
                        </label>
                        <div className="relative">
                          <Input
                            id="req-qty"
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="जैसे: 15"
                            value={reqQuantity}
                            onChange={(e) => setReqQuantity(e.target.value)}
                          />
                          <span className="absolute right-3 top-3.5 text-xs font-semibold text-loom-ink-light">
                            {reqMaterialName === 'रंगाई सामग्री' ? 'लीटर' : 'किलोग्राम'}
                          </span>
                        </div>
                      </div>

                      {/* Required By Date */}
                      <div>
                        <label htmlFor="req-date" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                          आवश्यकता की तिथि (Required By) *
                        </label>
                        <Input
                          id="req-date"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={reqRequiredByDate}
                          onChange={(e) => setReqRequiredByDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Submit actions */}
                    <div className="flex gap-4 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowRequestModal(false)}
                        disabled={submittingRequest}
                        className="flex-1 font-heading font-bold py-3.5 border border-loom-beige rounded-xl hover:bg-loom-sand/20 transition-all text-sm text-loom-wood"
                      >
                        रद्द करें (Cancel)
                      </button>
                      <button
                        type="submit"
                        disabled={submittingRequest}
                        className="vintage-button flex-1 font-heading font-bold py-3.5 bg-loom-wood text-white hover:bg-loom-wood-light text-sm"
                      >
                        {submittingRequest ? 'दर्ज किया जा रहा है...' : 'अनुरोध भेजें (Submit)'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <WeaverLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}
      {renderTabContent()}
      <EkatvaHumsafar role="weaver" userName={userProfile?.displayName} />
      <JobSakhi />
    </WeaverLayout>
  );
};
