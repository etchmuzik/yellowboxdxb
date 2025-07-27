#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  excludePatterns: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
  preserveErrors: true, // Keep console.error statements for production error tracking
  preserveWarnings: false, // Remove console.warn statements
};

// Statistics
let stats = {
  filesProcessed: 0,
  consoleLogs: 0,
  consoleErrors: 0,
  consoleWarns: 0,
  consoleOthers: 0,
  removed: 0,
  preserved: 0,
};

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count different types of console statements
    const logMatches = content.match(/console\.log\(/g) || [];
    const errorMatches = content.match(/console\.error\(/g) || [];
    const warnMatches = content.match(/console\.warn\(/g) || [];
    const otherMatches = content.match(/console\.(info|debug|trace|table|dir)\(/g) || [];
    
    stats.consoleLogs += logMatches.length;
    stats.consoleErrors += errorMatches.length;
    stats.consoleWarns += warnMatches.length;
    stats.consoleOthers += otherMatches.length;
    
    // Remove console.log statements
    content = content.replace(/^\s*console\.log\(.*?\);?\s*$/gm, '');
    content = content.replace(/console\.log\(.*?\);?/g, '');
    
    // Remove console.warn if configured
    if (!config.preserveWarnings) {
      content = content.replace(/^\s*console\.warn\(.*?\);?\s*$/gm, '');
      content = content.replace(/console\.warn\(.*?\);?/g, '');
      stats.removed += warnMatches.length;
    } else {
      stats.preserved += warnMatches.length;
    }
    
    // Remove other console methods
    content = content.replace(/^\s*console\.(info|debug|trace|table|dir)\(.*?\);?\s*$/gm, '');
    content = content.replace(/console\.(info|debug|trace|table|dir)\(.*?\);?/g, '');
    
    stats.removed += logMatches.length + otherMatches.length;
    
    // Preserve console.error if configured
    if (config.preserveErrors) {
      stats.preserved += errorMatches.length;
    } else {
      content = content.replace(/^\s*console\.error\(.*?\);?\s*$/gm, '');
      content = content.replace(/console\.error\(.*?\);?/g, '');
      stats.removed += errorMatches.length;
    }
    
    // Clean up empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesProcessed++;
      console.log(`✓ Processed: ${path.relative(config.srcDir, filePath)}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  console.log('Yellow Box Console Cleanup Tool');
  console.log('================================\n');
  
  // Find all files to process
  const files = [];
  config.patterns.forEach(pattern => {
    const matches = glob.sync(path.join(config.srcDir, pattern), {
      ignore: config.excludePatterns.map(p => path.join(config.srcDir, p))
    });
    files.push(...matches);
  });
  
  console.log(`Found ${files.length} files to scan...\n`);
  
  // Process each file
  files.forEach(processFile);
  
  // Report results
  console.log('\n================================');
  console.log('Console Cleanup Summary:');
  console.log('================================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`\nConsole statements found:`);
  console.log(`  console.log:   ${stats.consoleLogs}`);
  console.log(`  console.error: ${stats.consoleErrors}`);
  console.log(`  console.warn:  ${stats.consoleWarns}`);
  console.log(`  Others:        ${stats.consoleOthers}`);
  console.log(`\nActions taken:`);
  console.log(`  Removed: ${stats.removed}`);
  console.log(`  Preserved: ${stats.preserved} (console.error statements)`);
  console.log('\n✅ Console cleanup completed!');
  
  // Update task completion
  const completionLog = path.join(__dirname, '..', 'logs', 'task-001-completion.log');
  const logEntry = `[${new Date().toISOString()}] TASK-001 COMPLETED: Removed ${stats.removed} console statements, preserved ${stats.preserved} error logs\n`;
  fs.appendFileSync(completionLog, logEntry);
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.log('Installing required dependency...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('Dependency installed. Please run the script again.');
}