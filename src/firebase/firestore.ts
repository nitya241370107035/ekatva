import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  serverTimestamp,
  updateDoc,
  increment,
  addDoc,
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { 
  UserProfile, 
  WeaverProfile, 
  Cooperative, 
  Notice, 
  Meeting, 
  Grievance, 
  GrievanceMessage,
  JobCard,
  JobCardStatusLog,
  RawMaterialStock,
  RawMaterialIssued,
  IndentRequest,
  BulkIndent,
  Vendor,
  Payment,
  Product,
  ProductSubmission,
  BuyerRFQ,
  Coalition,
  CooperativeQuota,
  ProductInstance,
  GovtScheme
} from '../types';

// Create a new user profile doc inside users collection
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, {
    uid,
    createdAt: serverTimestamp(),
    ...data
  }, { merge: true });
}

// Create a new weaver profile doc inside weavers collection
export async function createWeaverProfile(uid: string, data: Partial<WeaverProfile>): Promise<void> {
  const weaverDocRef = doc(db, 'weavers', uid);
  await setDoc(weaverDocRef, {
    weaverId: uid,
    createdAt: serverTimestamp(),
    ...data
  }, { merge: true });

  // Increment member count in the associated cooperative
  if (data.cooperativeId) {
    await ensureCooperative(data.cooperativeId);
    const coopRef = doc(db, 'cooperatives', data.cooperativeId);
    await updateDoc(coopRef, {
      memberCount: increment(1)
    });
  }
}

// Ensure cooperative exists, creating one with Hindi presets if missing
export async function ensureCooperative(coopId: string): Promise<void> {
  const coopDocRef = doc(db, 'cooperatives', coopId);
  const coopSnap = await getDoc(coopDocRef);
  
  if (!coopSnap.exists()) {
    await setDoc(coopDocRef, {
      cooperativeId: coopId,
      name: "बुनकर सहकारी समिति",
      location: "वाराणसी, उत्तर प्रदेश",
      description: "एकत्व बुनकर सहकारी समिति - हाथकरघा कारीगरों का गौरवशाली संगम।",
      memberCount: 0,
      certifications: []
    });
  }
  // Seeding the government schemes database if empty
  await seedGovtSchemes();
}

// Get user profile doc
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

// Get single weaver profile
export async function getWeaverProfile(uid: string): Promise<WeaverProfile | null> {
  const weaverDocRef = doc(db, 'weavers', uid);
  const weaverSnap = await getDoc(weaverDocRef);
  if (weaverSnap.exists()) {
    return weaverSnap.data() as WeaverProfile;
  }
  return null;
}

// Get weavers belonging to a cooperative
export async function getWeaversByCooperative(cooperativeId: string): Promise<WeaverProfile[]> {
  const weaversRef = collection(db, 'weavers');
  const q = query(weaversRef, where('cooperativeId', '==', cooperativeId));
  const querySnapshot = await getDocs(q);
  
  const weavers: WeaverProfile[] = [];
  querySnapshot.forEach((doc) => {
    weavers.push(doc.data() as WeaverProfile);
  });
  return weavers;
}

// ==========================================
// 1. Notice Board Helpers
// ==========================================

export async function createNotice(data: Omit<Notice, 'noticeId' | 'createdAt'>): Promise<string> {
  const noticesRef = collection(db, 'notices');
  const docRef = await addDoc(noticesRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
  
  // Save the ID inside the doc
  await updateDoc(docRef, { noticeId: docRef.id });
  return docRef.id;
}

export async function getNoticesByCooperative(cooperativeId: string): Promise<Notice[]> {
  const noticesRef = collection(db, 'notices');
  const q = query(
    noticesRef, 
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  
  const notices: Notice[] = [];
  querySnapshot.forEach((doc) => {
    notices.push(doc.data() as Notice);
  });
  return notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ==========================================
// 2. Meeting Minutes Helpers
// ==========================================

export async function createMeeting(data: Omit<Meeting, 'meetingId' | 'createdAt'>): Promise<string> {
  const meetingsRef = collection(db, 'meetings');
  const docRef = await addDoc(meetingsRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
  
  // Save ID inside doc
  await updateDoc(docRef, { meetingId: docRef.id });
  return docRef.id;
}

export async function getMeetingsByCooperative(cooperativeId: string): Promise<Meeting[]> {
  const meetingsRef = collection(db, 'meetings');
  const q = query(
    meetingsRef, 
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  
  const meetings: Meeting[] = [];
  querySnapshot.forEach((doc) => {
    meetings.push(doc.data() as Meeting);
  });
  return meetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ==========================================
// 3. Grievance Ticketing Helpers
// ==========================================

export async function createGrievance(data: Omit<Grievance, 'grievanceId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const grievancesRef = collection(db, 'grievances');
  const now = new Date().toISOString();
  const docRef = await addDoc(grievancesRef, {
    ...data,
    createdAt: now,
    updatedAt: now
  });
  
  // Save ID inside doc
  await updateDoc(docRef, { grievanceId: docRef.id });
  return docRef.id;
}

export async function getGrievancesByCooperative(cooperativeId: string): Promise<Grievance[]> {
  const grievancesRef = collection(db, 'grievances');
  const q = query(
    grievancesRef, 
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  
  const grievances: Grievance[] = [];
  querySnapshot.forEach((doc) => {
    grievances.push(doc.data() as Grievance);
  });
  return grievances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getGrievancesByWeaver(weaverId: string): Promise<Grievance[]> {
  const grievancesRef = collection(db, 'grievances');
  const q = query(
    grievancesRef, 
    where('weaverId', '==', weaverId)
  );
  const querySnapshot = await getDocs(q);
  
  const grievances: Grievance[] = [];
  querySnapshot.forEach((doc) => {
    grievances.push(doc.data() as Grievance);
  });
  return grievances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getGrievanceById(grievanceId: string): Promise<Grievance | null> {
  const docRef = doc(db, 'grievances', grievanceId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Grievance;
  }
  return null;
}

export async function updateGrievanceStatus(
  grievanceId: string, 
  status: 'open' | 'in_progress' | 'resolved'
): Promise<void> {
  const docRef = doc(db, 'grievances', grievanceId);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString()
  });
}

// Subcollection Messages Helpers
export async function addGrievanceMessage(
  grievanceId: string, 
  message: Omit<GrievanceMessage, 'messageId' | 'timestamp'>
): Promise<string> {
  const messagesRef = collection(db, 'grievances', grievanceId, 'messages');
  const docRef = await addDoc(messagesRef, {
    ...message,
    timestamp: new Date().toISOString()
  });
  
  await updateDoc(docRef, { messageId: docRef.id });
  
  // Also update grievance's updatedAt timestamp
  const grievanceRef = doc(db, 'grievances', grievanceId);
  await updateDoc(grievanceRef, {
    updatedAt: new Date().toISOString()
  });

  return docRef.id;
}

// Real-time listener for messages
export function listenGrievanceMessages(
  grievanceId: string, 
  callback: (messages: GrievanceMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'grievances', grievanceId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages: GrievanceMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data() as GrievanceMessage);
    });
    callback(messages);
  });
}

// ==========================================
// 4. Raw Material Stock Helpers
// ==========================================

export async function getRawMaterialStock(cooperativeId: string): Promise<RawMaterialStock[]> {
  const stockRef = collection(db, 'rawMaterialStock');
  const q = query(stockRef, where('cooperativeId', '==', cooperativeId));
  const querySnapshot = await getDocs(q);
  
  const stock: RawMaterialStock[] = [];
  querySnapshot.forEach((doc) => {
    stock.push(doc.data() as RawMaterialStock);
  });
  return stock;
}

export async function addOrUpdateStockItem(
  cooperativeId: string,
  materialName: string,
  quantity: number,
  unit: string,
  reorderLevel: number
): Promise<void> {
  const stockRef = collection(db, 'rawMaterialStock');
  const q = query(
    stockRef, 
    where('cooperativeId', '==', cooperativeId),
    where('materialName', '==', materialName)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Update existing
    const existingDoc = querySnapshot.docs[0];
    const existingData = existingDoc.data() as RawMaterialStock;
    const docRef = doc(db, 'rawMaterialStock', existingDoc.id);
    await updateDoc(docRef, {
      totalQuantity: existingData.totalQuantity + quantity,
      unit,
      reorderLevel
    });
  } else {
    // Create new
    const docRef = await addDoc(stockRef, {
      cooperativeId,
      materialName,
      totalQuantity: quantity,
      unit,
      reorderLevel
    });
    await updateDoc(docRef, { stockId: docRef.id });
  }
}

export async function updateStockQuantityManual(
  cooperativeId: string,
  stockId: string,
  change: number
): Promise<void> {
  const docRef = doc(db, 'rawMaterialStock', stockId);
  await updateDoc(docRef, {
    totalQuantity: increment(change)
  });
}

export async function seedDefaultStock(cooperativeId: string): Promise<void> {
  const existing = await getRawMaterialStock(cooperativeId);
  if (existing.length === 0) {
    await addOrUpdateStockItem(cooperativeId, "रेसम धागा", 50, "किलोग्राम", 10);
    await addOrUpdateStockItem(cooperativeId, "सूती धागा", 100, "किलोग्राम", 20);
    await addOrUpdateStockItem(cooperativeId, "जरी", 5, "किलोग्राम", 1);
  }
}

// ==========================================
// 5. Job Cards Helpers
// ==========================================

export async function createJobCard(
  data: Omit<JobCard, 'jobCardId' | 'createdAt' | 'updatedAt' | 'status'>,
  changedByUid: string
): Promise<string> {
  // We will run this inside a Firestore transaction or batch to ensure we can verify and deduct stocks
  const stockRef = collection(db, 'rawMaterialStock');
  const stockSnapshot = await getDocs(query(stockRef, where('cooperativeId', '==', data.cooperativeId)));
  
  const stockDocsMap = new Map<string, { id: string; data: RawMaterialStock }>();
  stockSnapshot.forEach((doc) => {
    const s = doc.data() as RawMaterialStock;
    stockDocsMap.set(s.materialName.trim().toLowerCase(), { id: doc.id, data: s });
  });

  // Verify stock
  for (const item of data.rawMaterialsIssued) {
    const key = item.materialName.trim().toLowerCase();
    const stockItem = stockDocsMap.get(key);
    
    if (!stockItem || stockItem.data.totalQuantity < item.quantity) {
      throw new Error(`कच्चा माल: "${item.materialName}" स्टॉक में पर्याप्त नहीं है। वर्तमान स्टॉक: ${stockItem ? stockItem.data.totalQuantity : 0} ${item.unit}`);
    }
  }

  // Deduct stock and add Job Card inside a batch
  const batch = writeBatch(db);
  
  // Deduct stock
  for (const item of data.rawMaterialsIssued) {
    const key = item.materialName.trim().toLowerCase();
    const stockItem = stockDocsMap.get(key)!;
    const stockDocRef = doc(db, 'rawMaterialStock', stockItem.id);
    batch.update(stockDocRef, {
      totalQuantity: increment(-item.quantity)
    });
  }

  // Add Job Card
  const now = new Date().toISOString();
  const jobCardsRef = collection(db, 'jobCards');
  
  const jobCardDocRef = doc(jobCardsRef);
  const jobCardId = jobCardDocRef.id;
  
  const jobCardData: JobCard = {
    ...data,
    jobCardId,
    status: 'assigned',
    createdAt: now,
    updatedAt: now
  };
  
  batch.set(jobCardDocRef, jobCardData);

  // Add initial status log
  const statusLogRef = doc(collection(db, 'jobCards', jobCardId, 'statusLog'));
  const statusLogData: JobCardStatusLog = {
    logId: statusLogRef.id,
    status: 'assigned',
    timestamp: now,
    changedBy: changedByUid,
    remarks: 'कार्य कार्ड का निर्माण और बुनकर को असाइनमेंट।'
  };
  batch.set(statusLogRef, statusLogData);

  await batch.commit();
  return jobCardId;
}

export async function getJobCardsByCooperative(cooperativeId: string): Promise<JobCard[]> {
  const jobCardsRef = collection(db, 'jobCards');
  const q = query(
    jobCardsRef, 
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  
  const jobCards: JobCard[] = [];
  querySnapshot.forEach((doc) => {
    jobCards.push(doc.data() as JobCard);
  });
  return jobCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getJobCardsByWeaver(weaverId: string): Promise<JobCard[]> {
  const jobCardsRef = collection(db, 'jobCards');
  const q = query(
    jobCardsRef, 
    where('assignedTo', '==', weaverId)
  );
  const querySnapshot = await getDocs(q);
  
  const jobCards: JobCard[] = [];
  querySnapshot.forEach((doc) => {
    jobCards.push(doc.data() as JobCard);
  });
  return jobCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getJobCardById(jobCardId: string): Promise<JobCard | null> {
  const docRef = doc(db, 'jobCards', jobCardId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as JobCard;
  }
  return null;
}

export async function updateJobCardStatus(
  jobCardId: string,
  status: JobCard['status'],
  changedBy: string,
  remarks?: string,
  extraFields?: Partial<JobCard>
): Promise<void> {
  const now = new Date().toISOString();
  const jobCardRef = doc(db, 'jobCards', jobCardId);
  
  await updateDoc(jobCardRef, {
    status,
    updatedAt: now,
    ...extraFields
  });

  // Add to statusLog subcollection
  const logRef = collection(db, 'jobCards', jobCardId, 'statusLog');
  const statusLogRef = doc(logRef);
  
  await setDoc(statusLogRef, {
    logId: statusLogRef.id,
    status,
    timestamp: now,
    changedBy,
    remarks: remarks || ''
  } as JobCardStatusLog);
}

export async function getJobCardStatusLog(jobCardId: string): Promise<JobCardStatusLog[]> {
  const logRef = collection(db, 'jobCards', jobCardId, 'statusLog');
  const q = query(logRef, orderBy('timestamp', 'asc'));
  const querySnapshot = await getDocs(q);
  
  const log: JobCardStatusLog[] = [];
  querySnapshot.forEach((doc) => {
    log.push(doc.data() as JobCardStatusLog);
  });
  return log;
}

// ==========================================
// 6. Indent & Collective Procurement Helpers
// ==========================================

export async function createIndentRequest(
  data: Omit<IndentRequest, 'requestId' | 'createdAt' | 'status' | 'bulkIndentId'>
): Promise<string> {
  const requestsRef = collection(db, 'indentRequests');
  const now = new Date().toISOString();
  const docRef = await addDoc(requestsRef, {
    ...data,
    status: 'pending',
    bulkIndentId: null,
    createdAt: now
  });
  await updateDoc(docRef, { requestId: docRef.id });
  return docRef.id;
}

export async function getIndentRequestsByWeaver(weaverId: string): Promise<IndentRequest[]> {
  const requestsRef = collection(db, 'indentRequests');
  const q = query(
    requestsRef,
    where('weaverId', '==', weaverId)
  );
  const querySnapshot = await getDocs(q);
  const requests: IndentRequest[] = [];
  querySnapshot.forEach((doc) => {
    requests.push(doc.data() as IndentRequest);
  });
  return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getIndentRequestsByCooperative(cooperativeId: string): Promise<IndentRequest[]> {
  const requestsRef = collection(db, 'indentRequests');
  const q = query(
    requestsRef,
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  const requests: IndentRequest[] = [];
  querySnapshot.forEach((doc) => {
    requests.push(doc.data() as IndentRequest);
  });
  return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function consolidateIndentRequests(
  cooperativeId: string,
  requestIds: string[],
  materialName: string,
  totalQuantity: number,
  unit: string
): Promise<string> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  // Create Bulk Indent
  const bulkIndentsRef = collection(db, 'bulkIndents');
  const bulkIndentDocRef = doc(bulkIndentsRef);
  const bulkIndentId = bulkIndentDocRef.id;
  
  const bulkIndentData: BulkIndent = {
    indentId: bulkIndentId,
    cooperativeId,
    materialName,
    totalQuantity,
    unit,
    status: 'draft',
    requestIds,
    createdAt: now,
    updatedAt: now
  };
  
  batch.set(bulkIndentDocRef, bulkIndentData);
  
  // Update all individual requests to 'consolidated' and link bulkIndentId
  for (const reqId of requestIds) {
    const reqRef = doc(db, 'indentRequests', reqId);
    batch.update(reqRef, {
      status: 'consolidated',
      bulkIndentId
    });
  }
  
  await batch.commit();
  return bulkIndentId;
}

export async function getBulkIndents(cooperativeId: string): Promise<BulkIndent[]> {
  const indentsRef = collection(db, 'bulkIndents');
  const q = query(
    indentsRef,
    where('cooperativeId', '==', cooperativeId)
  );
  const querySnapshot = await getDocs(q);
  const indents: BulkIndent[] = [];
  querySnapshot.forEach((doc) => {
    indents.push(doc.data() as BulkIndent);
  });
  return indents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBulkIndentById(indentId: string): Promise<BulkIndent | null> {
  const docRef = doc(db, 'bulkIndents', indentId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as BulkIndent;
  }
  return null;
}

export async function updateBulkIndentStatus(
  indentId: string,
  status: BulkIndent['status'],
  extraFields?: Partial<BulkIndent>
): Promise<void> {
  const now = new Date().toISOString();
  const bulkIndentRef = doc(db, 'bulkIndents', indentId);
  
  // Fetch current bulk indent first to know details
  const snap = await getDoc(bulkIndentRef);
  if (!snap.exists()) {
    throw new Error('Bulk indent not found');
  }
  const bulkIndent = snap.data() as BulkIndent;
  
  const batch = writeBatch(db);
  
  // Update status
  batch.update(bulkIndentRef, {
    status,
    updatedAt: now,
    ...extraFields
  });
  
  // If moving to received, update stock and set individual requests as fulfilled
  if (status === 'received') {
    // Increment the stock item
    const stockRef = collection(db, 'rawMaterialStock');
    const q = query(
      stockRef,
      where('cooperativeId', '==', bulkIndent.cooperativeId),
      where('materialName', '==', bulkIndent.materialName)
    );
    const stockSnap = await getDocs(q);
    
    if (!stockSnap.empty) {
      const stockDoc = stockSnap.docs[0];
      const stockDocRef = doc(db, 'rawMaterialStock', stockDoc.id);
      batch.update(stockDocRef, {
        totalQuantity: increment(bulkIndent.totalQuantity)
      });
    } else {
      // Create new stock item
      const newStockRef = doc(collection(db, 'rawMaterialStock'));
      batch.set(newStockRef, {
        stockId: newStockRef.id,
        cooperativeId: bulkIndent.cooperativeId,
        materialName: bulkIndent.materialName,
        totalQuantity: bulkIndent.totalQuantity,
        unit: bulkIndent.unit,
        reorderLevel: 10
      });
    }
    
    // Set all associated requests as fulfilled
    for (const reqId of bulkIndent.requestIds) {
      const reqRef = doc(db, 'indentRequests', reqId);
      batch.update(reqRef, {
        status: 'fulfilled'
      });
    }
  }
  
  await batch.commit();
}

// ==========================================
// 7. Vendor Helpers
// ==========================================

export async function getVendors(): Promise<Vendor[]> {
  const vendorsRef = collection(db, 'vendors');
  const querySnapshot = await getDocs(vendorsRef);
  const vendors: Vendor[] = [];
  querySnapshot.forEach((doc) => {
    vendors.push(doc.data() as Vendor);
  });
  return vendors;
}

export async function createVendor(data: Omit<Vendor, 'vendorId'>): Promise<string> {
  const vendorsRef = collection(db, 'vendors');
  const docRef = await addDoc(vendorsRef, data);
  await updateDoc(docRef, { vendorId: docRef.id });
  return docRef.id;
}

export async function seedVendors(): Promise<void> {
  const vendors = await getVendors();
  if (vendors.length === 0) {
    await createVendor({
      name: "बनारस यार्न सप्लायर्स (Banaras Yarn Suppliers)",
      contactPerson: "सुरेश मेहता",
      phone: "9876543210",
      materials: ["रेसम धागा", "सूती धागा", "जरी"],
      address: "चौक बाजार, वाराणसी, उत्तर प्रदेश",
      rating: 4.8
    });
    await createVendor({
      name: "गंगा टेक्सटाइल डाइंग हाउस (Ganga Textile Dyeing House)",
      contactPerson: "रमेश यादव",
      phone: "9123456789",
      materials: ["रंगाई सामग्री", "सूती धागा"],
      address: "जैतपुरा, वाराणसी, उत्तर प्रदेश",
      rating: 4.5
    });
    await createVendor({
      name: "गोल्डन जरी एम्पोरियम (Golden Zari Emporium)",
      contactPerson: "अमित शाह",
      phone: "8888877777",
      materials: ["जरी"],
      address: "मदनपुरा, वाराणसी, उत्तर प्रदेश",
      rating: 4.9
    });
  }
}

// ==========================================
// 8. Predictive Procurement Advisor
// ==========================================

export async function getProcurementAdvice(cooperativeId: string): Promise<any[]> {
  // 1. Fetch current stock levels
  const stocks = await getRawMaterialStock(cooperativeId);
  
  // 2. Fetch pending indent requests
  const indents = await getIndentRequestsByCooperative(cooperativeId);
  const pendingIndents = indents.filter(r => r.status === 'pending');
  
  // Compute total requested quantity per material name
  const requestedMap = new Map<string, { quantity: number; unit: string }>();
  for (const req of pendingIndents) {
    const key = req.materialName.trim();
    const existing = requestedMap.get(key) || { quantity: 0, unit: req.unit };
    requestedMap.set(key, {
      quantity: existing.quantity + req.quantity,
      unit: req.unit
    });
  }
  
  // 3. Analyze stock levels and make advice
  const adviceList: any[] = [];
  
  // Seasonal factor (hardcoded for September-November: festival season, multiply by 1.5)
  const currentMonth = new Date().getMonth(); // 0-indexed, 8 is September, 10 is November
  const isFestivalSeason = currentMonth >= 8 && currentMonth <= 10;
  const seasonalMultiplier = isFestivalSeason ? 1.5 : 1.0;
  
  // Define default materials to advise even if not in stock doc yet
  const defaultMaterials = ["रेसम धागा", "सूती धागा", "जरी", "रंगाई सामग्री"];
  const handledMaterials = new Set<string>();
  
  for (const stock of stocks) {
    const material = stock.materialName;
    handledMaterials.add(material);
    
    const pendingReq = requestedMap.get(material) || { quantity: 0, unit: stock.unit };
    const stockQty = stock.totalQuantity;
    const reorderLevel = stock.reorderLevel;
    
    // Logic: stock is low if current stock + pending order is less than reorderLevel OR we have pending requests exceeding stock
    let urgency: 'high' | 'medium' | 'low' = 'low';
    let suggestedQty = 0;
    let reason = '';
    
    if (stockQty <= reorderLevel) {
      urgency = 'high';
      suggestedQty = Math.ceil((reorderLevel * 2 - stockQty + pendingReq.quantity) * seasonalMultiplier);
      reason = isFestivalSeason 
        ? `स्टॉक स्तर (${stockQty} ${stock.unit}) पुन: ऑर्डर स्तर (${reorderLevel} ${stock.unit}) से कम है। त्योहारी सीजन के कारण मांग 1.5 गुना अधिक है।`
        : `स्टॉक स्तर (${stockQty} ${stock.unit}) पुन: ऑर्डर स्तर (${reorderLevel} ${stock.unit}) से कम है। आगामी मांग को पूरा करने के लिए तुरंत आर्डर करें।`;
    } else if (pendingReq.quantity > stockQty) {
      urgency = 'high';
      suggestedQty = Math.ceil((pendingReq.quantity - stockQty + reorderLevel) * seasonalMultiplier);
      reason = `बुनकरों के लंबित अनुरोधों की संख्या (${pendingReq.quantity} ${stock.unit}) वर्तमान स्टॉक (${stockQty} ${stock.unit}) से अधिक है।`;
    } else if (stockQty <= reorderLevel * 2) {
      urgency = 'medium';
      suggestedQty = Math.ceil((reorderLevel * 1.5) * seasonalMultiplier);
      reason = `स्टॉक सुरक्षित स्तर पर है परंतु पुन: ऑर्डर स्तर के निकट पहुंच रहा है। सुचारू उत्पादन के लिए बफर स्टॉक बनाएं।`;
    } else {
      urgency = 'low';
      suggestedQty = 0;
      reason = `स्टॉक पर्याप्त मात्रा में उपलब्ध है (${stockQty} ${stock.unit})। तत्काल खरीद की आवश्यकता नहीं है।`;
    }
    
    if (suggestedQty > 0 || urgency !== 'low') {
      adviceList.push({
        materialName: material,
        stockQuantity: stockQty,
        pendingRequestedQuantity: pendingReq.quantity,
        suggestedQuantity: Math.max(suggestedQty, 5), // Min 5 units
        unit: stock.unit,
        urgency,
        reason
      });
    }
  }
  
  // Handle any default materials that aren't in stock yet but might have pending requests or need to be initialized
  for (const material of defaultMaterials) {
    if (!handledMaterials.has(material)) {
      const pendingReq = requestedMap.get(material);
      if (pendingReq && pendingReq.quantity > 0) {
        adviceList.push({
          materialName: material,
          stockQuantity: 0,
          pendingRequestedQuantity: pendingReq.quantity,
          suggestedQuantity: Math.ceil(pendingReq.quantity * 1.5 * seasonalMultiplier),
          unit: pendingReq.unit,
          urgency: 'high',
          reason: `यह नई सामग्री वर्तमान स्टॉक में नहीं है परंतु बुनकरों ने ${pendingReq.quantity} ${pendingReq.unit} का अनुरोध किया है।`
        });
      }
    }
  }
  
  return adviceList;
}

// ==========================================
// 8. Payment & Reliability Helpers (Stage 5)
// ==========================================

export async function createPayment(payment: Omit<Payment, 'paymentId' | 'createdAt'>): Promise<string> {
  const paymentsRef = collection(db, 'payments');
  const docRef = await addDoc(paymentsRef, {
    ...payment,
    createdAt: new Date().toISOString()
  });
  await updateDoc(docRef, { paymentId: docRef.id });
  return docRef.id;
}

export async function getPaymentsByWeaver(weaverId: string): Promise<Payment[]> {
  const paymentsRef = collection(db, 'payments');
  const q = query(paymentsRef, where('weaverId', '==', weaverId));
  const snap = await getDocs(q);
  const payments: Payment[] = [];
  snap.forEach((doc) => {
    payments.push(doc.data() as Payment);
  });
  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPaymentsByCooperative(cooperativeId: string): Promise<Payment[]> {
  const paymentsRef = collection(db, 'payments');
  const q = query(paymentsRef, where('cooperativeId', '==', cooperativeId));
  const snap = await getDocs(q);
  const payments: Payment[] = [];
  snap.forEach((doc) => {
    payments.push(doc.data() as Payment);
  });
  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateWeaverReliabilityScore(weaverId: string, scoreChange: number): Promise<number> {
  const docRef = doc(db, 'weavers', weaverId);
  const snap = await getDoc(docRef);
  let newScore = 100;
  if (snap.exists()) {
    const data = snap.data();
    const currentScore = typeof data.reliabilityScore === 'number' ? data.reliabilityScore : 100;
    newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
    await updateDoc(docRef, { reliabilityScore: newScore });
  } else {
    newScore = Math.max(0, Math.min(100, 100 + scoreChange));
    await setDoc(docRef, { 
      weaverId, 
      reliabilityScore: newScore,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }
  return newScore;
}

// =============================================================
// 9. Market Linkages, Products, RFQs & Coalitions (Stage 6)
// =============================================================

export async function createProduct(product: Omit<Product, 'productId' | 'createdAt'>): Promise<string> {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...product,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { productId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
  }
}

export async function getProductsByCooperative(cooperativeId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('cooperativeId', '==', cooperativeId));
    const snap = await getDocs(q);
    const products: Product[] = [];
    snap.forEach((doc) => {
      products.push(doc.data() as Product);
    });
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'products');
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const snap = await getDocs(productsRef);
    const products: Product[] = [];
    snap.forEach((doc) => {
      products.push(doc.data() as Product);
    });
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function createProductSubmission(submission: Omit<ProductSubmission, 'submissionId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const submissionsRef = collection(db, 'productSubmissions');
    const docRef = await addDoc(submissionsRef, {
      ...submission,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await updateDoc(docRef, { submissionId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'productSubmissions');
  }
}

export async function getProductSubmissionsByWeaver(weaverId: string): Promise<ProductSubmission[]> {
  try {
    const submissionsRef = collection(db, 'productSubmissions');
    const q = query(submissionsRef, where('weaverId', '==', weaverId));
    const snap = await getDocs(q);
    const submissions: ProductSubmission[] = [];
    snap.forEach((doc) => {
      submissions.push(doc.data() as ProductSubmission);
    });
    return submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'productSubmissions');
  }
}

export async function getProductSubmissionsByCooperative(cooperativeId: string): Promise<ProductSubmission[]> {
  try {
    const submissionsRef = collection(db, 'productSubmissions');
    const q = query(submissionsRef, where('cooperativeId', '==', cooperativeId));
    const snap = await getDocs(q);
    const submissions: ProductSubmission[] = [];
    snap.forEach((doc) => {
      submissions.push(doc.data() as ProductSubmission);
    });
    return submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'productSubmissions');
  }
}

export async function updateProductSubmissionStatus(
  submissionId: string, 
  status: 'approved' | 'rejected', 
  reviewData: { reviewedBy: string; rejectionReason?: string }
): Promise<void> {
  try {
    const docRef = doc(db, 'productSubmissions', submissionId);
    const updates: Partial<ProductSubmission> = {
      status,
      reviewedBy: reviewData.reviewedBy,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (status === 'rejected' && reviewData.rejectionReason) {
      updates.rejectionReason = reviewData.rejectionReason;
    }
    await updateDoc(docRef, updates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `productSubmissions/${submissionId}`);
  }
}

export async function createBuyerRFQ(rfq: Omit<BuyerRFQ, 'rfqId' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const rfqsRef = collection(db, 'buyerRFQs');
    const docRef = await addDoc(rfqsRef, {
      ...rfq,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { rfqId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'buyerRFQs');
  }
}

export async function getBuyerRFQs(buyerId: string): Promise<BuyerRFQ[]> {
  try {
    const rfqsRef = collection(db, 'buyerRFQs');
    const q = query(rfqsRef, where('buyerId', '==', buyerId));
    const snap = await getDocs(q);
    const rfqs: BuyerRFQ[] = [];
    snap.forEach((doc) => {
      rfqs.push(doc.data() as BuyerRFQ);
    });
    return rfqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'buyerRFQs');
  }
}

export async function getAllBuyerRFQs(): Promise<BuyerRFQ[]> {
  try {
    const rfqsRef = collection(db, 'buyerRFQs');
    const snap = await getDocs(rfqsRef);
    const rfqs: BuyerRFQ[] = [];
    snap.forEach((doc) => {
      rfqs.push(doc.data() as BuyerRFQ);
    });
    return rfqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'buyerRFQs');
  }
}

export async function getBuyerRFQById(rfqId: string): Promise<BuyerRFQ | null> {
  try {
    const docRef = doc(db, 'buyerRFQs', rfqId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BuyerRFQ;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `buyerRFQs/${rfqId}`);
  }
}

export async function updateRFQStatus(rfqId: string, status: BuyerRFQ['status'], coalitionId?: string): Promise<void> {
  try {
    const docRef = doc(db, 'buyerRFQs', rfqId);
    const updateData: any = { status };
    if (coalitionId !== undefined) {
      updateData.coalitionId = coalitionId;
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `buyerRFQs/${rfqId}`);
  }
}

export async function createCoalition(coalition: Omit<Coalition, 'coalitionId' | 'createdAt'>): Promise<string> {
  try {
    const coalitionsRef = collection(db, 'coalitions');
    const docRef = await addDoc(coalitionsRef, {
      ...coalition,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { coalitionId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'coalitions');
  }
}

export async function getCoalitionsByRFQ(rfqId: string): Promise<Coalition[]> {
  try {
    const coalitionsRef = collection(db, 'coalitions');
    const q = query(coalitionsRef, where('rfqId', '==', rfqId));
    const snap = await getDocs(q);
    const coalitions: Coalition[] = [];
    snap.forEach((doc) => {
      coalitions.push(doc.data() as Coalition);
    });
    return coalitions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'coalitions');
  }
}

export async function getCoalitionById(coalitionId: string): Promise<Coalition | null> {
  try {
    const docRef = doc(db, 'coalitions', coalitionId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Coalition;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `coalitions/${coalitionId}`);
  }
}

export async function updateCoalitionStatus(coalitionId: string, status: Coalition['status']): Promise<void> {
  try {
    const docRef = doc(db, 'coalitions', coalitionId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `coalitions/${coalitionId}`);
  }
}

export async function addOrUpdateCooperativeQuotaInCoalition(rfqId: string, quota: CooperativeQuota): Promise<Coalition> {
  try {
    const coalitionsRef = collection(db, 'coalitions');
    const q = query(coalitionsRef, where('rfqId', '==', rfqId));
    const snap = await getDocs(q);
    
    let coalition: Coalition;
    
    if (snap.empty) {
      // Create new coalition
      const newCoalition: Omit<Coalition, 'coalitionId' | 'createdAt'> = {
        rfqId,
        cooperativeQuotas: [quota],
        totalQuantity: quota.allocatedQuantity,
        totalQuotePrice: quota.allocatedQuantity * quota.unitPrice,
        status: 'forming'
      };
      const coalitionId = await createCoalition(newCoalition);
      coalition = {
        ...newCoalition,
        coalitionId,
        createdAt: new Date().toISOString()
      };
      
      // Also link coalitionId to RFQ
      await updateRFQStatus(rfqId, 'coalition_formed', coalitionId);
    } else {
      // Update existing coalition
      const existingDoc = snap.docs[0];
      const existingCoalition = existingDoc.data() as Coalition;
      
      const quotas = [...existingCoalition.cooperativeQuotas];
      const index = quotas.findIndex(q => q.cooperativeId === quota.cooperativeId);
      
      if (index >= 0) {
        quotas[index] = quota;
      } else {
        quotas.push(quota);
      }
      
      const totalQuantity = quotas.reduce((sum, q) => sum + q.allocatedQuantity, 0);
      const totalQuotePrice = quotas.reduce((sum, q) => sum + (q.allocatedQuantity * q.unitPrice), 0);
      
      const docRef = doc(db, 'coalitions', existingCoalition.coalitionId);
      await updateDoc(docRef, {
        cooperativeQuotas: quotas,
        totalQuantity,
        totalQuotePrice
      });
      
      coalition = {
        ...existingCoalition,
        cooperativeQuotas: quotas,
        totalQuantity,
        totalQuotePrice
      };
    }
    
    return coalition;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'coalitions');
  }
}

export async function submitCoalitionQuote(coalitionId: string): Promise<void> {
  try {
    const coalition = await getCoalitionById(coalitionId);
    if (!coalition) throw new Error("Coalition not found");
    
    await updateCoalitionStatus(coalitionId, 'submitted');
    await updateRFQStatus(coalition.rfqId, 'quote_submitted');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'coalitions');
  }
}

export async function createProductInstance(instance: Omit<ProductInstance, 'instanceId' | 'createdAt' | 'qrCodeData'>): Promise<string> {
  try {
    const instancesRef = collection(db, 'productInstances');
    const docRef = await addDoc(instancesRef, {
      ...instance,
      createdAt: new Date().toISOString()
    });
    const qrCodeData = `${window.location.origin}/trace/${docRef.id}`;
    await updateDoc(docRef, { 
      instanceId: docRef.id,
      qrCodeData
    });
    
    // If there is a product linked, update its hasTraceability field
    if (instance.productId) {
      try {
        const productRef = doc(db, 'products', instance.productId);
        await updateDoc(productRef, { hasTraceability: true });
      } catch (err) {
        console.error('Failed to update product hasTraceability:', err);
      }
    }
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'productInstances');
  }
}

export async function getProductInstanceById(instanceId: string): Promise<ProductInstance | null> {
  try {
    const docRef = doc(db, 'productInstances', instanceId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ProductInstance;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `productInstances/${instanceId}`);
  }
}

export async function getProductInstancesByCooperative(cooperativeId: string): Promise<ProductInstance[]> {
  try {
    const instancesRef = collection(db, 'productInstances');
    const q = query(instancesRef, where('cooperativeId', '==', cooperativeId));
    const snap = await getDocs(q);
    const instances: ProductInstance[] = [];
    snap.forEach((doc) => {
      instances.push(doc.data() as ProductInstance);
    });
    return instances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'productInstances');
  }
}

export async function getAllProductInstances(): Promise<ProductInstance[]> {
  try {
    const instancesRef = collection(db, 'productInstances');
    const snap = await getDocs(instancesRef);
    const instances: ProductInstance[] = [];
    snap.forEach((doc) => {
      instances.push(doc.data() as ProductInstance);
    });
    return instances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'productInstances');
  }
}

export async function markWeaverAttendance(weaverId: string, cooperativeId: string): Promise<string> {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where('weaverId', '==', weaverId), where('dateStr', '==', dateStr));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      return snap.docs[0].id;
    }
    
    const docRef = doc(attendanceRef);
    const attendanceId = docRef.id;
    const attendanceData = {
      attendanceId,
      weaverId,
      cooperativeId,
      timestamp: serverTimestamp(),
      dateStr
    };
    
    await setDoc(docRef, attendanceData);
    return attendanceId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'attendance');
    throw error;
  }
}

export async function getWeaverAttendanceToday(weaverId: string): Promise<boolean> {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef, where('weaverId', '==', weaverId), where('dateStr', '==', dateStr));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'attendance');
    return false;
  }
}

// Seed the govt schemes database if empty
export async function seedGovtSchemes(): Promise<void> {
  try {
    const schemesRef = collection(db, 'govtSchemes');
    const q = query(schemesRef);
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.log("Seeding government schemes database...");
      const initialSchemes: GovtScheme[] = [
        {
          schemeId: "ihb",
          name: "India Handloom Brand (IHB)",
          description: "Promotes high-quality handloom products with unique designs, authentic raw materials, and social compliance, giving weavers premium market access.",
          eligibilityCriteria: {
            minMembers: null,
            minAnnualProduction: 100,
            requiredCertifications: ["handloomMark"],
            cooperativeType: null
          },
          benefits: "Premium branding, marketing assistance in domestic and international exhibitions, and direct buyer trust.",
          applyLink: "https://www.indiahandloombrand.gov.in/",
          isActive: true
        },
        {
          schemeId: "gem",
          name: "GeM Registration for Handloom",
          description: "Facilitates direct online sale of handloom products to government departments, agencies, and public sector undertakings.",
          eligibilityCriteria: {
            minMembers: 10,
            minAnnualProduction: null,
            requiredCertifications: ["udyamRegistration"],
            cooperativeType: "cooperative society"
          },
          benefits: "Direct government procurement channels, automated matching with government tenders, and no intermediary transaction fees.",
          applyLink: "https://gem.gov.in/",
          isActive: true
        },
        {
          schemeId: "mudra",
          name: "MUDRA Loan for Weavers",
          description: "Provides easy and subsidized working capital and term loans to individual weavers and handloom cooperative organizations.",
          eligibilityCriteria: {
            minMembers: null,
            minAnnualProduction: null,
            requiredCertifications: ["handloomMark"],
            cooperativeType: null
          },
          benefits: "Subsidized loans up to ₹10 Lakhs, interest subvention of 6%, and margin money assistance up to ₹10,000.",
          applyLink: "https://www.mudra.org.in/",
          isActive: true
        },
        {
          schemeId: "nhdp",
          name: "NHDP – Handloom Cluster Development",
          description: "National Handloom Development Programme to set up infrastructure and common facilities for weaver clusters.",
          eligibilityCriteria: {
            minMembers: 20,
            minAnnualProduction: 500,
            requiredCertifications: [],
            cooperativeType: "cooperative society"
          },
          benefits: "Financial assistance up to ₹2.00 Crore for Common Facility Centers (CFC), design studios, and specialized looms.",
          applyLink: "https://handlooms.nic.in/",
          isActive: true
        },
        {
          schemeId: "pm_vishwakarma",
          name: "PM Vishwakarma Scheme",
          description: "Central scheme supporting traditional artisans with skill training, toolkit incentives, and subsidized credit.",
          eligibilityCriteria: {
            minMembers: null,
            minAnnualProduction: null,
            requiredCertifications: [],
            cooperativeType: null
          },
          benefits: "₹15,000 toolkit voucher, 5-day basic skill training with ₹500/day stipend, and interest-subsidized credit support up to ₹3,000,000.",
          applyLink: "https://pmvishwakarma.gov.in/",
          isActive: true
        }
      ];
      
      for (const scheme of initialSchemes) {
        await setDoc(doc(db, 'govtSchemes', scheme.schemeId), scheme);
      }
      console.log("Government schemes database seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed government schemes:", error);
  }
}

// Fetch all government schemes
export async function getGovtSchemes(): Promise<GovtScheme[]> {
  try {
    const schemesRef = collection(db, 'govtSchemes');
    const q = query(schemesRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const schemes: GovtScheme[] = [];
    querySnapshot.forEach((doc) => {
      schemes.push(doc.data() as GovtScheme);
    });
    return schemes;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'govtSchemes');
    return [];
  }
}

// Fetch single cooperative details
export async function getCooperative(cooperativeId: string): Promise<Cooperative | null> {
  try {
    const docRef = doc(db, 'cooperatives', cooperativeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Cooperative;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `cooperatives/${cooperativeId}`);
    return null;
  }
}

// Update cooperative certifications
export async function updateCooperativeCertifications(cooperativeId: string, certifications: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'cooperatives', cooperativeId);
    await updateDoc(docRef, { certifications });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `cooperatives/${cooperativeId}`);
    throw error;
  }
}



