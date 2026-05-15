const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMyb0TYfW0pFQukBpPFODUy3U2S2CuhjGwD4Ix4vZYfnYOVldsEXjIPrYTUk3oJtBkcgWzxYB-YVpf/pub?gid=0&single=true&output=csv';

const monthNames = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 
                    'juli', 'august', 'september', 'oktober', 'november', 'desember'];

let allRows = [];

function getDateObject(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}

function getYear(dateStr) {
    const parts = dateStr.split('-');
    return parts.length === 3 ? parseInt(parts[2], 10) : null;
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

// NEW: Update the latest water level card
function updateLatestCard() {
    if (allRows.length === 0) return;
    
    // Get the most recent row (first in sorted array)
    const latest = allRows[0];
    const waterLevel = latest["Water Level (moh)"];
    const changeCm = latest["Change cm/m"];
    
    // Update water level value
    const latestValueElem = document.getElementById('latestValue');
    if (latestValueElem && waterLevel) {
        latestValueElem.textContent = waterLevel;
    }
    
    // Update change indicator
    const latestChangeElem = document.getElementById('latestChange');
    const changeArrow = document.querySelector('.change-arrow');
    const changeValue = document.querySelector('.change-value');
    
    if (latestChangeElem && changeCm) {
        // Parse the change value (remove 'cm' suffix if present)
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
    
    // Update timestamp
    const latestUpdatedElem = document.getElementById('latestUpdated');
    if (latestUpdatedElem && latest.Timestamp) {
        latestUpdatedElem.textContent = `Oppdatert: ${latest.Timestamp}`;
    }
}

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
        updateLatestCard(); // NEW: Update the card
        
        const select = document.getElementById('yearSelect');
        select.addEventListener('change', function() {
            renderTable(this.value);
        });
    }
});
