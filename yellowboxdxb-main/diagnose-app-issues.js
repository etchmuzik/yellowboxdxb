#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 YELLOW BOX APP DIAGNOSTIC REPORT');
console.log('=====================================\n');

// Check if we're in the right directory
const currentDir = process.cwd();
console.log(`📁 Current Directory: ${currentDir}`);

// Check for key files
const keyFiles = [
  'package.json',
  'src/App.tsx',
  'src/pages/Riders.tsx',
  'src/pages/Expenses.tsx',
  'src/components/EnhancedRiderForm.tsx',
  'src/services/simpleFirebaseService.ts',
  '.env'
];

console.log('\n📋 KEY FILES CHECK:');
keyFiles.forEach(file => {
  const exists = fs.existsSync(path.join(currentDir, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check .env file content
console.log('\n🔧 ENVIRONMENT CONFIGURATION:');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  requiredVars.forEach(varName => {
    const found = envLines.find(line => line.startsWith(varName));
    if (found) {
      const value = found.split('=')[1];
      console.log(`✅ ${varName}: ${value ? 'SET' : 'EMPTY'}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
    }
  });
} catch (error) {
  console.log('❌ .env file not readable:', error.message);
}

// Check package.json dependencies
console.log('\n📦 DEPENDENCIES CHECK:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'firebase',
    'react',
    'react-dom',
    'react-router-dom',
    '@tanstack/react-query'
  ];
  
  requiredDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`${version ? '✅' : '❌'} ${dep}: ${version || 'MISSING'}`);
  });
} catch (error) {
  console.log('❌ package.json not readable:', error.message);
}

// Check if node_modules exists
console.log('\n🗂️  NODE_MODULES CHECK:');
const nodeModulesExists = fs.existsSync('node_modules');
console.log(`${nodeModulesExists ? '✅' : '❌'} node_modules directory`);

if (nodeModulesExists) {
  const firebaseExists = fs.existsSync('node_modules/firebase');
  const reactExists = fs.existsSync('node_modules/react');
  console.log(`${firebaseExists ? '✅' : '❌'} Firebase installed`);
  console.log(`${reactExists ? '✅' : '❌'} React installed`);
}

// Check build/dist directory
console.log('\n🏗️  BUILD CHECK:');
const distExists = fs.existsSync('dist');
console.log(`${distExists ? '✅' : '❌'} dist directory (built app)`);

// Check for common issues
console.log('\n🚨 COMMON ISSUES CHECK:');

// Check if there are TypeScript errors in key files
const checkTypeScriptFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasImportErrors = content.includes('Cannot find module') || content.includes('Module not found');
    const hasSyntaxErrors = content.includes('SyntaxError') || content.includes('Unexpected token');
    return { hasImportErrors, hasSyntaxErrors, content };
  } catch (error) {
    return { error: error.message };
  }
};

const riderPageCheck = checkTypeScriptFile('src/pages/Riders.tsx');
if (riderPageCheck.error) {
  console.log('❌ Riders.tsx: Cannot read file');
} else {
  console.log(`${riderPageCheck.hasImportErrors ? '❌' : '✅'} Riders.tsx: Import errors`);
  console.log(`${riderPageCheck.hasSyntaxErrors ? '❌' : '✅'} Riders.tsx: Syntax errors`);
}

// Check if the service is properly importing Firebase
const serviceCheck = checkTypeScriptFile('src/services/simpleFirebaseService.ts');
if (serviceCheck.error) {
  console.log('❌ simpleFirebaseService.ts: Cannot read file');
} else {
  console.log(`${serviceCheck.hasImportErrors ? '❌' : '✅'} simpleFirebaseService.ts: Import errors`);
  console.log(`${serviceCheck.hasSyntaxErrors ? '❌' : '✅'} simpleFirebaseService.ts: Syntax errors`);
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('1. Run: npm install (if node_modules missing)');
console.log('2. Run: npm run dev (to start development server)');
console.log('3. Check browser console for runtime errors');
console.log('4. Verify Firebase project is active and accessible');
console.log('5. Test Firebase connection with simple operations');

console.log('\n✨ DIAGNOSTIC COMPLETE');