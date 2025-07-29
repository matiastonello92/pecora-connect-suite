#!/bin/bash

# Setup Git hooks for automatic change detection
# This script configures Git hooks to run change detection on commits

set -e

echo "🔧 Setting up Git hooks for automatic change detection..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create backup of existing hooks
if [ -f .git/hooks/pre-commit ]; then
    echo "📦 Backing up existing pre-commit hook..."
    cp .git/hooks/pre-commit .git/hooks/pre-commit.backup
fi

if [ -f .git/hooks/post-commit ]; then
    echo "📦 Backing up existing post-commit hook..."
    cp .git/hooks/post-commit .git/hooks/post-commit.backup
fi

# Copy our custom hooks
echo "📋 Installing custom Git hooks..."

# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for change detection
# This runs before each commit to prepare for change detection

echo "🔍 Pre-commit: Preparing change detection..."

# Ensure reports directory exists
mkdir -p reports

# Run linting and basic checks
if command -v npm &> /dev/null; then
    echo "🧹 Running linters..."
    npm run lint --silent || echo "⚠️ Linting warnings detected"
fi

# Stage changes if any files were modified by linters
git add -A

echo "✅ Pre-commit checks completed"
EOF

# Post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# Post-commit hook for change detection
# This runs after each commit to detect changes

echo "🚀 Post-commit: Running change detection..."

# Check if we're in CI/CD environment
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "🤖 CI/CD environment detected, skipping local change detection"
    exit 0
fi

# Run change detection
if [ -f "scripts/detect-changes.js" ]; then
    echo "🔍 Detecting changes..."
    node scripts/detect-changes.js || true
    
    # Check if dashboard update is needed
    if [ "$SHOULD_UPDATE_DASHBOARD" = "true" ]; then
        echo "⚡ Dashboard update recommended"
        echo "💡 Run 'npm run update-dashboard' to update the test dashboard"
    fi
else
    echo "⚠️ Change detection script not found"
fi

echo "✅ Post-commit hook completed"
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit

echo "✅ Git hooks installed successfully!"

# Setup npm scripts
echo "📝 Setting up npm scripts..."

# Check if package.json exists
if [ -f "package.json" ]; then
    # Add our custom scripts to package.json if they don't exist
    if ! grep -q "detect-changes" package.json; then
        echo "📋 Adding npm scripts to package.json..."
        
        # Create a temporary script to add our scripts
        cat > add-scripts.js << 'EOF'
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add our custom scripts
packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['detect-changes'] = 'node scripts/detect-changes.js';
packageJson.scripts['update-dashboard'] = 'node scripts/update-test-dashboard.js';
packageJson.scripts['notify-team'] = 'node scripts/notify-team.js';
packageJson.scripts['setup-hooks'] = 'bash scripts/setup-hooks.sh';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Scripts added to package.json');
EOF

        node add-scripts.js
        rm add-scripts.js
    else
        echo "✅ npm scripts already exist"
    fi
else
    echo "⚠️ package.json not found, skipping npm scripts setup"
fi

# Create configuration files
echo "⚙️ Creating configuration files..."

# Create detection rules configuration
mkdir -p scripts/config
cat > scripts/config/detection-rules.json << 'EOF'
{
  "description": "Configuration for automatic change detection",
  "version": "1.0.0",
  "rules": {
    "pages": {
      "enabled": true,
      "pattern": "src/pages/**/*.tsx",
      "description": "React page components",
      "autoUpdate": true
    },
    "components": {
      "enabled": true,
      "pattern": "src/components/**/*.tsx",
      "description": "React components",
      "autoUpdate": false,
      "excludePatterns": [
        "src/components/ui/**/*"
      ]
    },
    "hooks": {
      "enabled": true,
      "pattern": "src/hooks/**/*.tsx",
      "description": "Custom React hooks",
      "autoUpdate": true
    },
    "api": {
      "enabled": true,
      "patterns": [
        "supabase/functions/*/index.ts",
        "src/integrations/supabase/types.ts"
      ],
      "description": "API functions and database types",
      "autoUpdate": true
    }
  },
  "notifications": {
    "slack": {
      "enabled": true,
      "channel": "#development",
      "mentionRoles": ["@developers", "@qa-team"]
    },
    "github": {
      "enabled": true,
      "createIssues": true,
      "labels": ["testing", "automation", "needs-review"]
    },
    "email": {
      "enabled": false,
      "recipients": []
    }
  },
  "dashboard": {
    "autoUpdate": true,
    "backupBeforeUpdate": true,
    "updateComponents": [
      "PageTestRunner",
      "APITestRunner", 
      "SystemOverview"
    ]
  },
  "ci": {
    "enabled": true,
    "runOnPullRequest": true,
    "runOnPush": true,
    "failBuildOnCriticalChanges": false
  }
}
EOF

# Create environment variables template
cat > .env.example << 'EOF'
# Team Notification Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# Email Notifications (optional)
EMAIL_NOTIFICATIONS=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_RECIPIENTS=dev1@company.com,dev2@company.com

# Application URLs
LOVABLE_APP_URL=https://your-app.lovable.app
GITHUB_REPOSITORY_URL=https://github.com/your-org/your-repo

# Feature Flags
AUTO_UPDATE_DASHBOARD=true
CREATE_GITHUB_ISSUES=true
SEND_NOTIFICATIONS=true
EOF

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env and configure your webhook URLs"
echo "2. Configure GitHub secrets for CI/CD pipeline:"
echo "   - SLACK_WEBHOOK_URL"
echo "   - DISCORD_WEBHOOK_URL (optional)"
echo "3. Test the setup with: npm run detect-changes"
echo "4. Make a test commit to verify hooks are working"
echo ""
echo "💡 Available commands:"
echo "   npm run detect-changes    - Manually run change detection"
echo "   npm run update-dashboard  - Update test dashboard"
echo "   npm run notify-team       - Send team notifications"
echo ""
echo "🔗 The system will now automatically:"
echo "   - Detect new pages, components, hooks, and APIs"
echo "   - Update the test dashboard"
echo "   - Create GitHub issues for tracking"
echo "   - Send team notifications"
echo "   - Run on every commit and PR"
echo ""