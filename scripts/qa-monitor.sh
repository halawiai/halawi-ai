#!/bin/bash

# QA Monitoring Script for Chat UI
# Monitors terminal logs and server output for errors

LOG_FILE="server.log"
ERROR_PATTERNS=(
    "error"
    "Error"
    "ERROR"
    "failed"
    "Failed"
    "FAILED"
    "exception"
    "Exception"
    "EXCEPTION"
    "No module named"
    "Cannot find module"
    "EADDRINUSE"
    "ECONNREFUSED"
    "timeout"
    "Timeout"
    "TIMEOUT"
)

echo "🔍 QA Monitor Started - Watching for errors..."
echo "=============================================="
echo ""

# Function to check log file
check_log_file() {
    if [ -f "$LOG_FILE" ]; then
        while IFS= read -r line; do
            for pattern in "${ERROR_PATTERNS[@]}"; do
                if echo "$line" | grep -qi "$pattern"; then
                    echo "⚠️  ERROR DETECTED in $LOG_FILE:"
                    echo "   $line"
                    echo ""
                fi
            done
        done < "$LOG_FILE"
    fi
}

# Function to monitor npm/vite output
monitor_process() {
    # Check if dev server is running
    if pgrep -f "vite dev" > /dev/null; then
        echo "✅ Dev server is running"
    else
        echo "❌ Dev server is NOT running"
    fi
    echo ""
}

# Initial check
check_log_file
monitor_process

# Watch mode
if [ "$1" == "--watch" ]; then
    echo "👀 Watching for new errors (Ctrl+C to stop)..."
    echo ""
    
    # Watch log file for changes
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE" 2>/dev/null | while read -r line; do
            for pattern in "${ERROR_PATTERNS[@]}"; do
                if echo "$line" | grep -qi "$pattern"; then
                    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  ERROR: $line"
                fi
            done
        done
    else
        echo "⚠️  Log file $LOG_FILE not found. Monitoring process output..."
        sleep 5
    fi
fi

