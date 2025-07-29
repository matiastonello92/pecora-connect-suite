#!/bin/sh

# Health check script for test environment

set -e

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Check if application is accessible
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "❌ Application health check failed"
    exit 1
fi

# Check if application is serving content
if ! curl -s http://localhost/ | grep -q "Management PN" > /dev/null 2>&1; then
    echo "❌ Application content check failed"
    exit 1
fi

# Check memory usage (warn if > 80%)
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️ High memory usage: ${MEMORY_USAGE}%"
fi

# Check disk usage (warn if > 85%)
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️ High disk usage: ${DISK_USAGE}%"
fi

echo "✅ Health check passed"
exit 0