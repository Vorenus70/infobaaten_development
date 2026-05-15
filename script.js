const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMyb0TYfW0pFQukBpPFODUy3U2S2CuhjGwD4Ix4vZYfnYOVldsEXjIPrYTUk3oJtBkcgWzxYB-YVpf/pub?gid=0&single=true&output=csv';

const monthNames = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 
                    'juli', 'august', 'september', 'oktober', 'november', 'desember'];

let allRows = [];
let chartInstance = null;
let isMobile = false;

// Detect mobile device
function checkMobile() {
    isMobile = window.innerWidth <= 768;
}

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
    // On mobile, show even shorter dates
    if (isMobile) {
        return `${parts[0]}/${parts[1]}`;
    }
    return `${parts[0]}.${parts[1]}`;
}

// Calculate linear regression trend line
function calculateTrendLine(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, i) => slope * i + intercept);
}

// Calculate average
function calculateAverage(data) {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
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

function showToast(message, isError = false) {
    let toast = document.querySelector('.refresh-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'refresh-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#c5221f' : '#0d652d';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalContent = refreshBtn.innerHTML;
    
    refreshBtn.innerHTML = `<svg class="action-icon spinning" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
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
            showToast('✓ Data oppdatert');
        },
        error: function() {
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
            showToast('❌ Kunne ikke oppdatere', true);
        }
    });
}

function exportToCSV() {
    const selectedYear = document.getElementById('yearSelect').value;
    
    let exportRows = allRows;
    if (selectedYear !== 'all') {
        exportRows = allRows.filter(row => getYear(row.Date) === parseInt(selectedYear, 10));
    }
    
    if (exportRows.length === 0) {
        showToast('❌ Ingen data å eksportere', true);
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
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`✓ Eksportert ${exportRows.length} rader`);
}

// MOBILE-OPTIMIZED GRAPH
function showGraph() {
    const selectedYear = document.getElementById('yearSelect').value;
    
    let graphRows = allRows;
    if (selectedYear !== 'all') {
        graphRows = allRows.filter(row => getYear(row.Date) === parseInt(selectedYear, 10));
    }
    
    if (graphRows.length === 0) {
        showToast('❌ Ingen data å vise graf for', true);
        return;
    }
    
    checkMobile();
    
    // On mobile, show fewer data points for better readability
    let displayRows = graphRows;
    if (isMobile && graphRows.length > 15) {
        // Take every 2nd data point on mobile
        displayRows = graphRows.filter((_, index) => index % 2 === 0);
        if (displayRows.length < 10) displayRows = graphRows.slice(0, 15);
    }
    displayRows = displayRows.slice(0, isMobile ? 20 : 30);
    
    const labels = [];
    const changeData = [];
    const backgroundColors = [];
    
    // Reverse to show oldest to newest (left to right)
    [...displayRows].reverse().forEach(row => {
        labels.push(formatDateForChart(row.Date));
        const changeCm = row["Change cm/m"];
        let changeNum = parseFloat(changeCm);
        
        if (isNaN(changeNum)) {
            changeData.push(0);
            backgroundColors.push('#9aa0a6');
        } else {
            changeData.push(changeNum);
            backgroundColors.push(changeNum > 0 ? '#0d652d' : (changeNum < 0 ? '#c5221f' : '#9aa0a6'));
        }
    });
    
    // Calculate trend line and average only if we have enough data
    let trendLineData = changeData;
    let averageValue = 0;
    if (changeData.length >= 3) {
        trendLineData = calculateTrendLine(changeData);
        averageValue = calculateAverage(changeData);
    }
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = document.getElementById('graphCanvas').getContext('2d');
    
    // Mobile-optimized chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        if (context.dataset.label === 'Trendlinje') return null;
                        if (context.dataset.label && context.dataset.label.includes('Gjennomsnitt')) return null;
                        let value = context.raw;
                        if (value > 0) return `Stigning: +${value} cm`;
                        if (value < 0) return `Fall: ${value} cm`;
                        return `Ingen endring: 0 cm`;
                    },
                    // On mobile, show smaller tooltips
                    bodyFont: { size: isMobile ? 10 : 12 },
                    titleFont: { size: isMobile ? 10 : 12 }
                }
            },
            legend: {
                position: isMobile ? 'bottom' : 'top',
                labels: {
                    boxWidth: isMobile ? 8 : 12,
                    font: { size: isMobile ? 9 : 12 },
                    usePointStyle: true,
                    pointStyle: 'rect'
                }
            }
        },
        scales: {
            y: {
                title: { 
                    display: !isMobile, 
                    text: 'Endring (cm)', 
                    color: '#5f6368' 
                },
                grid: { color: '#e0e5eb' },
                ticks: { 
                    font: { size: isMobile ? 9 : 11 },
                    stepSize: isMobile ? undefined : undefined
                }
            },
            x: {
                title: { 
                    display: !isMobile, 
                    text: 'Dato', 
                    color: '#5f6368' 
                },
                ticks: { 
                    maxRotation: isMobile ? 45 : 45, 
                    minRotation: isMobile ? 45 : 45,
                    font: { size: isMobile ? 8 : 11 },
                    autoSkip: true,
                    maxTicksLimit: isMobile ? 8 : 15
                }
            }
        }
    };
    
    const datasets = [
        {
            label: 'Endring (cm)',
            data: changeData,
            backgroundColor: backgroundColors,
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: isMobile ? 0.5 : 0.4,
            categoryPercentage: isMobile ? 0.7 : 0.8
        }
    ];
    
    // Add trend line only if we have enough data
    if (changeData.length >= 3 && trendLineData !== changeData) {
        datasets.push({
            label: 'Trendlinje',
            data: trendLineData,
            type: 'line',
            borderColor: '#1a73e8',
            backgroundColor: 'transparent',
            borderWidth: isMobile ? 1.5 : 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 1
        });
    }
    
    // Add average line only if we have data
    if (changeData.length > 0) {
        datasets.push({
            label: `Gj.snitt (${averageValue.toFixed(1)} cm)`,
            data: Array(changeData.length).fill(averageValue),
            type: 'line',
            borderColor: '#ea4335',
            backgroundColor: 'transparent',
            borderWidth: isMobile ? 1.5 : 2,
            borderDash: [],
            pointRadius: 0,
            fill: false,
            tension: 0,
            order: 0
        });
    }
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: chartOptions
    });
    
    document.getElementById('graphModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('graphModal').style.display = 'none';
}

function init() {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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
            
            document.getElementById('yearSelect').addEventListener('change', function() {
                renderTable(this.value);
            });
            
            document.getElementById('refreshBtn').onclick = function(e) { e.preventDefault(); refreshData(); };
            document.getElementById('exportBtn').onclick = function(e) { e.preventDefault(); exportToCSV(); };
            document.getElementById('graphBtn').onclick = function(e) { e.preventDefault(); showGraph(); };
            
            document.querySelector('.modal-close').onclick = closeModal;
            window.onclick = function(event) {
                if (event.target === document.getElementById('graphModal')) closeModal();
            };
        }
    });
}

init();
