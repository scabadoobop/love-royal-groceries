// Main JavaScript for rendering dynamic content

// Render shows grid
function renderShowsGrid(shows, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (shows.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">No shows found.</p>';
        return;
    }

    container.innerHTML = shows.map(show => `
        <div class="show-card" onclick="window.location.href='show.html?id=${show.id}'">
            <div class="show-card-image">${show.name.charAt(0)}</div>
            <div class="show-card-content">
                <h3>${show.name}</h3>
                <p>${show.description.substring(0, 100)}...</p>
                <div class="show-platforms">
                    ${show.platforms.map(platform => `<span class="platform-badge">${platform}</span>`).join('')}
                </div>
                <a href="show.html?id=${show.id}" class="btn btn-primary">View Show</a>
            </div>
        </div>
    `).join('');
}

// Render individual show detail
function renderShowDetail(show) {
    const container = document.getElementById('showDetail');
    if (!container || !show) return;

    container.innerHTML = `
        <div class="container">
            <div class="show-detail-banner">${show.name.charAt(0)}</div>
            <div class="show-detail-content">
                <div class="show-detail-header">
                    <h1>${show.name}</h1>
                    <div class="show-meta">
                        <div class="show-meta-item">
                            <strong>Date:</strong> ${window.formatDate(show.date)}
                        </div>
                        <div class="show-meta-item">
                            <strong>Time:</strong> ${show.time}
                        </div>
                        <div class="show-meta-item">
                            <strong>Host:</strong> ${show.host}
                        </div>
                        <div class="show-meta-item">
                            <strong>Platform:</strong> ${show.platform}
                        </div>
                    </div>
                    <div class="show-platforms">
                        ${show.platforms.map(platform => `<span class="platform-badge">${platform}</span>`).join('')}
                    </div>
                </div>
                <div class="show-description">
                    ${show.description}
                </div>
                <div class="show-video">
                    <iframe 
                        src="${show.videoUrl}" 
                        title="${show.name}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="show-apply">
                    <a href="talent.html" class="btn btn-primary btn-large">Apply as Guest</a>
                </div>
            </div>
        </div>
    `;
}

// Render talent grid
function renderTalentGrid(talent, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = talent.map(person => `
        <div class="talent-card">
            <div class="talent-avatar">${person.avatar}</div>
            <h3>${person.name}</h3>
            <p>${person.bio}</p>
            <div class="talent-expertise">
                ${person.expertise.map(exp => `<span class="expertise-tag">${exp}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Render calendar
function renderCalendar(date) {
    const container = document.getElementById('calendarContainer');
    const monthHeader = document.getElementById('currentMonth');
    if (!container || !monthHeader) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update month header
    monthHeader.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let calendarHTML = '<div class="calendar-grid">';
    
    // Add day headers
    dayHeaders.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Add empty cells for days before month starts
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = lastDayPrevMonth - i;
        const prevMonthDate = new Date(year, month - 1, day);
        const dateStr = formatDateForCalendar(prevMonthDate);
        calendarHTML += `<div class="calendar-day other-month" data-date="${dateStr}"></div>`;
    }

    // Add days of current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = formatDateForCalendar(currentDate);
        const isToday = currentDate.getTime() === today.getTime();
        const showsOnDate = window.getShowsByDate(dateStr);
        const hasShows = showsOnDate.length > 0;
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (hasShows) dayClass += ' has-shows';
        
        calendarHTML += `
            <div class="${dayClass}" data-date="${dateStr}" onclick="selectDate('${dateStr}')">
                <div class="calendar-day-number">${day}</div>
            </div>
        `;
    }

    // Add empty cells for days after month ends
    const remainingCells = 42 - (startingDayOfWeek + daysInMonth); // 42 = 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const nextMonthDate = new Date(year, month + 1, day);
        const dateStr = formatDateForCalendar(nextMonthDate);
        calendarHTML += `<div class="calendar-day other-month" data-date="${dateStr}"></div>`;
    }

    calendarHTML += '</div>';
    container.innerHTML = calendarHTML;
}

// Format date as YYYY-MM-DD for calendar
function formatDateForCalendar(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Select date and show shows
function selectDate(dateStr) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });

    // Add selection to clicked day
    const clickedDay = document.querySelector(`[data-date="${dateStr}"]`);
    if (clickedDay && !clickedDay.classList.contains('other-month')) {
        clickedDay.classList.add('selected');
    }

    // Show shows for selected date
    const shows = window.getShowsByDate(dateStr);
    const container = document.getElementById('selectedDateShows');
    
    if (!container) return;

    if (shows.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light);">No shows scheduled for this date.</p>';
        return;
    }

    container.innerHTML = shows.map(show => `
        <div class="show-list-item" onclick="window.location.href='show.html?id=${show.id}'">
            <h4>${show.name}</h4>
            <p><strong>Time:</strong> ${show.time} | <strong>Host:</strong> ${show.host}</p>
            <p>${show.description.substring(0, 150)}...</p>
        </div>
    `).join('');
}

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
});

