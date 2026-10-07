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

if (localStorage.getItem('biz_emp_v9')) {
    const saved = JSON.parse(localStorage.getItem('biz_emp_v9'));
    game = { ...game, ...saved.game }; 
    inventory = { ...inventory, ...saved.inventory };
    if (saved.reInventory) reInventory = { ...reInventory, ...saved.reInventory };
    
    const actInc = game.baseIncome * game.currentModifier;
    if (actInc > 0 && game.lastSaveTime) {
        const passed = Math.floor((Date.now() - game.lastSaveTime) / 1000);
        if (passed > 5) {
            game.balance += passed * actInc;
            setTimeout(() => alert(`Доход за время отсутствия: ${formatMoney(passed * actInc)}`), 500);
        }
    }
    upgrades.forEach(up => up.cost = Math.round(initialCosts[up.id] * Math.pow(up.multiplier, inventory[up.id])));
    realEstateUpgrades.forEach(up => up.cost = Math.round(initialRECosts[up.id] * Math.pow(up.multiplier, reInventory[up.id])));
}

function formatMoney(n) {
    if (n >= 1e9) return '\$' + (n / 1e9).toFixed(2) + ' Б';
    if (n >= 1e6) return '\$' + (n / 1e6).toFixed(2) + ' М';
    if (n >= 1e3) return '\$' + (n / 1e3).toFixed(1) + ' К';
    return '\$' + Math.floor(n);
}

function saveGame() { localStorage.setItem('biz_emp_v9', JSON.stringify({ game, inventory, reInventory })); }

let saveTimeout;
function queueSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveGame, 1500);
}
