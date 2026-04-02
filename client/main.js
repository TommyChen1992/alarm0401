const API_URL = 'https://chenzidan2024.club';
let alarms = [];
let triggeredAlarms = new Set();
let currentUserEmail = localStorage.getItem('userEmail');

// --- DOM Elements ---
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date-display');
const alarmListEl = document.getElementById('alarm-list');
const alarmPanelEl = document.getElementById('alarm-panel');
const toggleAlarmBtn = document.getElementById('toggle-alarm-btn');
const addAlarmBtn = document.getElementById('add-alarm-btn');
const alarmTimeInput = document.getElementById('alarm-time');
const alarmLabelInput = document.getElementById('alarm-label');
const alarmOverlay = document.getElementById('alarm-overlay');
const triggeredLabelEl = document.getElementById('triggered-alarm-label');
const triggeredTimeEl = document.getElementById('triggered-alarm-time');
const dismissBtn = document.getElementById('dismiss-alarm-btn');

const loginOverlay = document.getElementById('login-overlay');
const loginEmailInput = document.getElementById('login-email');
const loginBtn = document.getElementById('login-btn');
const loginErrorEl = document.getElementById('login-error');
const clockContainer = document.getElementById('clock-container');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// --- Auth Logic ---
function initAuth() {
    if (currentUserEmail) {
        showClockApp();
    } else {
        showLoginPage();
    }
}

function showLoginPage() {
    loginOverlay.classList.remove('hidden');
    clockContainer.classList.add('hidden');
}

function showClockApp() {
    loginOverlay.classList.add('hidden');
    clockContainer.classList.remove('hidden');
    userDisplay.textContent = currentUserEmail;
    fetchAlarms();
}

async function handleLogin() {
    const email = loginEmailInput.value.trim();
    if (!email || !email.includes('@')) {
        showLoginError('Please enter a valid email address.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            currentUserEmail = email;
            localStorage.setItem('userEmail', email);
            showClockApp();
        } else {
            const data = await response.json();
            showLoginError(data.error || 'Login failed');
        }
    } catch (error) {
        showLoginError('Server connection failed.');
    }
}

function handleLogout() {
    localStorage.removeItem('userEmail');
    currentUserEmail = null;
    alarms = [];
    showLoginPage();
}

function showLoginError(msg) {
    loginErrorEl.textContent = msg;
    loginErrorEl.classList.remove('hidden');
}

// --- API Helpers ---
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-user-email': currentUserEmail
    };
}

// --- Clock Logic ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString(undefined, options);

    if (currentUserEmail) checkAlarms(hours, minutes);
}

// --- Alarm Logic ---
async function fetchAlarms() {
    if (!currentUserEmail) return;
    try {
        const response = await fetch(`${API_URL}/alarms`, {
            headers: getAuthHeaders()
        });
        alarms = await response.json();
        renderAlarms();
    } catch (error) {
        console.error('Failed to fetch alarms:', error);
    }
}

function renderAlarms() {
    alarmListEl.innerHTML = '';
    alarms.forEach(alarm => {
        const li = document.createElement('li');
        li.className = 'alarm-item';
        li.innerHTML = `
            <div class="alarm-info">
                <span class="alarm-time-text">${alarm.time}</span>
                <span class="alarm-label-text">${alarm.label}</span>
            </div>
            <button class="btn-delete" onclick="deleteAlarm('${alarm.id}')">×</button>
        `;
        alarmListEl.appendChild(li);
    });
}

async function addAlarm() {
    const time = alarmTimeInput.value;
    const label = alarmLabelInput.value || 'Alarm';
    if (!time) return;

    try {
        const response = await fetch(`${API_URL}/alarms`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ time, label })
        });
        if (response.ok) {
            alarmTimeInput.value = '';
            alarmLabelInput.value = '';
            await fetchAlarms();
        }
    } catch (error) {
        console.error('Failed to add alarm:', error);
    }
}

async function deleteAlarm(id) {
    try {
        const response = await fetch(`${API_URL}/alarms/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            await fetchAlarms();
        }
    } catch (error) {
        console.error('Failed to delete alarm:', error);
    }
}

function checkAlarms(hours, minutes) {
    const currentTime = `${hours}:${minutes}`;
    if (new Date().getSeconds() === 0) triggeredAlarms.clear();

    alarms.forEach(alarm => {
        if (alarm.time === currentTime && !triggeredAlarms.has(alarm.id)) {
            triggerAlarm(alarm);
            triggeredAlarms.add(alarm.id);
        }
    });
}

function triggerAlarm(alarm) {
    triggeredLabelEl.textContent = alarm.label;
    triggeredTimeEl.textContent = alarm.time;
    alarmOverlay.classList.remove('hidden');
    new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play();
}

// --- Event Listeners ---
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
toggleAlarmBtn.addEventListener('click', () => alarmPanelEl.classList.toggle('hidden'));
addAlarmBtn.addEventListener('click', addAlarm);
dismissBtn.addEventListener('click', () => alarmOverlay.classList.add('hidden'));

// Initialize
setInterval(updateClock, 1000);
updateClock();
initAuth();
window.deleteAlarm = deleteAlarm;
