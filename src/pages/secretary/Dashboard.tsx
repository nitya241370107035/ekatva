import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { 
  getWeaversByCooperative, 
  getNoticesByCooperative, 
  getGrievancesByCooperative, 
  getMeetingsByCooperative,
  getGovtSchemes,
  getCooperative,
  getJobCardsByCooperative
} from '../../firebase/firestore';
import { 
  Users, 
  Megaphone, 
  AlertCircle, 
  Calendar, 
  Sparkles,
  PlusCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';
import { checkEligibility } from '../../utils/schemeEligibility';
import { useTranslation } from 'react-i18next';

export const SecretaryDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [loading, setLoading] = useState(true);
  
  const [weaversCount, setWeaversCount] = useState<number>(0);
  const [activeNoticesCount, setActiveNoticesCount] = useState<number>(0);
  const [openGrievancesCount, setOpenGrievancesCount] = useState<number>(0);
  const [meetingsCount, setMeetingsCount] = useState<number>(0);
  const [eligibleSchemesCount, setEligibleSchemesCount] = useState<number>(0);
  
  const [recentActivities, setRecentActivities] = useState<{ text: string; time: string; tag?: string }[]>([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        
        // 1. Get Weavers
        const weavers = await getWeaversByCooperative(coopId);
        setWeaversCount(weavers.length);
        
        // 2. Get Notices (Active = last 30 days)
        const notices = await getNoticesByCooperative(coopId);
        const activeNotices = notices.filter(n => {
          if (!n.createdAt) return false;
          const createdTime = new Date(n.createdAt).getTime();
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          return createdTime > thirtyDaysAgo;
        });
        setActiveNoticesCount(activeNotices.length);
        
        // 3. Get Grievances (Open or In Progress)
        const grievances = await getGrievancesByCooperative(coopId);
        const openGrievances = grievances.filter(g => g.status === 'open' || g.status === 'in_progress');
        setOpenGrievancesCount(openGrievances.length);
        
        // 4. Get Meetings
        const meetings = await getMeetingsByCooperative(coopId);
        setMeetingsCount(meetings.length);

        // 5. Get Schemes Matchmaker Stats
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

        // Generate custom dynamic activity feed
        const tempActivities = [];
        if (weavers.length > 0) {
          const sortedWeavers = [...weavers].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          tempActivities.push({
            text: isEn ? `New weaver registered: ${sortedWeavers[0].displayName}` : `नया बुनकर पंजीकरण: ${sortedWeavers[0].displayName}`,
            time: isEn ? 'Recent' : 'हालिया',
            tag: isEn ? 'Weaver' : 'बुनकर'
          });
        }
        if (notices.length > 0) {
          tempActivities.push({
            text: isEn ? `New notice published: "${notices[0].title}"` : `नयी सूचना प्रकाशित: "${notices[0].title}"`,
            time: isEn ? 'Recent' : 'हालिया',
            tag: isEn ? 'Notice' : 'सूचना'
          });
        }
        if (meetings.length > 0) {
          tempActivities.push({
            text: isEn ? `Meeting recorded: "${meetings[0].title}"` : `बैठक दर्ज की गई: "${meetings[0].title}"`,
            time: isEn ? 'Recent' : 'हालिया',
            tag: isEn ? 'Meeting' : 'बैठक'
          });
        }
        if (grievances.length > 0) {
          tempActivities.push({
            text: isEn ? `Grievance from: ${grievances[0].weaverName} - "${grievances[0].subject}"` : `शिकायत शिकायतकर्ता: ${grievances[0].weaverName} - "${grievances[0].subject}"`,
            time: isEn ? 'Recent' : 'हालिया',
            tag: isEn ? 'Grievance' : 'शिकायत'
          });
        }

        // Add defaults if empty
        if (tempActivities.length === 0) {
          tempActivities.push({
            text: isEn ? 'Cooperative digital credentials setup completed' : 'समिति का डिजिटल क्रेडेंशियल सृजन',
            time: isEn ? 'Setup session' : 'गठन सत्र',
            tag: isEn ? 'System' : 'प्रणाली'
          });
        }
        setRecentActivities(tempActivities);

      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [userProfile, i18n.language]);

  return (
    <SecretaryLayout>
      {/* Welcome Header */}
      <div className="mb-8 p-6 bg-loom-cream border border-loom-beige rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood">
            {isEn ? "Cooperative Management Dashboard" : "बुनकर सहकारी प्रबंधन पटल (Management Center)"}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {isEn ? "Coop Manager: " : "समिति प्रबंधक: "}<span className="font-bold text-loom-wood">{userProfile?.displayName || (isEn ? "Secretary" : "सचिव साहब")}</span> | {isEn ? "Coop Union: " : "सहकारी संघ: "}<span className="font-semibold text-loom-gold">{isEn ? "Weaver Cooperative Society (coop1)" : "बुनकर सहकारी समिति (coop1)"}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 bg-loom-gold/15 text-loom-wood rounded-full border border-loom-gold/30 self-start font-heading font-bold text-base">
          <Sparkles className="w-4 h-4 text-loom-gold animate-pulse" />
          {isEn ? "Active Session" : "सत्र चालू (Active Session)"}
        </div>
      </div>

      {/* Stats Cards 5-column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        
        {/* Stat 1: Total Weavers */}
        <div className="vintage-card p-5 border-l-8 border-l-loom-wood relative overflow-hidden bg-loom-cream">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 flex flex-col justify-around py-4">
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
          </div>
          <div className="flex justify-between items-start pl-3">
            <div>
              <span className="text-xs font-bold text-loom-ink-light uppercase tracking-wider block font-heading">
                {isEn ? "Total Weavers" : "कुल बुनकर सदस्य"}
              </span>
              <span className="font-heading text-4xl font-black text-loom-wood block mt-1">
                {loading ? '...' : weaversCount}
              </span>
              <p className="text-xs text-loom-gold font-semibold mt-3 font-body">
                {isEn ? "All registered weavers" : "सभी पंजीकृत बुनकर"}
              </p>
            </div>
            <div className="p-2.5 bg-loom-wood/15 text-loom-wood rounded-lg shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Stat 2: Active Notices */}
        <div className="vintage-card p-5 border-l-8 border-l-loom-gold relative overflow-hidden bg-loom-cream">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 flex flex-col justify-around py-4">
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
          </div>
          <div className="flex justify-between items-start pl-3">
            <div>
              <span className="text-xs font-bold text-loom-ink-light uppercase tracking-wider block font-heading">
                {isEn ? "Active Notices" : "सक्रिय सूचनाएँ"}
              </span>
              <span className="font-heading text-4xl font-black text-loom-wood block mt-1">
                {loading ? '...' : activeNoticesCount}
              </span>
              <p className="text-xs text-loom-gold font-semibold mt-3 font-body">
                {isEn ? "Notices in past 30 days" : "पिछले 30 दिनों के नोटिस"}
              </p>
            </div>
            <div className="p-2.5 bg-loom-gold/15 text-loom-gold rounded-lg shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Stat 3: Open Grievances */}
        <div className="vintage-card p-5 border-l-8 border-l-red-800 relative overflow-hidden bg-loom-cream">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 flex flex-col justify-around py-4">
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
          </div>
          <div className="flex justify-between items-start pl-3">
            <div>
              <span className="text-xs font-bold text-loom-ink-light uppercase tracking-wider block font-heading">
                {isEn ? "Pending Grievances" : "लंबित शिकायतें"}
              </span>
              <span className="font-heading text-4xl font-black text-red-800 block mt-1">
                {loading ? '...' : openGrievancesCount}
              </span>
              <p className="text-xs text-red-600/80 font-semibold mt-3 font-body">
                {isEn ? "Actionable tickets" : "कार्रवाई योग्य शिकायतें"}
              </p>
            </div>
            <div className="p-2.5 bg-red-100 text-red-800 rounded-lg shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Stat 4: Total Meetings */}
        <div className="vintage-card p-5 border-l-8 border-l-teal-700 relative overflow-hidden bg-loom-cream">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 flex flex-col justify-around py-4">
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
          </div>
          <div className="flex justify-between items-start pl-3">
            <div>
              <span className="text-xs font-bold text-loom-ink-light uppercase tracking-wider block font-heading">
                {isEn ? "Meetings Recorded" : "दर्ज की गई बैठकें"}
              </span>
              <span className="font-heading text-4xl font-black text-teal-700 block mt-1">
                {loading ? '...' : meetingsCount}
              </span>
              <p className="text-xs text-teal-600 font-semibold mt-3 font-body">
                {isEn ? "Total meetings" : "कुल बैठकें"}
              </p>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Stat 5: Eligible Schemes */}
        <Link 
          to="/secretary/schemes" 
          className="vintage-card p-5 border-l-8 border-l-loom-gold relative overflow-hidden bg-loom-cream hover:shadow-md transition-all block group cursor-pointer"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 flex flex-col justify-around py-4">
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
            <div className="w-1 h-1 rounded-full bg-loom-parchment" />
          </div>
          <div className="flex justify-between items-start pl-3">
            <div>
              <span className="text-xs font-bold text-loom-ink-light uppercase tracking-wider block font-heading group-hover:text-loom-wood">
                {isEn ? "Eligible Schemes" : "पात्र योजनाएं"}
              </span>
              <span className="font-heading text-4xl font-black text-loom-wood block mt-1">
                {loading ? '...' : eligibleSchemesCount}
              </span>
              <p className="text-xs text-loom-gold font-semibold mt-3 font-body">
                {isEn ? "Matched schemes" : "योग्य योजनाएं"}
              </p>
            </div>
            <div className="p-2.5 bg-loom-gold/15 text-loom-wood rounded-lg shrink-0 group-hover:bg-loom-gold/25 transition-colors">
              <Award className="w-6 h-6 text-loom-gold animate-pulse" />
            </div>
          </div>
        </Link>

      </div>

      {/* Quick Actions Panel */}
      <div className="vintage-card p-6 mb-8 bg-loom-cream border-t-4 border-t-loom-gold">
        <h2 className="font-heading text-xl font-bold text-loom-wood flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-loom-gold" />
          {isEn ? "Quick Actions" : "त्वरित कार्य (Quick Actions)"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/secretary/notices"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-loom-wood text-white font-heading font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] hover:bg-loom-wood-light cursor-pointer text-center"
          >
            <PlusCircle className="w-5 h-5" />
            {isEn ? "Add Notice" : "नयी सूचना जोड़ें (Add Notice)"}
          </Link>
          <Link
            to="/secretary/meetings"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white border-2 border-loom-wood text-loom-wood font-heading font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] hover:bg-loom-cream cursor-pointer text-center"
          >
            <PlusCircle className="w-5 h-5" />
            {isEn ? "Record Meeting" : "बैठक रिकॉर्ड करें (Record Meeting)"}
          </Link>
          <Link
            to="/secretary/grievances"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-loom-gold text-loom-ink font-heading font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] hover:bg-loom-gold/90 cursor-pointer text-center"
          >
            <MessageSquare className="w-5 h-5" />
            {isEn ? "Resolve Tickets" : "शिकायत निवारण (Resolve Tickets)"}
          </Link>
        </div>
      </div>

      {/* Secondary Information Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity Ledger */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-loom-gold" />
                {isEn ? "Recent Activity Log" : "समिति की हालिया गतिविधि (Recent Activity Log)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="font-body text-base">
              <div className="divide-y divide-loom-beige/30">
                {recentActivities.map((act, index) => (
                  <div key={index} className="py-3.5 flex justify-between items-center gap-3">
                    <span className="text-loom-ink font-semibold text-base">{act.text}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {act.tag && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-loom-wood/15 text-loom-wood">
                          {act.tag}
                        </span>
                      )}
                      <span className="text-xs text-loom-ink-light">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Co-op overview summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-loom-gold" />
                {isEn ? "Weaving Statistics" : "उत्पादन सांख्यिकी (Weaving Statistics)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="font-body text-sm text-loom-ink-light space-y-4">
              <div className="p-4 bg-loom-cream/50 rounded-xl border border-loom-beige/40">
                <p className="font-heading font-bold text-loom-wood text-base">
                  {isEn ? "Banarasi Sarees" : "बनारसी साड़ियाँ (Banarasi Sarees)"}
                </p>
                <p className="text-xs text-loom-gold font-bold">
                  {isEn ? "Primary Product Category" : "मुख्य उत्पाद श्रेणी"}
                </p>
                <div className="w-full bg-loom-beige/30 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-loom-wood h-full rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="p-4 bg-loom-cream/50 rounded-xl border border-loom-beige/40">
                <p className="font-heading font-bold text-loom-wood text-base">
                  {isEn ? "Ikat Bundles" : "इकत थान (Ikat Bundles)"}
                </p>
                <p className="text-xs text-loom-gold font-bold">
                  {isEn ? "Secondary Product Category" : "द्वितीयक उत्पाद श्रेणी"}
                </p>
                <div className="w-full bg-loom-beige/30 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-loom-gold h-full rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </SecretaryLayout>
  );
};
