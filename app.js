const firebaseConfig = {
  apiKey: "AIzaSyB-JkP87t9klLB47fM3kwQ-5iOGvtJV_RU",
  authDomain: "project-coins-4964c.firebaseapp.com",
  databaseURL: "https://project-coins-4964c-default-rtdb.firebaseio.com",
  projectId: "project-coins-4964c",
  storageBucket: "project-coins-4964c.firebasestorage.app",
  messagingSenderId: "1028489811592",
  appId: "1:1028489811592:web:3535c550a592093e7f713d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const coinsRef = db.ref('coins');
const visitsRef = db.ref('visits');

const state = { wal: 0, lay: 0 };
const visitState = {
  wal: { count: 0, history: [] },
  lay: { count: 0, history: [] }
};

const MEMBER_SINCE = new Date(2026, 5, 2); // 02/06/2026

document.getElementById('visit-modal-date').max = new Date().toISOString().slice(0, 10);
let pendingVisitFrom = null;

// Escuta mudanças em tempo real e atualiza a UI
coinsRef.on('value', (snapshot) => {
  const data = snapshot.val() || { wal: 0, lay: 0 };
  state.wal = data.wal || 0;
  state.lay = data.lay || 0;

  updateCounter('wal');
  updateCounter('lay');
  updateLeaderBanner();
  setButtonsDisabled(false);
});

visitsRef.on('value', (snapshot) => {
  const data = snapshot.val() || {};

  ['wal', 'lay'].forEach((person) => {
    const historyObj = (data[person] && data[person].history) || {};
    const history = Object.values(historyObj).sort((a, b) => b - a);

    visitState[person].count = history.length;
    visitState[person].history = history;

    updateVisitCounter(person);
    updateVisitSubstats(person);
    renderStamps(person);
    renderMRZ(person);
  });
});

function switchTab(tab) {
  document.getElementById('panel-moedas').hidden = tab !== 'moedas';
  document.getElementById('panel-visitas').hidden = tab !== 'visitas';
  document.getElementById('tab-btn-moedas').classList.toggle('active', tab === 'moedas');
  document.getElementById('tab-btn-visitas').classList.toggle('active', tab === 'visitas');
  document.getElementById('tab-btn-moedas').setAttribute('aria-selected', tab === 'moedas');
  document.getElementById('tab-btn-visitas').setAttribute('aria-selected', tab === 'visitas');
}

function updateVisitCounter(person) {
  const el = document.getElementById(`visit-counter-${person}`);
  const prev = parseInt(el.textContent) || 0;
  el.textContent = visitState[person].count;
  if (visitState[person].count !== prev) {
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }
}

function updateVisitSubstats(person) {
  const history = visitState[person].history;
  const lastEl = document.getElementById(`visit-last-${person}`);
  const streakEl = document.getElementById(`visit-streak-${person}`);
  const memberEl = document.getElementById(`passport-member-since-${person}`);

  lastEl.textContent = history.length ? formatPassportDate(history[0]) : '—';

  const streak = calculateStreakMonths(history);
  streakEl.textContent = streak === 0 ? '—' : `${streak} ${streak === 1 ? 'mês' : 'meses'}`;

  memberEl.textContent = formatPassportDate(MEMBER_SINCE.getTime());
}

function calculateStreakMonths(historyDesc) {
  if (historyDesc.length === 0) return 0;

  const monthKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };

  const monthsWithVisit = new Set(historyDesc.map(monthKey));
  const cursor = new Date(historyDesc[0]);
  let streak = 0;

  while (monthsWithVisit.has(monthKey(cursor.getTime()))) {
    streak++;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return streak;
}

function formatPassportDate(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
}

function renderStamps(person) {
  const container = document.getElementById(`visit-stamps-${person}`);
  const history = visitState[person].history;
  container.innerHTML = '';

  if (history.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'stamp-badge stamp-badge--empty';
    empty.textContent = 'Nenhum carimbo ainda';
    container.appendChild(empty);
    return;
  }

  history.forEach((timestamp) => {
    const date = new Date(timestamp);
    const badge = document.createElement('div');
    badge.className = 'stamp-badge';
    badge.textContent = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    badge.title = formatVisitDateTime(timestamp);
    container.appendChild(badge);
  });
}

function formatVisitDateTime(timestamp) {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} às ${timePart}`;
}

function renderMRZ(person) {
  const name = person === 'wal' ? 'WAL' : 'LAY';
  const count = visitState[person].count;
  const memberCompact = formatPassportDate(MEMBER_SINCE.getTime()).replace(/ /g, '');

  const line1 = padMRZ(`${name}<<VISITANTE<<MANAUS`, 40);
  const line2 = padMRZ(`${String(count).padStart(3, '0')}BRA<<MEMBER${memberCompact}<<VOEGOL.COM.BR`, 40);

  document.getElementById(`passport-mrz-${person}`).textContent = `${line1}\n${line2}`;
}

function padMRZ(text, length) {
  const clean = text.toUpperCase();
  return clean.length >= length ? clean.slice(0, length) : clean + '<'.repeat(length - clean.length);
}

function openVisitModal(from) {
  const otherName = from === 'wal' ? 'Lay' : 'Wal';
  const stampColor = from === 'wal' ? '#A8DADC' : '#FFD166';

  pendingVisitFrom = from;
  document.getElementById('visit-modal-desc').textContent =
    `Você visitou ${otherName}? Receba seu carimbo de região, insira a data ou deixe em branco para contar como data de hoje.`;
  document.getElementById('visit-modal-icon').style.color = stampColor;
  document.getElementById('visit-modal-date').value = '';
  document.getElementById('visit-modal-confirm').disabled = false;
  document.getElementById('visit-modal-overlay').classList.add('open');
}

function closeVisitModal() {
  document.getElementById('visit-modal-overlay').classList.remove('open');
  pendingVisitFrom = null;
}

function closeOnVisitOverlay(event) {
  if (event.target === document.getElementById('visit-modal-overlay')) closeVisitModal();
}

function confirmVisit() {
  const from = pendingVisitFrom;
  if (!from) return;

  const dateValue = document.getElementById('visit-modal-date').value;
  const visitTimestamp = dateValue
    ? new Date(`${dateValue}T12:00:00`).getTime()
    : Date.now();

  document.getElementById('visit-modal-confirm').disabled = true;
  closeVisitModal();
  runStampAnimation(from, visitTimestamp);
}

function runStampAnimation(from, visitTimestamp) {
  const passportEl = document.getElementById(`passport-${from}`);
  passportEl.classList.add('passport-shake');

  const stamp = document.createElement('div');
  stamp.className = 'stamp-slam';
  stamp.innerHTML = '<i class="fa-solid fa-stamp"></i>';
  passportEl.appendChild(stamp);

  const anim = stamp.animate(
    [
      { transform: 'translate(-50%, -50%) scale(3) rotate(-25deg)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(-12deg)', opacity: 1, offset: 0.4 },
      { transform: 'translate(-50%, -50%) scale(1.05) rotate(-12deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(-12deg)', opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%, -50%) scale(1) rotate(-12deg)', opacity: 0, offset: 1 }
    ],
    { duration: 1100, easing: 'ease-out', fill: 'forwards' }
  );

  anim.onfinish = () => {
    stamp.remove();
    passportEl.classList.remove('passport-shake');
    visitsRef.child(from).child('history').push(visitTimestamp);
  };
}

function updateCounter(player) {
  const el = document.getElementById(`counter-${player}`);
  const prev = parseInt(el.textContent) || 0;
  el.textContent = state[player];
  if (state[player] !== prev) {
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }
}

function giveCoins(from, to) {
  setButtonsDisabled(true);

  const fromCard = document.getElementById(`card-${from}`);
  const toCard   = document.getElementById(`card-${to}`);

  const fromRect = fromCard.getBoundingClientRect();
  const toRect   = toCard.getBoundingClientRect();

  const startX = fromRect.left + fromRect.width  / 2;
  const startY = fromRect.top  + fromRect.height / 2;
  const endX   = toRect.left   + toRect.width    / 2;
  const endY   = toRect.top    + toRect.height   / 2;

  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 90;

  const coin = document.createElement('div');
  coin.className = 'flying-coin-anim';
  coin.textContent = '🪙';
  coin.style.left = `${startX}px`;
  coin.style.top  = `${startY}px`;
  document.body.appendChild(coin);

  const anim = coin.animate(
    [
      { left: `${startX}px`, top: `${startY}px`, opacity: '1', transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
      { left: `${midX}px`,   top: `${midY}px`,   opacity: '1', transform: 'translate(-50%, -50%) scale(2) rotate(180deg)' },
      { left: `${endX}px`,   top: `${endY}px`,   opacity: '0', transform: 'translate(-50%, -50%) scale(0.4) rotate(360deg)' }
    ],
    { duration: 900, easing: 'ease-in-out', fill: 'forwards' }
  );

  anim.onfinish = () => {
    coin.remove();
    db.ref(`coins/${to}`).transaction((val) => (val || 0) + 1);
  };
}

function setButtonsDisabled(disabled) {
  document.getElementById('btn-give-wal').disabled = disabled;
  document.getElementById('btn-give-lay').disabled = disabled;
}

function openSettings() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('password-input').value = '';
  document.getElementById('modal-error').textContent = '';
  setTimeout(() => document.getElementById('password-input').focus(), 250);
}

function closeSettings() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeOnOverlay(event) {
  if (event.target === document.getElementById('modal-overlay')) closeSettings();
}

function togglePassword() {
  const input = document.getElementById('password-input');
  const icon  = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

function handlePasswordKey(event) {
  if (event.key === 'Enter') confirmReset();
}

function confirmReset() {
  const input = document.getElementById('password-input');
  const error = document.getElementById('modal-error');

  if (input.value !== '0906') {
    error.textContent = 'Senha incorreta. Tente novamente.';
    input.value = '';
    input.focus();
    return;
  }

  coinsRef.set({ wal: 0, lay: 0 });
  closeSettings();
}

function updateLeaderBanner() {
  const banner = document.getElementById('leader-banner');
  const w = state.wal;
  const l = state.lay;

  if (w === l) {
    banner.innerHTML = 'Empate!';
    banner.style.color = 'rgba(255,255,255,0.65)';
  } else if (w > l) {
    banner.innerHTML = `<i class="fa-solid fa-crown"></i> Wal tá na frente com ${w} moeda${w !== 1 ? 's' : ''}!`;
    banner.style.color = '#FFD166';
  } else {
    banner.innerHTML = `<i class="fa-solid fa-crown"></i> Lay tá na frente com ${l} moeda${l !== 1 ? 's' : ''}!`;
    banner.style.color = '#A8DADC';
  }
}
