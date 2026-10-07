const initialCosts = { click: 15, startup: 60, retail: 500, oil: 4000, it: 30000 };
const initialRECosts = { re_flat: 1200, re_floor: 8500, re_hotel: 75000, re_sky: 650000 };

let game = { balance: 0, clickPower: 1, baseIncome: 0, currentModifier: 1, lastSaveTime: Date.now(), ownedStocks: 0, lastDailyTime: 0 };
let inventory = { click: 0, startup: 0, retail: 0, oil: 0, it: 0 };
let reInventory = { re_flat: 0, re_floor: 0, re_hotel: 0, re_sky: 0 };
let stockPrice = 35;

const upgrades = [
    { id: 'click', name: 'Офисный Маркетинг', class: 'ico-click', cost: 15, multiplier: 1.45, type: 'click', power: 1, desc: 'Клик +\$1' },
    { id: 'startup', name: 'Акции Венчуров', class: 'ico-startup', cost: 60, multiplier: 1.5, type: 'passive', power: 1, desc: 'Доход +\$1/с' },
    { id: 'retail', name: 'Франшизы Общепита', class: 'ico-retail', cost: 500, multiplier: 1.55, type: 'passive', power: 7, desc: 'Доход +\$7/с' },
    { id: 'oil', name: 'Скважины Сибири', class: 'ico-oil', cost: 4000, multiplier: 1.6, type: 'passive', power: 55, desc: 'Доход +\$55/с' },
    { id: 'it', name: 'Нейросети ИИ', class: 'ico-it', cost: 30000, multiplier: 1.7, type: 'passive', power: 400, desc: 'Доход +\$400/с' }
];

const realEstateUpgrades = [
    { id: 're_flat', name: 'Смарт-Апартаменты', class: 'ico-flat', cost: 1200, multiplier: 1.4, power: 15, desc: 'Доход +\$15/с' },
    { id: 're_floor', name: 'Офисный Этаж', class: 'ico-floor', cost: 8500, multiplier: 1.45, power: 110, desc: 'Доход +\$110/с' },
    { id: 're_hotel', name: 'Сеть Хостелов', class: 'ico-hotel', cost: 75000, multiplier: 1.5, power: 950, desc: 'Доход +\$950/с' },
    { id: 're_sky', name: 'Небоскреб Сити', class: 'ico-sky', cost: 650000, multiplier: 1.6, power: 8200, desc: 'Доход +\$8200/с' }
];

const ranks = [
    { limit: 0, title: "💼 Стажер" }, { limit: 1000, title: "👔 Трейдер" },
    { limit: 25000, title: "🏢 Директор" }, { limit: 500000, title: "🏦 Инвестор" }, { limit: 10000000, title: "👑 Магнат" }
];

// Загрузка сохранений
if (localStorage.getItem('biz_emp_v9')) {
    const saved = JSON.parse(localStorage.getItem('biz_emp_v9'));
    game = { ...game, ...saved.game }; inventory = { ...inventory, ...saved.inventory };
    if (saved.reInventory) reInventory = { ...reInventory, ...saved.reInventory };
    
    let actInc = game.baseIncome * game.currentModifier;
    if (actInc > 0 && game.lastSaveTime) {
        let passed = Math.floor((Date.now() - game.lastSaveTime) / 1000);
        if (passed > 5) {
            game.balance += passed * actInc;
            setTimeout(() => alert(`Доход за время отсутствия: ${formatMoney(passed * actInc)}`), 500);
        }
    }
    upgrades.forEach(up => up.cost = Math.round(initialCosts[up.id] * Math.pow(up.multiplier, inventory[up.id])));
    realEstateUpgrades.forEach(up => up.cost = Math.round(initialRECosts[up.id] * Math.pow(up.multiplier, reInventory[up.id])));
}

const canvas = document.getElementById('marketChart'), ctx = canvas.getContext('2d');
let chartData = Array(30).fill(35);

function initCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
}

function drawChart() {
    if (!canvas || !canvas.offsetWidth) return;
    const w = canvas.width / (window.devicePixelRatio || 1), h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h); ctx.beginPath(); ctx.lineWidth = 2;
    ctx.strokeStyle = game.currentModifier >= 1 ? '#16a34a' : '#dc2626';
    
    const step = w / (chartData.length - 1), minP = Math.min(...chartData) - 5, maxP = Math.max(...chartData) + 5, range = maxP - minP;
    for(let i=0; i<chartData.length; i++) {
        let x = i * step, y = h - ((chartData[i] - minP) / range) * (h - 15) - 5;
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function updateChartData() {
    chartData.shift(); let base = chartData[chartData.length - 1], noise = (Math.random() - 0.48) * 6;
    stockPrice = Math.max(5, Math.min(65, base + noise));
    if(game.currentModifier > 1) stockPrice = Math.min(65, stockPrice + 1.5);
    if(game.currentModifier < 1) stockPrice = Math.max(5, stockPrice - 1.5);
    chartData.push(stockPrice);
    const lbl = document.getElementById('stockLabel'); if (lbl) lbl.innerText = `Индекс акций: $${stockPrice.toFixed(2)}`;
    drawChart(); updateUI();
}

const newsTicker = document.getElementById('newsTicker');
function triggerEvent() {
    const rand = Math.random(); if (!newsTicker) return;
    if (rand < 0.35) {
        game.currentModifier = 0.4; newsTicker.style.display = 'block'; newsTicker.style.background = 'rgba(220, 38, 38, 0.1)'; newsTicker.style.borderColor = '#dc2626'; newsTicker.style.color = '#dc2626';
        newsTicker.innerText = "🚨 НАЛОГОВЫЙ КРИЗИС: Акции падают, доходы снижены на 60%!";
    } else if (rand > 0.65) {
        game.currentModifier = 2.0; newsTicker.style.display = 'block'; newsTicker.style.background = 'rgba(22, 163, 74, 0.1)'; newsTicker.style.borderColor = '#16a34a'; newsTicker.style.color = '#16a34a';
        newsTicker.innerText = "🚀 ЭКОНОМИЧЕСКИЙ БУМ: Рынок растет, доходы увеличены в 2 раза!";
    } else { game.currentModifier = 1.0; newsTicker.style.display = 'none'; }
}

function formatMoney(n) {
    if (n >= 1e9) return '\$' + (n / 1e9).toFixed(2) + ' Б';
    if (n >= 1e6) return '\$' + (n / 1e6).toFixed(2) + ' М';
    if (n >= 1e3) return '\$' + (n / 1e3).toFixed(1) + ' К';
    return '\$' + Math.floor(n);
}

const balDisp = document.getElementById('balanceDisplay'), incDisp = document.getElementById('incomeDisplay'), rankDisp = document.getElementById('rankDisplay'), shopList = document.getElementById('shopList'), realEstateList = document.getElementById('realEstateList');
const buyStockBtn = document.getElementById('buyStockBtn'), sellStockBtn = document.getElementById('sellStockBtn'), dailyBtn = document.getElementById('dailyBtn');

function renderShop() {
    if (!shopList) return; shopList.innerHTML = '';
    upgrades.forEach(up => {
        const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = `btn-${up.id}`;
        btn.innerHTML = `<div class="asset-content"><div class="icon-wrapper"><div class="${up.class}"></div></div><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Ур. ${inventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>`;
        btn.addEventListener('click', (e) => { e.stopPropagation(); buyAsset(up); }); shopList.appendChild(btn);
    });
}

function renderRealEstate() {
    if (!realEstateList) return; realEstateList.innerHTML = '';
    realEstateUpgrades.forEach(up => {
        const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = `btn-${up.id}`;
        btn.innerHTML = `<div class="asset-content"><div class="icon-wrapper"><div class="${up.class}"></div></div><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Владеете: ${reInventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>`;
        btn.addEventListener('click', (e) => { e.stopPropagation(); buyRealEstate(up); }); realEstateList.appendChild(btn);
    });
}

function updateUI() {
    if (balDisp) balDisp.innerText = formatMoney(game.balance);
    let actInc = game.baseIncome * game.currentModifier;
    if (incDisp) incDisp.innerText = `Доход: ${formatMoney(actInc)}/с` + (game.currentModifier !== 1 ? ` (x${game.currentModifier})` : '');
    
    // ИСПРАВЛЕНО: Безопасное получение начального ранга из нулевой ячейки массива
    let currRank = ranks[0].title;
    for(let r of ranks) { if(game.balance >= r.limit) currRank = r.title; }
    if (rankDisp) rankDisp.innerText = currRank;
    
    upgrades.forEach(up => { const btn = document.getElementById(`btn-${up.id}`); if (btn) btn.disabled = game.balance < up.cost; });
    realEstateUpgrades.forEach(up => { const btn = document.getElementById(`btn-${up.id}`); if (btn) btn.disabled = game.balance < up.cost; });
    if (buyStockBtn) { buyStockBtn.disabled = game.balance < stockPrice; buyStockBtn.innerText = `Купить 1 шт. (${game.ownedStocks})`; }
    if (sellStockBtn) sellStockBtn.disabled = game.ownedStocks <= 0;
    if (dailyBtn) dailyBtn.disabled = (Date.now() - game.lastDailyTime) <= 86400000;
}

function saveGame() { localStorage.setItem('biz_emp_v9', JSON.stringify({ game, inventory, reInventory })); }
let saveTimeout; function queueSave() { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveGame, 1500); }

function handleCoinClick(e) {
    e.preventDefault(); game.balance += game.clickPower;
    let cX = e.clientX || (e.touches && e.touches.clientX), cY = e.clientY || (e.touches && e.touches.clientY);
    const coinEl = document.getElementById('mainCoin'); if (!coinEl) return;
    const rect = coinEl.getBoundingClientRect(), cX_ctr = rect.left + rect.width / 2, cY_ctr = rect.top + rect.height / 2;
    
    if (cX && cY) {
        const tX = ((cY - cY_ctr) / (rect.height / 2)) * -15, tY = ((cX - cX_ctr) / (rect.width / 2)) * 15;
        coinEl.style.transform = `scale(0.90) rotateX(${tX}deg) rotateY(${tY}deg) translateY(4px)`;
        setTimeout(() => { coinEl.style.transform = ''; }, 100);
        const el = document.createElement('div'); el.className = 'floating-income'; el.innerText = `+$${game.clickPower}`;
        el.style.left = `${cX - 10}px`; el.style.top = `${cY - 20}px`; document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }
    updateUI(); queueSave();
}

function buyAsset(asset) {
    if (game.balance >= asset.cost) {
        game.balance -= asset.cost; inventory[asset.id]++;
        if (asset.type === 'click') game.clickPower += asset.power; else game.baseIncome += asset.power;
asset.cost = Math.round(initialCosts[asset.id] * Math.pow(asset.multiplier, inventory[asset.id])); renderShop(); updateUI(); saveGame();
}
}
function buyRealEstate(asset) {
if (game.balance >= asset.cost) {
game.balance -= asset.cost; reInventory[asset.id]++; game.baseIncome += asset.power;
asset.cost = Math.round(initialRECosts[asset.id] * Math.pow(asset.multiplier, reInventory[asset.id])); renderRealEstate(); updateUI(); saveGame();
}
}
const navShopBtn = document.getElementById('navShopBtn'), navRealEstateBtn = document.getElementById('navRealEstateBtn');
const businessContainer = document.getElementById('businessContainer'), realEstateContainer = document.getElementById('realEstateContainer');
if (navShopBtn && navRealEstateBtn) {
navShopBtn.addEventListener('click', () => {
navShopBtn.classList.add('active'); navRealEstateBtn.classList.remove('active');
if (businessContainer) businessContainer.classList.remove('hidden'); if (realEstateContainer) realEstateContainer.classList.add('hidden');
});
navRealEstateBtn.addEventListener('click', () => {
navRealEstateBtn.classList.add('active'); navShopBtn.classList.remove('active');
if (realEstateContainer) realEstateContainer.classList.remove('hidden'); if (businessContainer) businessContainer.classList.add('hidden');
});
}
if (buyStockBtn) buyStockBtn.addEventListener('click', () => { if (game.balance >= stockPrice) { game.balance -= stockPrice; game.ownedStocks++; updateUI(); saveGame(); } });
if (sellStockBtn) sellStockBtn.addEventListener('click', () => { if (game.ownedStocks > 0) { game.balance += game.ownedStocks * stockPrice; game.ownedStocks = 0; updateUI(); saveGame(); } });
if (dailyBtn) dailyBtn.addEventListener('click', () => { if ((Date.now() - game.lastDailyTime) > 86400000) { let rwd = 100 + (game.baseIncome * 60); game.balance += rwd; game.lastDailyTime = Date.now(); alert(Субсидия: ${formatMoney(rwd)}!); updateUI(); saveGame(); } });
const mainCoin = document.getElementById('mainCoin');
if (mainCoin) {
mainCoin.addEventListener('touchstart', handleCoinClick, { passive: false });
mainCoin.addEventListener('mousedown', (e) => { if ('ontouchstart' in window) return; handleCoinClick(e); });
}
window.addEventListener('resize', () => { initCanvas(); drawChart(); });
setInterval(() => { if (game.baseIncome > 0) { game.balance += (game.baseIncome * game.currentModifier) / 10; updateUI(); } }, 100);
setInterval(updateChartData, 1000); setInterval(triggerEvent, 25000); setInterval(() => { game.lastSaveTime = Date.now(); saveGame(); }, 5000);
initCanvas(); renderShop(); renderRealEstate(); updateUI(); drawChart();
