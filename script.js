```javascript
const initialCosts = { 
    click: 15, 
    startup: 60, 
    retail: 500, 
    oil: 4000, 
    it: 30000 
};

const initialRECosts = { 
    re_flat: 1200, 
    re_floor: 8500, 
    re_hotel: 75000, 
    re_sky: 650000 
};

let game = { 
    balance: 0, 
    clickPower: 1, 
    baseIncome: 0, 
    currentModifier: 1, 
    lastSaveTime: Date.now(), 
    ownedStocks: 0, 
    lastDailyTime: 0, 
    cryptoBtc: 0 
};

let inventory = { click: 0, startup: 0, retail: 0, oil: 0, it: 0 };
let reInventory = { re_flat: 0, re_floor: 0, re_hotel: 0, re_sky: 0 };

let stockPrice = 35;
let btcPrice = 1000;

function playCoinSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctxAudio = new AudioContext();
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctxAudio.currentTime);
        osc.frequency.setValueAtTime(1318.51, ctxAudio.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.1, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctxAudio.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctxAudio.destination);
        
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.3);
    } catch (e) {
        console.error("Ошибка звука: ", e);
    }
}

const upgrades = [
    { id: 'click', name: 'Офисный Маркетинг', cost: 15, multiplier: 1.45, type: 'click', power: 1, desc: 'Клик +$1' },
    { id: 'startup', name: 'Акции Венчуров', cost: 60, multiplier: 1.5, type: 'passive', power: 1, desc: 'Доход +$1/с' },
    { id: 'retail', name: 'Франшизы Общепита', cost: 500, multiplier: 1.55, type: 'passive', power: 7, desc: 'Доход +$7/с' },
    { id: 'oil', name: 'Скважины Сибири', cost: 4000, multiplier: 1.6, type: 'passive', power: 55, desc: 'Доход +$55/с' },
    { id: 'it', name: 'Нейросети ИИ', cost: 30000, multiplier: 1.7, type: 'passive', power: 400, desc: 'Доход +$400/с' }
];

const realEstateUpgrades = [
    { id: 're_flat', name: 'Смарт-Апартаменты', cost: 1200, multiplier: 1.4, power: 15, desc: 'Доход +$15/с' },
    { id: 're_floor', name: 'Офисный Этаж', cost: 8500, multiplier: 1.45, power: 110, desc: 'Доход +$110/с' },
    { id: 're_hotel', name: 'Сеть Хостелов', cost: 75000, multiplier: 1.5, power: 950, desc: 'Доход +$950/с' },
    { id: 're_sky', name: 'Небоскреб Сити', cost: 650000, multiplier: 1.6, power: 8200, desc: 'Доход +$8200/с' }
];

const ranks = [
    { limit: 0, title: "💼 Стажер" },
    { limit: 1000, title: "👔 Трейдер" },
    { limit: 25000, title: "🏢 Директор" },
    { limit: 500000, title: "🏦 Инвестор" },
    { limit: 10000000, title: "👑 Магнат" }
];

if (localStorage.getItem('biz_emp_v10')) {
    const saved = JSON.parse(localStorage.getItem('biz_emp_v10'));
    game = { ...game, ...saved.game };
    inventory = { ...inventory, ...saved.inventory };
    
    if (saved.reInventory) {
        reInventory = { ...reInventory, ...saved.reInventory };
    }
    
    let actInc = game.baseIncome * game.currentModifier;
    if (actInc > 0 && game.lastSaveTime && saved.game) {
        let passed = Math.floor((Date.now() - game.lastSaveTime) / 1000);
        if (passed > 5) {
            game.balance += passed * actInc;
            setTimeout(function() {
                alert(`Офлайн доход: ${formatMoney(passed * actInc)}`);
            }, 500);
        }
    }
    
    upgrades.forEach(function(up) {
        up.cost = Math.round(initialCosts[up.id] * Math.pow(up.multiplier, inventory[up.id]));
    });
    
    realEstateUpgrades.forEach(function(up) {
        up.cost = Math.round(initialRECosts[up.id] * Math.pow(up.multiplier, reInventory[up.id]));
    });
}

const canvas = document.getElementById('marketChart');
const ctx = canvas.getContext('2d');
let chartData = Array(30).fill(35);

function initCanvas() {
    if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
    }
}

// ПОЛНЫЙ ФИКС ОШИБКИ: points[0] вместо points.x
function drawChart() {
    if (!canvas || !canvas.offsetWidth) return;
    
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);
    
    const minP = Math.min(...chartData) - 3;
    const maxP = Math.max(...chartData) + 3;
    const range = maxP - minP;
    const step = w / (chartData.length - 1);
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
        ctx.moveTo(0, (h / 4) * i);
        ctx.lineTo(w, (h / 4) * i);
    }
    ctx.stroke();
    
    let points = [];
    for (let i = 0; i < chartData.length; i++) {
        points.push({ 
            x: i * step, 
            y: h - ((chartData[i] - minP) / range) * (h - 20) - 8 
        });
    }
    
    const mainColor = game.currentModifier >= 1 ? '#10b981' : '#ef4444';
    const gradColor = game.currentModifier >= 1 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    
    if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, h);
        for (let i = 0; i < points.length - 1; i++) {
            ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i+1].x) / 2, (points[i].y + points[i+1].y) / 2);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, h);
        ctx.closePath();
        
        let areaGrad = ctx.createLinearGradient(0, 0, 0, h);
        areaGrad.addColorStop(0, gradColor);
        areaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = areaGrad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = mainColor;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 8;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i+1].x) / 2, (points[i].y + points[i+1].y) / 2);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function updateChartData() {
    chartData.shift();
    let base = chartData[chartData.length - 1];
    let noise = (Math.random() - 0.48) * 6;
    stockPrice = Math.max(5, Math.min(65, base + noise));
    
    if (game.currentModifier > 1) stockPrice = Math.min(65, stockPrice + 1.5);
    if (game.currentModifier < 1) stockPrice = Math.max(5, stockPrice - 1.5);
    chartData.push(stockPrice);
    
    btcPrice = Math.max(100, Math.min(1000000, btcPrice + (Math.random() - 0.5) * (btcPrice * 0.18)));
    
    const lbl = document.getElementById('stockLabel');
    if (lbl) lbl.innerText = `Индекс акций: $${stockPrice.toFixed(2)}`;
    
    drawChart();
    updateUI();
    renderCrypto();
}

function formatMoney(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + ' Б';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + ' М';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + ' К';
    return '$' + Math.floor(n);
}

const balDisp = document.getElementById('balanceDisplay');
const incDisp = document.getElementById('incomeDisplay');
const rankDisp = document.getElementById('rankDisplay');
const shopList = document.getElementById('shopList');
const realEstateList = document.getElementById('realEstateList');
const cryptoList = document.getElementById('cryptoList');

const buyStockBtn = document.getElementById('buyStockBtn');
const buyStock10Btn = document.getElementById('buyStock10Btn');
const buyStockMaxBtn = document.getElementById('buyStockMaxBtn');
const sellStockBtn = document.getElementById('sellStockBtn');
const dailyBtn = document.getElementById('dailyBtn');

function renderShop() {
    if (!shopList) return;
    shopList.innerHTML = '';
    upgrades.forEach(function(up) {
        const btn = document.createElement('button');
        btn.className = 'asset-item';
        btn.id = "btn-" + up.id;
        btn.innerHTML = `<div class="asset-content"><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Ур. ${inventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>`;
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            buyAsset(up);
        });
        shopList.appendChild(btn);
    });
}

function renderRealEstate() {
    if (!realEstateList) return;
    realEstateList.innerHTML = '';
    realEstateUpgrades.forEach(function(up) {
        const btn = document.createElement('button');
        btn.className = 'asset-item';
        btn.id = "btn-" + up.id;
        btn.innerHTML = `<div class="asset-content"><div><div class="asset-name">${up.name}</div><div class="asset-stats">${up.desc} | Владеете: ${reInventory[up.id]}</div></div></div><div class="asset-cost">${formatMoney(up.cost)}</div>`;
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            buyRealEstate(up);
        });
        realEstateList.appendChild(btn);
    });
}

function renderCrypto() {
    if (!cryptoList) return;
cryptoList.innerHTML = <div class="asset-item" style="flex-direction:column; align-items:flex-start; gap:4px;"><div style="display:flex; justify-content:space-between; width:100%; align-items:center;"><div class="asset-content"><div><div class="asset-name">Bitcoin (BTC)</div><div class="asset-stats">В наличии: ${(game.cryptoBtc || 0).toFixed(4)} BTC</div></div></div><div class="asset-cost" style="color:#f59e0b;">$${btcPrice.toFixed(2)}</div></div><div class="crypto-trade-row"><button class="crypto-btn crypto-buy-btn" id="buyBtcBtn" ${game.balance < btcPrice ? 'disabled' : ''}>Купить 1 BTC</button><button class="crypto-btn crypto-sell-btn" id="sellBtcBtn" ${(!game.cryptoBtc || game.cryptoBtc < 1) ? 'disabled' : ''}>Продать 1 BTC</button></div></div>;
const bBtn = document.getElementById('buyBtcBtn');
const sBtn = document.getElementById('sellBtcBtn');
if (bBtn) {
bBtn.addEventListener('click', function() {
if (game.balance >= btcPrice) {
game.balance -= btcPrice;
game.cryptoBtc = (game.cryptoBtc || 0) + 1;
updateUI();
renderCrypto();
saveGame();
}
});
}
if (sBtn) {
sBtn.addEventListener('click', function() {
if (game.cryptoBtc >= 1) {
game.cryptoBtc -= 1;
game.balance += btcPrice;
updateUI();
renderCrypto();
saveGame();
}
});
}
}
function updateUI() {
if (balDisp) balDisp.innerText = formatMoney(game.balance);
let actInc = game.baseIncome * game.currentModifier;
if (incDisp) {
incDisp.innerText = Доход: ${formatMoney(actInc)}/с + (game.currentModifier !== 1 ?  (x${game.currentModifier}) : '');
}
let currRank = "💼 Стажер";
for (let i = 0; i < ranks.length; i++) {
if (game.balance >= ranks[i].limit) {
currRank = ranks[i].title;
}
}
if (rankDisp) rankDisp.innerText = currRank;

    upgrades.forEach(function(up) {
const btn = document.getElementById("btn-" + up.id);
if (btn) btn.disabled = game.balance < up.cost;
});
realEstateUpgrades.forEach(function(up) {
const btn = document.getElementById("btn-" + up.id);
if (btn) btn.disabled = game.balance < up.cost;
});
if (buyStockBtn) {
buyStockBtn.disabled = game.balance < stockPrice;
buyStockBtn.innerText = Купить 1 (${game.ownedStocks});
}
if (buyStock10Btn) buyStock10Btn.disabled = game.balance < (stockPrice * 10);
if (buyStockMaxBtn) buyStockMaxBtn.disabled = game.balance < stockPrice;
if (sellStockBtn) sellStockBtn.disabled = game.ownedStocks <= 0;
if (dailyBtn) dailyBtn.disabled = (Date.now() - game.lastDailyTime) <= 86400000;
}

function saveGame() {
localStorage.setItem('biz_emp_v10', JSON.stringify({ game, inventory, reInventory }));
}

let saveTimeout;
function queueSave() {
clearTimeout(saveTimeout);
saveTimeout = setTimeout(saveGame, 1500);
}

function handleCoinClick(e) {
e.preventDefault();
game.balance += game.clickPower;
playCoinSound();
let cX = e.clientX || (e.touches && e.touches.clientX);
let cY = e.clientY || (e.touches && e.touches.clientY);
const coinEl = document.getElementById('mainCoin');

    if (coinEl && cX && cY) {
const rect = coinEl.getBoundingClientRect();
const cX_ctr = rect.left + rect.width / 2;
const cY_ctr = rect.top + rect.height / 2;
const tX = ((cY - cY_ctr) / (rect.height / 2)) * -25;
const tY = ((cX - cX_ctr) / (rect.width / 2)) * 25;
coinEl.style.transform = rotateX(${12 + tX}deg) rotateY(${-14 + tY}deg) translateZ(-10px);
setTimeout(function() {
coinEl.style.transform = 'rotateX(12deg) rotateY(-14deg) translateZ(0)';
}, 80);
    
const el = document.createElement('div');
el.className = 'floating-income';
el.innerText = +$${game.clickPower};
el.style.left = ${cX - 10}px;
el.style.top = ${cY - 20}px;
document.body.appendChild(el);

    setTimeout(function() {
el.remove();
}, 500);
}
updateUI();
queueSave();
}

function buyAsset(asset) {
if (game.balance >= asset.cost) {
game.balance -= asset.cost;
inventory[asset.id]++;
if (asset.type === 'click') {
game.clickPower += asset.power;
} else {
game.baseIncome += asset.power;
}
asset.cost = Math.round(initialCosts[asset.id] * Math.pow(asset.multiplier, inventory[asset.id]));
renderShop();
updateUI();
saveGame();
}
}

function buyRealEstate(asset) {
if (game.balance >= asset.cost) {
game.balance -= asset.cost;
reInventory[asset.id]++;
game.baseIncome += asset.power;
asset.cost = Math.round(initialRECosts[asset.id] * Math.pow(asset.multiplier, reInventory[asset.id]));
renderRealEstate();
updateUI();
saveGame();
}
}

const navShopBtn = document.getElementById('navShopBtn');
const navRealEstateBtn = document.getElementById('navRealEstateBtn');
const navCryptoBtn = document.getElementById('navCryptoBtn');

const businessContainer = document.getElementById('businessContainer');
const realEstateContainer = document.getElementById('realEstateContainer');
const cryptoContainer = document.getElementById('cryptoContainer');

if (navShopBtn && navRealEstateBtn && navCryptoBtn) {
function switchTab(activeBtn, activeContainer) {
[navShopBtn, navRealEstateBtn, navCryptoBtn].forEach(function(b) { b.classList.remove('active'); });
[businessContainer, realEstateContainer, cryptoContainer].forEach(function(c) { if (c) c.classList.add('hidden'); });
activeBtn.classList.add('active');
activeContainer.classList.remove('hidden');
}
navShopBtn.addEventListener('click', function() { switchTab(navShopBtn, businessContainer); });
navRealEstateBtn.addEventListener('click', function() { switchTab(navRealEstateBtn, realEstateContainer); });
navCryptoBtn.addEventListener('click', function() { switchTab(navCryptoBtn, cryptoContainer); });
}

if (buyStockBtn) buyStockBtn.addEventListener('click', function() { if (game.balance >= stockPrice) { game.balance -= stockPrice; game.ownedStocks++; updateUI(); saveGame(); } });
if (buyStock10Btn) buyStock10Btn.addEventListener('click', function() { if (game.balance >= (stockPrice * 10)) { game.balance -= (stockPrice * 10); game.ownedStocks += 10; updateUI(); saveGame(); } });
if (buyStockMaxBtn) buyStockMaxBtn.addEventListener('click', function() { let max = Math.floor(game.balance / stockPrice); if (max > 0) { game.balance -= (max * stockPrice); game.ownedStocks += max; updateUI(); saveGame(); } });
if (sellStockBtn) sellStockBtn.addEventListener('click', function() { if (game.ownedStocks > 0) { game.balance += game.ownedStocks * stockPrice; game.ownedStocks = 0; updateUI(); saveGame(); } });

const mainCoin = document.getElementById('mainCoin');
if (mainCoin) {
mainCoin.addEventListener('touchstart', handleCoinClick, { passive: false });
mainCoin.addEventListener('mousedown', function(e) {
if ('ontouchstart' in window) return;
handleCoinClick(e);
});
}

window.addEventListener('resize', function() {
initCanvas();
drawChart();
});

setInterval(function() {
if (game.baseIncome > 0) {
game.balance += (game.baseIncome * game.currentModifier) / 10;
updateUI();
}
}, 100);

setInterval(updateChartData, 1000);
setInterval(function() {
game.lastSaveTime = Date.now();
saveGame();
}, 5000);

initCanvas();
renderShop();
renderRealEstate();
renderCrypto();
updateUI();
drawChart();
