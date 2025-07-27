#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 Bundle Size Analysis');
console.log('======================');

const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Get all JS files in dist/assets
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ assets directory not found in dist.');
  process.exit(1);
}

const files = fs.readdirSync(assetsPath)
  .filter(file => file.endsWith('.js'))
  .map(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
    };
  })
  .sort((a, b) => b.size - a.size);

console.log('\n📦 JavaScript Bundle Analysis:');
console.log('================================');

let totalSize = 0;
const warningThreshold = 600 * 1024; // 600KB
const errorThreshold = 1000 * 1024; // 1MB

files.forEach((file, index) => {
  totalSize += file.size;
  
  let status = '✅';
  if (file.size > errorThreshold) {
    status = '🔴';
  } else if (file.size > warningThreshold) {
    status = '⚠️';
  }
  
  console.log(`${status} ${file.name}`);
  console.log(`   Size: ${file.sizeKB} KB (${file.sizeMB} MB)`);
  
  // Try to identify chunk type from filename
  let chunkType = 'Unknown';
  if (file.name.includes('react-vendor') || file.name.includes('react-core')) {
    chunkType = 'React Core';
  } else if (file.name.includes('firebase')) {
    chunkType = 'Firebase';
  } else if (file.name.includes('radix')) {
    chunkType = 'Radix UI';
  } else if (file.name.includes('vendor')) {
    chunkType = 'Third-party Libraries';
  } else if (file.name.includes('index')) {
    chunkType = 'Application Code';
  } else if (file.name.includes('router')) {
    chunkType = 'React Router';
  } else if (file.name.includes('charts')) {
    chunkType = 'Charts/Visualization';
  } else if (file.name.includes('maps')) {
    chunkType = 'Google Maps';
  }
  
  console.log(`   Type: ${chunkType}`);
  console.log('');
});

console.log('📈 Summary:');
console.log('===========');
console.log(`Total JS Size: ${Math.round(totalSize / 1024)} KB (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Number of chunks: ${files.length}`);

const largeChunks = files.filter(f => f.size > warningThreshold);
if (largeChunks.length > 0) {
  console.log(`\n⚠️  Large chunks (>600KB): ${largeChunks.length}`);
  largeChunks.forEach(chunk => {
    console.log(`   - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
}

const veryLargeChunks = files.filter(f => f.size > errorThreshold);
if (veryLargeChunks.length > 0) {
  console.log(`\n🔴 Very large chunks (>1MB): ${veryLargeChunks.length}`);
  veryLargeChunks.forEach(chunk => {
    console.log(`   - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
}

// Recommendations
console.log('\n💡 Optimization Recommendations:');
console.log('=================================');

if (veryLargeChunks.length > 0) {
  console.log('🔴 Critical: Very large chunks detected');
  console.log('   - Consider lazy loading these components');
  console.log('   - Split large libraries into smaller chunks');
  console.log('   - Use dynamic imports for heavy features');
}

if (largeChunks.length > 0) {
  console.log('⚠️  Warning: Large chunks detected');
  console.log('   - Review manual chunk configuration');
  console.log('   - Consider code splitting for large features');
}

if (totalSize > 2 * 1024 * 1024) { // 2MB
  console.log('📦 Total bundle size is large');
  console.log('   - Implement lazy loading for routes');
  console.log('   - Use tree shaking to remove unused code');
  console.log('   - Consider removing unused dependencies');
}

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Implement lazy loading for large components');
console.log('2. Use React.lazy() for route-based code splitting');
console.log('3. Analyze and remove unused dependencies');
console.log('4. Consider using lighter alternatives for heavy libraries');

// Check for CSS files too
const cssFiles = fs.readdirSync(assetsPath)
  .filter(file => file.endsWith('.css'))
  .map(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024)
    };
  });

if (cssFiles.length > 0) {
  console.log('\n🎨 CSS Bundle Analysis:');
  console.log('=======================');
  
  let totalCSSSize = 0;
  cssFiles.forEach(file => {
    totalCSSSize += file.size;
    console.log(`📄 ${file.name}: ${file.sizeKB} KB`);
  });
  
  console.log(`\nTotal CSS Size: ${Math.round(totalCSSSize / 1024)} KB`);
}