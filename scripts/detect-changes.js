#!/usr/bin/env node

/**
 * Automatic Detection Script for New Functions, Pages, and APIs
 * Compares current code with previous version to detect changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directories to monitor
  watchDirs: [
    'src/pages',
    'src/components',
    'src/hooks',
    'src/integrations/supabase',
    'supabase/functions'
  ],
  // File patterns to detect
  patterns: {
    pages: /src\/pages\/[A-Z]\w+\.tsx$/,
    components: /src\/components\/\w+\/[A-Z]\w+\.tsx$/,
    hooks: /src\/hooks\/use[A-Z]\w+\.tsx?$/,
    apiRoutes: /supabase\/functions\/[\w-]+\/index\.ts$/,
    supabaseTypes: /src\/integrations\/supabase\/types\.ts$/
  },
  // Functions to detect in files
  functionPatterns: {
    reactComponent: /export\s+(?:default\s+)?(?:function\s+)?([A-Z]\w+)/g,
    customHook: /export\s+(?:const\s+|function\s+)?(use[A-Z]\w+)/g,
    apiFunction: /export\s+(?:const\s+|function\s+)?([a-zA-Z]\w+)/g,
    supabaseTable: /(\w+):\s*{/g
  }
};

class ChangeDetector {
  constructor() {
    this.previousCommit = this.getPreviousCommit();
    this.currentFiles = new Map();
    this.previousFiles = new Map();
    this.changes = {
      newPages: [],
      newComponents: [],
      newHooks: [],
      newApiFunctions: [],
      newSupabaseTables: [],
      modifiedFunctions: []
    };
  }

  /**
   * Get the previous commit hash
   */
  getPreviousCommit() {
    try {
      return execSync('git rev-parse HEAD~1', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('Could not get previous commit, using current HEAD');
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    }
  }

  /**
   * Get file content from a specific commit
   */
  getFileFromCommit(filePath, commit) {
    try {
      return execSync(`git show ${commit}:${filePath}`, { encoding: 'utf8' });
    } catch (error) {
      return null; // File didn't exist in previous commit
    }
  }

  /**
   * Get all files matching our patterns
   */
  getCurrentFiles() {
    const files = new Map();
    
    for (const [type, pattern] of Object.entries(CONFIG.patterns)) {
      const matchingFiles = this.findFilesByPattern(pattern);
      for (const file of matchingFiles) {
        if (fs.existsSync(file)) {
          files.set(file, {
            type,
            content: fs.readFileSync(file, 'utf8'),
            functions: this.extractFunctions(file, fs.readFileSync(file, 'utf8'))
          });
        }
      }
    }
    
    return files;
  }

  /**
   * Find files matching a pattern
   */
  findFilesByPattern(pattern) {
    const files = [];
    
    function scanDirectory(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (pattern.test(fullPath)) {
          files.push(fullPath);
        }
      }
    }
    
    for (const watchDir of CONFIG.watchDirs) {
      scanDirectory(watchDir);
    }
    
    return files;
  }

  /**
   * Extract functions from file content
   */
  extractFunctions(filePath, content) {
    const functions = [];
    const fileType = this.getFileType(filePath);
    
    const patterns = fileType === 'pages' || fileType === 'components' 
      ? [CONFIG.functionPatterns.reactComponent]
      : fileType === 'hooks'
      ? [CONFIG.functionPatterns.customHook]
      : fileType === 'apiRoutes'
      ? [CONFIG.functionPatterns.apiFunction]
      : [CONFIG.functionPatterns.supabaseTable];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          line: content.substring(0, match.index).split('\n').length,
          type: fileType
        });
      }
    }
    
    return functions;
  }

  /**
   * Get file type based on path
   */
  getFileType(filePath) {
    for (const [type, pattern] of Object.entries(CONFIG.patterns)) {
      if (pattern.test(filePath)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * Compare current files with previous commit
   */
  async detectChanges() {
    console.log('🔍 Detecting changes...');
    console.log(`Comparing current state with commit: ${this.previousCommit}`);
    
    this.currentFiles = this.getCurrentFiles();
    
    // Get previous files
    for (const [filePath, fileData] of this.currentFiles) {
      const previousContent = this.getFileFromCommit(filePath, this.previousCommit);
      
      if (previousContent === null) {
        // New file
        this.handleNewFile(filePath, fileData);
      } else {
        // Modified file
        const previousFunctions = this.extractFunctions(filePath, previousContent);
        this.handleModifiedFile(filePath, fileData, previousFunctions);
      }
    }
    
    return this.changes;
  }

  /**
   * Handle new file detection
   */
  handleNewFile(filePath, fileData) {
    console.log(`📄 New file detected: ${filePath}`);
    
    switch (fileData.type) {
      case 'pages':
        this.changes.newPages.push({
          path: filePath,
          name: path.basename(filePath, '.tsx'),
          route: this.inferRoute(filePath),
          functions: fileData.functions
        });
        break;
        
      case 'components':
        this.changes.newComponents.push({
          path: filePath,
          name: path.basename(filePath, '.tsx'),
          functions: fileData.functions
        });
        break;
        
      case 'hooks':
        this.changes.newHooks.push({
          path: filePath,
          name: path.basename(filePath, '.tsx').replace('.ts', ''),
          functions: fileData.functions
        });
        break;
        
      case 'apiRoutes':
        this.changes.newApiFunctions.push({
          path: filePath,
          name: path.dirname(filePath).split('/').pop(),
          functions: fileData.functions
        });
        break;
        
      case 'supabaseTypes':
        // Special handling for Supabase types
        this.detectNewSupabaseTables(fileData.content);
        break;
    }
  }

  /**
   * Handle modified file detection
   */
  handleModifiedFile(filePath, currentData, previousFunctions) {
    const currentFunctions = currentData.functions;
    const previousFunctionNames = previousFunctions.map(f => f.name);
    
    for (const func of currentFunctions) {
      if (!previousFunctionNames.includes(func.name)) {
        console.log(`🔧 New function detected: ${func.name} in ${filePath}`);
        this.changes.modifiedFunctions.push({
          file: filePath,
          functionName: func.name,
          functionType: func.type,
          line: func.line
        });
      }
    }
  }

  /**
   * Detect new Supabase tables from types
   */
  detectNewSupabaseTables(content) {
    const tablePattern = /(\w+):\s*{[^}]*Row:\s*{/g;
    let match;
    
    while ((match = tablePattern.exec(content)) !== null) {
      this.changes.newSupabaseTables.push({
        name: match[1],
        detected: true
      });
    }
  }

  /**
   * Infer route from page file path
   */
  inferRoute(filePath) {
    const fileName = path.basename(filePath, '.tsx');
    
    // Handle special cases
    if (fileName === 'Index') return '/app';
    if (fileName === 'NotFound') return '*';
    
    // Convert PascalCase to kebab-case
    const routeName = fileName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1);
      
    return `/app/${routeName}`;
  }

  /**
   * Generate summary report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      previousCommit: this.previousCommit,
      changes: this.changes,
      summary: {
        totalNewPages: this.changes.newPages.length,
        totalNewComponents: this.changes.newComponents.length,
        totalNewHooks: this.changes.newHooks.length,
        totalNewApiFunctions: this.changes.newApiFunctions.length,
        totalNewTables: this.changes.newSupabaseTables.length,
        totalModifiedFunctions: this.changes.modifiedFunctions.length
      }
    };
    
    // Save report
    const reportPath = `reports/change-detection-${Date.now()}.json`;
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Report saved to: ${reportPath}`);
    return report;
  }

  /**
   * Check if changes require test dashboard update
   */
  shouldUpdateTestDashboard() {
    const { newPages, newApiFunctions, newSupabaseTables } = this.changes;
    return newPages.length > 0 || newApiFunctions.length > 0 || newSupabaseTables.length > 0;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting change detection...');
    
    const detector = new ChangeDetector();
    const changes = await detector.detectChanges();
    const report = detector.generateReport();
    
    console.log('\n📋 SUMMARY:');
    console.log(`New Pages: ${changes.newPages.length}`);
    console.log(`New Components: ${changes.newComponents.length}`);
    console.log(`New Hooks: ${changes.newHooks.length}`);
    console.log(`New API Functions: ${changes.newApiFunctions.length}`);
    console.log(`New Supabase Tables: ${changes.newSupabaseTables.length}`);
    console.log(`Modified Functions: ${changes.modifiedFunctions.length}`);
    
    // Check if test dashboard needs update
    if (detector.shouldUpdateTestDashboard()) {
      console.log('\n⚡ Test dashboard update required!');
      process.env.SHOULD_UPDATE_DASHBOARD = 'true';
    }
    
    // Exit with appropriate code
    const hasChanges = Object.values(changes).some(arr => arr.length > 0);
    process.exit(hasChanges ? 1 : 0); // Exit 1 if changes detected for CI/CD
    
  } catch (error) {
    console.error('❌ Error during change detection:', error);
    process.exit(2);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { ChangeDetector, CONFIG };