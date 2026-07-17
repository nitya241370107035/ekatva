import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getWeaversByCooperative } from '../../firebase/firestore';
import { WeaverProfile } from '../../types';
import { Users, Search, Award, ChevronRight, Filter } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SecretaryMembers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [weavers, setWeavers] = useState<WeaverProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeavers = async () => {
      try {
        const coopId = userProfile?.cooperativeId || 'coop1';
        const fetchedWeavers = await getWeaversByCooperative(coopId);
        setWeavers(fetchedWeavers);
      } catch (err) {
        console.error("Error loading weavers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeavers();
  }, [userProfile]);

  // Extract all unique skills across all weavers
  const allUniqueSkills: string[] = Array.from(
    new Set(weavers.flatMap((w) => w.skillTags || []))
  );

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const filteredWeavers = weavers.filter((weaver) => {
    const query = searchQuery.toLowerCase();
    
    // Search query matches name, phone or city
    const nameMatch = weaver.displayName?.toLowerCase().includes(query);
    const phoneMatch = weaver.phone?.includes(query);
    const cityMatch = weaver.address?.city?.toLowerCase().includes(query);
    const matchesSearch = nameMatch || phoneMatch || cityMatch;

    // Skill matches (all selected must be present in weaver)
    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => weaver.skillTags?.includes(skill));

    return matchesSearch && matchesSkills;
  });

  const isEn = i18n.language === 'en';

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

  return (
    <SecretaryLayout>
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood">
          {isEn ? "Weaver Members Registry" : t('members.title', 'सहकारी सदस्य पंजी (Weaver Members Registry)')}
        </h1>
        <p className="font-body text-base text-loom-ink-light mt-1">
          {isEn 
            ? "Current registry of registered weavers and their loom capacities."
            : t('members.desc', 'पंजीकृत बुनकर समुदाय एवं उनके करघों की वर्तमान विवरणी।')}
        </p>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="vintage-card p-5 mb-6 bg-loom-cream border-t-4 border-t-loom-gold space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:max-w-md">
            <Input
              id="search"
              placeholder={isEn ? "Search by name, phone or city..." : t('members.searchPlaceholder', 'नाम, फ़ोन नंबर अथवा शहर से खोजें...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-loom-gold" />}
            />
          </div>
          <div className="text-right text-loom-ink-light font-body font-semibold">
            {isEn 
              ? `Showing Members: ${filteredWeavers.length} / ${weavers.length}`
              : t('members.totalCount', 'कुल प्रदर्शित सदस्य: {{shown}} / {{total}}', { shown: filteredWeavers.length, total: weavers.length })}
          </div>
        </div>

        {/* Skill Filters */}
        {allUniqueSkills.length > 0 && (
          <div className="pt-2 border-t border-loom-beige/30">
            <div className="flex items-center gap-2 mb-2 font-heading text-sm font-bold text-loom-wood">
              <Filter className="w-4 h-4 text-loom-gold" />
              {isEn ? "Filter by Skills:" : t('members.filterBySkills', 'कौशल द्वारा फ़िल्टर करें (Filter by Skills):')}
            </div>
            <div className="flex flex-wrap gap-2">
              {allUniqueSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1 rounded-full text-xs font-heading font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-loom-gold text-loom-ink border-loom-wood shadow-sm scale-105'
                        : 'bg-white text-loom-ink-light border-loom-beige hover:border-loom-gold'
                    }`}
                  >
                    {getTagLabel(skill)}
                  </button>
                );
              })}
              {selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSkills([])}
                  className="px-3 py-1 rounded-full text-xs font-heading font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  {isEn ? "Clear All" : t('members.clearAll', 'साफ़ करें (Clear All)')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-loom-gold border-t-transparent rounded-full animate-spin" />
              <p className="font-heading text-xl text-loom-wood animate-pulse">
                {isEn ? "Loading registry..." : t('members.loading', 'सदस्य पंजी लोड हो रही है...')}
              </p>
            </div>
          ) : filteredWeavers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Users className="w-16 h-16 text-loom-beige mb-4" />
              <h3 className="font-heading text-xl font-bold text-loom-wood">{isEn ? "No members found" : t('members.empty', 'कोई सदस्य नहीं मिला')}</h3>
              <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                {isEn 
                  ? "No registered weaver matches your search criteria."
                  : t('members.emptyDesc', 'आपके खोज मानदंडों के अनुरूप कोई भी पंजीकृत बुनकर सदस्य नहीं मिला।')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isEn ? "Name" : t('members.colName', 'बुनकर का नाम (Name)')}</TableHead>
                  <TableHead>{isEn ? "Phone" : t('members.colPhone', 'मोबाइल फ़ोन (Phone)')}</TableHead>
                  <TableHead>{isEn ? "Skills" : t('members.colSkills', 'कौशल (Skills)')}</TableHead>
                  <TableHead>{isEn ? "Experience" : t('members.colExp', 'अनुभव (Exp)')}</TableHead>
                  <TableHead>{isEn ? "Looms" : t('members.colLooms', 'करघे (Looms)')}</TableHead>
                  <TableHead>{isEn ? "Capacity" : t('members.colCapacity', 'क्षमता (Capacity)')}</TableHead>
                  <TableHead className="text-right">{isEn ? "Action" : t('members.colAction', 'कार्रवाई (Action)')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWeavers.map((weaver) => (
                  <TableRow 
                    key={weaver.weaverId} 
                    className="hover:bg-loom-cream/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/secretary/members/${weaver.weaverId}`)}
                  >
                    <TableCell className="font-heading font-bold text-lg text-loom-wood">
                      {weaver.displayName}
                    </TableCell>
                    <TableCell className="font-mono text-sm tracking-wide">
                      {weaver.phone}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {weaver.skillTags?.map((tag, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="bg-loom-gold/15 border border-loom-gold/30 text-loom-ink text-[11px] font-heading font-bold px-1.5 py-0.5 rounded"
                          >
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm font-semibold text-loom-ink">
                      {isEn ? `${weaver.experience} Years` : t('members.years', '{{count}} वर्ष', { count: weaver.experience })}
                    </TableCell>
                    <TableCell className="font-heading text-base font-bold text-loom-ink-light">
                      {weaver.numberOfLooms}
                    </TableCell>
                    <TableCell className="font-body text-sm text-loom-ink">
                      {isEn ? `${weaver.dailyCapacity} meters/day` : t('members.capacityUnits', '{{count}} थान/दिन', { count: weaver.dailyCapacity })}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/secretary/members/${weaver.weaverId}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-loom-wood text-white hover:bg-loom-wood-light text-xs font-heading font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        {isEn ? "View Profile" : t('members.viewDetails', 'विवरण देखें')} <ChevronRight className="w-3.5 h-3.5" />
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
