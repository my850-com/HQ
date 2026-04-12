/**
 * Google Sheets Connector for MY850 HQ Dashboard
 * Fetches live data from your Google Sheet
 */

const SHEET_CONFIG = {
    // Your actual Sheet ID
    sheetId: '1d_UzZrIs4oO5Z3Nshc_UO4Fcorbimmm6rKovIyybdcg',
    
    // Sheet tabs to read from
    tabs: {
        listings: 'Listings',
        buyerLeads: 'Buyer Leads',
        sellerLeads: 'Seller Leads',
        lisPendens: 'Lis Pendens Data',
        hotSheet: 'Hot Sheet Data'
    },
    
    // CSV export base URL (public sheets)
    csvExportUrl: (tabName) => `https://docs.google.com/spreadsheets/d/1d_UzZrIs4oO5Z3Nshc_UO4Fcorbimmm6rKovIyybdcg/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
};

// Fetch data from a specific sheet tab
async function fetchSheetData(tabName) {
    try {
        const url = SHEET_CONFIG.csvExportUrl(tabName);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Failed to fetch ${tabName}:`, response.status);
            return null;
        }
        
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error fetching ${tabName}:`, error);
        return null;
    }
}

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse headers (first line)
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

// Parse a single CSV line (handles quoted values)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    
    return values;
}

// Fetch all metrics from Google Sheets
async function fetchAllMetrics() {
    const metrics = {
        activeListings: 0,
        pipelineValue: 0,
        hotLeads: 0,
        lisPendens: 0,
        teamTasks: 0,
        callsToday: 0,
        // MVP-specific metrics
        scoredLeadsToday: 0,
        lettersGenerated: 0,
        topPriorityCount: 0
    };
    
    // Fetch Listings
    const listings = await fetchSheetData(SHEET_CONFIG.tabs.listings);
    if (listings) {
        metrics.activeListings = listings.length;
        // Calculate pipeline value if Amount column exists
        metrics.pipelineValue = listings.reduce((sum, row) => {
            const amount = parseFloat(row.Amount || row['Asking Price'] || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
    }
    
    // Fetch Buyer + Seller leads
    const buyerLeads = await fetchSheetData(SHEET_CONFIG.tabs.buyerLeads) || [];
    const sellerLeads = await fetchSheetData(SHEET_CONFIG.tabs.sellerLeads) || [];
    const allLeads = [...buyerLeads, ...sellerLeads];
    
    // Count hot leads (today)
    const today = new Date().toISOString().split('T')[0];
    metrics.hotLeads = allLeads.filter(lead => {
        const date = lead.Date || lead['Date Added'] || '';
        return date.includes(today) && (lead.Status === 'Hot' || lead.Priority === 'High');
    }).length;
    
    // Total leads count as team tasks
    metrics.teamTasks = allLeads.length;
    
    // Fetch Lis Pendens
    const lisData = await fetchSheetData(SHEET_CONFIG.tabs.lisPendens);
    if (lisData) {
        // Count this month's filings
        const currentMonth = new Date().getMonth();
        metrics.lisPendens = lisData.filter(row => {
            const date = row['Filing Date'] || row.FilingDate || row.Date || '';
            if (!date) return false;
            try {
                const fileDate = new Date(date);
                return fileDate.getMonth() === currentMonth;
            } catch {
                return false;
            }
        }).length;
        
        // MVP metrics from scored leads
        const scoredCount = lisData.filter(row => row.Score && row.Priority).length;
        metrics.scoredLeadsToday = scoredCount;
        metrics.topPriorityCount = lisData.filter(row => row.Priority === 'A').length;
    }
    
    // Fetch Hot Sheet for calls/activity
    const hotSheet = await fetchSheetData(SHEET_CONFIG.tabs.hotSheet);
    if (hotSheet) {
        metrics.callsToday = hotSheet.filter(row => {
            const date = row.Date || row['Call Date'] || '';
            return date.includes(today);
        }).length;
    }
    
    return metrics;
}

// Fetch leads for the leads table
async function fetchLeadsForTable() {
    const buyerLeads = await fetchSheetData(SHEET_CONFIG.tabs.buyerLeads) || [];
    const sellerLeads = await fetchSheetData(SHEET_CONFIG.tabs.sellerLeads) || [];
    
    // Transform to dashboard format
    const transformLead = (lead, type) => ({
        id: lead.ID || lead.id || Math.random().toString(36).substr(2, 9),
        name: lead['Contact Name'] || lead.Name || lead['Owner Name'] || 'Unknown',
        property: lead['Property Address'] || lead.Address || 'N/A',
        county: lead.County || 'Unknown',
        phone: lead.Phone || lead['Phone Number'] || '',
        score: parseInt(lead.Score) || 0,
        grade: lead.Priority || lead.Grade || 'C',
        status: lead.Status || 'New',
        tags: lead.Tags ? lead.Tags.split(',').map(t => t.trim()) : [],
        date: lead['Date Added'] || lead.Date || new Date().toISOString().split('T')[0],
        lastActivity: lead['Last Activity'] || 'Just now',
        type: type
    });
    
    const leads = [
        ...buyerLeads.map(l => transformLead(l, 'Buyer')),
        ...sellerLeads.map(l => transformLead(l, 'Seller'))
    ];
    
    // Sort by score descending
    return leads.sort((a, b) => b.score - a.score);
}

// Update dashboard with live data
async function updateDashboardFromSheets() {
    try {
        // Fetch metrics
        const metrics = await fetchAllMetrics();
        
        // Update metric cards
        updateMetricCard('activeListings', metrics.activeListings);
        updateMetricCard('pipelineValue', formatCurrency(metrics.pipelineValue));
        updateMetricCard('hotLeads', metrics.hotLeads);
        updateMetricCard('lisPendens', metrics.lisPendens);
        updateMetricCard('teamTasks', metrics.teamTasks);
        updateMetricCard('synthflowCalls', metrics.callsToday);
        
        // Fetch leads for table
        const leads = await fetchLeadsForTable();
        if (leads.length > 0) {
            AppState.allLeads = leads;
            AppState.filteredLeads = leads;
            renderLeadsTable();
        }
        
        console.log('✅ Dashboard updated from Google Sheets');
        
    } catch (error) {
        console.error('❌ Failed to update from Sheets:', error);
        // Fall back to sample data (already in app.js)
    }
}

// Helper: Update a metric card
function updateMetricCard(metricId, value) {
    const element = document.getElementById(metricId === 'pipelineValue' ? 'pipelineValue' : 
                                          metricId === 'activeListings' ? 'activeListings' :
                                          metricId === 'hotLeads' ? 'hotLeads' :
                                          metricId === 'lisPendens' ? 'lisPendens' :
                                          metricId === 'teamTasks' ? 'teamTasks' :
                                          metricId === 'synthflowCalls' ? 'synthflowCalls' : null);
    
    if (element) {
        element.textContent = value;
    }
}

// Helper: Format currency
function formatCurrency(value) {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '$' + (value / 1000).toFixed(0) + 'K';
    }
    return '$' + value;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    updateDashboardFromSheets();
    
    // Refresh every 30 seconds
    setInterval(updateDashboardFromSheets, 30000);
});

// Export for use in app.js
window.SheetsConnector = {
    fetchMetrics: fetchAllMetrics,
    fetchLeads: fetchLeadsForTable,
    updateDashboard: updateDashboardFromSheets
};
