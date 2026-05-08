#!/bin/bash
# log-session-data.sh - Capture session data every 15 minutes
# Run via cron: */15 * * * * /Users/sherlockhomes/.openclaw/workspace/HQ/log-session-data.sh

OUTPUT_FILE="/Users/sherlockhomes/.openclaw/workspace/HQ/session-data.json"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Fetch from OpenClaw gateway (assumes running with token auth)
SESSION_DATA=$(curl -s http://127.0.0.1:18789/api/status 2>/dev/null || echo "")

if [ -n "$SESSION_DATA" ]; then
    # Real data available
    echo "$SESSION_DATA" > "$OUTPUT_FILE"
    echo "Session data logged at $DATE"
else
    # No connection, don't overwrite old data (it becomes aged)
    echo "No session data available at $DATE, keeping stale data"
fi