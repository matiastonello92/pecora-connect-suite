#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DuplicationAnalyzer {
  constructor() {
    this.duplicatePatterns = new Map();
    this.fileContents = new Map();
    this.totalLines = 0;
    this.duplicateLines = 0;
  }

  analyzeDirectory(dirPath) {
    const files = this.getAllTsxFiles(dirPath);
    
    // Read all files
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      this.fileContents.set(file, content);
      this.totalLines += content.split('\n').length;
    });

    // Analyze patterns
    this.analyzePatterns();
    
    return {
      totalFiles: files.length,
      totalLines: this.totalLines,
      duplicateLines: this.duplicateLines,
      duplicationPercentage: ((this.duplicateLines / this.totalLines) * 100).toFixed(1),
      patterns: Array.from(this.duplicatePatterns.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
    };
  }

  getAllTsxFiles(dirPath) {
    const files = [];
    
    const scanDir = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && !item.includes('node_modules')) {
          scanDir(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      });
    };
    
    scanDir(dirPath);
    return files;
  }

  analyzePatterns() {
    const commonPatterns = [
      // Loading states
      /const\s+\[\s*\w*loading\w*,\s*set\w*Loading\w*\]\s*=\s*useState/g,
      /const\s+\[\s*is\w*Loading\w*,\s*setIs\w*Loading\w*\]\s*=\s*useState/g,
      /<Loader2\s+className="[^"]*animate-spin[^"]*"\s*\/>/g,
      
      // Error handling
      /try\s*\{[^}]*\}\s*catch\s*\([^)]*\)\s*\{[^}]*toast[^}]*\}/g,
      /toast\(\s*\{[^}]*variant:\s*"destructive"[^}]*\}\s*\)/g,
      
      // Form patterns
      /const\s+form\s*=\s*useForm[^;]+zodResolver/g,
      /const\s+\[\s*\w*submitting\w*,\s*set\w*Submitting\w*\]\s*=\s*useState/g,
      
      // Permission checks
      /const\s+userRole\s*=\s*profile\?\.role/g,
      /if\s*\(\s*!hasPermission/g,
      
      // Data fetching
      /const\s+\[\s*\w*data\w*,\s*set\w*Data\w*\]\s*=\s*useState/g,
      /const\s+\[\s*\w*error\w*,\s*set\w*Error\w*\]\s*=\s*useState/g,
      /useEffect\(\s*\(\)\s*=>\s*\{[^}]*fetch/g,
    ];

    const patternDescriptions = [
      'Loading state with useState',
      'isLoading state with useState',
      'Loader2 with animate-spin',
      'Try-catch with toast error',
      'Toast with destructive variant',
      'useForm with zodResolver',
      'Submitting state with useState',
      'User role from profile',
      'Permission check pattern',
      'Data state with useState',
      'Error state with useState',
      'useEffect with fetch',
    ];

    for (const [filePath, content] of this.fileContents) {
      commonPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          const key = patternDescriptions[index];
          if (!this.duplicatePatterns.has(key)) {
            this.duplicatePatterns.set(key, { count: 0, files: new Set(), lines: 0 });
          }
          
          const current = this.duplicatePatterns.get(key);
          current.count += matches.length;
          current.files.add(path.relative('src', filePath));
          current.lines += matches.reduce((sum, match) => sum + match.split('\n').length, 0);
          
          this.duplicateLines += matches.reduce((sum, match) => sum + match.split('\n').length, 0);
        }
      });
    }
  }
}

// Run analysis
const analyzer = new DuplicationAnalyzer();
const results = analyzer.analyzeDirectory('src');

console.log('\n🔍 Code Duplication Analysis Report\n');
console.log('='*50);
console.log(`📁 Total Files: ${results.totalFiles}`);
console.log(`📄 Total Lines: ${results.totalLines}`);
console.log(`🔄 Duplicate Lines: ${results.duplicateLines}`);
console.log(`📊 Duplication Percentage: ${results.duplicationPercentage}%`);
console.log('\n📋 Top Duplication Patterns:\n');

results.patterns.forEach((pattern, index) => {
  const [description, data] = pattern;
  console.log(`${index + 1}. ${description}`);
  console.log(`   Count: ${data.count} occurrences`);
  console.log(`   Lines: ${data.lines} duplicate lines`);
  console.log(`   Files: ${data.files.size} files affected`);
  console.log(`   Files: ${Array.from(data.files).slice(0, 3).join(', ')}${data.files.size > 3 ? '...' : ''}`);
  console.log('');
});

// Generate recommendations
console.log('\n💡 Refactoring Recommendations:\n');

if (results.duplicationPercentage > 10) {
  console.log('⚠️  High duplication detected! Immediate action recommended:');
} else if (results.duplicationPercentage > 5) {
  console.log('⚡ Moderate duplication. Consider refactoring:');
} else {
  console.log('✅ Low duplication. Minor optimizations available:');
}

results.patterns.slice(0, 5).forEach((pattern, index) => {
  const [description, data] = pattern;
  console.log(`${index + 1}. ${description} → Create reusable hook/component`);
});

console.log('\n🎯 Target: <5% duplication for optimal maintainability\n');