const initialCosts = { click: 15, startup: 60, retail: 500, oil: 4000, it: 30000 }, initialRECosts = { re_flat: 1200, re_floor: 8500, re_hotel: 75000, re_sky: 650000 };
let game = { balance: 0, clickPower: 1, baseIncome: 0, currentModifier: 1, lastSaveTime: Date.now(), ownedStocks: 0, lastDailyTime: 0, cryptoBtc: 0 };
let inventory = { click: 0, startup: 0, retail: 0, oil: 0, it: 0 }, reInventory = { re_flat: 0, re_floor: 0, re_hotel: 0, re_sky: 0 }, stockPrice = 35, btcPrice = 1000;

function playCoinSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
        const ctxAudio = new AudioContext(), osc = ctxAudio.createOscillator(), gain = ctxAudio.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(987.77, ctxAudio.currentTime); osc.frequency.setValueAtTime(1318.51, ctxAudio.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctxAudio.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctxAudio.currentTime + 0.3);
        osc.connect(gain); gain.connect(ctxAudio.destination); osc.start(); osc.stop(ctxAudio.currentTime + 0.3);
    } catch(e) {}
}

// === ИНИЦИАЛИЗАЦИЯ THREE.JS (ИСПРАВЛЕНО) ===
let scene, camera, renderer, coinMesh, container3D;
let isClicking = false, targetScaleZ = 1, currentScaleZ = 1;

function init3D() {
    container3D = document.getElementById('canvas3d-container');
    if (!container3D) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container3D.clientWidth / container3D.clientHeight, 0.1, 1000);
    camera.position.z = 5.5; // Слегка приблизили камеру для лучшей видимости

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container3D.clientWidth, container3D.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container3D.innerHTML = ""; // Очищаем контейнер перед добавлением холста
    container3D.appendChild(renderer.domElement);

    // Геометрия 3D монеты
    const geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.25, 40, 1);
    const material = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.2,
    });

    coinMesh = new THREE.Mesh(geometry, material);
    coinMesh.rotation.x = Math.PI / 2;
    scene.add(coinMesh);

    // Освещение сцены
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 5, 4);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xfacc15, 0.5);
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    // Параллакс при движении мыши
    window.addEventListener('mousemove', (e) => {
        if (!coinMesh) return;
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        coinMesh.rotation.y = (Math.PI / 2) + x * 0.4;
        coinMesh.rotation.z = y * 0.4;
    });

    // Страховочный фикс: принудительно обновляем размеры через 100мс после загрузки
    setTimeout(resize3D, 100);

    animate3D();
}

function resize3D() {
    if (renderer && camera && container3D) {
        const w = container3D.clientWidth;
        const h = container3D.clientHeight;
        if (w && h) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }
}

function animate3D() {
    requestAnimationFrame(animate3D);
    if (coinMesh) {
        if(!isClicking) coinMesh.rotation.y += 0.008;
        currentScaleZ += (targetScaleZ - currentScaleZ) * 0.25;
        coinMesh.scale.set(1, currentScaleZ, 1);
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// Слушатели нажатий на 3D монету
const container3DElement = document.getElementById('canvas3d-container');
if (container3DElement) {
    container3DElement.addEventListener('mousedown', (e) => {
        isClicking = true; targetScaleZ = 0.4;
        triggerClickLogic(e.clientX, e.clientY);
        setTimeout(() => { targetScaleZ = 1; isClicking = false; }, 80);
    });
    container3DElement.addEventListener('touchstart', (e) => {
        isClicking = true; targetScaleZ = 0.4;
        const touch = e.touches[0];
        triggerClickLogic(touch.clientX, touch.clientY);
        setTimeout(() => { targetScaleZ = 1; isClicking = false; }, 80);
    }, { passive: true });
}

function triggerClickLogic(clientX, clientY) {
    game.balance += game.clickPower;
    playCoinSound();
    if (clientX && clientY) {
        const el = document.createElement('div'); el.className = 'floating-income'; el.innerText = `+$${game.clickPower}`;
        el.style.left = `${clientX - 10}px`; el.style.top = `${clientY - 20}px`; document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }
    updateUI(); queueSave();
}

// === БАЗОВАЯ СТАТИСТИКА И ИНТЕРФЕЙС ===
const upgrades = [
    { id: 'click', name: 'Офисный Маркетинг', cost: 15, multiplier: 1.45, type: 'click', power: 1, desc: 'Клик +\$1' },
    { id: 'startup', name: 'Акции Венчуров', cost: 60, multiplier: 1.5, type: 'passive', power: 1, desc: 'Доход +\$1/с' },
    { id: 'retail', name: 'Франшизы Общепита', cost: 500, multiplier: 1.55, type: 'passive', power: 7, desc: 'Доход +\$7/с' },
    { id: 'oil', name: 'Скважины Сибири', cost: 4000, multiplier: 1.6, type: 'passive', power: 55, desc: 'Доход +\$55/с' },
    { id: 'it', name: 'Нейросети ИИ', cost: 30000, multiplier: 1.7, type: 'passive', power: 400, desc: 'Доход +\$400/с' }
], realEstateUpgrades = [
    { id: 're_flat', name: 'Смарт-Апартаменты', cost: 1200, multiplier: 1.4, power: 15, desc: 'Доход +\$15/с' },
    { id: 're_floor', name: 'Офисный Этаж', cost: 8500, multiplier: 1.45, power: 110, desc: 'Доход +\$110/с' },
    { id: 're_hotel', name: 'Сеть Хостелов', cost: 75000, multiplier: 1.5, power: 950, desc: 'Доход +\$950/с' },
    { id: 're_sky', name: 'Небоскреб Сити', cost: 650000, multiplier: 1.6, power: 8200, desc: 'Доход +\$8200/с' }
], ranks = [{ limit: 0, title: "💼 Стажер" }, { limit: 1000, title: "👔 Трейдер" }, { limit: 25000, title: "🏢 Директор" }, { limit: 500000, title: "🏦 Инвестор" }, { limit: 10000000, title: "👑 Магнат" }];

if (localStorage.getItem('biz_emp_v10')) {
    const saved = JSON.parse(localStorage.getItem('biz_emp_v10')); game = { ...game, ...saved.game }; inventory = { ...inventory, ...saved.inventory };
    if (saved.reInventory) reInventory = { ...reInventory, ...saved.reInventory };
    let actInc = game.baseIncome * game.currentModifier;
    if (actInc > 0 && game.lastSaveTime && saved.game) {
        let passed = Math.floor((Date.now() - game.lastSaveTime) / 1000);
        if (passed > 5) { game.balance += passed * actInc; setTimeout(() => alert(`Офлайн доход: ${formatMoney(passed * actInc)}`), 500); }
    }
    upgrades.forEach(up => up.cost = Math.round(initialCosts[up.id] * Math.pow(up.multiplier, inventory[up.id])));
    realEstateUpgrades.forEach(up => up.cost = Math.round(initialRECosts[up.id] * Math.pow(up.multiplier, reInventory[up.id])));
}

const canvas = document.getElementById('marketChart'), ctx = canvas.getContext('2d'); let chartData = Array(30).fill(35);
function initCanvas() { if(canvas) { const dpr = window.devicePixelRatio || 1; canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr; ctx.scale(dpr, dpr); } }

function drawChart() {
    if (!canvas || !canvas.offsetWidth) return; const w = canvas.width / (window.devicePixelRatio || 1), h = canvas.height / (window.devicePixelRatio || 1); ctx.clearRect(0, 0, w, h);
    const minP = Math.min(...chartData) - 3, maxP = Math.max(...chartData) + 3, range = maxP - minP, step = w / (chartData.length - 1);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; ctx.setLineDash([]);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke(); }
    let points = []; for (let i = 0; i < chartData.length; i++) points.push({ x: i * step, y: h - ((chartData[i] - minP) / range) * (h - 20) - 8 });
    const mainColor = game.currentModifier >= 1 ? '#10b981' : '#ef4444', gradColor = game.currentModifier >= 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    
    if(points.length > 0) {
        ctx.beginPath(); ctx.moveTo(points[0].x, h);
        for (let i = 0; i < points.length - 1; i++) ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i+1].x) / 2, (points[i].y + points[i+1].y) / 2);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y); ctx.lineTo(points[points.length - 1].x, h); ctx.closePath();
        let areaGrad = ctx.createLinearGradient(0, 0, 0, h); areaGrad.addColorStop(0, gradColor); areaGrad.addColorStop(1, 'transparent'); ctx.fillStyle = areaGrad; ctx.fill();
        ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = mainColor; ctx.shadowColor = mainColor; ctx.shadowBlur = 8; ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i+1].x) / 2, (points[i].y + points[i+1].y) / 2);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y); ctx.stroke(); ctx.shadowBlur = 0;
    }
}

function updateChartData() {
    chartData.shift(); let base = chartData[chartData.length - 1], noise = (Math.random() - 0.48) * 6; stockPrice = Math.max(5, Math.min(65, base + noise));
    if(game.currentModifier > 1) stockPrice = Math.min(65, stockPrice + 1.5); if(game.currentModifier < 1) stockPrice = Math.max(5, stockPrice - 1.5); chartData.push(stockPrice);
    btcPrice = Math.max(100, Math.min(1000000, btcPrice + (Math.random() - 0.5) * (btcPrice * 0.18)));
const lbl = document.getElementById('stockLabel'); if (lbl) lbl.innerText = Индекс акций: $${stockPrice.toFixed(2)}; drawChart(); updateUI(); renderCrypto();
}
function formatMoney(n) { if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + ' Б'; if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + ' М'; if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + ' К'; return '$' + Math.floor(n); }
const balDisp = document.getElementById('balanceDisplay'), incDisp = document.getElementById('incomeDisplay'), rankDisp = document.getElementById('rankDisplay'), shopList = document.getElementById('shopList'), realEstateList = document.getElementById('realEstateList'), cryptoList = document.getElementById('cryptoList');
const buyStockBtn = document.getElementById('buyStockBtn'), buyStock10Btn = document.getElementById('buyStock10Btn'), buyStockMaxBtn = document.getElementById('buyStockMaxBtn'), sellStockBtn = document.getElementById('sellStockBtn'), dailyBtn = document.getElementById('dailyBtn');
function renderShop() {
if (!shopList) return; shopList.innerHTML = '';
upgrades.forEach(up => {
const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = btn-${up.id};
btn.innerHTML = <div class="asset-content"><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Ур. ${inventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>;
btn.addEventListener('click', (e) => { e.stopPropagation(); buyAsset(up); }); shopList.appendChild(btn);
});
}
function renderRealEstate() {
if (!realEstateList) return; realEstateList.innerHTML = '';
realEstateUpgrades.forEach(up => {
const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = btn-${up.id};
btn.innerHTML = <div class="asset-content"><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Владеете: ${reInventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>;
btn.addEventListener('click', (e) => { e.stopPropagation(); buyRealEstate(up); }); realEstateList.appendChild(btn);
});
}
function renderCrypto() {
if (!cryptoList) return; cryptoList.innerHTML = <div class="asset-item" style="flex-direction:column; align-items:flex-start; gap:4px;"><div style="display:flex; justify-content:space-between; width:100%; align-items:center;"><div class="asset-content"><div><div class="asset-name">Bitcoin (BTC)</div><div class="asset-stats">В наличии: ${(game.cryptoBtc || 0).toFixed(4)} BTC</div></div></div><div class="asset-cost" style="color:#f59e0b;">$${btcPrice.toFixed(2)}</div></div><div class="crypto-trade-row"><button class="crypto-btn crypto-buy-btn" id="buyBtcBtn" ${game.balance < btcPrice ? 'disabled' : ''}>Купить 1 BTC</button><button class="crypto-btn crypto-sell-btn" id="sellBtcBtn" ${(!game.cryptoBtc || game.cryptoBtc < 1) ? 'disabled' : ''}>Продать 1 BTC</button></div></div>;
const bBtn = document.getElementById('buyBtcBtn'), sBtn = document.getElementById('sellBtcBtn');
if(bBtn) bBtn.addEventListener('click', () => { if(game.balance >= btcPrice) { game.balance -= btcPrice; game.cryptoBtc = (game.cryptoBtc || 0) + 1; updateUI(); renderCrypto(); saveGame(); } });
if(sBtn) sBtn.addEventListener('click', () => { if(game.cryptoBtc >= 1) { game.cryptoBtc -= 1; game.balance += btcPrice; updateUI(); renderCrypto(); saveGame(); } });
}
function updateUI() {
if (balDisp) balDisp.innerText = formatMoney(game.balance); let actInc = game.baseIncome * game.currentModifier; if (incDisp) incDisp.innerText = Доход: ${formatMoney(actInc)}/с + (game.currentModifier !== 1 ?  (x${game.currentModifier}) : '');
let currRank = ranks[0].title; for(let r of ranks) { if(game.balance >= r.limit) currRank = r.title; } if (rankDisp) rankDisp.innerText = currRank;
upgrades.forEach(up => { const btn = document.getElementById(btn-${up.id}); if (btn) btn.disabled = game.balance < up.cost; });
realEstateUpgrades.forEach(up => { const btn = document.getElementById(btn-${up.id}); if (btn) btn.disabled = game.balance < up.cost; });
if (buyStockBtn) { buyStockBtn.disabled = game.balance < stockPrice; buyStockBtn.innerText = Купить 1 (${game.ownedStocks}); }
if (buyStock10Btn) buyStock10Btn.disabled = game.balance < (stockPrice * 10); if (buyStockMaxBtn) buyStockMaxBtn.disabled = game.balance < stockPrice;
if (sellStockBtn) sellStockBtn.disabled = game.ownedStocks <= 0; if (dailyBtn) dailyBtn.disabled = (Date.now() - game.lastDailyTime) <= 86400000;
}
function saveGame() { localStorage.setItem('biz_emp_v10', JSON.stringify({ game, inventory, reInventory })); }
let saveTimeout; function queueSave() { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveGame, 1500); }
function buyAsset(asset) { if (game.balance >= asset.cost) { game.balance -= asset.cost; inventory[asset.id]++; if (asset.type === 'click') game.clickPower += asset.power; else game.baseIncome += asset.power; asset.cost = Math.round(initialCosts[asset.id] * Math.pow(asset.multiplier, inventory[asset.id])); renderShop(); updateUI(); saveGame(); } }
function buyRealEstate(asset) { if (game.balance >= asset.cost) { game.balance -= asset.cost; reInventory[asset.id]++; game.baseIncome += asset.power; asset.cost = Math.round(initialRECosts[asset.id] * Math.pow(asset.multiplier, reInventory[asset.id])); renderRealEstate(); updateUI(); saveGame(); } }
const upgradesTabBtn = document.getElementById('navShopBtn'), reTabBtn = document.getElementById('navRealEstateBtn'), cryptoTabBtn = document.getElementById('navCryptoBtn');
const businessContainer = document.getElementById('businessContainer'), realEstateContainer = document.getElementById('realEstateContainer'), cryptoContainer = document.getElementById('cryptoContainer');
if (upgradesTabBtn && reTabBtn && cryptoTabBtn) {
function switchTab(activeBtn, activeContainer) { [upgradesTabBtn, reTabBtn, cryptoTabBtn].forEach(b => b.classList.remove('active')); [businessContainer, realEstateContainer, cryptoContainer].forEach(c => { if(c) c.classList.add('hidden'); }); activeBtn.classList.add('active'); activeContainer.classList.remove('hidden'); }
upgradesTabBtn.addEventListener('click', () => switchTab(upgradesTabBtn, businessContainer)); reTabBtn.addEventListener('click', () => switchTab(reTabBtn, realEstateContainer)); cryptoTabBtn.addEventListener('click', () => switchTab(cryptoTabBtn, cryptoContainer));
}
if (buyStockBtn) buyStockBtn.addEventListener('click', () => { if (game.balance >= stockPrice) { game.balance -= stockPrice; game.ownedStocks++; updateUI(); saveGame(); } });
if (buyStock10Btn) buyStock10Btn.addEventListener('click', () => { if (game.balance >= (stockPrice * 10)) { game.balance -= (stockPrice * 10); game.ownedStocks += 10; updateUI(); saveGame(); } });
if (buyStockMaxBtn) buyStockMaxBtn.addEventListener('click', () => { let max = Math.floor(game.balance / stockPrice); if (max > 0) { game.balance -= (max * stockPrice); game.ownedStocks += max; updateUI(); saveGame(); } });
if (sellStockBtn) sellStockBtn.addEventListener('click', () => { if (game.ownedStocks > 0) { game.balance += game.ownedStocks * stockPrice; game.ownedStocks = 0; updateUI(); saveGame(); } });
window.addEventListener('resize', () => { initCanvas(); drawChart(); resize3D(); });
setInterval(() => { if (game.baseIncome > 0) { game.balance += (game.baseIncome * game.currentModifier) / 10; updateUI(); } }, 100);
setInterval(updateChartData, 1000); setInterval(() => { game.lastSaveTime = Date.now(); saveGame(); }, 5000);
initCanvas(); renderShop(); renderRealEstate(); renderCrypto(); updateUI(); drawChart(); init3D();
