const canvas = document.getElementById('marketChart'), ctx = canvas.getContext('2d');
let chartData = Array(30).fill(35);

function initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr; canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
}

function drawChart() {
    if (!canvas.offsetWidth) return;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h); ctx.beginPath(); ctx.lineWidth = 2;
    ctx.strokeStyle = game.currentModifier >= 1 ? '#16a34a' : '#dc2626';
    
    const step = w / (chartData.length - 1);
    const minPrice = Math.min(...chartData) - 5;
    const maxPrice = Math.max(...chartData) + 5;
    const priceRange = maxPrice - minPrice;

    for(let i=0; i<chartData.length; i++) {
        let x = i * step;
        let y = h - ((chartData[i] - minPrice) / priceRange) * (h - 15) - 5;
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
    const label = document.getElementById('stockLabel');
    if (label) label.innerText = `Индекс акций: $${stockPrice.toFixed(2)}`;
    drawChart(); updateUI();
}

const newsTicker = document.getElementById('newsTicker');
function triggerEvent() {
    const rand = Math.random();
    if (!newsTicker) return;
    if (rand < 0.35) {
        game.currentModifier = 0.4; newsTicker.style.display = 'block';
        newsTicker.style.background = 'rgba(220, 38, 38, 0.1)'; newsTicker.style.borderColor = '#dc2626'; newsTicker.style.color = '#dc2626';
        newsTicker.innerText = "🚨 НАЛОГОВЫЙ КРИЗИС: Акции падают, доходы снижены на 60%!";
    } else if (rand > 0.65) {
        game.currentModifier = 2.0; newsTicker.style.display = 'block';
        newsTicker.style.background = 'rgba(22, 163, 74, 0.1)'; newsTicker.style.borderColor = '#16a34a'; newsTicker.style.color = '#16a34a';
        newsTicker.innerText = "🚀 ЭКОНОМИЧЕСКИЙ БУМ: Рынок растет, доходы увеличены в 2 раза!";
    } else { game.currentModifier = 1.0; newsTicker.style.display = 'none'; }
}

const balDisp = document.getElementById('balanceDisplay'), incDisp = document.getElementById('incomeDisplay'), rankDisp = document.getElementById('rankDisplay'), shopList = document.getElementById('shopList'), realEstateList = document.getElementById('realEstateList');
const buyStockBtn = document.getElementById('buyStockBtn'), sellStockBtn = document.getElementById('sellStockBtn'), dailyBtn = document.getElementById('dailyBtn');

function renderShop() {
    if (!shopList) return;
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

function renderRealEstate() {
    if (!realEstateList) return;
    realEstateList.innerHTML = '';
    realEstateUpgrades.forEach(up => {
        const btn = document.createElement('button'); btn.className = 'asset-item'; btn.id = `btn-${up.id}`;
        btn.innerHTML = `
            <div class="asset-content">
                <div class="icon-wrapper"><div class="${up.class}"></div></div>
                <div>
                    <div class="asset-name">${up.name}</div>
                    <div class="asset-stats">${up.desc} | Владеете: ${reInventory[up.id]}</div>
                </div>
            </div>
            <div class="asset-cost">${formatMoney(up.cost)}</div>
        `;
        btn.addEventListener('click', (e) => { e.stopPropagation(); buyRealEstate(up); });
        realEstateList.appendChild(btn);
    });
}

function updateUI() {
    if (balDisp) balDisp.innerText = formatMoney(game.balance);
    let actInc = game.baseIncome * game.currentModifier;
    if (incDisp) incDisp.innerText = `Доход: ${formatMoney(actInc)}/с` + (game.currentModifier !== 1 ? ` (x${game.currentModifier})` : '');
    
    let currRank = ranks[0].title;
    for(let r of ranks) { if(game.balance >= r.limit) currRank = r.title; }
    if (rankDisp) rankDisp.innerText = currRank;
    
    upgrades.forEach(up => { const btn = document.getElementById(`btn-${up.id}`); if (btn) btn.disabled = game.balance < up.cost; });
    realEstateUpgrades.forEach(up => { const btn = document.getElementById(`btn-${up.id}`); if (btn) btn.disabled = game.balance < up.cost; });
    
    if (buyStockBtn) {
        buyStockBtn.disabled = game.balance < stockPrice;
        buyStockBtn.innerText = `Купить 1 шт. (${game.ownedStocks})`;
    }
    if (sellStockBtn) sellStockBtn.disabled = game.ownedStocks <= 0;
    
    const canDaily = (Date.now() - game.lastDailyTime) > 86400000;
    if (dailyBtn) dailyBtn.disabled = !canDaily;
}

function handleCoinClick(e) {
    e.preventDefault(); 
    game.balance += game.clickPower;
    
    let cX = e.clientX || (e.touches && e.touches.clientX);
    let cY = e.clientY || (e.touches && e.touches.clientY);
    
    const coinEl = document.getElementById('mainCoin');
    if (!coinEl) return;
    const rect = coinEl.getBoundingClientRect();
    const coinCenterX = rect.left + rect.width / 2;
    const coinCenterY = rect.top + rect.height / 2;
    
    if (cX && cY) {
        const tiltX = ((cY - coinCenterY) / (rect.height / 2)) * -15;
        const tiltY = ((cX - coinCenterX) / (rect.width / 2)) * 15;
        
        coinEl.style.transform = `scale(0.90) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(4px)`;
        setTimeout(() => { coinEl.style.transform = ''; }, 100);

        const el = document.createElement('div'); 
        el.className = 'floating-income'; 
        el.innerText = `+$${game.clickPower}`;
        el.style.left = `${cX - 10}px`; 
        el.style.top = `${cY - 20}px`; 
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }
    updateUI();
    queueSave();
}
function buyAsset(asset) {
    if (game.balance >= asset.cost) {
        game.balance -= asset.cost; inventory[asset.id]++;
        if (asset.type === 'click') game.clickPower += asset.power; else game.baseIncome += asset.power;
        asset.cost = Math.round(initialCosts[asset.id] * Math.pow(asset.multiplier, inventory[asset.id])); 
        renderShop(); updateUI(); saveGame();
    }
}
function buyRealEstate(asset) {
    if (game.balance >= asset.cost) {
        game.balance -= asset.cost; reInventory[asset.id]++;
        game.baseIncome += asset.power;
        asset.cost = Math.round(initialRECosts[asset.id] * Math.pow(asset.multiplier, reInventory[asset.id])); 
        renderRealEstate(); updateUI(); saveGame();
    }
}
const navShopBtn = document.getElementById('navShopBtn'), navRealEstateBtn = document.getElementById('navRealEstateBtn');
const businessContainer = document.getElementById('businessContainer'), realEstateContainer = document.getElementById('realEstateContainer');

if (navShopBtn && navRealEstateBtn) {
    navShopBtn.addEventListener('click', () => {
        navShopBtn.classList.add('active'); navRealEstateBtn.classList.remove('active');
        if (businessContainer) businessContainer.classList.remove('hidden'); 
        if (realEstateContainer) realEstateContainer.classList.add('hidden');
    });

    navRealEstateBtn.addEventListener('click', () => {
        navRealEstateBtn.classList.add('active'); navShopBtn.classList.remove('active');
        if (realEstateContainer) realEstateContainer.classList.remove('hidden'); 
        if (businessContainer) businessContainer.classList.add('hidden');
    });
}

if (buyStockBtn) {
    buyStockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (game.balance >= stockPrice) {
            game.balance -= stockPrice; game.ownedStocks++; updateUI(); saveGame();
        }
    });
}
if (sellStockBtn) {
    sellStockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (game.ownedStocks > 0) {
            game.balance += game.ownedStocks * stockPrice; game.ownedStocks = 0; updateUI(); saveGame();
        }
    });
}
if (dailyBtn) {
    dailyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if ((Date.now() - game.lastDailyTime) > 86400000) {
            let reward = 100 + (game.baseIncome * 60);
            game.balance += reward; game.lastDailyTime = Date.now();
            alert(`Вы получили субсидию от инвесторов: ${formatMoney(reward)}!`);
            updateUI(); saveGame();
        }
    });
}
document.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}, { once: true });

const mainCoin = document.getElementById('mainCoin');
if (mainCoin) {
    mainCoin.addEventListener('touchstart', handleCoinClick, { passive: false });
    mainCoin.addEventListener('mousedown', (e) => { if ('ontouchstart' in window) return; handleCoinClick(e); });
}
window.addEventListener('resize', () => { initCanvas(); drawChart(); });
setInterval(() => { if (game.baseIncome > 0) { game.balance += (game.baseIncome * game.currentModifier) / 10; updateUI(); } }, 100);
setInterval(updateChartData, 1000); setInterval(triggerEvent, 25000); setInterval(() => { game.lastSaveTime = Date.now(); saveGame(); }, 5000);
initCanvas(); renderShop(); renderRealEstate(); updateUI(); drawChart();
