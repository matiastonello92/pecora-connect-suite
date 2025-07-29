#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function analyzeCodeDuplication() {
  const srcDir = 'src';
  let totalLines = 0;
  let duplicateLines = 0;
  const patterns = {
    loading: {
      regex: /(const\s+\[\s*\w*[Ll]oading\w*,\s*set\w*[Ll]oading\w*\]\s*=\s*useState|<Loader2\s+className="[^"]*animate-spin)/g,
      count: 0,
      lines: 0
    },
    toast: {
      regex: /(toast\(\s*\{[^}]*variant:\s*"destructive"|toast\(\s*\{[^}]*title:[^}]*description:)/g,
      count: 0,
      lines: 0
    },
    form: {
      regex: /(const\s+form\s*=\s*useForm[^;]+zodResolver|const\s+\[\s*\w*[Ss]ubmitting\w*,\s*set\w*[Ss]ubmitting\w*\]\s*=\s*useState)/g,
      count: 0,
      lines: 0
    },
    error: {
      regex: /(const\s+\[\s*\w*[Ee]rror\w*,\s*set\w*[Ee]rror\w*\]\s*=\s*useState|try\s*\{[^}]*\}\s*catch)/g,
      count: 0,
      lines: 0
    },
    auth: {
      regex: /(const\s+\{\s*user,\s*profile\s*\}\s*=\s*useSimpleAuth|if\s*\(\s*!user\s*\)|useAuthGuard)/g,
      count: 0,
      lines: 0
    }
  };

  function scanFiles(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.')) {
        scanFiles(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        totalLines += lines.length;
        
        // Check for patterns
        Object.keys(patterns).forEach(key => {
          const matches = content.match(patterns[key].regex);
          if (matches) {
            patterns[key].count += matches.length;
            patterns[key].lines += matches.length * 2; // Estimate 2 lines per match
            duplicateLines += matches.length * 2;
          }
        });
      }
    });
  }

  scanFiles(srcDir);
  
  const duplicationPercentage = ((duplicateLines / totalLines) * 100).toFixed(1);
  
  console.log('\n🔍 Quick Code Duplication Analysis');
  console.log('=====================================');
  console.log(`📁 Total Lines: ${totalLines}`);
  console.log(`🔄 Duplicate Lines: ${duplicateLines}`);
  console.log(`📊 Duplication: ${duplicationPercentage}%`);
  console.log('\n📋 Pattern Analysis:');
  
  Object.entries(patterns).forEach(([key, data]) => {
    if (data.count > 0) {
      console.log(`  ${key}: ${data.count} occurrences (~${data.lines} lines)`);
    }
  });
  
  console.log('\n🎯 Target: <5% for optimal maintainability');
  
  if (parseFloat(duplicationPercentage) < 5) {
    console.log('✅ LOW DUPLICATION - Good job!');
  } else if (parseFloat(duplicationPercentage) < 10) {
    console.log('⚡ MODERATE DUPLICATION - Consider refactoring');
  } else {
    console.log('⚠️  HIGH DUPLICATION - Immediate action needed');
  }
  
  return parseFloat(duplicationPercentage);
}

if (require.main === module) {
  analyzeCodeDuplication();
}

module.exports = { analyzeCodeDuplication };