import { db } from '../config/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ApplicationStage } from '../types';

/**
 * Migration script to fix invalid applicationStage values in production
 * This script should be run once to clean up any invalid data
 */
export async function fixInvalidApplicationStages() {
  
  const validStages: ApplicationStage[] = [
    'Applied', 'Docs Verified', 'Theory Test', 'Road Test', 
    'Medical', 'ID Issued', 'Active'
  ];
  
  // Mapping of known invalid values to valid ones
  const stageMapping: Record<string, ApplicationStage> = {
    'Documents': 'Docs Verified',
    'Training': 'Theory Test',
    'Document': 'Docs Verified',
    'document': 'Docs Verified',
    'documents': 'Docs Verified',
    'training': 'Theory Test',
    'Train': 'Theory Test',
    'train': 'Theory Test'
  };
  
  try {
    // Get all riders
    const ridersSnapshot = await getDocs(collection(db, 'riders'));
    let fixedCount = 0;
    let totalCount = 0;
    
    for (const riderDoc of ridersSnapshot.docs) {
      totalCount++;
      const data = riderDoc.data();
      const currentStage = data.applicationStage;
      
      // Check if the current stage is invalid
      if (!validStages.includes(currentStage)) {
        let newStage: ApplicationStage = 'Applied'; // Default fallback
        
        // Check if we have a mapping for this invalid value
        if (stageMapping[currentStage]) {
          newStage = stageMapping[currentStage];
        }

        // Update the document
        await updateDoc(doc(db, 'riders', riderDoc.id), {
          applicationStage: newStage,
          updatedAt: new Date().toISOString()
        });
        
        fixedCount++;
      }
    }

    return {
      success: true,
      totalChecked: totalCount,
      totalFixed: fixedCount
    };
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Function to run a dry-run (check without updating)
export async function checkInvalidApplicationStages() {
  
  const validStages: ApplicationStage[] = [
    'Applied', 'Docs Verified', 'Theory Test', 'Road Test', 
    'Medical', 'ID Issued', 'Active'
  ];
  
  try {
    const ridersSnapshot = await getDocs(collection(db, 'riders'));
    const invalidRiders: Array<{id: string, name: string, stage: string}> = [];
    
    for (const riderDoc of ridersSnapshot.docs) {
      const data = riderDoc.data();
      const currentStage = data.applicationStage;
      
      if (!validStages.includes(currentStage)) {
        invalidRiders.push({
          id: riderDoc.id,
          name: data.fullName || 'Unknown',
          stage: currentStage
        });
      }
    }
    
    if (invalidRiders.length === 0) {
    } else {
      invalidRiders.forEach(rider => {
      });
    }
    
    return invalidRiders;
  } catch (error) {
    console.error('Error checking riders:', error);
    throw error;
  }
}

// To use from browser console:
// 1. First check what needs to be fixed:
//    await checkInvalidApplicationStages()
// 2. Then run the fix:
//    await fixInvalidApplicationStages()