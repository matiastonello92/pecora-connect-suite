import fs from 'fs';
import path from 'path';

/**
 * K6 Test Results Processor
 * Processa i risultati dei test k6 e li converte per la dashboard
 */

class TestResultsProcessor {
  constructor() {
    this.resultsDir = './test-results';
    this.processedDir = './test-results/processed';
    this.dashboardDataFile = './test-results/dashboard-data.json';
    
    // Crea le directory se non esistono
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.resultsDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Processa tutti i file di risultato k6 non ancora elaborati
   */
  processNewResults() {
    const files = fs.readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json') && !file.startsWith('processed_'))
      .sort((a, b) => fs.statSync(path.join(this.resultsDir, b)).mtime - fs.statSync(path.join(this.resultsDir, a)).mtime);

    const processedResults = [];

    files.forEach(file => {
      const filePath = path.join(this.resultsDir, file);
      const processedResult = this.processResultFile(filePath);
      
      if (processedResult) {
        processedResults.push(processedResult);
        
        // Sposta il file processato
        const processedFileName = `processed_${file}`;
        const processedPath = path.join(this.processedDir, processedFileName);
        fs.renameSync(filePath, processedPath);
      }
    });

    if (processedResults.length > 0) {
      this.updateDashboardData(processedResults);
    }

    return processedResults;
  }

  /**
   * Processa un singolo file di risultati k6
   */
  processResultFile(filePath) {
    try {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      const result = {
        testId: this.generateTestId(),
        timestamp: new Date().toISOString(),
        filename: path.basename(filePath),
        testSuite: this.extractTestSuite(filePath),
        status: this.determineTestStatus(data),
        duration: this.calculateDuration(data),
        metrics: this.extractMetrics(data),
        thresholds: this.extractThresholds(data),
        stages: this.extractStages(data),
        errors: this.extractErrors(data),
        performance: this.calculatePerformanceScore(data)
      };

      return result;
    } catch (error) {
      console.error(`Errore processando ${filePath}:`, error.message);
      return null;
    }
  }

  generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractTestSuite(filePath) {
    const filename = path.basename(filePath, '.json');
    
    if (filename.includes('auth')) return 'auth-system';
    if (filename.includes('chat')) return 'chat-system';
    if (filename.includes('inventory')) return 'inventory-system';
    if (filename.includes('full')) return 'full-system';
    
    return 'unknown';
  }

  determineTestStatus(data) {
    // Controlla se ci sono soglie fallite
    if (data.thresholds) {
      for (const [metric, threshold] of Object.entries(data.thresholds)) {
        if (threshold.fails && threshold.fails > 0) {
          return 'failed';
        }
      }
    }

    // Controlla il tasso di errore generale
    const errorRate = this.getMetricValue(data, 'http_req_failed');
    if (errorRate > 0.1) { // >10% errori
      return 'failed';
    }

    return 'passed';
  }

  calculateDuration(data) {
    if (data.state && data.state.testRunDurationMs) {
      return Math.round(data.state.testRunDurationMs / 1000); // Converti in secondi
    }
    
    // Fallback: calcola dalla differenza di timestamp
    const timestamps = this.extractTimestamps(data);
    if (timestamps.length >= 2) {
      return Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 1000);
    }
    
    return 0;
  }

  extractMetrics(data) {
    const metrics = {};
    
    if (data.metrics) {
      // Estrai metriche chiave
      metrics.http_req_duration = this.getMetricStats(data, 'http_req_duration');
      metrics.http_req_failed = this.getMetricValue(data, 'http_req_failed');
      metrics.http_reqs = this.getMetricValue(data, 'http_reqs');
      metrics.vus = this.getMetricStats(data, 'vus');
      metrics.vus_max = this.getMetricValue(data, 'vus_max');
      
      // Estrai metriche personalizzate se presenti
      Object.keys(data.metrics).forEach(key => {
        if (key.includes('_errors') || key.includes('_response_time') || key.includes('_operation_time')) {
          metrics[key] = this.getMetricStats(data, key);
        }
      });
    }
    
    return metrics;
  }

  getMetricStats(data, metricName) {
    const metric = data.metrics[metricName];
    if (!metric) return null;
    
    return {
      avg: metric.avg || 0,
      min: metric.min || 0,
      max: metric.max || 0,
      p90: metric.p90 || 0,
      p95: metric.p95 || 0,
      p99: metric.p99 || 0,
      count: metric.count || 0
    };
  }

  getMetricValue(data, metricName) {
    const metric = data.metrics[metricName];
    if (!metric) return 0;
    
    return metric.rate || metric.value || metric.count || 0;
  }

  extractThresholds(data) {
    if (!data.thresholds) return [];
    
    return Object.entries(data.thresholds).map(([name, threshold]) => ({
      name,
      passed: !threshold.fails || threshold.fails === 0,
      fails: threshold.fails || 0,
      passes: threshold.passes || 0
    }));
  }

  extractStages(data) {
    // Estrai informazioni sugli stage se disponibili
    if (data.options && data.options.stages) {
      return data.options.stages;
    }
    
    return [];
  }

  extractErrors(data) {
    const errors = [];
    
    // Cerca errori nei log se disponibili
    if (data.metrics && data.metrics.http_req_failed) {
      const errorRate = this.getMetricValue(data, 'http_req_failed');
      if (errorRate > 0) {
        errors.push({
          type: 'http_errors',
          rate: errorRate,
          description: `${(errorRate * 100).toFixed(2)}% delle richieste HTTP sono fallite`
        });
      }
    }
    
    return errors;
  }

  calculatePerformanceScore(data) {
    let score = 100;
    
    // Penalizza per tempo di risposta alto
    const avgResponseTime = this.getMetricStats(data, 'http_req_duration')?.avg || 0;
    if (avgResponseTime > 1000) {
      score -= 30;
    } else if (avgResponseTime > 500) {
      score -= 15;
    }
    
    // Penalizza per tasso di errore
    const errorRate = this.getMetricValue(data, 'http_req_failed');
    score -= errorRate * 50; // -50 punti per ogni 100% di errori
    
    // Penalizza per soglie fallite
    const thresholds = this.extractThresholds(data);
    const failedThresholds = thresholds.filter(t => !t.passed).length;
    score -= failedThresholds * 10;
    
    return Math.max(0, Math.round(score));
  }

  extractTimestamps(data) {
    const timestamps = [];
    
    if (data.points) {
      data.points.forEach(point => {
        if (point.time) {
          timestamps.push(new Date(point.time).getTime());
        }
      });
    }
    
    return timestamps.sort((a, b) => a - b);
  }

  /**
   * Aggiorna i dati della dashboard con i nuovi risultati
   */
  updateDashboardData(newResults) {
    let dashboardData = this.loadDashboardData();
    
    // Aggiungi i nuovi risultati
    dashboardData.tests.push(...newResults);
    
    // Mantieni solo gli ultimi 100 test
    dashboardData.tests = dashboardData.tests
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);
    
    // Aggiorna le statistiche generali
    dashboardData.summary = this.calculateSummary(dashboardData.tests);
    dashboardData.lastUpdated = new Date().toISOString();
    
    this.saveDashboardData(dashboardData);
    
    // Genera alert se necessario
    this.checkForAlerts(newResults);
  }

  loadDashboardData() {
    if (fs.existsSync(this.dashboardDataFile)) {
      try {
        const data = fs.readFileSync(this.dashboardDataFile, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Errore caricando dashboard data:', error.message);
      }
    }
    
    return {
      tests: [],
      summary: {},
      lastUpdated: new Date().toISOString()
    };
  }

  saveDashboardData(data) {
    try {
      fs.writeFileSync(this.dashboardDataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Errore salvando dashboard data:', error.message);
    }
  }

  calculateSummary(tests) {
    if (tests.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averagePerformanceScore: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        averageErrorRate: 0
      };
    }
    
    const recentTests = tests.slice(0, 20); // Ultimi 20 test
    
    return {
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'passed').length,
      failedTests: tests.filter(t => t.status === 'failed').length,
      averagePerformanceScore: recentTests.reduce((sum, t) => sum + t.performance, 0) / recentTests.length,
      averageResponseTime: recentTests.reduce((sum, t) => 
        sum + (t.metrics.http_req_duration?.avg || 0), 0) / recentTests.length,
      totalRequests: recentTests.reduce((sum, t) => 
        sum + (t.metrics.http_reqs || 0), 0),
      averageErrorRate: recentTests.reduce((sum, t) => 
        sum + (t.metrics.http_req_failed || 0), 0) / recentTests.length,
      testsByStatus: {
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length
      },
      testsBySuite: tests.reduce((acc, test) => {
        acc[test.testSuite] = (acc[test.testSuite] || 0) + 1;
        return acc;
      }, {})
    };
  }

  checkForAlerts(newResults) {
    const alerts = [];
    
    newResults.forEach(result => {
      // Alert per test falliti
      if (result.status === 'failed') {
        alerts.push({
          type: 'test_failure',
          severity: 'high',
          testId: result.testId,
          testSuite: result.testSuite,
          message: `Test ${result.testSuite} fallito con score ${result.performance}`,
          timestamp: result.timestamp
        });
      }
      
      // Alert per performance degradata
      if (result.performance < 70) {
        alerts.push({
          type: 'performance_degradation',
          severity: result.performance < 50 ? 'critical' : 'medium',
          testId: result.testId,
          testSuite: result.testSuite,
          message: `Performance degradata: score ${result.performance}/100`,
          timestamp: result.timestamp
        });
      }
      
      // Alert per tempo di risposta alto
      const avgResponseTime = result.metrics.http_req_duration?.avg || 0;
      if (avgResponseTime > 1000) {
        alerts.push({
          type: 'high_response_time',
          severity: avgResponseTime > 2000 ? 'critical' : 'medium',
          testId: result.testId,
          testSuite: result.testSuite,
          message: `Tempo di risposta elevato: ${avgResponseTime.toFixed(0)}ms`,
          timestamp: result.timestamp
        });
      }
    });
    
    if (alerts.length > 0) {
      this.saveAlerts(alerts);
    }
  }

  saveAlerts(alerts) {
    const alertsFile = './test-results/alerts.json';
    let existingAlerts = [];
    
    if (fs.existsSync(alertsFile)) {
      try {
        const data = fs.readFileSync(alertsFile, 'utf8');
        existingAlerts = JSON.parse(data);
      } catch (error) {
        console.error('Errore caricando alerts:', error.message);
      }
    }
    
    existingAlerts.push(...alerts);
    
    // Mantieni solo alert degli ultimi 7 giorni
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    existingAlerts = existingAlerts.filter(alert => 
      new Date(alert.timestamp) > sevenDaysAgo
    );
    
    try {
      fs.writeFileSync(alertsFile, JSON.stringify(existingAlerts, null, 2));
    } catch (error) {
      console.error('Errore salvando alerts:', error.message);
    }
  }

  /**
   * Genera un report in formato HTML
   */
  generateHtmlReport(testResults) {
    const template = this.getHtmlTemplate();
    const reportData = {
      timestamp: new Date().toLocaleString(),
      summary: this.calculateSummary(testResults),
      tests: testResults.slice(0, 10), // Ultimi 10 test
      chartData: this.prepareChartData(testResults)
    };
    
    const html = template.replace('{{DATA}}', JSON.stringify(reportData));
    const reportPath = `./test-results/report-${Date.now()}.html`;
    
    try {
      fs.writeFileSync(reportPath, html);
      return reportPath;
    } catch (error) {
      console.error('Errore generando report HTML:', error.message);
      return null;
    }
  }

  getHtmlTemplate() {
    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Stress Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .chart-container { margin: 20px 0; height: 400px; }
        .test-list { margin-top: 20px; }
        .test-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .test-status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 0.8em; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>K6 Stress Test Report</h1>
        <p>Generato il: <span id="timestamp"></span></p>
    </div>
    
    <div class="summary" id="summary"></div>
    
    <div class="chart-container">
        <canvas id="performanceChart"></canvas>
    </div>
    
    <div class="test-list" id="testList"></div>
    
    <script>
        const data = {{DATA}};
        
        // Popola timestamp
        document.getElementById('timestamp').textContent = data.timestamp;
        
        // Popola summary
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = \`
            <div class="metric">
                <h3>Test Totali</h3>
                <div class="value">\${data.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Test Superati</h3>
                <div class="value passed">\${data.summary.passedTests}</div>
            </div>
            <div class="metric">
                <h3>Test Falliti</h3>
                <div class="value failed">\${data.summary.failedTests}</div>
            </div>
            <div class="metric">
                <h3>Score Medio</h3>
                <div class="value">\${data.summary.averagePerformanceScore.toFixed(0)}/100</div>
            </div>
            <div class="metric">
                <h3>Tempo Risposta Medio</h3>
                <div class="value">\${data.summary.averageResponseTime.toFixed(0)}ms</div>
            </div>
            <div class="metric">
                <h3>Tasso Errori</h3>
                <div class="value">\${(data.summary.averageErrorRate * 100).toFixed(2)}%</div>
            </div>
        \`;
        
        // Crea grafico performance
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.tests.map(t => new Date(t.timestamp).toLocaleDateString()),
                datasets: [{
                    label: 'Performance Score',
                    data: data.tests.map(t => t.performance),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        // Popola lista test
        const testListDiv = document.getElementById('testList');
        testListDiv.innerHTML = '<h2>Ultimi Test</h2>' + data.tests.map(test => \`
            <div class="test-item">
                <h3>\${test.testSuite} 
                    <span class="test-status status-\${test.status}">\${test.status}</span>
                </h3>
                <p><strong>Timestamp:</strong> \${new Date(test.timestamp).toLocaleString()}</p>
                <p><strong>Durata:</strong> \${test.duration}s</p>
                <p><strong>Performance Score:</strong> \${test.performance}/100</p>
                <p><strong>Richieste:</strong> \${test.metrics.http_reqs || 0}</p>
                <p><strong>Tempo Risposta Medio:</strong> \${test.metrics.http_req_duration?.avg?.toFixed(0) || 0}ms</p>
            </div>
        \`).join('');
    </script>
</body>
</html>
    `;
  }

  prepareChartData(testResults) {
    return testResults.slice(0, 20).reverse().map(test => ({
      timestamp: test.timestamp,
      performance: test.performance,
      responseTime: test.metrics.http_req_duration?.avg || 0,
      errorRate: test.metrics.http_req_failed || 0
    }));
  }
}

// Esegui il processore se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const processor = new TestResultsProcessor();
  const results = processor.processNewResults();
  
  if (results.length > 0) {
    console.log(`Processati ${results.length} nuovi risultati`);
    const reportPath = processor.generateHtmlReport(results);
    if (reportPath) {
      console.log(`Report HTML generato: ${reportPath}`);
    }
  } else {
    console.log('Nessun nuovo risultato da processare');
  }
}

export default TestResultsProcessor;