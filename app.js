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

const state = { wal: 0, lay: 0 };

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
