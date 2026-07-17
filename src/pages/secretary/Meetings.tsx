import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SecretaryLayout } from '../../components/layout/SecretaryLayout';
import { getMeetingsByCooperative, createMeeting, getWeaversByCooperative } from '../../firebase/firestore';
import { Meeting, WeaverProfile, MeetingAttendee } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Calendar, PlusCircle, X, Users, BookOpen, Users2, FileText, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MeetingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [weavers, setWeavers] = useState<WeaverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedWeaverIds, setSelectedWeaverIds] = useState<string[]>([]);
  const [agenda, setAgenda] = useState('');
  const [minutes, setMinutes] = useState('');
  const [decisions, setDecisions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      
      const fetchedMeetings = await getMeetingsByCooperative(coopId);
      setMeetings(fetchedMeetings);
      
      const fetchedWeavers = await getWeaversByCooperative(coopId);
      setWeavers(fetchedWeavers);
    } catch (err) {
      console.error("Error loading meetings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const handleCheckboxToggle = (uid: string) => {
    if (selectedWeaverIds.includes(uid)) {
      setSelectedWeaverIds(selectedWeaverIds.filter(id => id !== uid));
    } else {
      setSelectedWeaverIds([...selectedWeaverIds, uid]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !agenda.trim() || !minutes.trim() || !decisions.trim()) {
      setError(isEn ? 'Please fill all required fields' : 'कृपया सभी आवश्यक फ़ील्ड भरें (Please fill all required fields)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const coopId = userProfile?.cooperativeId || 'coop1';
      
      // Map selected weaver IDs to meeting attendees list
      const attendees: MeetingAttendee[] = weavers
        .filter(w => selectedWeaverIds.includes(w.weaverId))
        .map(w => ({
          weaverId: w.weaverId,
          displayName: w.displayName
        }));

      await createMeeting({
        cooperativeId: coopId,
        title,
        date,
        attendees,
        agenda,
        minutes,
        decisions,
        createdBy: userProfile?.uid || 'system'
      });

      // Clear Form & Close
      setTitle('');
      setDate(new Date().toISOString().substring(0, 10));
      setSelectedWeaverIds([]);
      setAgenda('');
      setMinutes('');
      setDecisions('');
      setShowAddModal(false);

      // Reload
      setLoading(true);
      await loadData();
    } catch (err) {
      console.error("Error adding meeting:", err);
      setError(isEn ? 'Failed to record meeting. Please try again.' : 'बैठक रिकॉर्ड करने में त्रुटि हुई। कृपया दोबारा प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(isEn ? 'en-US' : 'hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SecretaryLayout>
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-loom-wood flex items-center gap-2">
            <Calendar className="w-8 h-8 text-loom-gold" />
            {isEn ? "Meetings & Minutes" : "सहकारी बैठकें एवं प्रस्ताव (Meetings & Minutes)"}
          </h1>
          <p className="font-body text-base text-loom-ink-light mt-1">
            {isEn 
              ? "Digital records of committee meetings, minutes, attendee lists, and cooperative resolutions."
              : "समिति की बैठकों की कार्यवाही, उपस्थित सदस्य एवं प्रस्तावों का डिजिटल रिकॉर्ड।"}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-loom-wood text-white hover:bg-loom-wood-light font-heading font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          {isEn ? "Record Meeting" : "नई बैठक जोड़ें (Record Meeting)"}
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-heading text-xl text-loom-wood animate-pulse">
                {isEn ? "Loading meetings list..." : "बैठक सूची लोड हो रही है..."}
              </p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Calendar className="w-16 h-16 text-loom-beige mb-4" />
              <h3 className="font-heading text-xl font-bold text-loom-wood">
                {isEn ? "No Meetings Recorded" : "कोई बैठक दर्ज नहीं है"}
              </h3>
              <p className="font-body text-base text-loom-ink-light max-w-sm mt-1">
                {isEn 
                  ? "No committee meetings have been recorded yet."
                  : "अभी तक इस समिति के लिए कोई बैठक रिकॉर्ड नहीं की गई है।"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isEn ? "Date" : "दिनांक (Date)"}</TableHead>
                  <TableHead>{isEn ? "Meeting Title" : "बैठक का शीर्षक (Meeting Title)"}</TableHead>
                  <TableHead>{isEn ? "Attendees" : "उपस्थित सदस्य (Attendees)"}</TableHead>
                  <TableHead className="text-right font-bold">{isEn ? "Action" : "कार्यवाही (Action)"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow 
                    key={meeting.meetingId} 
                    className="hover:bg-loom-cream/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <TableCell className="font-heading font-bold text-base text-loom-wood">
                      {formatDate(meeting.date)}
                    </TableCell>
                    <TableCell className="font-body font-bold text-lg text-loom-ink">
                      {meeting.title}
                    </TableCell>
                    <TableCell className="font-body text-sm font-semibold text-loom-ink-light">
                      <span className="inline-flex items-center gap-1 bg-loom-gold/15 text-loom-wood px-2 py-1 rounded border border-loom-gold/30">
                        <Users className="w-3.5 h-3.5" /> {isEn ? `${meeting.attendees?.length || 0} Members Present` : `${meeting.attendees?.length || 0} सदस्य उपस्थित`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedMeeting(meeting)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-loom-wood text-white hover:bg-loom-wood-light text-xs font-heading font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        {isEn ? "View Details" : "विवरण देखें (View Details)"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 1. NEW MEETING MODAL FORM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border-2 border-loom-gold shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-heading text-2xl font-bold text-loom-wood mb-1">
              {isEn ? "Record New Meeting Minutes" : "नई बैठक की कार्यवाही दर्ज करें"}
            </h2>
            <p className="font-body text-xs text-loom-ink-light mb-6 border-b border-loom-beige/30 pb-3">
              (Record minutes and resolutions of cooperative committee meeting)
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-body font-semibold">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label htmlFor="m-title" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                    {isEn ? "Meeting Title / Subject *" : "बैठक का विषय/शीर्षक (Meeting Title) *"}
                  </label>
                  <Input
                    id="m-title"
                    placeholder={isEn ? "e.g. Annual General Body Meeting 2026" : "उदा: वार्षिक आमसभा 2026"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Date */}
                <div>
                  <label htmlFor="m-date" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                    {isEn ? "Meeting Date *" : "बैठक की तिथि (Meeting Date) *"}
                  </label>
                  <Input
                    id="m-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Attendees Checklist */}
              <div>
                <label className="block text-sm font-bold text-loom-wood mb-2 font-heading flex items-center gap-1.5">
                  <Users2 className="w-4.5 h-4.5 text-loom-gold" />
                  {isEn ? "Attending Weaver Members *" : "उपस्थित बुनकर सदस्य (Attendees Checklist)"}
                </label>
                <div className="border border-loom-beige bg-white rounded-xl p-4 max-h-[140px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 shadow-inner">
                  {weavers.map((weaver) => {
                    const checked = selectedWeaverIds.includes(weaver.weaverId);
                    return (
                      <label 
                        key={weaver.weaverId} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-body font-medium transition-all cursor-pointer ${
                          checked 
                            ? 'bg-amber-50/50 border-loom-gold text-loom-wood' 
                            : 'border-transparent hover:bg-loom-cream/50 text-loom-ink-light'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCheckboxToggle(weaver.weaverId)}
                          className="accent-loom-wood"
                        />
                        <span className="truncate">{weaver.displayName}</span>
                      </label>
                    );
                  })}
                  {weavers.length === 0 && (
                    <span className="text-xs text-loom-ink-light col-span-2">
                      {isEn ? "No weavers registered." : "कोई बुनकर पंजीकृत नहीं है।"}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-loom-ink-light font-body mt-1.5">
                  {isEn 
                    ? `Selected: ${selectedWeaverIds.length} Weavers` 
                    : `चयनित सदस्य: ${selectedWeaverIds.length} बुनकर`}
                </p>
              </div>

              {/* Agenda */}
              <div>
                <label htmlFor="agenda" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Meeting Agenda *" : "बैठक का एजेंडा / कार्यसूची (Meeting Agenda) *"}
                </label>
                <textarea
                  id="agenda"
                  rows={2.5}
                  placeholder={isEn ? "Main topics to be discussed in the meeting..." : "बैठक में विचार किए जाने वाले मुख्य विषय..."}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                />
              </div>

              {/* Minutes of meeting */}
              <div>
                <label htmlFor="minutes" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Proceedings / Minutes Details *" : "बैठक की कार्यवाही / विवरण (Proceedings / Minutes) *"}
                </label>
                <textarea
                  id="minutes"
                  rows={3}
                  placeholder={isEn ? "Detailed discussion minutes..." : "बैठक में क्या-क्या चर्चा की गई..."}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                />
              </div>

              {/* Resolutions/Decisions */}
              <div>
                <label htmlFor="decisions" className="block text-sm font-bold text-loom-wood mb-1.5 font-heading">
                  {isEn ? "Resolutions / Decisions Passed *" : "लिए गए महत्वपूर्ण निर्णय (Resolutions / Decisions) *"}
                </label>
                <textarea
                  id="decisions"
                  rows={2.5}
                  placeholder={isEn ? "Decisions unanimously approved during the session..." : "सर्वसम्मति से कौन से निर्णय पारित हुए..."}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-loom-beige rounded-xl focus:outline-none focus:ring-2 focus:ring-loom-gold focus:border-transparent font-body text-base placeholder-loom-beige text-loom-ink shadow-inner resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-3 border-t border-loom-beige/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 font-heading font-bold py-3.5"
                >
                  {isEn ? "Cancel" : "रद्द करें (Cancel)"}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 font-heading font-bold py-3.5 bg-loom-wood text-white hover:bg-loom-wood-light"
                >
                  {submitting 
                    ? (isEn ? "Recording..." : "रिकॉर्डिंग चालू...") 
                    : (isEn ? "Save Minutes" : "बैठक सहेजें (Save Minutes)")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. VIEW MEETING DETAILS MODAL */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-loom-parchment p-6 sm:p-8 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative border-2 border-loom-gold shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMeeting(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-loom-cream text-loom-wood cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-loom-beige/30 pb-4 mb-6">
              <span className="bg-loom-gold/25 text-loom-wood px-3 py-1 rounded-full text-xs font-bold font-heading border border-loom-gold/30">
                {isEn ? "📅 Meeting Minutes" : "📅 बैठक विवरणी (Meeting Minutes)"}
              </span>
              <h2 className="font-heading text-2xl font-black text-loom-wood mt-2.5">
                {selectedMeeting.title}
              </h2>
              <p className="font-body text-sm font-semibold text-loom-ink-light mt-1">
                {isEn ? "Meeting Date: " : "बैठक की दिनांक: "}<span className="text-loom-wood">{formatDate(selectedMeeting.date)}</span>
              </p>
            </div>

            {/* Attendance display */}
            <div className="mb-6">
              <h3 className="font-heading text-sm font-extrabold text-loom-wood flex items-center gap-1.5 mb-2.5 uppercase tracking-wide">
                <Users className="w-4 h-4 text-loom-gold" />
                {isEn 
                  ? `Attending Weaver Members (${selectedMeeting.attendees?.length || 0}):`
                  : `उपस्थित बुनकर सदस्य (${selectedMeeting.attendees?.length || 0}):`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 ? (
                  selectedMeeting.attendees.map((attendee, index) => (
                    <span 
                      key={index} 
                      className="bg-loom-cream border border-loom-beige/60 text-loom-ink font-body text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      {attendee.displayName}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-loom-ink-light italic font-body">
                    {isEn ? "No members registered." : "कोई सदस्य पंजीकृत नहीं है।"}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Agenda card */}
              <div className="p-4 bg-white rounded-xl border border-loom-beige/40">
                <h4 className="font-heading text-xs font-bold text-loom-gold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {isEn ? "Agenda" : "एजेंडा (Agenda)"}
                </h4>
                <p className="font-body text-sm text-loom-ink leading-relaxed whitespace-pre-wrap">{selectedMeeting.agenda}</p>
              </div>

              {/* Proceedings card */}
              <div className="p-4 bg-white rounded-xl border border-loom-beige/40">
                <h4 className="font-heading text-xs font-bold text-teal-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> {isEn ? "Minutes" : "कार्यवाही (Minutes)"}
                </h4>
                <p className="font-body text-sm text-loom-ink leading-relaxed whitespace-pre-wrap">{selectedMeeting.minutes}</p>
              </div>

              {/* Decisions card */}
              <div className="p-4 bg-amber-50 border border-loom-gold/30 rounded-xl">
                <h4 className="font-heading text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> {isEn ? "Resolutions" : "निर्णय (Resolutions)"}
                </h4>
                <p className="font-body text-sm text-amber-900 font-medium leading-relaxed whitespace-pre-wrap">{selectedMeeting.decisions}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-loom-beige/30 text-right">
              <Button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="font-heading font-bold px-6 py-2.5 bg-loom-wood text-white hover:bg-loom-wood-light"
              >
                {isEn ? "Close" : "विवरण बंद करें (Close)"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SecretaryLayout>
  );
};
