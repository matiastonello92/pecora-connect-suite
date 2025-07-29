#!/usr/bin/env node

/**
 * Team Notification System
 * Sends alerts to development team when new functions are detected
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

class TeamNotifier {
  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    this.emailConfig = {
      enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      recipients: process.env.EMAIL_RECIPIENTS?.split(',') || []
    };
  }

  /**
   * Get the latest change detection report
   */
  getLatestReport() {
    const reportFiles = fs.readdirSync('reports')
      .filter(file => file.startsWith('change-detection-'))
      .sort()
      .reverse();

    if (reportFiles.length === 0) {
      throw new Error('No change detection reports found');
    }

    const latestReportPath = `reports/${reportFiles[0]}`;
    return JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));
  }

  /**
   * Get current git information
   */
  getGitInfo() {
    try {
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        shortCommit: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
        author: execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim(),
        message: execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      return {
        commit: 'unknown',
        shortCommit: 'unknown',
        author: 'unknown',
        message: 'unknown',
        branch: 'unknown'
      };
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(report) {
    if (!this.slackWebhookUrl) {
      console.log('⚠️ Slack webhook URL not configured, skipping Slack notification');
      return;
    }

    const gitInfo = this.getGitInfo();
    const { changes, summary } = report;

    // Create summary of changes
    const changesList = [];
    if (changes.newPages.length > 0) {
      changesList.push(`📄 *${changes.newPages.length} New Pages*: ${changes.newPages.map(p => p.name).join(', ')}`);
    }
    if (changes.newComponents.length > 0) {
      changesList.push(`🧩 *${changes.newComponents.length} New Components*: ${changes.newComponents.map(c => c.name).join(', ')}`);
    }
    if (changes.newHooks.length > 0) {
      changesList.push(`🪝 *${changes.newHooks.length} New Hooks*: ${changes.newHooks.map(h => h.name).join(', ')}`);
    }
    if (changes.newApiFunctions.length > 0) {
      changesList.push(`🔌 *${changes.newApiFunctions.length} New API Functions*: ${changes.newApiFunctions.map(a => a.name).join(', ')}`);
    }
    if (changes.newSupabaseTables.length > 0) {
      changesList.push(`🗄️ *${changes.newSupabaseTables.length} New Database Tables*: ${changes.newSupabaseTables.map(t => t.name).join(', ')}`);
    }

    const payload = {
      username: "Test Detection Bot",
      icon_emoji: ":test_tube:",
      attachments: [{
        color: "warning",
        title: "🧪 New Features Detected - Test Coverage Required",
        fields: [
          {
            title: "Commit Information",
            value: `*Author:* ${gitInfo.author}\n*Branch:* ${gitInfo.branch}\n*Commit:* \`${gitInfo.shortCommit}\`\n*Message:* ${gitInfo.message}`,
            short: false
          },
          {
            title: "Changes Summary",
            value: changesList.join('\n'),
            short: false
          },
          {
            title: "Statistics",
            value: `Total New Features: ${summary.totalNewPages + summary.totalNewComponents + summary.totalNewHooks + summary.totalNewApiFunctions + summary.totalNewTables}`,
            short: true
          },
          {
            title: "Action Required",
            value: "✅ Test dashboard automatically updated\n📋 Manual testing recommended\n📖 Documentation update may be needed",
            short: true
          }
        ],
        actions: [
          {
            type: "button",
            text: "View Test Dashboard",
            url: `${process.env.LOVABLE_APP_URL || 'https://your-app.lovable.app'}/app/test-dashboard`
          },
          {
            type: "button",
            text: "View Commit",
            url: `${process.env.GITHUB_REPOSITORY_URL || '#'}/commit/${gitInfo.commit}`
          }
        ],
        footer: "Auto Test Detection System",
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    return this.sendWebhookRequest(this.slackWebhookUrl, payload, 'Slack');
  }

  /**
   * Send Discord notification
   */
  async sendDiscordNotification(report) {
    if (!this.discordWebhookUrl) {
      console.log('⚠️ Discord webhook URL not configured, skipping Discord notification');
      return;
    }

    const gitInfo = this.getGitInfo();
    const { changes, summary } = report;

    const embed = {
      title: "🧪 New Features Detected - Test Coverage Required",
      description: "Automatic detection system found new functionality that requires testing",
      color: 0xff9900, // Orange color
      fields: [
        {
          name: "📊 Summary",
          value: `**Pages:** ${summary.totalNewPages}\n**Components:** ${summary.totalNewComponents}\n**Hooks:** ${summary.totalNewHooks}\n**APIs:** ${summary.totalNewApiFunctions}\n**Tables:** ${summary.totalNewTables}`,
          inline: true
        },
        {
          name: "👤 Commit Info",
          value: `**Author:** ${gitInfo.author}\n**Branch:** ${gitInfo.branch}\n**Commit:** \`${gitInfo.shortCommit}\``,
          inline: true
        },
        {
          name: "✅ Actions Taken",
          value: "• Test dashboard updated automatically\n• Issue created for tracking\n• Team notification sent",
          inline: false
        }
      ],
      footer: {
        text: "Auto Test Detection System"
      },
      timestamp: new Date().toISOString()
    };

    // Add detailed changes if any
    if (changes.newPages.length > 0) {
      embed.fields.push({
        name: "📄 New Pages",
        value: changes.newPages.map(p => `• ${p.name}`).join('\n'),
        inline: true
      });
    }

    if (changes.newSupabaseTables.length > 0) {
      embed.fields.push({
        name: "🗄️ New Tables",
        value: changes.newSupabaseTables.map(t => `• ${t.name}`).join('\n'),
        inline: true
      });
    }

    const payload = {
      username: "Test Detection Bot",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/2103/2103613.png",
      embeds: [embed]
    };

    return this.sendWebhookRequest(this.discordWebhookUrl, payload, 'Discord');
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(report) {
    if (!this.emailConfig.enabled || this.emailConfig.recipients.length === 0) {
      console.log('⚠️ Email notifications not configured, skipping email notification');
      return;
    }

    // This is a simplified email implementation
    // In a real scenario, you would use a proper email service like SendGrid, SES, etc.
    console.log('📧 Email notification would be sent to:', this.emailConfig.recipients.join(', '));
    console.log('📋 Email content would include change summary and links to test dashboard');
  }

  /**
   * Send webhook request
   */
  async sendWebhookRequest(url, payload, platform) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${platform} notification sent successfully`);
            resolve(responseBody);
          } else {
            console.error(`❌ ${platform} notification failed:`, res.statusCode, responseBody);
            reject(new Error(`${platform} notification failed: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Error sending ${platform} notification:`, error);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Send all configured notifications
   */
  async sendNotifications() {
    try {
      console.log('📢 Sending team notifications...');

      const report = this.getLatestReport();
      const promises = [];

      // Send Slack notification
      if (this.slackWebhookUrl) {
        promises.push(this.sendSlackNotification(report));
      }

      // Send Discord notification
      if (this.discordWebhookUrl) {
        promises.push(this.sendDiscordNotification(report));
      }

      // Send email notification
      if (this.emailConfig.enabled) {
        promises.push(this.sendEmailNotification(report));
      }

      if (promises.length === 0) {
        console.log('⚠️ No notification methods configured');
        return;
      }

      await Promise.allSettled(promises);
      console.log('✅ Notification process completed');

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const notifier = new TeamNotifier();
  await notifier.sendNotifications();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { TeamNotifier };