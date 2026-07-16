export interface UserProfile {
  uid: string;
  email: string;
  role: 'weaver' | 'secretary' | 'buyer';
  cooperativeId: string;
  displayName: string;
  createdAt: any; // Can be string or Timestamp
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  ifsc: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface WeaverProfile {
  weaverId: string;
  cooperativeId: string;
  displayName: string;
  phone: string;
  skillTags: string[];
  experience: number;
  numberOfLooms: number;
  dailyCapacity: number;
  aadharNumber?: string;
  bankAccount: BankAccount;
  address: Address;
  photoURL: string;
  createdAt: any;
  reliabilityScore?: number;
}

export interface Cooperative {
  cooperativeId: string;
  name: string;
  location: string;
  description: string;
  memberCount: number;
  certifications?: string[];
}

export interface SchemeEligibilityCriteria {
  minMembers: number | null;
  minAnnualProduction: number | null;
  requiredCertifications: string[];
  cooperativeType: string | null;
}

export interface GovtScheme {
  schemeId: string;
  name: string;
  description: string;
  eligibilityCriteria: SchemeEligibilityCriteria;
  benefits: string;
  applyLink: string;
  isActive: boolean;
}

export interface Notice {
  noticeId: string;
  cooperativeId: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  createdAt: any;
  createdBy: string;
}

export interface MeetingAttendee {
  weaverId: string;
  displayName: string;
}

export interface Meeting {
  meetingId: string;
  cooperativeId: string;
  title: string;
  date: string; // ISO String or Date
  attendees: MeetingAttendee[];
  agenda: string;
  minutes: string;
  decisions: string;
  createdAt: any;
  createdBy: string;
}

export interface Grievance {
  grievanceId: string;
  cooperativeId: string;
  weaverId: string;
  weaverName: string;
  subject: string;
  category: 'payment' | 'raw material' | 'other';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: any;
  updatedAt: any;
}

export interface GrievanceMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: 'weaver' | 'secretary';
  text: string;
  timestamp: any;
}

export interface RawMaterialIssued {
  materialName: string;
  quantity: number;
  unit: string;
}

export interface JobCard {
  jobCardId: string;
  cooperativeId: string;
  title: string;
  designCode: string;
  quantity: number;
  assignedTo: string; // weaver uid
  assignedToName: string;
  rawMaterialsIssued: RawMaterialIssued[];
  status: 'assigned' | 'in_progress' | 'completed' | 'qc_passed' | 'qc_rejected';
  deadline: string; // deadline date
  wagePerPiece: number;
  totalWage?: number;
  createdAt: any;
  updatedAt: any;
  qcRemarks?: string;
  qcPhotoURL?: string;
}

export interface JobCardStatusLog {
  logId: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'qc_passed' | 'qc_rejected';
  timestamp: any;
  changedBy: string;
  remarks?: string;
}

export interface RawMaterialStock {
  stockId: string;
  cooperativeId: string;
  materialName: string;
  totalQuantity: number;
  unit: string;
  reorderLevel: number;
}

export interface IndentRequest {
  requestId: string;
  cooperativeId: string;
  weaverId: string;
  weaverName: string;
  materialName: string;
  quantity: number;
  unit: string;
  requiredByDate?: string;
  status: 'pending' | 'consolidated' | 'fulfilled';
  bulkIndentId: string | null;
  createdAt: any;
}

export interface BulkIndent {
  indentId: string;
  cooperativeId: string;
  materialName: string;
  totalQuantity: number;
  unit: string;
  vendorId?: string;
  vendorName?: string;
  vendorQuote?: number;
  status: 'draft' | 'sent_to_vendor' | 'ordered' | 'received';
  requestIds: string[];
  createdAt: any;
  updatedAt: any;
}

export interface Vendor {
  vendorId: string;
  name: string;
  contactPerson: string;
  phone: string;
  materials: string[];
  address: string;
  rating?: number;
  cooperativeId?: string;
}

export interface Payment {
  paymentId: string;
  cooperativeId: string;
  weaverId: string;
  weaverName: string;
  type: 'wage' | 'advance' | 'deduction';
  amount: number;
  description: string;
  jobCardId?: string;
  createdAt: any;
  createdBy: string;
}

export interface Product {
  productId: string;
  cooperativeId: string;
  cooperativeName: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  quantityAvailable: number;
  skillTags: string[];
  handloomMark: boolean;
  weaverStory: string;
  createdAt: any;
  hasTraceability?: boolean;
}

export interface ProductionStep {
  step: string;
  timestamp: string;
  details: string;
  hash: string;
}

export interface ProductInstance {
  instanceId: string;
  jobCardId: string;
  productId: string | null;
  cooperativeId: string;
  weaverId: string;
  weaverName: string;
  weaverPhotoURL?: string;
  productName: string;
  finalPrice: number;
  wagePaid: number;
  wagePercentage: number;
  productionSteps: ProductionStep[];
  qrCodeData: string;
  createdAt: any;
}

export interface BuyerRFQ {
  rfqId: string;
  buyerId: string;
  buyerName: string;
  productDescription: string;
  requiredQuantity: number;
  maxBudgetPerUnit?: number;
  deadline: string;
  status: 'open' | 'coalition_formed' | 'quote_submitted' | 'accepted' | 'declined';
  coalitionId?: string;
  createdAt: any;
}

export interface CooperativeQuota {
  cooperativeId: string;
  cooperativeName: string;
  allocatedQuantity: number;
  unitPrice: number;
}

export interface Coalition {
  coalitionId: string;
  rfqId: string;
  cooperativeQuotas: CooperativeQuota[];
  totalQuantity: number;
  totalQuotePrice: number;
  status: 'forming' | 'submitted' | 'accepted' | 'declined';
  createdAt: any;
}


