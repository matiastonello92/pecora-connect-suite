/**
 * Code Analyzer Utility
 * Advanced analysis of code changes for better detection and categorization
 */

const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  constructor() {
    this.patterns = {
      // React patterns
      reactComponent: {
        regex: /export\s+(?:default\s+)?(?:function\s+)?([A-Z][a-zA-Z0-9_]*)/g,
        type: 'component'
      },
      reactHook: {
        regex: /export\s+(?:const\s+|function\s+)?(use[A-Z][a-zA-Z0-9_]*)/g,
        type: 'hook'
      },
      
      // API patterns
      apiEndpoint: {
        regex: /export\s+(?:const\s+|function\s+)?([a-zA-Z][a-zA-Z0-9_]*)/g,
        type: 'api'
      },
      
      // Database patterns
      supabaseTable: {
        regex: /(\w+):\s*{[^}]*Row:\s*{/g,
        type: 'table'
      },
      supabaseFunction: {
        regex: /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)/gi,
        type: 'function'
      },
      
      // Route patterns
      routeDefinition: {
        regex: /<Route\s+path=["']([^"']+)["']/g,
        type: 'route'
      },
      
      // Import/Export patterns
      importStatement: {
        regex: /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
        type: 'import'
      },
      exportStatement: {
        regex: /export\s+.*\s+from\s+['"]([^'"]+)['"]/g,
        type: 'export'
      }
    };
    
    this.complexity = {
      cyclomatic: this.calculateCyclomaticComplexity.bind(this),
      cognitive: this.calculateCognitiveComplexity.bind(this),
      halstead: this.calculateHalsteadComplexity.bind(this)
    };
  }

  /**
   * Analyze a single file for various patterns and metrics
   */
  analyzeFile(filePath, content = null) {
    if (!content) {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      content = fs.readFileSync(filePath, 'utf8');
    }

    const analysis = {
      path: filePath,
      type: this.getFileType(filePath),
      size: content.length,
      lines: content.split('\n').length,
      functions: [],
      imports: [],
      exports: [],
      complexity: {},
      dependencies: [],
      testCoverage: this.estimateTestCoverage(content),
      security: this.analyzeSecurityPatterns(content),
      performance: this.analyzePerformancePatterns(content)
    };

    // Extract functions and patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const matches = this.extractMatches(content, pattern.regex, pattern.type);
      
      switch (pattern.type) {
        case 'component':
        case 'hook':
        case 'api':
        case 'function':
          analysis.functions.push(...matches);
          break;
        case 'import':
          analysis.imports.push(...matches);
          break;
        case 'export':
          analysis.exports.push(...matches);
          break;
        case 'table':
          analysis.tables = matches;
          break;
        case 'route':
          analysis.routes = matches;
          break;
      }
    }

    // Calculate complexity metrics
    analysis.complexity = {
      cyclomatic: this.complexity.cyclomatic(content),
      cognitive: this.complexity.cognitive(content),
      halstead: this.complexity.halstead(content)
    };

    // Analyze dependencies
    analysis.dependencies = this.extractDependencies(content);

    return analysis;
  }

  /**
   * Compare two file analyses to detect changes
   */
  compareAnalyses(current, previous) {
    if (!previous) {
      return {
        type: 'new_file',
        changes: {
          newFunctions: current.functions,
          newImports: current.imports,
          newExports: current.exports
        }
      };
    }

    const changes = {
      type: 'modified_file',
      changes: {
        newFunctions: this.findNewItems(current.functions, previous.functions),
        removedFunctions: this.findRemovedItems(current.functions, previous.functions),
        modifiedFunctions: this.findModifiedItems(current.functions, previous.functions),
        newImports: this.findNewItems(current.imports, previous.imports),
        newExports: this.findNewItems(current.exports, previous.exports),
        complexityChange: {
          cyclomatic: current.complexity.cyclomatic - previous.complexity.cyclomatic,
          cognitive: current.complexity.cognitive - previous.complexity.cognitive
        }
      }
    };

    return changes;
  }

  /**
   * Extract matches using regex pattern
   */
  extractMatches(content, regex, type) {
    const matches = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      matches.push({
        name: match[1],
        type: type,
        line: lineNumber,
        fullMatch: match[0],
        context: this.getContextAroundMatch(content, match.index)
      });
    }

    return matches;
  }

  /**
   * Get context around a match for better analysis
   */
  getContextAroundMatch(content, index, contextLines = 3) {
    const lines = content.split('\n');
    const matchLine = content.substring(0, index).split('\n').length - 1;
    
    const start = Math.max(0, matchLine - contextLines);
    const end = Math.min(lines.length, matchLine + contextLines + 1);
    
    return {
      before: lines.slice(start, matchLine),
      current: lines[matchLine],
      after: lines.slice(matchLine + 1, end)
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  calculateCyclomaticComplexity(content) {
    const complexityKeywords = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /catch\s*\(/g,
      /case\s+/g,
      /&&/g,
      /\|\|/g,
      /\?.*:/g
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityKeywords) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  calculateCognitiveComplexity(content) {
    // Simplified cognitive complexity calculation
    const cognitivePatterns = [
      { pattern: /if\s*\(/g, weight: 1 },
      { pattern: /else\s*if\s*\(/g, weight: 1 },
      { pattern: /else\s*{/g, weight: 1 },
      { pattern: /while\s*\(/g, weight: 1 },
      { pattern: /for\s*\(/g, weight: 1 },
      { pattern: /catch\s*\(/g, weight: 1 },
      { pattern: /switch\s*\(/g, weight: 1 },
      { pattern: /case\s+/g, weight: 1 },
      { pattern: /&&/g, weight: 1 },
      { pattern: /\|\|/g, weight: 1 },
      { pattern: /function\s*\([^)]*\)\s*{/g, weight: 0 }, // Nested functions add weight
      { pattern: /=>\s*{/g, weight: 0 } // Arrow functions
    ];

    let complexity = 0;
    let nestingLevel = 0;

    for (const { pattern, weight } of cognitivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length * (weight + nestingLevel);
      }
    }

    return complexity;
  }

  /**
   * Calculate Halstead complexity metrics
   */
  calculateHalsteadComplexity(content) {
    // Simplified Halstead metrics
    const operators = content.match(/[+\-*/=<>!&|^%]/g) || [];
    const operands = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g) || [];
    
    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = operators.length + operands.length;
    
    return {
      vocabulary,
      length,
      difficulty: (uniqueOperators / 2) * (operands.length / uniqueOperands),
      effort: vocabulary * length * Math.log2(vocabulary)
    };
  }

  /**
   * Estimate test coverage based on code patterns
   */
  estimateTestCoverage(content) {
    const testPatterns = [
      /describe\s*\(/g,
      /it\s*\(/g,
      /test\s*\(/g,
      /expect\s*\(/g,
      /\.toEqual\(/g,
      /\.toBe\(/g,
      /\.toHaveBeenCalled/g
    ];

    let testIndicators = 0;
    for (const pattern of testPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        testIndicators += matches.length;
      }
    }

    // Estimate coverage based on test indicators vs code complexity
    const complexity = this.calculateCyclomaticComplexity(content);
    const coverage = Math.min(100, (testIndicators / complexity) * 100);

    return {
      estimated: Math.round(coverage),
      testIndicators,
      complexity,
      hasTests: testIndicators > 0
    };
  }

  /**
   * Analyze security patterns in code
   */
  analyzeSecurityPatterns(content) {
    const securityPatterns = {
      sqlInjection: [
        /query\s*\+\s*['"`]/g,
        /\$\{.*\}.*FROM/gi,
        /SELECT.*\+.*WHERE/gi
      ],
      xss: [
        /innerHTML\s*=/g,
        /dangerouslySetInnerHTML/g,
        /\.html\(/g
      ],
      authentication: [
        /auth\.uid\(\)/g,
        /authenticate/gi,
        /authorization/gi,
        /bearer/gi
      ],
      secrets: [
        /api[_-]?key/gi,
        /secret/gi,
        /password/gi,
        /token/gi
      ],
      rls: [
        /RLS/gi,
        /row.level.security/gi,
        /policy/gi
      ]
    };

    const findings = {};
    let riskLevel = 'low';

    for (const [category, patterns] of Object.entries(securityPatterns)) {
      findings[category] = [];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          findings[category].push(...matches);
          
          // Increase risk level based on findings
          if (category === 'sqlInjection' || category === 'xss') {
            riskLevel = 'high';
          } else if (riskLevel === 'low' && category === 'secrets') {
            riskLevel = 'medium';
          }
        }
      }
    }

    return {
      riskLevel,
      findings,
      requiresReview: riskLevel !== 'low'
    };
  }

  /**
   * Analyze performance patterns in code
   */
  analyzePerformancePatterns(content) {
    const performancePatterns = {
      heavyOperations: [
        /\.map\(.*\.map\(/g, // Nested maps
        /\.filter\(.*\.filter\(/g, // Nested filters
        /for\s*\(.*for\s*\(/g, // Nested loops
        /while\s*\(.*while\s*\(/g // Nested while loops
      ],
      reactOptimizations: [
        /useMemo/g,
        /useCallback/g,
        /React\.memo/g,
        /React\.lazy/g
      ],
      asyncPatterns: [
        /async\s+function/g,
        /await\s+/g,
        /Promise\./g,
        /\.then\(/g
      ]
    };

    const analysis = {};
    let performanceScore = 100;

    for (const [category, patterns] of Object.entries(performancePatterns)) {
      const matches = [];
      
      for (const pattern of patterns) {
        const found = content.match(pattern);
        if (found) {
          matches.push(...found);
        }
      }
      
      analysis[category] = matches.length;
      
      // Adjust performance score
      if (category === 'heavyOperations') {
        performanceScore -= matches.length * 10;
      } else if (category === 'reactOptimizations') {
        performanceScore += matches.length * 5;
      }
    }

    return {
      score: Math.max(0, performanceScore),
      patterns: analysis,
      recommendations: this.generatePerformanceRecommendations(analysis)
    };
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations(analysis) {
    const recommendations = [];

    if (analysis.heavyOperations > 2) {
      recommendations.push('Consider optimizing nested loops and array operations');
    }

    if (analysis.reactOptimizations === 0 && analysis.heavyOperations > 0) {
      recommendations.push('Consider using React.memo, useMemo, or useCallback for optimization');
    }

    if (analysis.asyncPatterns > 5) {
      recommendations.push('Review async patterns for potential performance bottlenecks');
    }

    return recommendations;
  }

  /**
   * Extract dependencies from imports
   */
  extractDependencies(content) {
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const dependencies = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      
      dependencies.push({
        name: dep,
        type: dep.startsWith('.') ? 'relative' : 'external',
        isThirdParty: !dep.startsWith('.') && !dep.startsWith('@/')
      });
    }

    return dependencies;
  }

  /**
   * Get file type based on path and content
   */
  getFileType(filePath) {
    const extension = path.extname(filePath);
    const basename = path.basename(filePath);
    const dirname = path.dirname(filePath);

    if (dirname.includes('pages')) return 'page';
    if (dirname.includes('components')) return 'component';
    if (dirname.includes('hooks')) return 'hook';
    if (dirname.includes('functions')) return 'api';
    if (basename.includes('types')) return 'types';
    if (extension === '.sql') return 'migration';

    return 'unknown';
  }

  /**
   * Find new items between two arrays
   */
  findNewItems(current, previous) {
    const previousNames = previous.map(item => item.name);
    return current.filter(item => !previousNames.includes(item.name));
  }

  /**
   * Find removed items between two arrays
   */
  findRemovedItems(current, previous) {
    const currentNames = current.map(item => item.name);
    return previous.filter(item => !currentNames.includes(item.name));
  }

  /**
   * Find modified items between two arrays
   */
  findModifiedItems(current, previous) {
    const modified = [];
    const previousMap = new Map(previous.map(item => [item.name, item]));

    for (const currentItem of current) {
      const previousItem = previousMap.get(currentItem.name);
      if (previousItem && JSON.stringify(currentItem) !== JSON.stringify(previousItem)) {
        modified.push({
          name: currentItem.name,
          current: currentItem,
          previous: previousItem
        });
      }
    }

    return modified;
  }
}

module.exports = { CodeAnalyzer };