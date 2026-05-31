// DOM Elements
const body = document.body;
const timerTime = document.getElementById('timer-time');
const timerStatus = document.getElementById('timer-status');
const timerSubtitle = document.getElementById('app-subtitle');
const btnToggle = document.getElementById('btn-toggle');
const btnToggleText = document.getElementById('btn-toggle-text');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnReset = document.getElementById('btn-reset');
const btnSkip = document.getElementById('btn-skip');
const sessionCountEl = document.getElementById('session-count');
const sessionDotsContainer = document.getElementById('session-dots');

const inputWork = document.getElementById('input-work');
const inputBreak = document.getElementById('input-break');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnResetSessions = document.getElementById('btn-reset-sessions');
const progressBar = document.getElementById('progress-bar');

// Timer State Variables
let workDuration = 25 * 60;  // 25 minutes in seconds
let breakDuration = 5 * 60;  // 5 minutes in seconds
let timeLeft = workDuration;
let currentDuration = workDuration;
let isRunning = false;
let mode = 'work';           // 'work' or 'break'
let sessions = 0;
let timerInterval = null;

// Time quotes list
const quotes = [
  "時は金なり / Time is money. (ベンジャミン・フランクリン)",
  "今を生きる / Carpe diem. (ホラティウス)",
  "時間こそが、最も貴重な資源である (ピーター・ドラッカー)",
  "一日の価値は、何をしたかで決まる (イギリスの格言)",
  "時間の大切さを知る者は、人生の大切さを知る者である",
  "最も強い味方は、時間と忍耐である (レフ・トルストイ)",
  "今日できることを明日に延ばすな (トーマス・ジェファーソン)",
  "未来は、今日何をするかによって決まる (マハトマ・ガンジー)",
  "失われた時間は、二度と戻らない (ベンジャミン・フランクリン)",
  "一瞬一瞬が、新しい始まりである (T.S.エリオット)",
  "時間を支配する者は、人生を支配する (西洋の格言)",
  "時間の使い方の最も下手な者が、その短さについて文句を言う (ラ・ブリュイエール)",
  "今日という日は、残りの人生の最初の一日である"
];

function updateQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  timerSubtitle.textContent = quotes[randomIndex];
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateDisplay();
  setupProgressRing();
  updateSessionDots();
  updateQuote();
  
  // Listen for resize to recalculate progress ring stroke dash properties if necessary
  window.addEventListener('resize', () => {
    setupProgressRing();
    updateProgressRing();
  });
});

// Event Listeners
btnToggle.addEventListener('click', toggleTimer);
btnReset.addEventListener('click', resetTimer);
btnSkip.addEventListener('click', skipSession);
btnSaveSettings.addEventListener('click', saveSettings);
btnResetSessions.addEventListener('click', resetSessionsCount);

// Load Settings from LocalStorage
function loadSettings() {
  const savedWork = localStorage.getItem('workDuration');
  const savedBreak = localStorage.getItem('breakDuration');
  const savedSessions = localStorage.getItem('sessionsCount');

  if (savedWork) {
    workDuration = parseInt(savedWork, 10) * 60;
    inputWork.value = savedWork;
  }
  if (savedBreak) {
    breakDuration = parseInt(savedBreak, 10) * 60;
    inputBreak.value = savedBreak;
  }
  if (savedSessions) {
    sessions = parseInt(savedSessions, 10);
    sessionCountEl.textContent = sessions;
  }
  
  // Initial mode time setup
  timeLeft = (mode === 'work') ? workDuration : breakDuration;
  currentDuration = timeLeft;
}

// Toggle Timer (Start / Pause)
function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  btnToggleText.textContent = '一時停止';
  iconPlay.classList.add('hidden');
  iconPause.classList.remove('hidden');
  
  // Transition to allow smooth progress ring movement
  progressBar.style.transition = 'stroke-dashoffset 1s linear, stroke 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';

  timerInterval = setInterval(() => {
    timeLeft--;
    
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      playChime();
      handleSessionComplete();
    } else {
      updateDisplay();
      updateProgressRing();
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
  btnToggleText.textContent = 'スタート';
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');
  
  clearInterval(timerInterval);
  // Keep transition fast for UI actions when paused
  progressBar.style.transition = 'stroke-dashoffset 0.3s ease, stroke 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
}

// Reset current session
function resetTimer() {
  pauseTimer();
  timeLeft = (mode === 'work') ? workDuration : breakDuration;
  currentDuration = timeLeft;
  updateDisplay();
  setupProgressRing();
}

// Skip to the next mode
function skipSession() {
  pauseTimer();
  if (mode === 'work') {
    // Switching from work to break
    mode = 'break';
    body.classList.remove('theme-work');
    body.classList.add('theme-break');
    timerStatus.textContent = '休憩の時間';
    timeLeft = breakDuration;
  } else {
    // Switching from break to work
    mode = 'work';
    body.classList.remove('theme-break');
    body.classList.add('theme-work');
    timerStatus.textContent = '作業の時間';
    timeLeft = workDuration;
  }
  currentDuration = timeLeft;
  updateDisplay();
  setupProgressRing();
  updateQuote();
}

// Handle completion of a timer session
function handleSessionComplete() {
  isRunning = false;
  btnToggleText.textContent = 'スタート';
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');

  if (mode === 'work') {
    sessions++;
    localStorage.setItem('sessionsCount', sessions);
    sessionCountEl.textContent = sessions;
    updateSessionDots();
    
    // Switch to break
    mode = 'break';
    body.classList.remove('theme-work');
    body.classList.add('theme-break');
    timerStatus.textContent = '休憩の時間';
    timeLeft = breakDuration;
  } else {
    // Switch to work
    mode = 'work';
    body.classList.remove('theme-break');
    body.classList.add('theme-work');
    timerStatus.textContent = '作業の時間';
    timeLeft = workDuration;
  }
  
  currentDuration = timeLeft;
  updateDisplay();
  setupProgressRing();
  updateQuote();
}

// Save customs timer durations
function saveSettings() {
  const workVal = parseInt(inputWork.value, 10);
  const breakVal = parseInt(inputBreak.value, 10);

  if (isNaN(workVal) || workVal < 1 || workVal > 60 ||
      isNaN(breakVal) || breakVal < 1 || breakVal > 60) {
    alert('1分から60分の間で入力してください。');
    return;
  }

  workDuration = workVal * 60;
  breakDuration = breakVal * 60;

  localStorage.setItem('workDuration', workVal);
  localStorage.setItem('breakDuration', breakVal);

  resetTimer();
  alert('設定を保存しました。');
}

// Reset session counter
function resetSessionsCount() {
  if (confirm('できたセッション数をリセットしてもよろしいですか？')) {
    sessions = 0;
    localStorage.setItem('sessionsCount', sessions);
    sessionCountEl.textContent = sessions;
    updateSessionDots();
  }
}

// Update Timer Text and Page Title
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const timeString = `${formattedMinutes}:${formattedSeconds}`;
  
  timerTime.textContent = timeString;
  
  // Update browser tab title
  const modeText = (mode === 'work') ? '作業中' : '休憩中';
  document.title = `[${timeString}] ${modeText} - Flow Timer`;
}

// Setup progress ring dimensions & properties
let circumference = 0;

function setupProgressRing() {
  const radius = progressBar.r.baseVal.value;
  circumference = 2 * Math.PI * radius;
  
  progressBar.style.strokeDasharray = circumference;
  updateProgressRing();
}

// Dynamic progress ring update based on remaining time
function updateProgressRing() {
  if (currentDuration <= 0) return;
  const progress = timeLeft / currentDuration;
  // Make sure the offset calculation behaves correctly
  const offset = circumference - (progress * circumference);
  progressBar.style.strokeDashoffset = offset;
}

// Render aesthetic dots for completed sessions
function updateSessionDots() {
  sessionDotsContainer.innerHTML = '';
  // Max dots to display to avoid clutter is 10, then add a simple indicator
  const maxDots = Math.min(sessions, 10);
  
  for (let i = 0; i < maxDots; i++) {
    const dot = document.createElement('span');
    dot.classList.add('session-dot');
    // Delay slightly to create sequential pop-in effect
    dot.style.animationDelay = `${i * 0.05}s`;
    sessionDotsContainer.appendChild(dot);
  }
  
  if (sessions > 10) {
    const plusText = document.createElement('span');
    plusText.textContent = '+';
    plusText.style.fontSize = '0.8rem';
    plusText.style.fontWeight = 'bold';
    plusText.style.opacity = '0.7';
    sessionDotsContainer.appendChild(plusText);
  }
}

// Clean Chime Sound Generation (Web Audio API Synthesizer)
function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  
  // Bell Tone 1: Foundation (A5 / 880Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  
  // Bell Tone 2: Warm Third (C#6 / 1109Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1109, now);
  gain2.gain.setValueAtTime(0.12, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  // Bell Tone 3: Bright Perfect Fifth (E6 / 1318Hz)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(1318, now);
  gain3.gain.setValueAtTime(0.1, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  
  // Bell Tone 4: Shimmering Octave (A6 / 1760Hz)
  const osc4 = ctx.createOscillator();
  const gain4 = ctx.createGain();
  osc4.type = 'sine';
  osc4.frequency.setValueAtTime(1760, now);
  gain4.gain.setValueAtTime(0.06, now);
  gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  osc4.connect(gain4);
  gain4.connect(ctx.destination);

  // Start all oscillators
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc4.start(now);
  
  // Stop after decay finishes
  osc1.stop(now + 1.9);
  osc2.stop(now + 1.5);
  osc3.stop(now + 1.1);
  osc4.stop(now + 0.8);
}
