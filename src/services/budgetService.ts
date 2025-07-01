
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import { Budget } from "../types";

const COLLECTION = "budgets";

export const getBudgets = async (): Promise<Budget[]> => {
  const budgetsSnapshot = await getDocs(collection(db, COLLECTION));
  return budgetsSnapshot.docs.map(doc => ({ 
    ...doc.data(), 
    id: doc.id 
  }) as Budget);
};

export const getCurrentBudget = async (): Promise<Budget | null> => {
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  
  const budgetsRef = collection(db, COLLECTION);
  const q = query(budgetsRef, where("month", "==", currentMonth));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const budgetDoc = querySnapshot.docs[0];
    return { 
      ...budgetDoc.data(),
      id: budgetDoc.id
    } as Budget;
  }
  return null;
};

export const getBudgetByMonth = async (month: string): Promise<Budget | null> => {
  const budgetsRef = collection(db, COLLECTION);
  const q = query(budgetsRef, where("month", "==", month));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const budgetDoc = querySnapshot.docs[0];
    return { 
      ...budgetDoc.data(),
      id: budgetDoc.id
    } as Budget;
  }
  return null;
};

export const createOrUpdateBudget = async (month: string, allocatedAed: number): Promise<Budget> => {
  const existingBudget = await getBudgetByMonth(month);
  
  if (existingBudget) {
    await updateDoc(doc(db, COLLECTION, existingBudget.id), { allocatedAed });
    return { ...existingBudget, allocatedAed };
  } else {
    const newBudget: Omit<Budget, "id"> = {
      month,
      allocatedAed,
      spentAed: 0
    };
    
    const newBudgetRef = doc(collection(db, COLLECTION));
    await setDoc(newBudgetRef, newBudget);
    
    return { 
      ...newBudget, 
      id: newBudgetRef.id
    } as Budget;
  }
};

export const updateBudgetSpent = async (month: string, spentAed: number): Promise<void> => {
  const existingBudget = await getBudgetByMonth(month);
  
  if (existingBudget) {
    await updateDoc(doc(db, COLLECTION, existingBudget.id), { spentAed });
  } else {
    throw new Error(`Budget for month ${month} not found`);
  }
};
