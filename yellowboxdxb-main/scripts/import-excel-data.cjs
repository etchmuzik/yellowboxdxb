#!/usr/bin/env node

/**
 * Import Real Yellowbox Data from Excel to Supabase
 * Usage: node scripts/import-excel-data.js
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://31.97.59.237:5557';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2Mjk0OTUyMCwiZXhwIjo0OTE4NjIzMTIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.egBHx9jZuMab5vccj3CX_H9YPPp_1VK12ahDQl8dgTY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Excel file path
const EXCEL_FILE = '/Users/etch/Downloads/YELLOWBOX OB .xlsx';

// Helper: Convert Excel date number to JS Date
function excelDateToJSDate(excelDate) {
  if (!excelDate || isNaN(excelDate)) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

// Helper: Convert Excel time to HH:MM:SS
function excelTimeToTime(excelTime) {
  if (!excelTime || isNaN(excelTime)) return null;
  const totalSeconds = Math.round(excelTime * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function main() {
  console.log('📊 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);

  // Import Riders Data
  console.log('\n👥 Importing RIDERS DATA...');
  const ridersSheet = workbook.Sheets['RIDERS DATA'];
  const ridersData = XLSX.utils.sheet_to_json(ridersSheet);

  const riders = ridersData
    .filter(row => row.NAME) // Skip empty rows
    .map(row => ({
      talabat_id: row['TALABAT ID'] ? String(row['TALABAT ID']) : null,
      keeta_id: row['KEETA ID'] || null,
      name: row.NAME,
      nationality: row.NATIONALITY || null,
      email: row.EMAIL || null,
      company_phone: row['C PHONE NO'] ? String(row['C PHONE NO']) : null,
      personal_phone: row['P PHONE NO'] ? String(row['P PHONE NO']) : null,
      eid_number: row.EID ? String(row.EID) : null,
      passport_number: row.PASSPORT || null,
      license_number: row['LICENSE NO'] ? String(row['LICENSE NO']) : null,
      zone: row.ZONE || null,
      bike_number: row.BIKE || null,
      joining_date: excelDateToJSDate(row['JONIG DATE']),
      offboarding_date: excelDateToJSDate(row[' Offboarding Date']),
      doc_folder_name: row['DOC FILE'] || null,
      status: row[' Offboarding Date'] ? 'offboarded' : 'active'
    }));

  console.log(`  Found ${riders.length} riders`);

  const { data: insertedRiders, error: ridersError } = await supabase
    .from('riders')
    .insert(riders)
    .select();

  if (ridersError) {
    console.error('  ❌ Error:', ridersError.message);
  } else {
    console.log(`  ✅ Imported ${insertedRiders.length} riders`);
  }

  // Import Onboarding Applications
  console.log('\n📋 Importing ONBOARDING APPLICATIONS...');
  const obSheet = workbook.Sheets['OB'];
  const obData = XLSX.utils.sheet_to_json(obSheet);

  const onboarding = obData
    .filter(row => row.Name)
    .map(row => ({
      timestamp: excelDateToJSDate(row.Timestamp),
      email_address: row['Email Address'] || null,
      fp_name: row['FP Name'] || 'Yellow Box Delivery Services LLC',
      application_date: excelDateToJSDate(row.Date),
      name: row.Name,
      emirates_id: row['Emirates ID number'] || null,
      nationality: row.Nationality || null,
      city: row.City || null,
      date_of_birth: excelDateToJSDate(row['Date of Birth']),
      age: row.Age || null,
      applicant_category: row['Applicant category'] || null,
      application_status: row['Application Status'] || 'Pending',
      remarks: row.Remarks || null,
      reason: row.Reason || null,
      onboarded_date: excelDateToJSDate(row['Onboarded Date']),
      rider_id: row['Rider ID'] ? String(row['Rider ID']) : null,
      alloted_training_date: excelDateToJSDate(row['Alloted Training Date']),
      alloted_training_slot: excelTimeToTime(row['Alloted Training Slot']),
      trainer_name: row['Trainer Name'] || null,
      actual_training_date: excelDateToJSDate(row['Actual Training Date']),
      test_results: row['Test Results'] || 'Pending'
    }));

  console.log(`  Found ${onboarding.length} onboarding records`);

  const { data: insertedOB, error: obError } = await supabase
    .from('onboarding_applications')
    .insert(onboarding)
    .select();

  if (obError) {
    console.error('  ❌ Error:', obError.message);
  } else {
    console.log(`  ✅ Imported ${insertedOB.length} onboarding applications`);
  }

  // Import Terminations
  console.log('\n🚫 Importing TERMINATIONS...');
  const offboardingSheet = workbook.Sheets['Offboarding'];
  const cancelSheet = workbook.Sheets['CANCEL'];
  const offboardingData = XLSX.utils.sheet_to_json(offboardingSheet).slice(1); // Skip header row
  const cancelData = XLSX.utils.sheet_to_json(cancelSheet);

  const terminations = [
    ...offboardingData.map(row => ({
      rider_id: row['TERMINATION DATA'] || null,
      name: row.__EMPTY || null,
      fleet_partner: row.__EMPTY_1 || 'Yellow Box Delivery Services LLC (Dubai)',
      termination_month: row.__EMPTY_2 || null,
      deactivation_date: excelDateToJSDate(row.__EMPTY_3),
      primary_reason: row.__EMPTY_4 || null,
      status: 'completed'
    })),
    ...cancelData.map(row => ({
      rider_id: row.rider_id || null,
      name: row.NAME || null,
      eid_number: row.EID ? String(row.EID) : null,
      deactivation_date: excelDateToJSDate(row['Deactivation Date']),
      primary_reason: row['Primary Reason'] || null,
      status: 'completed'
    }))
  ].filter(row => row.deactivation_date); // Only import rows with dates

  console.log(`  Found ${terminations.length} termination records`);

  const { data: insertedTerminations, error: termError } = await supabase
    .from('terminations')
    .insert(terminations)
    .select();

  if (termError) {
    console.error('  ❌ Error:', termError.message);
  } else {
    console.log(`  ✅ Imported ${insertedTerminations.length} terminations`);
  }

  // Import Platform Migrations
  console.log('\n🔄 Importing PLATFORM MIGRATIONS...');
  const migrationSheet = workbook.Sheets['TALABAT TO KEETA'];
  const migrationData = XLSX.utils.sheet_to_json(migrationSheet);

  const migrations = migrationData.map(row => ({
    talabat_id: row['TALABAT ID'] ? String(row['TALABAT ID']) : null,
    keeta_id: row['KEETA ID'] ? String(row['KEETA ID']) : null,
    rider_name: row['RIDER NAME'] || null,
    status: 'completed'
  })).filter(row => row.talabat_id && row.keeta_id);

  console.log(`  Found ${migrations.length} migration records`);

  const { data: insertedMigrations, error: migError } = await supabase
    .from('platform_migrations')
    .insert(migrations)
    .select();

  if (migError) {
    console.error('  ❌ Error:', migError.message);
  } else {
    console.log(`  ✅ Imported ${insertedMigrations.length} platform migrations`);
  }

  // Import New Hires
  console.log('\n📝 Importing NEW HIRES...');
  const hiringSheet = workbook.Sheets['New Hiring'];
  const hiringData = XLSX.utils.sheet_to_json(hiringSheet);

  const newHires = hiringData.map(row => ({
    name: Object.keys(row)[0] ? row[Object.keys(row)[0]] : null, // First column
    phone: Object.values(row)[1] || null, // Second column
    expected_joining_date: excelDateToJSDate(Object.values(row)[2]),
    status: 'pending'
  })).filter(row => row.name);

  if (newHires.length > 0) {
    console.log(`  Found ${newHires.length} new hire records`);

    const { data: insertedHires, error: hireError } = await supabase
      .from('new_hires')
      .insert(newHires)
      .select();

    if (hireError) {
      console.error('  ❌ Error:', hireError.message);
    } else {
      console.log(`  ✅ Imported ${insertedHires.length} new hires`);
    }
  } else {
    console.log('  ℹ️  No new hires to import');
  }

  console.log('\n✅ Data import completed!');
  console.log('\n📊 Summary:');
  console.log(`  - Riders: ${insertedRiders?.length || 0}`);
  console.log(`  - Onboarding: ${insertedOB?.length || 0}`);
  console.log(`  - Terminations: ${insertedTerminations?.length || 0}`);
  console.log(`  - Platform Migrations: ${insertedMigrations?.length || 0}`);
  console.log(`  - New Hires: ${newHires.length || 0}`);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
