const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMyb0TYfW0pFQukBpPFODUy3U2S2CuhjGwD4Ix4vZYfnYOVldsEXjIPrYTUk3oJtBkcgWzxYB-YVpf/pub?gid=0&single=true&output=csv';

const monthNames = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 
                    'juli', 'august', 'september', 'oktober', 'november', 'desember'];

let allRows = [];
let chartInstance = null;

function getDateObject(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}

function getYear(dateStr) {
    const parts = dateStr.split('-');
    return parts.length === 3 ? parseInt(parts[2], 10) : null;
}

function formatDateForChart(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}.${parts[1]}`;
}

function addDivider(tbody, month, year) {
    const dividerRow = document.createElement("tr");
    dividerRow.className = "month-divider";
    const dividerCell = document.createElement("td");
    dividerCell.colSpan = 5;
    dividerCell.textContent = `--- ${monthNames[month - 1]} ${year} ---`;
    dividerRow.appendChild(dividerCell);
    tbody.appendChild(dividerRow);
}

function renderTable(selectedYear) {
    const tbody = document.querySelector("#waterTable tbody");
    tbody.innerHTML = "";
    
    let filteredRows = allRows;
    if (selectedYear !== 'all') {
        filteredRows = allRows.filter(row => getYear(row.Date) === parseInt(selectedYear, 10));
    }
    
    if (filteredRows.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="5" style="text-align: center;">Ingen data for valgt år</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    const grouped = {};
    filteredRows.forEach(row => {
        const date = getDateObject(row.Date);
        if (!date) return;
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });
    
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
        const [yearA, monthA] = a.split('-');
        const [yearB, monthB] = b.split('-');
        if (yearA !== yearB) return parseInt(yearB, 10) - parseInt(yearA, 10);
        return parseInt(monthB, 10) - parseInt(monthA, 10);
    });
    
    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        addDivider(tbody, parseInt(month, 10), parseInt(year, 10));
        grouped[monthKey].forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="hide-on-mobile">${row.Timestamp || ''}</td>
                <td style="white-space: nowrap;">${row.Date || ''}</td>
                <td>${row["Water Level (moh)"] || ''}</td>
                <td>${row["Change vs yesterday"] || ''}</td>
                <td>${row["Change cm/m"] || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function populateYearOptions() {
    const years = new Set();
    allRows.forEach(row => {
        const year = getYear(row.Date);
        if (year) years.add(year);
    });
    const currentYear = new Date().getFullYear();
    const select = document.getElementById('yearSelect');
    while (select.options.length > 1) select.remove(1);
    Array.from(years).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
    if (years.has(currentYear)) {
        select.value = currentYear;
    } else {
        select.value = 'all';
    }
    renderTable(select.value);
}

function updateLatestCard() {
    if (allRows.length === 0) return;
    
    const latest = allRows[0];
    const waterLevel = latest["Water Level (moh)"];
    const changeCm = latest["Change cm/m"];
    
    const latestValueElem = document.getElementById('latestValue');
    if (latestValueElem && waterLevel) {
        latestValueElem.textContent = waterLevel;
    }
    
    const latestChangeElem = document.getElementById('latestChange');
    const changeArrow = document.querySelector('.change-arrow');
    const changeValue = document.querySelector('.change-value');
    
    if (latestChangeElem && changeCm) {
        let changeNum = parseFloat(changeCm);
        let changeText = changeCm.toString().replace('cm', '').trim();
        
        if (!isNaN(changeNum)) {
            if (changeNum > 0) {
                changeArrow.textContent = '▲';
                changeValue.textContent = `+${changeText} cm`;
                latestChangeElem.className = 'latest-change positive';
            } else if (changeNum < 0) {
                changeArrow.textContent = '▼';
                changeValue.textContent = `${changeText} cm`;
                latestChangeElem.className = 'latest-change negative';
            } else {
                changeArrow.textContent = '●';
                changeValue.textContent = `${changeText} cm`;
                latestChangeElem.className = 'latest-change neutral';
            }
        }
    }
    
    const latestUpdatedElem = document.getElementById('latestUpdated');
    if (latestUpdatedElem && latest.Timestamp) {
        latestUpdatedElem.textContent = `Oppdatert: ${latest.Timestamp}`;
    }
}

// Refresh data function
function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalContent = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = `
        <svg class="action-icon spinning" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
    `;
    refreshBtn.disabled = true;
    
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            allRows = results.data.filter(row => row.Date && row["Water Level (moh)"]);
            allRows.sort((a, b) => {
                const dateA = getDateObject(a.Date);
                const dateB = getDateObject(b.Date);
                return dateB - dateA;
            });
            
            const currentYear = document.getElementById('yearSelect').value;
            populateYearOptions();
            
            const select = document.getElementById('yearSelect');
            if (select.querySelector(`option[value="${currentYear}"]`)) {
                select.value = currentYear;
            }
            renderTable(select.value);
            updateLatestCard();
            
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
            
            let toast = document.querySelector('.refresh-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.className = 'refresh-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = '✓ Data oppdatert';
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
            
            const latestUpdatedElem = document.getElementById('latestUpdated');
            if (latestUpdatedElem && allRows[0] && allRows[0].Timestamp) {
                latestUpdatedElem.textContent = `Oppdatert: ${allRows[0].Timestamp}`;
            }
        },
        error: function(error) {
            console.error("Refresh failed:", error);
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
            
            let toast = document.querySelector('.refresh-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.className = 'refresh-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = '❌ Kunne ikke oppdatere';
            toast.style.backgroundColor = '#c5221f';
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                toast.style.backgroundColor = '#0d652d';
            }, 2000);
        }
    });
}

// Export to CSV function
function exportToCSV() {
    const selectedYear = document.getElementById('yearSelect').value;
    
    let exportRows = allRows;
    if (selectedYear !== 'all') {
        exportRows = allRows.filter(row => getYear(row.Date) === parseInt(selectedYear, 10));
    }
    
    if (exportRows.length === 0) {
        let toast = document.querySelector('.refresh-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'refresh-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = '❌ Ingen data å eksportere';
        toast.style.backgroundColor = '#c5221f';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.style.backgroundColor = '#0d652d';
        }, 2000);
        return;
    }
    
    const headers = ['Tid', 'Dato', 'Vannstand (moh)', 'Endring m', 'Endring cm'];
    const csvRows = [headers];
    
    exportRows.forEach(row => {
        csvRows.push([
            row.Timestamp || '',
            row.Date || '',
            row["Water Level (moh)"] || '',
            row["Change vs yesterday"] || '',
            row["Change cm/m"] || ''
        ]);
    });
    
    const csvContent = csvRows.map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const fileName = selectedYear === 'all' 
        ? `vannstand_osensjoen_alle_${dateStr}.csv`
        : `vannstand_osensjoen_${selectedYear}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    let toast = document.querySelector('.refresh-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'refresh-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = `✓ Eksportert ${exportRows.length} rader`;
    toast.style.backgroundColor = '#0d652d';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// NEW: Show Graph function
function showGraph() {
    const selectedYear = document.getElementById('yearSelect').value;
    
    let graphRows = allRows;
    if (selectedYear !== 'all') {
        graphRows = allRows.filter(row => getYear(row.Date) === parseInt(selectedYear, 10));
    }
    
    if (graphRows.length === 0) {
        let toast = document.querySelector('.refresh-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'refresh-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = '❌ Ingen data å vise graf for';
        toast.style.backgroundColor = '#c5221f';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.style.backgroundColor = '#0d652d';
        }, 2000);
        return;
    }
    
    // Take last 30 days for better readability, or all if less
    const displayRows = graphRows.slice(0, 30);
    const labels = [];
    const changeData = [];
    const backgroundColors = [];
    
    displayRows.reverse().forEach(row => {
        labels.push(formatDateForChart(row.Date));
        const changeCm = row["Change cm/m"];
        let changeNum = parseFloat(changeCm);
        
        if (isNaN(changeNum)) {
            changeData.push(0);
            backgroundColors.push('#9aa0a6');
        } else {
            changeData.push(changeNum);
            if (changeNum > 0) {
                backgroundColors.push('#0d652d');
            } else if (changeNum < 0) {
                backgroundColors.push('#c5221f');
            } else {
                backgroundColors.push('#9aa0a6');
            }
        }
    });
    
    // Destroy existing chart if any
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = document.getElementById('graphCanvas').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Endring (cm)',
                data: changeData,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            if (value > 0) {
                                return `Stigning: +${value} cm`;
                            } else if (value < 0) {
                                return `Fall: ${value} cm`;
                            }
                            return `Ingen endring: 0 cm`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Endring (cm)',
                        color: '#5f6368'
                    },
                    grid: {
                        color: '#e0e5eb'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Dato',
                        color: '#5f6368'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Show modal
    const modal = document.getElementById('graphModal');
    modal.style.display = 'block';
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('graphModal');
    modal.style.display = 'none';
}

// Initial load
function initialLoad() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            allRows = results.data.filter(row => row.Date && row["Water Level (moh)"]);
            allRows.sort((a, b) => {
                const dateA = getDateObject(a.Date);
                const dateB = getDateObject(b.Date);
                return dateB - dateA;
            });
            
            populateYearOptions();
            updateLatestCard();
            
            const select = document.getElementById('yearSelect');
            select.addEventListener('change', function() {
                renderTable(this.value);
            });
            
            // Attach refresh button event
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', refreshData);
                refreshBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    refreshData();
                }, { passive: false });
            }
            
            // Attach export button event
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportToCSV);
                exportBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    exportToCSV();
                }, { passive: false });
            }
            
            // NEW: Attach graph button event
            const graphBtn = document.getElementById('graphBtn');
            if (graphBtn) {
                graphBtn.addEventListener('click', showGraph);
                graphBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    showGraph();
                }, { passive: false });
            }
            
            // Attach modal close events
            const modal = document.getElementById('graphModal');
            const closeBtn = document.querySelector('.modal-close');
            
            closeBtn.addEventListener('click', closeModal);
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }
    });
}

// Start everything
initialLoad();
