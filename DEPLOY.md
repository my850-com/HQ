# Dashboard Deployment Guide

## Quick Deploy Steps

### 1. Clone Your HQ Repo (if not already)
```bash
cd ~/Documents
git clone https://github.com/my850Lars/HQ.git
cd HQ
```

### 2. Copy Dashboard Files
```bash
# Copy the three files from your workspace
cp ~/.openclaw/workspace/dashboard/index.html ./
cp ~/.openclaw/workspace/dashboard/styles.css ./
cp ~/.openclaw/workspace/dashboard/app.js ./
```

### 3. Commit & Push
```bash
git add index.html styles.css app.js
git commit -m "Add MY850 HQ Mission Control Dashboard v1.0"
git push origin main
```

### 4. Enable GitHub Pages
Go to: https://github.com/my850Lars/HQ/settings/pages
- **Source:** Deploy from a branch
- **Branch:** main
- **Folder:** / (root)
- Click **Save**

### 5. Access Dashboard
Wait 2-3 minutes, then visit:
**https://my850Lars.github.io/HQ/**

---

## Dashboard URL
**Once deployed:** https://my850Lars.github.io/HQ/

---

## Features You Can Use Immediately

✅ **Live Metrics** — Real-time updating numbers  
✅ **Hot Leads Table** — Sortable, filterable, with "Call Now" buttons  
✅ **Interactive Charts** — Click legend items to hide/show data  
✅ **Task Management** — Add/complete/delete tasks  
✅ **Dark/Light Mode** — Toggle in header  
✅ **Collapsible Sections** — Click headers to expand/collapse  
✅ **County Filters** — Filter leads by county  

---

## Next Steps (When Ready)

To connect your Google Sheet data:
1. Publish your Sheet to web: File → Share → Publish to web
2. Get the CSV export URL
3. Update `CONFIG.googleSheetUrl` in app.js
4. Rebuild with real data

For HighLevel/Synthflow integration, see the API section in app.js (lines 600+)

---

**Files ready to deploy!**