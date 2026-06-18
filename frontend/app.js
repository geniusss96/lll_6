// Моковые данные
const patients = [
    { id: 'PAT-001', name: 'Иванов Иван Иванович', dob: '1985-04-12', phone: '+7 (999) 123-45-67' },
    { id: 'PAT-002', name: 'Смирнова Анна Сергеевна', dob: '1990-08-25', phone: '+7 (999) 987-65-43' },
    { id: 'PAT-003', name: 'Петров Петр Васильевич', dob: '1975-11-03', phone: '+7 (999) 555-22-33' }
];

const appointments = [
    { time: '09:00', doctor: 'Терапевт', patient: 'Иванов И.И.', status: 'booked' },
    { time: '10:00', doctor: 'Терапевт', patient: null, status: 'free' },
    { time: '11:00', doctor: 'Терапевт', patient: 'Петров П.В.', status: 'booked' },
    { time: '09:00', doctor: 'Хирург', patient: null, status: 'free' },
    { time: '10:00', doctor: 'Хирург', patient: 'Смирнова А.С.', status: 'booked' },
    { time: '11:00', doctor: 'Хирург', patient: null, status: 'free' }
];

// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderPatients();
    renderCalendar();
    renderDashboardList();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show page
            const target = item.dataset.target;
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            
            // Update Topbar Title
            document.querySelector('.topbar h1').textContent = item.textContent.trim();
        });
    });
}

function renderPatients() {
    const tbody = document.getElementById('patients-table-body');
    tbody.innerHTML = '';
    
    patients.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.id}</strong></td>
            <td>${p.name}</td>
            <td>${p.dob}</td>
            <td>${p.phone}</td>
            <td>
                <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">ЭМК</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = `
        <div></div>
        <div style="font-weight: 600; color: var(--text-muted); text-align: center;">Терапевт</div>
        <div style="font-weight: 600; color: var(--text-muted); text-align: center;">Хирург</div>
        <div style="font-weight: 600; color: var(--text-muted); text-align: center;">Невролог</div>
    `;

    const times = ['09:00', '10:00', '11:00', '12:00'];
    
    times.forEach(time => {
        grid.innerHTML += `<div class="cal-time">${time}</div>`;
        
        // 3 doctors columns
        for(let i = 0; i < 3; i++) {
            const doctors = ['Терапевт', 'Хирург', 'Невролог'];
            const currentDoc = doctors[i];
            
            const apt = appointments.find(a => a.time === time && a.doctor === currentDoc);
            
            if (apt && apt.status === 'booked') {
                grid.innerHTML += `<div class="cal-slot booked">${apt.patient}</div>`;
            } else {
                grid.innerHTML += `<div class="cal-slot" onclick="alert('Запись на ${time} к врачу: ${currentDoc}')">+ Свободно</div>`;
            }
        }
    });
}

function renderDashboardList() {
    const container = document.getElementById('dashboard-appointments-list');
    const booked = appointments.filter(a => a.status === 'booked');
    
    container.innerHTML = booked.map(b => `
        <div style="display: flex; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem; background: var(--surface);">
            <div>
                <strong>${b.patient}</strong>
                <div style="color: var(--text-muted); font-size: 0.875rem;">Врач: ${b.doctor}</div>
            </div>
            <div style="font-weight: 600; color: var(--primary);">${b.time}</div>
        </div>
    `).join('');
}
