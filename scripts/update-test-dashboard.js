#!/usr/bin/env node

/**
 * Automatic Test Dashboard Updater
 * Updates the test dashboard with newly detected functions, pages, and APIs
 */

const fs = require('fs');
const path = require('path');

class TestDashboardUpdater {
  constructor() {
    this.reportDir = 'reports';
    this.dashboardComponents = {
      pageTestRunner: 'src/components/testing/PageTestRunner.tsx',
      apiTestRunner: 'src/components/testing/APITestRunner.tsx',
      systemOverview: 'src/components/testing/SystemOverview.tsx'
    };
  }

  /**
   * Get the latest change detection report
   */
  getLatestReport() {
    if (!fs.existsSync(this.reportDir)) {
      throw new Error('No reports directory found');
    }

    const reportFiles = fs.readdirSync(this.reportDir)
      .filter(file => file.startsWith('change-detection-'))
      .sort()
      .reverse();

    if (reportFiles.length === 0) {
      throw new Error('No change detection reports found');
    }

    const latestReportPath = path.join(this.reportDir, reportFiles[0]);
    return JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));
  }

  /**
   * Update PageTestRunner with new pages
   */
  updatePageTestRunner(newPages) {
    if (newPages.length === 0) return;

    const filePath = this.dashboardComponents.pageTestRunner;
    let content = fs.readFileSync(filePath, 'utf8');

    console.log(`📄 Updating PageTestRunner with ${newPages.length} new pages...`);

    // Find the pages array in the useState
    const pagesArrayRegex = /const \[pages\] = useState<PageTest\[\]>\(\[([\s\S]*?)\]\);/;
    const match = content.match(pagesArrayRegex);

    if (!match) {
      console.warn('Could not find pages array in PageTestRunner');
      return;
    }

    const existingPagesContent = match[1];
    const existingPages = this.extractExistingPages(existingPagesContent);

    // Generate new page entries
    const newPageEntries = newPages.map((page, index) => {
      const id = (existingPages.length + index + 1).toString();
      return `    { id: '${id}', name: '${page.name}', route: '${page.route}', description: '${this.generatePageDescription(page.name)}', status: 'pending' }`;
    });

    // Combine existing and new pages
    const allPages = existingPages.concat(newPageEntries);
    const newPagesArray = `[\n${allPages.join(',\n')}\n  ]`;

    // Replace the pages array
    const updatedContent = content.replace(
      pagesArrayRegex,
      `const [pages] = useState<PageTest[]>(${newPagesArray});`
    );

    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Added ${newPages.length} new pages to PageTestRunner`);
  }

  /**
   * Update APITestRunner with new API functions and tables
   */
  updateAPITestRunner(newApiFunctions, newTables) {
    if (newApiFunctions.length === 0 && newTables.length === 0) return;

    const filePath = this.dashboardComponents.apiTestRunner;
    let content = fs.readFileSync(filePath, 'utf8');

    console.log(`🔌 Updating APITestRunner with ${newApiFunctions.length} APIs and ${newTables.length} tables...`);

    // Find the apiTests array
    const apiTestsRegex = /const \[apiTests, setApiTests\] = useState<APITest\[\]>\(\[([\s\S]*?)\]\);/;
    const match = content.match(apiTestsRegex);

    if (!match) {
      console.warn('Could not find apiTests array in APITestRunner');
      return;
    }

    const existingTestsContent = match[1];
    const existingTests = this.extractExistingApiTests(existingTestsContent);

    // Generate new API test entries
    const newEntries = [];

    // Add new Supabase tables
    newTables.forEach((table, index) => {
      const id = (existingTests.length + newEntries.length + 1).toString();
      newEntries.push(`    { id: '${id}', table: '${table.name}', description: '${this.generateTableDescription(table.name)}', operations: { select: { status: 'pending' }, insert: { status: 'pending' }, update: { status: 'pending' }, delete: { status: 'pending' } } }`);
    });

    // Add new API functions (if applicable)
    newApiFunctions.forEach((api, index) => {
      const id = (existingTests.length + newEntries.length + 1).toString();
      newEntries.push(`    { id: '${id}', table: '${api.name}', description: '${this.generateApiDescription(api.name)}', operations: { select: { status: 'pending' }, insert: { status: 'pending' }, update: { status: 'pending' }, delete: { status: 'pending' } } }`);
    });

    if (newEntries.length > 0) {
      // Combine existing and new tests
      const allTests = existingTests.concat(newEntries);
      const newTestsArray = `[\n${allTests.join(',\n')}\n  ]`;

      // Replace the apiTests array
      const updatedContent = content.replace(
        apiTestsRegex,
        `const [apiTests, setApiTests] = useState<APITest[]>(${newTestsArray});`
      );

      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Added ${newEntries.length} new API tests to APITestRunner`);
    }
  }

  /**
   * Update SystemOverview with new statistics
   */
  updateSystemOverview(report) {
    const filePath = this.dashboardComponents.systemOverview;
    let content = fs.readFileSync(filePath, 'utf8');

    console.log('📊 Updating SystemOverview with new statistics...');

    // Update total tests count
    const totalNewTests = report.summary.totalNewPages + report.summary.totalNewTables + report.summary.totalNewApiFunctions;

    // Find the stats useState
    const statsRegex = /(const \[stats, setStats\] = useState<TestStats>\(\{[\s\S]*?totalTests:\s*)(\d+)([\s\S]*?\}\);)/;
    const match = content.match(statsRegex);

    if (match) {
      const currentTotal = parseInt(match[2]);
      const newTotal = currentTotal + totalNewTests;
      
      const updatedContent = content.replace(
        statsRegex,
        `$1${newTotal}$3`
      );

      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated SystemOverview total tests from ${currentTotal} to ${newTotal}`);
    }
  }

  /**
   * Generate a description for a page
   */
  generatePageDescription(pageName) {
    const descriptions = {
      'Dashboard': 'Main dashboard page',
      'Communication': 'Chat and messaging',
      'UserManagement': 'User administration',
      'Financial': 'Financial reports and cash closure',
      'Inventory': 'Inventory management',
      'KitchenInventory': 'Kitchen inventory tracking',
      'Equipment': 'Equipment management',
      'Suppliers': 'Supplier management',
      'CashRegister': 'Cash register operations',
      'Checklists': 'Operational checklists',
      'Tasks': 'Task management',
      'Maintenance': 'Maintenance scheduling',
      'Reports': 'Business reports',
      'Settings': 'Application settings',
      'Profile': 'User profile management'
    };

    return descriptions[pageName] || `${pageName} page functionality`;
  }

  /**
   * Generate a description for a database table
   */
  generateTableDescription(tableName) {
    const descriptions = {
      'profiles': 'User profiles',
      'locations': 'Restaurant locations',
      'chats': 'Chat conversations',
      'chat_messages': 'Chat messages',
      'equipment': 'Equipment tracking',
      'suppliers': 'Supplier management',
      'orders': 'Purchase orders',
      'cash_closures': 'Cash register closures',
      'monthly_inventories': 'Monthly inventory',
      'maintenance_records': 'Maintenance records',
      'notifications': 'User notifications'
    };

    return descriptions[tableName] || `${tableName.replace(/_/g, ' ')} data`;
  }

  /**
   * Generate a description for an API function
   */
  generateApiDescription(apiName) {
    return `${apiName} API functionality`;
  }

  /**
   * Extract existing pages from content
   */
  extractExistingPages(content) {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => line.trim()).filter(line => line.startsWith('{'));
  }

  /**
   * Extract existing API tests from content
   */
  extractExistingApiTests(content) {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => line.trim()).filter(line => line.startsWith('{'));
  }

  /**
   * Create a backup of the dashboard files
   */
  createBackup() {
    const backupDir = `backups/dashboard-${Date.now()}`;
    fs.mkdirSync(backupDir, { recursive: true });

    Object.values(this.dashboardComponents).forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        fs.copyFileSync(filePath, path.join(backupDir, fileName));
      }
    });

    console.log(`💾 Dashboard backup created at: ${backupDir}`);
    return backupDir;
  }

  /**
   * Main update function
   */
  async update() {
    try {
      console.log('🔄 Starting test dashboard update...');

      const report = this.getLatestReport();
      const { changes } = report;

      // Create backup before making changes
      this.createBackup();

      // Update dashboard components
      this.updatePageTestRunner(changes.newPages);
      this.updateAPITestRunner(changes.newApiFunctions, changes.newSupabaseTables);
      this.updateSystemOverview(report);

      // Generate update summary
      const summary = {
        timestamp: new Date().toISOString(),
        updates: {
          newPages: changes.newPages.length,
          newApiTests: changes.newApiFunctions.length + changes.newSupabaseTables.length,
          totalUpdates: changes.newPages.length + changes.newApiFunctions.length + changes.newSupabaseTables.length
        },
        details: {
          pages: changes.newPages.map(p => p.name),
          apis: changes.newApiFunctions.map(a => a.name),
          tables: changes.newSupabaseTables.map(t => t.name)
        }
      };

      // Save update summary
      const summaryPath = `reports/dashboard-update-${Date.now()}.json`;
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

      console.log('✅ Test dashboard update completed successfully!');
      console.log(`📊 Summary: ${summary.updates.totalUpdates} total updates applied`);
      console.log(`📄 Update summary saved to: ${summaryPath}`);

      return summary;

    } catch (error) {
      console.error('❌ Error updating test dashboard:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const updater = new TestDashboardUpdater();
  await updater.update();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { TestDashboardUpdater };