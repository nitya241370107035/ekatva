import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getGrievancesByCooperative } from '../../firebase/firestore';
import { Grievance } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { MessageSquare, Calendar, ChevronRight, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'resolved';

export const GrievanceListPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        const data = await getGrievancesByCooperative(coopId);
        setGrievances(data);
      } catch (err) {
        console.error("Error loading grievances:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, [userProfile]);

  const filteredGrievances = grievances.filter((g) => {
    if (activeTab === 'all') return true;
    return g.status === activeTab;
  });

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'payment':
        return 'भुगतान संबंधी (Payment)';
      case 'raw material':
        return 'कच्चा माल संबंधी (Raw Material)';
      case 'other':
        return 'अन्य विषय (Other)';
      default:
        return category;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SecretaryLayout>
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-loom-gold" />
          शिकायत निवारण पटल (Grievance Desk)
        </h1>
        <p className="font-body text-base text-loom-ink-light mt-1">
          सहकारी बुनकरों द्वारा दर्ज की गई शिकायतों का प्रबंधन एवं संवाद समाधान।
        </p>
      </div>

      {/* Tabs Filter Section */}
      <div className="flex flex-wrap gap-2.5 mb-6 border-b border-loom-beige/40 pb-3">
        {(
          [
            { id: 'all', label: 'सभी शिकायतें (All)' },
            { id: 'open', label: 'खुली शिकायतें (Open)' },
            { id: 'in_progress', label: 'प्रगति पर (In Progress)' },
            { id: 'resolved', label: 'हल की गई (Resolved)' }
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4.5 py-2.5 rounded-xl text-sm font-heading font-bold transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-loom-wood text-white border-loom-wood shadow-md scale-102'
                  : 'bg-white text-loom-ink-light border-loom-beige hover:bg-loom-cream/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-heading text-xl text-loom-wood animate-pulse">शिकायतें लोड हो रही हैं...</p>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <MessageSquare className="w-16 h-16 text-loom-beige mb-4" />
              <h3 className="font-heading text-xl font-bold text-loom-wood">कोई शिकायत नहीं मिली</h3>
              <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                चयनित श्रेणी के तहत कोई भी बुनकर शिकायत उपलब्ध नहीं है।
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>विषय / विवरण (Subject)</TableHead>
                  <TableHead>बुनकर का नाम (Weaver)</TableHead>
                  <TableHead>श्रेणी (Category)</TableHead>
                  <TableHead>स्थिति (Status)</TableHead>
                  <TableHead>दिनांक (Date)</TableHead>
                  <TableHead className="text-right">कार्रवाई (Action)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrievances.map((grievance) => (
                  <TableRow 
                    key={grievance.grievanceId}
                    className="hover:bg-loom-cream/40 transition-colors cursor-pointer font-body"
                    onClick={() => navigate(`/secretary/grievances/${grievance.grievanceId}`)}
                  >
                    <TableCell className="font-heading font-bold text-lg text-loom-wood max-w-[200px] truncate">
                      {grievance.subject}
                    </TableCell>
                    <TableCell className="font-semibold text-loom-ink">
                      {grievance.weaverName}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-loom-gold">
                      {getCategoryText(grievance.category)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={grievance.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-loom-ink-light">
                      {formatDate(grievance.createdAt)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/secretary/grievances/${grievance.grievanceId}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-loom-wood text-white hover:bg-loom-wood-light text-xs font-heading font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        चर्चा खोलें (Respond) <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </SecretaryLayout>
  );
};
