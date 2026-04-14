/**
 * MY850 HQ DASHBOARD - MAIN JAVASCRIPT
 * Real Estate Command Center
 * Version: 1.0.0
 * Author: Sherlock for MY850 Team
 * Features: Live clock, dark mode, charts, tasks, team status, filtering
 */

// ================= CONFIGURATION =================
const CONFIG = {
    // Update with your actual data sources:
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1o7DQGa_Jum0nNKpQUV9fiWXOeAmma9vs4twDTqPCMJ0/edit',
    refreshInterval: 30000, // 30 seconds
    timeFormat: '12h', // '12h' or '24h'
    itemsPerPage: 10,
};

// ================= STATE MANAGEMENT =================
const AppState = {
    currentTheme: 'dark',
    currentPage: 1,
    totalPages: 1,
    filteredLeads: [],
    allLeads: [],
    teamMembers: [],
    tasks: [],
    sortColumn: null,
    sortDirection: 'asc'
};

// ================= SAMPLE DATA (Replace with API calls) =================
const SAMPLE_DATA = {
    metrics: {
        activeListings: 23,
        pipelineValue: 2450000,
        hotLeads: 8,
        lisPendens: 127,
        teamTasks: 12,
        synthflowCalls: 47
    },
    leads: [
        {
            id: 1,
            name: "Linda Ramroop",
            property: "5211 NW 110 Ave, Coral Springs",
            county: "Broward",
            phone: "+18139670043",
            score: 100,
            grade: "A",
            status: "New",
            tags: ["HOT LEAD", "PRIORITY", "OUT OF STATE"],
            date: "2026-04-08",
            lastActivity: "2 hours ago"
        },
        {
            id: 2,
            name: "Gievan Rodriguez",
            property: "310 SW 9 Ave, Hallandale Beach",
            county: "Broward",
            phone: "+13059427684",
            score: 100,
            grade: "A",
            status: "New",
            tags: ["HOT LEAD", "PRIORITY", "OWNER OCCUPIED"],
            date: "2026-04-08",
            lastActivity: "3 hours ago"
        },
        {
            id: 3,
            name: "Carl Ervin",
            property: "8650 NW 28 St, Sunrise",
            county: "Broward",
            phone: "+18775551234",
            score: 95,
            grade: "A",
            status: "Contacted",
            tags: ["PRIORITY", "MAJOR BANK"],
            date: "2026-04-08",
            lastActivity: "5 hours ago"
        },
        {
            id: 4,
            name: "Nuvia Rodriguez",
            property: "6851 SW 6 St, Pembroke Pines",
            county: "Broward",
            phone: "+13055559876",
            score: 90,
            grade: "A",
            status: "Appointment Set",
            tags: ["PRIORITY", "ABSENTEE OWNER"],
            date: "2026-04-07",
            lastActivity: "1 day ago"
        },
        {
            id: 5,
            name: "Tyrell Smith",
            property: "3647 SW 62 Ave, Miramar",
            county: "Broward",
            phone: "+13054990957",
            score: 88,
            grade: "B",
            status: "New",
            tags: ["WARM", "OWNER OCCUPIED"],
            date: "2026-04-07",
            lastActivity: "1 day ago"
        },
        {
            id: 6,
            name: "Alysha & Byas Brown",
            property: "2911 NW 6 Ct, Pompano Beach",
            county: "Broward",
            phone: "+19548676560",
            score: 85,
            grade: "B",
            status: "New",
            tags: ["WARM", "CITIBANK"],
            date: "2026-04-06",
            lastActivity: "2 days ago"
        },
        {
            id: 7,
            name: "Seth & Susan Adelman",
            property: "4710 N 40 St, Hollywood",
            county: "Broward",
            phone: "+19555551212",
            score: 82,
            grade: "B",
            status: "New",
            tags: ["WARM", "US BANK"],
            date: "2026-04-06",
            lastActivity: "2 days ago"
        },
        {
            id: 8,
            name: "Nina Goetsch",
            property: "4902 NW 25 Ter, Tamarac",
            county: "Broward",
            phone: "+19543362557",
            score: 80,
            grade: "B",
            status: "Contacted",
            tags: ["WARM", "ROCKET MORTGAGE"],
            date: "2026-04-05",
            lastActivity: "3 days ago"
        }
    ],
    team: [
        {
            name: "Lars Rygaard",
            role: "Team Leader",
            status: "online",
            activeTasks: 5,
            closedThisWeek: 3,
            avatar: "👑"
        },
        {
            name: "Luis Perez",
            role: "Transaction Manager",
            status: "online",
            activeTasks: 4,
            callsToday: 12,
            avatar: "🤝"
        },
        {
            name: "Jon",
            role: "Technical Lead",
            status: "away",
            activeTasks: 2,
            systemsDeployed: 2,
            avatar: "💻"
        }
    ],
    tasks: [
        { id: 1, text: "Follow up with Linda Ramroop (hot lead)", completed: false, priority: "high", assignee: "Lars" },
        { id: 2, text: "Review Lis Pendens data for Broward County", completed: true, priority: "medium", assignee: "Luis" },
        { id: 3, text: "Set up Synthflow campaign for Grade A leads", completed: false, priority: "high", assignee: "Luis" },
        { id: 4, text: "Update HighLevel automation workflows", completed: false, priority: "medium", assignee: "Jon" },
        { id: 5, text: "Prepare Letter 1 batch for mailing", completed: true, priority: "low", assignee: "Luis" }
    ]
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 MY850 HQ Dashboard initializing...');
    
    // Check if user is already logged in (sessionStorage)
    if (sessionStorage.getItem('hqAuthenticated') === 'true') {
        // User already authenticated, show dashboard
        hideLoginOverlay();
        initDashboard();
    } else {
        // Show login first
        initLogin();
    }
});

function initLogin() {
    const password = 'Sherlock';
    const loginButton = document.getElementById('loginButton');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    
    if (!loginButton || !passwordInput) {
        console.error('Login elements not found');
        return;
    }
    
    // Focus on password input
    passwordInput.focus();
    
    // Handle login on button click
    loginButton.addEventListener('click', () => {
        checkPassword(passwordInput.value, password, loginError);
    });
    
    // Handle enter key
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword(passwordInput.value, password, loginError);
        }
    });
}

function checkPassword(input, correct, errorElement) {
    if (input === correct) {
        // Success!
        sessionStorage.setItem('hqAuthenticated', 'true');
        hideLoginOverlay();
        initDashboard();
        showToast('Welcome to MY850 HQ', 'success');
    } else {
        // Failed
        if (errorElement) {
            errorElement.textContent = 'Incorrect password. Please try again.';
            errorElement.style.display = 'block';
        }
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.add('login-hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}

function initDashboard() {
    // Initialize all dashboard components
    initClock();
    initThemeToggle();
    initCollapsibleSections();
    initCharts();
    initData();
    initEventListeners();
    
    // Start auto-refresh
    setInterval(refreshDashboard, CONFIG.refreshInterval);
    
    console.log('✅ Dashboard ready');
}

// ================= LIVE CLOCK =================
function initClock() {
    updateClock();
    setInterval(updateClock, 1000); // Update every second
}

function updateClock() {
    const now = new Date();
    const clockDate = document.getElementById('clock-date');
    const clockTime = document.getElementById('clock-time');
    
    if (clockDate && clockTime) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        clockDate.textContent = now.toLocaleDateString('en-US', options);
        
        let timeString;
        if (CONFIG.timeFormat === '12h') {
            timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: true 
            });
        } else {
            timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
            });
        }
        clockTime.textContent = timeString;
    }
    
    // Update last sync time
    const lastSync = document.getElementById('lastSync');
    if (lastSync) {
        lastSync.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// ================= THEME TOGGLE =================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        AppState.currentTheme = 'light';
        if (themeIcon) themeIcon.textContent = '🌙';
        showToast('Switched to light mode', 'info');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        AppState.currentTheme = 'dark';
        if (themeIcon) themeIcon.textContent = '☀️';
        showToast('Switched to dark mode', 'info');
    }
    
    // Update charts for theme change
    updateChartColors();
}

// ================= COLLAPSIBLE SECTIONS =================
function initCollapsibleSections() {
    const headers = document.querySelectorAll('.section-header.collapsible');
    headers.forEach(header => {
        header.addEventListener('click', () => toggleSection(header));
    });
}

function toggleSection(header) {
    const targetId = header.dataset.target;
    const content = document.getElementById(targetId);
    
    if (content) {
        content.classList.toggle('collapsed');
        header.classList.toggle('collapsed');
    }
}

// ================= CHARTS =================
let gradeChart, pipelineChart, countyChart, marketTrendChart;

function initCharts() {
    const chartDefaults = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
            }
        }
    };
    
    // Grade Distribution Chart
    const gradeCtx = document.getElementById('gradeChart');
    if (gradeCtx) {
        gradeChart = new Chart(gradeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Grade A (Hot)', 'Grade B (Warm)', 'Grade C (Cool)', 'Grade D (Cold)'],
                datasets: [{
                    data: [15, 32, 45, 32],
                    backgroundColor: ['#28A745', '#FD7E14', '#6c757d', '#1e1e36'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                ...chartDefaults,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            color: getCurrentTextColor()
                        }
                    }
                }
            }
        });
    }
    
    // Pipeline Trend Chart
    const pipelineCtx = document.getElementById('pipelineChart');
    if (pipelineCtx) {
        pipelineChart = new Chart(pipelineCtx, {
            type: 'line',
            data: {
                labels: generateLast30Days(),
                datasets: [{
                    label: 'Pipeline Value ($K)',
                    data: generateRandomTrend(30, 2000, 2800),
                    borderColor: '#2E5090',
                    backgroundColor: 'rgba(46, 80, 144, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: {
                        ticks: { color: getCurrentTextColor() },
                        grid: { color: getCurrentGridColor() }
                    },
                    x: {
                        ticks: { 
                            color: getCurrentTextColor(),
                            maxTicksLimit: 5
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // County Distribution Chart
    const countyCtx = document.getElementById('countyChart');
    if (countyCtx) {
        countyChart = new Chart(countyCtx, {
            type: 'bar',
            data: {
                labels: ['Broward', 'Miami-Dade', 'Palm Beach', 'Walton', 'Lee'],
                datasets: [{
                    label: 'Leads',
                    data: [45, 38, 22, 12, 7],
                    backgroundColor: [
                        '#2E5090',
                        '#20C997',
                        '#FD7E14',
                        '#6F42C1',
                        '#DC3545'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: getCurrentTextColor() },
                        grid: { color: getCurrentGridColor() }
                    },
                    x: {
                        ticks: { color: getCurrentTextColor() },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Market Trend Chart
    const marketCtx = document.getElementById('marketTrendChart');
    if (marketCtx) {
        marketTrendChart = new Chart(marketCtx, {
            type: 'line',
            data: {
                labels: generateLast6Months(),
                datasets: [
                    {
                        label: 'Avg Sale Price ($K)',
                        data: [460, 465, 470, 475, 480, 485],
                        borderColor: '#28A745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Active Listings',
                        data: [18, 19, 20, 21, 22, 23],
                        borderColor: '#20C997',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                        tension: 0.3
                    }
                ]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: getCurrentTextColor() },
                        grid: { color: getCurrentGridColor() }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { display: false },
                        ticks: { color: getCurrentTextColor() }
                    },
                    x: {
                        ticks: { color: getCurrentTextColor() },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

function updateChartColors() {
    const textColor = getCurrentTextColor();
    const gridColor = getCurrentGridColor();
    
    [gradeChart, pipelineChart, countyChart, marketTrendChart].forEach(chart => {
        if (chart) {
            chart.options.plugins.legend.labels.color = textColor;
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
            }
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            chart.update();
        }
    });
}

function getCurrentTextColor() {
    return AppState.currentTheme === 'dark' ? '#ffffff' : '#1a1a2e';
}

function getCurrentGridColor() {
    return AppState.currentTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
}

// ================= DATA INITIALIZATION =================
async function initData() {
    // Load initial data
    AppState.allLeads = [...SAMPLE_DATA.leads];
    AppState.filteredLeads = [...SAMPLE_DATA.leads];
    AppState.teamMembers = [...SAMPLE_DATA.team];
    AppState.tasks = [...SAMPLE_DATA.tasks];
    
    // Fetch real active listings count from Google Sheets
    await fetchActiveListingsCount();
    
    // Render all components
    renderMetrics();
    renderLeadsTable();
    renderTeam();
    renderTasks();
    updateTaskStats();
}

// ================= ACTIVE LISTINGS COUNT =================
async function fetchActiveListingsCount() {
    try {
        // Same CSV URL used by listings.html
        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdI2q5qlHpihVdEm7ev8GHjCqWQQ7NTX0C2MnNRYWkd2eAweBjdPRA2zEG-4xq5dJ4FdvqhgOCkuXU/pub?gid=494197748&single=true&output=csv';
        
        const response = await fetch(SHEET_CSV_URL, {
            headers: { 'Accept': 'text/csv' }
        });
        
        if (!response.ok) throw new Error('Failed to load');
        
        const csv = await response.text();
        const listings = parseCSVToListings(csv);
        const activeCount = listings.filter(l => l.Status === 'A').length;
        
        // Update the metrics
        SAMPLE_DATA.metrics.activeListings = activeCount;
        
    } catch (error) {
        console.error('Error fetching listings count:', error);
        // Keep default value if fetch fails
    }
}

// Parse CSV to array of objects (simplified for dashboard)
function parseCSVToListings(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        data.push(obj);
    }
    
    return data;
}

// Parse a single CSV line (handles quotes)
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

function renderMetrics() {
    const metrics = SAMPLE_DATA.metrics;
    
    updateElement('activeListings', metrics.activeListings);
    updateElement('pipelineValue', formatCurrency(metrics.pipelineValue));
    updateElement('hotLeads', metrics.hotLeads);
    updateElement('lisPendens', metrics.lisPendens);
    updateElement('teamTasks', metrics.teamTasks);
    updateElement('synthflowCalls', metrics.synthflowCalls);
}

// ================= LEADS TABLE =================
function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
    const start = (AppState.currentPage - 1) * CONFIG.itemsPerPage;
    const end = start + CONFIG.itemsPerPage;
    const pageLeads = AppState.filteredLeads.slice(start, end);
    
    if (pageLeads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading-cell">
                    <p>No leads found matching your filters.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageLeads.map(lead => `
        <tr data-id="${lead.id}">
            <td><span class="grade grade-${lead.grade.toLowerCase()}">${lead.grade}</span></td>
            <td><strong>${lead.name}</strong></td>
            <td>${lead.property}</td>
            <td class="phone">${lead.phone}</td>
            <td><strong>${lead.score}</strong></td>
            <td>${lead.county}</td>
            <td><span class="status-badge">${lead.status}</span></td>
            <td>
                ${lead.tags.map(tag => `<span class="tag ${tag.toLowerCase().includes('hot') ? 'hot' : ''}">${tag}</span>`).join('')}
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="startCall('${lead.phone}', '${lead.name}')">Call</button>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

// ================= TEAM SECTION =================
function renderTeam() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    grid.innerHTML = AppState.teamMembers.map(member => `
        <div class="team-card">
            <div class="team-avatar">${member.avatar}</div>
            <div class="team-info">
                <div class="team-name">${member.name}</div>
                <div class="team-role">${member.role}</div>
                <div class="team-status">
                    <span class="status-dot ${member.status}"></span>
                    <span>${member.status}</span>
                </div>
                <div class="team-stats">
                    ${member.activeTasks !== undefined ? `<span>Tasks: ${member.activeTasks}</span>` : ''}
                    ${member.callsToday !== undefined ? `<span>Calls: ${member.callsToday}</span>` : ''}
                    ${member.closedThisWeek !== undefined ? `<span>Closed: ${member.closedThisWeek}</span>` : ''}
                    ${member.systemsDeployed !== undefined ? `<span>Systems: ${member.systemsDeployed}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ================= TASKS MANAGEMENT =================
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    taskList.innerHTML = AppState.tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority === 'high' ? 'priority-high' : ''}" data-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <span class="task-assignee">${task.assignee}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">×</button>
        </div>
    `).join('');
}

function addTask() {
    const text = prompt('Enter task description:');
    if (text && text.trim()) {
        const newTask = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            priority: 'medium',
            assignee: 'Lars'
        };
        AppState.tasks.push(newTask);
        renderTasks();
        updateTaskStats();
        showToast('Task added', 'success');
    }
}

function toggleTask(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        updateTaskStats();
        showToast(task.completed ? 'Task completed!' : 'Task reopened', 'success');
    }
}

function deleteTask(id) {
    if (confirm('Delete this task?')) {
        AppState.tasks = AppState.tasks.filter(t => t.id !== id);
        renderTasks();
        updateTaskStats();
        showToast('Task deleted', 'info');
    }
}

function updateTaskStats() {
    const total = AppState.tasks.length;
    const completed = AppState.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    updateElement('taskStats', `${completed} of ${total} tasks complete`);
    
    const progressBar = document.getElementById('taskProgress');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

// ================= PAGINATION =================
function updatePagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    AppState.totalPages = Math.ceil(AppState.filteredLeads.length / CONFIG.itemsPerPage);
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${AppState.currentPage} of ${AppState.totalPages}`;
    }
    
    if (prevBtn) prevBtn.disabled = AppState.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = AppState.currentPage >= AppState.totalPages;
}

// ================= EVENT LISTENERS =================
function initEventListeners() {
    // Filter change listeners
    const countyFilter = document.getElementById('countyFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    
    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    
    // Pagination
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (AppState.currentPage > 1) {
                AppState.currentPage--;
                renderLeadsTable();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (AppState.currentPage < AppState.totalPages) {
                AppState.currentPage++;
                renderLeadsTable();
            }
        });
    }
    
    // Table headers sorting
    document.querySelectorAll('#leadsTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });
}

// ================= FILTERING =================
function applyFilters() {
    const county = document.getElementById('countyFilter')?.value || 'all';
    const grade = document.getElementById('gradeFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    
    AppState.filteredLeads = AppState.allLeads.filter(lead => {
        if (county !== 'all' && !lead.county.toLowerCase().includes(county)) return false;
        if (grade !== 'all' && lead.grade !== grade) return false;
        if (status !== 'all' && lead.status !== status) return false;
        return true;
    });
    
    AppState.currentPage = 1;
    renderLeadsTable();
    showToast(`Filtered: ${AppState.filteredLeads.length} leads`, 'info');
}

function clearFilters() {
    const selects = document.querySelectorAll('.filter-select');
    selects.forEach(select => select.value = 'all');
    
    AppState.filteredLeads = [...AppState.allLeads];
    AppState.currentPage = 1;
    renderLeadsTable();
    showToast('Filters cleared', 'info');
}

// ================= SORTING =================
function sortTable(column) {
    // Toggle direction
    if (AppState.sortColumn === column) {
        AppState.sortDirection = AppState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        AppState.sortColumn = column;
        AppState.sortDirection = 'desc';
    }
    
    AppState.filteredLeads.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle numeric sorting for score
        if (column === 'score') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        if (aVal < bVal) return AppState.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return AppState.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderLeadsTable();
    showToast(`Sorted by ${column} (${AppState.sortDirection})`, 'info');
}

// ================= REFRESH & ACTIONS =================
function refreshAllData() {
    showToast('Refreshing data...', 'info');
    
    // Simulate refresh
    setTimeout(() => {
        renderMetrics();
        renderLeadsTable();
        updateChartsWithNewData();
        showToast('Data refreshed!', 'success');
    }, 1500);
}

function refreshDashboard() {
    // Auto-refresh every 30 seconds
    console.log('Auto-refreshing...');
    // In production, this would fetch new data from APIs
}

function updateChartsWithNewData() {
    if (gradeChart) {
        gradeChart.data.datasets[0].data = [
            Math.floor(Math.random() * 20) + 10, // Grade A
            Math.floor(Math.random() * 30) + 20, // Grade B
            Math.floor(Math.random() * 40) + 30, // Grade C
            Math.floor(Math.random() * 20) + 10  // Grade D
        ];
        gradeChart.update();
    }
}

function startCall(phone, name) {
    showToast(`Initiating call to ${name || 'lead'}: ${phone}`, 'success');
    // In production, integrate with Synthflow API
}

function exportData() {
    const csv = convertToCSV(AppState.filteredLeads);
    downloadCSV(csv, 'my850-leads-export.csv');
    showToast('CSV exported!', 'success');
}

// ================= UTILITIES =================
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatCurrency(value) {
    return '$' + value.toLocaleString();
}

function generateLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
}

function generateLast6Months() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
    return months;
}

function generateRandomTrend(count, min, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function convertToCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ================= TOAST NOTIFICATIONS =================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ================= GLOBAL FUNCTIONS (exposed to HTML) =================
window.refreshAllData = refreshAllData;
window.exportData = exportData;
window.sortTable = sortTable;
window.startCall = startCall;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.showSettings = () => showToast('Settings panel coming soon!', 'info');

console.log('🚀 MY850 HQ Dashboard JavaScript loaded');
console.log('Version: 1.0.0 | Ready for production data integration');