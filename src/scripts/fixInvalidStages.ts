import { db } from '../config/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ApplicationStage } from '../types';

/**
 * Migration script to fix invalid applicationStage values in production
 * This script should be run once to clean up any invalid data
 */
export async function fixInvalidApplicationStages() {
  console.log('Starting migration to fix invalid application stages...');
  
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
        
        console.log(`Fixing rider ${riderDoc.id}: "${currentStage}" -> "${newStage}"`);
        
        // Update the document
        await updateDoc(doc(db, 'riders', riderDoc.id), {
          applicationStage: newStage,
          updatedAt: new Date().toISOString()
        });
        
        fixedCount++;
      }
    }
    
    console.log(`Migration completed!`);
    console.log(`Total riders checked: ${totalCount}`);
    console.log(`Riders fixed: ${fixedCount}`);
    
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
  console.log('Checking for invalid application stages (dry run)...');
  
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
      console.log('No invalid application stages found!');
    } else {
      console.log(`Found ${invalidRiders.length} riders with invalid stages:`);
      invalidRiders.forEach(rider => {
        console.log(`- ${rider.name} (${rider.id}): "${rider.stage}"`);
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