import { getWeaversByCooperative, getJobCardsByCooperative } from '../firebase/firestore';

/**
 * Calculates the available capacity for a cooperative up to a given deadline.
 * 
 * Formula:
 * 1. Sum dailyCapacity of all weavers in the cooperative.
 * 2. Multiply by working days from today to deadline.
 * 3. Subtract the quantity of active job cards ('assigned' or 'in_progress').
 * 4. Return the floor, minimum 0.
 */
export async function calculateCooperativeCapacity(cooperativeId: string, deadlineStr: string): Promise<number> {
  if (!deadlineStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  
  if (isNaN(deadline.getTime()) || deadline.getTime() < today.getTime()) {
    return 0;
  }
  
  // Calculate days from today to deadline
  const timeDiff = deadline.getTime() - today.getTime();
  const daysDiff = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  
  // Get all weavers of that cooperative
  const weavers = await getWeaversByCooperative(cooperativeId);
  const totalDailyCapacity = weavers.reduce((sum, w) => sum + (Number(w.dailyCapacity) || 0), 0);
  
  // Total potential capacity over this timeframe
  const potentialCapacity = totalDailyCapacity * daysDiff;
  
  // Get all active job cards (used capacity)
  const jobCards = await getJobCardsByCooperative(cooperativeId);
  const activeJobCards = jobCards.filter(jc => jc.status === 'assigned' || jc.status === 'in_progress');
  const usedCapacity = activeJobCards.reduce((sum, jc) => sum + (Number(jc.quantity) || 0), 0);
  
  return Math.max(0, Math.floor(potentialCapacity - usedCapacity));
}
