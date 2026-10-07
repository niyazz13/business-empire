const initialCosts = { click: 15, startup: 60, retail: 500, oil: 4000, it: 30000 };
let game = { balance: 0, clickPower: 1, baseIncome: 0, currentModifier: 1, lastSaveTime: Date.now(), ownedStocks: 0, lastDailyTime: 0 };
let inventory = { click: 0, startup: 0, retail: 0, oil: 0, it: 0 };

let stockPrice = 35;
const upgrades = [
    { id: 'click', name: 'Офисный Маркетинг', class: 'ico-click', cost: 15, multiplier: 1.45, type: 'click', power: 1, desc: 'Клик +\$1' },
    { id: 'startup', name: 'Акции Венчуров', class: 'ico-startup', cost: 60, multiplier: 1.5, type: 'passive', power: 1, desc: 'Доход +\$1/с' },
    { id: 'retail', name: 'Франшизы Общепита', class: 'ico-retail', cost: 500, multiplier: 1.55, type: 'passive', power: 7, desc: 'Доход +\$7/с' },
    { id: 'oil', name: 'Скважины Сибири', class: 'ico-oil', cost: 4000, multiplier: 1.6, type: 'passive', power: 55, desc: 'Доход +\$55/с' },
    { id: 'it', name: 'Нейросети ИИ', class: 'ico-it', cost: 30000, multiplier: 1.7, type: 'passive', power: 400, desc: 'Доход +\$400/с' }
];

const ranks = [
    { limit: 0, title: "💼 Стажер" }, { limit: 1000, title: "👔 Трейдер" },
    { limit: 25000, title: "🏢 Директор" }, { limit: 500000, title: "🏦 Инвестор" }, { limit: 10000000, title: "👑 Магнат" }
];

if (localStorage.getItem('biz_emp_v8')) {
    const saved = JSON.parse(localStorage.getItem('biz_emp_v8'));
    game = { ...game, ...saved.game }; inventory = { ...inventory, ...saved.inventory };
    const actInc = game.baseIncome * game.currentModifier;
    if (actInc > 0 && game.lastSaveTime) {
        const passed = Math.floor((Date.now() - game.lastSaveTime) / 1000);
        if (passed > 5) {
            game.balance += passed * actInc;
            setTimeout(() => alert(`Доход за время отсутствия: ${formatMoney(passed * actInc)}`), 500);
        }
    }
    upgrades.forEach(up => up.cost = Math.round(initialCosts[up.id] * Math.pow(up.multiplier, inventory[up.id])));
}

const canvas = document.getElementById('marketChart'), ctx = canvas.getContext('2d');
let chartData = Array(30).fill(35);

function initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
}

function drawChart() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h); ctx.beginPath(); ctx.lineWidth = 2;
    ctx.strokeStyle = game.currentModifier >= 1 ? '#2ecc71' : '#ff4757';
    const step = w / (chartData.length - 1);
    for(let i=0; i<chartData.length; i++) {
        let x = i * step, y = h - (chartData[i] * (h / 70));
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function updateChartData() {
    chartData.shift(); let base = chartData[chartData.length - 1];
    let noise = (Math.random() - 0.48) * 6;
    stockPrice = Math.max(5, Math.min(65, base + noise));
    if(game.currentModifier > 1) stockPrice = Math.min(65, stockPrice + 1.5);
    if(game.currentModifier < 1) stockPrice = Math.max(5, stockPrice - 1.5);
    chartData.push(stockPrice);
    document.getElementById('stockLabel').innerText = `Индекс акций: $${stockPrice.toFixed(2)}`;
    drawChart(); updateUI();
}

const newsTicker = document.getElementById('newsTicker');
function triggerEvent() {
    const rand = Math.random();
    if (rand < 0.35) {
        game.currentModifier = 0.4; newsTicker.style.display = 'block';
        newsTicker.style.background = 'rgba(255, 71, 87, 0.15)'; newsTicker.style.borderColor = '#ff4757'; newsTicker.style.color = '#ff4757';
        newsTicker.innerText = "🚨 НАЛОГОВЫЙ КРИЗИС: Акции падают, доходы снижены на 60%!";
    } else if (rand > 0.65) {
        game.currentModifier = 2.0; newsTicker.style.display = 'block';
        newsTicker.style.background = 'rgba(46, 204, 113, 0.15)'; newsTicker.style.borderColor = '#2ecc71'; newsTicker.style.color = '#2ecc71';
        newsTicker.innerText = "🚀 ЭКОНОМИЧЕСКИЙ БУМ: Рынок растет, доходы увеличены в 2 раза!";
    } else { game.currentModifier = 1.0; newsTicker.style.display = 'none'; }
}

function formatMoney(n) {
    if (n >= 1e9) return '\$' + (n / 1e9).toFixed(2) + ' Б';
    if (n >= 1e6) return '\$' + (n / 1e6).toFixed(2) + ' М';
    if (n >= 1e3) return '\$' + (n / 1e3).toFixed(1) + ' К';
    return '\$' + Math.floor(n);
}

const balDisp = document.getElementById('balanceDisplay'), incDisp = document.getElementById('incomeDisplay'), rankDisp = document.getElementById('rankDisplay'), shopList = document.getElementById('shopList');
const buyStockBtn = document.getElementById('buyStockBtn'), sellStockBtn = document.getElementById('sellStockBtn'), dailyBtn = document.getElementById('dailyBtn');

function renderShop() {
    shopList.innerHTML = '';
    upgrades.forEach(up => {
        const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = `btn-${up.id}`;
        btn.innerHTML = `
            <div class="asset-content">
                <div class="icon-wrapper"><div class="${up.class}"></div></div>
                <div>
                    <div class="asset-name">${up.name}</div>
                    <div class="asset-stats">${up.desc} | Ур. ${inventory[up.id]}</div>
                </div>
            </div>
            <div class="asset-cost">${formatMoney(up.cost)}</div>
        `;
        btn.addEventListener('click', (e) => { e.stopPropagation(); buyAsset(up); });
        shopList.appendChild(btn);
    });
}

function updateUI() {
    balDisp.innerText = formatMoney(game.balance);
    let actInc = game.baseIncome * game.currentModifier;
    incDisp.innerText = `Доход: ${formatMoney(actInc)}/с` + (game.currentModifier !== 1 ? ` (x${game.currentModifier})` : '');
    
    let currRank = ranks[0].title;
    for(let r of ranks) { if(game.balance >= r.limit) currRank = r.title; }
    rankDisp.innerText = currRank;
    
    upgrades.forEach(up => { const btn = document.getElementById(`btn-${up.id}`); if (btn) btn.disabled = game.balance < up.cost; });
    
    buyStockBtn.disabled = game.balance < stockPrice;
    buyStockBtn.innerText = `Купить (${game.ownedStocks})`;
    sellStockBtn.disabled = game.ownedStocks <= 0;
    
    const canDaily = (Date.now() - game.lastDailyTime) > 86400000;
    dailyBtn.disabled = !canDaily;
}

function saveGame() { game.lastSaveTime = Date.now(); localStorage.setItem('biz_emp_v8', JSON.stringify({ game, inventory })); }

function handleCoinClick(e) {
    e.preventDefault(); game.balance += game.clickPower;
    let cX = e.clientX || (e.touches && e.touches.clientX);
    let cY = e.clientY || (e.touches && e.touches.clientY);
    if (cX && cY) {
        const el = document.createElement('div'); el.className = 'floating-income'; el.innerText = `+$${game.clickPower}`;
        el.style.left = `${cX - 10}px`; el.style.top = `${cY - 20}px`; document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }
    updateUI();
}

function buyAsset(asset) {
    if (game.balance >= asset.cost) {
        game.balance -= asset.cost; inventory[asset.id]++;
        if (asset.type === 'click') game.clickPower += asset.power; else game.baseIncome += asset.power;
        asset.cost = Math.round(initialCosts[asset.id] * Math.pow(asset.multiplier, inventory[asset.id])); 
        renderShop(); updateUI(); saveGame();
    }
}

buyStockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (game.balance >= stockPrice) {
        game.balance -= stockPrice; game.ownedStocks++; updateUI(); saveGame();
    }
});
sellStockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (game.ownedStocks > 0) {
        game.balance += game.ownedStocks * stockPrice; game.ownedStocks = 0; updateUI(); saveGame();
    }
});

dailyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if ((Date.now() - game.lastDailyTime) > 86400000) {
        let reward = 100 + (game.baseIncome * 60);
        game.balance += reward; game.lastDailyTime = Date.now();
        alert(`Вы получили субсидию от инвесторов: ${formatMoney(reward)}!`);
        updateUI(); saveGame();
    }
});

document.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}, { once: true });

const mainCoin = document.getElementById('mainCoin');
mainCoin.addEventListener('touchstart', handleCoinClick, { passive: false });
mainCoin.addEventListener('mousedown', (e) => { if ('ontouchstart' in window) return; handleCoinClick(e); });

window.addEventListener('resize', () => { initCanvas(); drawChart(); });

setInterval(() => { if (game.baseIncome > 0) { game.balance += (game.baseIncome * game.currentModifier) / 10; updateUI(); } }, 100);
setInterval(updateChartData, 1000); setInterval(triggerEvent, 25000); setInterval(saveGame, 5000);

initCanvas(); renderShop(); updateUI(); drawChart();
