// Telegram Bot Clicker Game Application
class TelegramClickerApp {
    constructor() {
        this.gameData = {
            samplePlayers: [
                {"id": 1, "username": "@MaxGamer", "firstName": "Max", "points": 125420, "level": 15, "dailyStreak": 7, "referrals": 12, "lastActive": "2025-09-18T22:10:00Z"},
                {"id": 2, "username": "@AnnaClicker", "firstName": "Anna", "points": 89320, "level": 12, "dailyStreak": 4, "referrals": 8, "lastActive": "2025-09-18T21:45:00Z"},
                {"id": 3, "username": "@TomTapper", "firstName": "Tom", "points": 67890, "level": 10, "dailyStreak": 2, "referrals": 5, "lastActive": "2025-09-18T20:30:00Z"},
                {"id": 4, "username": "@SaraBot", "firstName": "Sara", "points": 45230, "level": 8, "dailyStreak": 1, "referrals": 3, "lastActive": "2025-09-18T19:15:00Z"},
                {"id": 5, "username": "@LeoKing", "firstName": "Leo", "points": 34560, "level": 7, "dailyStreak": 12, "referrals": 15, "lastActive": "2025-09-18T18:00:00Z"}
            ],
            upgrades: [
                {"id": 1, "name": "Auto-Clicker", "description": "Automatisch 1 Click pro Sekunde", "basePrice": 100, "multiplier": 1.5, "effect": "+1 Click/Sekunde"},
                {"id": 2, "name": "Golden Touch", "description": "Doppelte Punkte pro Click", "basePrice": 500, "multiplier": 2.0, "effect": "+100% Click Value"},
                {"id": 3, "name": "Lucky Charm", "description": "Chance auf Bonus-Punkte", "basePrice": 1000, "multiplier": 2.2, "effect": "10% Chance +10x Points"},
                {"id": 4, "name": "Time Warp", "description": "Schnellere Regeneration", "basePrice": 2000, "multiplier": 2.5, "effect": "+50% Energy Regen"},
                {"id": 5, "name": "Mega Multiplier", "description": "Massive Punkte-Verstärkung", "basePrice": 5000, "multiplier": 3.0, "effect": "+200% All Points"}
            ],
            gameStats: {
                totalPlayers: 1247,
                activePlayers: 89,
                totalClicks: 2847392,
                averageLevel: 6.3,
                topPlayer: "@MaxGamer",
                dailyActiveUsers: 234,
                serverUptime: "99.7%"
            },
            recentActivities: [
                {"player": "@MaxGamer", "action": "Erreichte Level 15", "timestamp": "vor 2 Min"},
                {"player": "@AnnaClicker", "action": "Kaufte Auto-Clicker Upgrade", "timestamp": "vor 5 Min"},
                {"player": "@TomTapper", "action": "Sammelte Daily Reward", "timestamp": "vor 8 Min"},
                {"player": "@SaraBot", "action": "Warb neuen Spieler", "timestamp": "vor 12 Min"},
                {"player": "@LeoKing", "action": "Erreichte 1000 Clicks", "timestamp": "vor 15 Min"}
            ],
            botCommands: [
                {"command": "/start", "description": "Startet das Clicker-Spiel"},
                {"command": "/click", "description": "Führt einen Click aus"},
                {"command": "/stats", "description": "Zeigt Spieler-Statistiken"},
                {"command": "/shop", "description": "Öffnet den Upgrade-Shop"},
                {"command": "/daily", "description": "Holt tägliche Belohnung"},
                {"command": "/leaderboard", "description": "Zeigt Top-Spieler"},
                {"command": "/refer", "description": "Generiert Referral-Link"}
            ]
        };

        this.botStatus = {
            isOnline: false,
            token: '',
            username: ''
        };

        this.simulatorStats = {
            points: 0,
            level: 1,
            perClick: 1
        };

        this.currentTab = 'setup';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTabs();
        this.loadDashboard();
        this.loadAdminPanel();
        this.loadLeaderboard();
        this.loadSimulator();
        this.startLiveUpdates();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Bot setup
        const startBotBtn = document.getElementById('start-bot');
        if (startBotBtn) {
            startBotBtn.addEventListener('click', this.startBot.bind(this));
        }

        // Clicker game
        const clickerBtn = document.getElementById('clicker-btn');
        if (clickerBtn) {
            clickerBtn.addEventListener('click', this.handleClick.bind(this));
        }

        // Modal handling
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalClose) modalClose.addEventListener('click', this.closeModal.bind(this));
        if (modalCancel) modalCancel.addEventListener('click', this.closeModal.bind(this));
        if (modalOverlay) modalOverlay.addEventListener('click', this.closeModal.bind(this));

        // Admin actions
        const addPlayerBtn = document.getElementById('add-player');
        const addUpgradeBtn = document.getElementById('add-upgrade');
        
        if (addPlayerBtn) addPlayerBtn.addEventListener('click', () => this.openAddPlayerModal());
        if (addUpgradeBtn) addUpgradeBtn.addEventListener('click', () => this.openAddUpgradeModal());
    }

    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeTabContent = document.getElementById(`${tabName}-tab`);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }

        // Load content specific to tab if needed
        if (tabName === 'leaderboard') {
            this.loadLeaderboard();
        } else if (tabName === 'admin') {
            this.loadAdminPanel();
        } else if (tabName === 'dashboard') {
            this.loadDashboard();
        } else if (tabName === 'simulator') {
            this.loadSimulator();
        }
    }

    initializeTabs() {
        // Default to setup tab
        this.switchTab('setup');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    startBot() {
        const tokenInput = document.getElementById('bot-token');
        const usernameInput = document.getElementById('bot-username');
        
        if (!tokenInput || !usernameInput) {
            console.error('Bot input fields not found');
            return;
        }

        const token = tokenInput.value.trim();
        const username = usernameInput.value.trim();
        
        if (!token) {
            alert('Bitte Bot Token eingeben!');
            return;
        }

        if (!username) {
            alert('Bitte Bot Username eingeben!');
            return;
        }

        this.botStatus.isOnline = true;
        this.botStatus.token = token;
        this.botStatus.username = username;

        // Update UI
        const statusIndicator = document.getElementById('bot-status');
        if (statusIndicator) {
            statusIndicator.innerHTML = '<span class="status-dot online"></span>Bot Online';
        }
        
        // Switch to dashboard
        setTimeout(() => {
            this.switchTab('dashboard');
            alert('Bot erfolgreich gestartet! 🚀\nNavigiere zu den anderen Tabs um alle Features zu erkunden.');
        }, 500);
    }

    loadDashboard() {
        // Load stats
        const totalPlayersEl = document.getElementById('total-players');
        const activePlayersEl = document.getElementById('active-players');
        const totalClicksEl = document.getElementById('total-clicks');
        const averageLevelEl = document.getElementById('average-level');

        if (totalPlayersEl) totalPlayersEl.textContent = this.formatNumber(this.gameData.gameStats.totalPlayers);
        if (activePlayersEl) activePlayersEl.textContent = this.gameData.gameStats.activePlayers;
        if (totalClicksEl) totalClicksEl.textContent = this.formatNumber(this.gameData.gameStats.totalClicks);
        if (averageLevelEl) averageLevelEl.textContent = this.gameData.gameStats.averageLevel;

        // Load activity feed
        this.loadActivityFeed();
    }

    loadActivityFeed() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;

        feed.innerHTML = this.gameData.recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar">${activity.player.substring(1, 2).toUpperCase()}</div>
                <div class="activity-content">
                    <div class="activity-player">${activity.player}</div>
                    <div class="activity-action">${activity.action}</div>
                </div>
                <div class="activity-time">${activity.timestamp}</div>
            </div>
        `).join('');
    }

    loadAdminPanel() {
        this.loadPlayersTable();
        this.loadUpgradesGrid();
    }

    loadPlayersTable() {
        const tbody = document.querySelector('#players-table tbody');
        if (!tbody) return;

        tbody.innerHTML = this.gameData.samplePlayers.map(player => `
            <tr>
                <td>
                    <div class="player-info">
                        <div class="player-avatar">${player.firstName.charAt(0)}</div>
                        <div class="player-details">
                            <div class="player-username">${player.username}</div>
                            <div class="player-name">${player.firstName}</div>
                        </div>
                    </div>
                </td>
                <td>${this.formatNumber(player.points)}</td>
                <td>Level ${player.level}</td>
                <td>${player.dailyStreak} Tage</td>
                <td>${player.referrals}</td>
                <td>
                    <div class="player-actions">
                        <button class="btn btn--sm btn--outline" onclick="app.editPlayer(${player.id})">✏️</button>
                        <button class="btn btn--sm btn--outline" onclick="app.deletePlayer(${player.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadUpgradesGrid() {
        const grid = document.getElementById('upgrades-grid');
        if (!grid) return;

        grid.innerHTML = this.gameData.upgrades.map(upgrade => `
            <div class="upgrade-card">
                <div class="upgrade-header">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-price">${this.formatNumber(upgrade.basePrice)}💰</div>
                </div>
                <div class="upgrade-description">${upgrade.description}</div>
                <div class="upgrade-effect">${upgrade.effect}</div>
                <div class="upgrade-actions">
                    <button class="btn btn--sm btn--outline" onclick="app.editUpgrade(${upgrade.id})">✏️</button>
                    <button class="btn btn--sm btn--outline" onclick="app.deleteUpgrade(${upgrade.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    loadLeaderboard() {
        const leaderboard = document.getElementById('leaderboard-list');
        if (!leaderboard) return;

        const sortedPlayers = [...this.gameData.samplePlayers].sort((a, b) => b.points - a.points);
        
        leaderboard.innerHTML = sortedPlayers.map((player, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'first';
            else if (rank === 2) rankClass = 'second';
            else if (rank === 3) rankClass = 'third';

            return `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">#${rank}</div>
                    <div class="leaderboard-player">
                        <div class="player-avatar">${player.firstName.charAt(0)}</div>
                        <div class="player-details">
                            <div class="player-username">${player.username}</div>
                            <div class="player-name">${player.firstName}</div>
                        </div>
                    </div>
                    <div class="leaderboard-stats">
                        <div class="leaderboard-stat">
                            <span class="leaderboard-stat-value">${this.formatNumber(player.points)}</span>
                            <span class="leaderboard-stat-label">Punkte</span>
                        </div>
                        <div class="leaderboard-stat">
                            <span class="leaderboard-stat-value">${player.level}</span>
                            <span class="leaderboard-stat-label">Level</span>
                        </div>
                        <div class="leaderboard-stat">
                            <span class="leaderboard-stat-value">${player.referrals}</span>
                            <span class="leaderboard-stat-label">Referrals</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadSimulator() {
        this.updateSimulatorStats();
        this.loadShopItems();
        this.loadCommands();
    }

    updateSimulatorStats() {
        const pointsEl = document.getElementById('sim-points');
        const levelEl = document.getElementById('sim-level');
        const perClickEl = document.getElementById('sim-per-click');

        if (pointsEl) pointsEl.textContent = this.formatNumber(this.simulatorStats.points);
        if (levelEl) levelEl.textContent = this.simulatorStats.level;
        if (perClickEl) perClickEl.textContent = this.simulatorStats.perClick;
    }

    loadShopItems() {
        const shopItems = document.getElementById('shop-items');
        if (!shopItems) return;

        shopItems.innerHTML = this.gameData.upgrades.map(upgrade => `
            <div class="shop-item">
                <div class="shop-item-info">
                    <div class="shop-item-name">${upgrade.name}</div>
                    <div class="shop-item-description">${upgrade.description}</div>
                </div>
                <div class="shop-item-price">${this.formatNumber(upgrade.basePrice)}</div>
            </div>
        `).join('');
    }

    loadCommands() {
        const commandsList = document.getElementById('commands-list');
        if (!commandsList) return;

        commandsList.innerHTML = this.gameData.botCommands.map(cmd => `
            <div class="command-item">
                <div class="command-code">${cmd.command}</div>
                <div class="command-description">${cmd.description}</div>
            </div>
        `).join('');
    }

    handleClick() {
        const button = document.getElementById('clicker-btn');
        if (!button) return;
        
        // Add click animation
        button.classList.add('click-animation');
        setTimeout(() => button.classList.remove('click-animation'), 200);
        
        // Update points
        this.simulatorStats.points += this.simulatorStats.perClick;
        
        // Check for level up
        const newLevel = Math.floor(this.simulatorStats.points / 1000) + 1;
        if (newLevel > this.simulatorStats.level) {
            this.simulatorStats.level = newLevel;
            this.simulatorStats.perClick = newLevel;
            this.showLevelUpEffect();
        }
        
        this.updateSimulatorStats();
    }

    showLevelUpEffect() {
        // Simple level up notification
        const notification = document.createElement('div');
        notification.textContent = `🎉 Level ${this.simulatorStats.level} erreicht!`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--color-primary);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 9999;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    startLiveUpdates() {
        // Simulate live updates every 5 seconds
        setInterval(() => {
            if (this.botStatus.isOnline) {
                this.updateLiveStats();
                this.updateActivityFeed();
            }
        }, 5000);
    }

    updateLiveStats() {
        // Simulate small changes in stats
        this.gameData.gameStats.activePlayers += Math.floor(Math.random() * 3) - 1;
        this.gameData.gameStats.totalClicks += Math.floor(Math.random() * 100) + 50;
        
        // Update UI if on dashboard
        if (this.currentTab === 'dashboard') {
            const activePlayersEl = document.getElementById('active-players');
            const totalClicksEl = document.getElementById('total-clicks');
            
            if (activePlayersEl) activePlayersEl.textContent = Math.max(0, this.gameData.gameStats.activePlayers);
            if (totalClicksEl) totalClicksEl.textContent = this.formatNumber(this.gameData.gameStats.totalClicks);
        }
    }

    updateActivityFeed() {
        // Add a random new activity
        const players = ['@MaxGamer', '@AnnaClicker', '@TomTapper', '@SaraBot', '@LeoKing', '@NewPlayer'];
        const actions = ['Erreichte neues Level', 'Kaufte Upgrade', 'Sammelte Daily Reward', 'Warb Freund', 'Erreichte Meilenstein'];
        
        const newActivity = {
            player: players[Math.floor(Math.random() * players.length)],
            action: actions[Math.floor(Math.random() * actions.length)],
            timestamp: 'vor 1 Min'
        };
        
        this.gameData.recentActivities.unshift(newActivity);
        this.gameData.recentActivities = this.gameData.recentActivities.slice(0, 5);
        
        if (this.currentTab === 'dashboard') {
            this.loadActivityFeed();
        }
    }

    // Modal functions
    openAddPlayerModal() {
        this.openModal('Neuen Spieler hinzufügen', `
            <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" placeholder="@Username">
            </div>
            <div class="form-group">
                <label class="form-label">Vorname</label>
                <input type="text" class="form-control" placeholder="Vorname">
            </div>
            <div class="form-group">
                <label class="form-label">Punkte</label>
                <input type="number" class="form-control" placeholder="0">
            </div>
        `);
    }

    openAddUpgradeModal() {
        this.openModal('Neues Upgrade hinzufügen', `
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" placeholder="Upgrade Name">
            </div>
            <div class="form-group">
                <label class="form-label">Beschreibung</label>
                <textarea class="form-control" rows="3" placeholder="Beschreibung des Upgrades"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Grundpreis</label>
                <input type="number" class="form-control" placeholder="100">
            </div>
            <div class="form-group">
                <label class="form-label">Effekt</label>
                <input type="text" class="form-control" placeholder="+10% Damage">
            </div>
        `);
    }

    openModal(title, content) {
        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (modal) modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) modal.classList.add('hidden');
    }

    // Placeholder functions for edit/delete
    editPlayer(id) {
        const player = this.gameData.samplePlayers.find(p => p.id === id);
        if (player) {
            this.openModal(`Spieler bearbeiten: ${player.username}`, `
                <div class="form-group">
                    <label class="form-label">Punkte</label>
                    <input type="number" class="form-control" value="${player.points}">
                </div>
                <div class="form-group">
                    <label class="form-label">Level</label>
                    <input type="number" class="form-control" value="${player.level}">
                </div>
            `);
        }
    }

    deletePlayer(id) {
        if (confirm('Spieler wirklich löschen?')) {
            this.gameData.samplePlayers = this.gameData.samplePlayers.filter(p => p.id !== id);
            this.loadPlayersTable();
        }
    }

    editUpgrade(id) {
        const upgrade = this.gameData.upgrades.find(u => u.id === id);
        if (upgrade) {
            this.openModal(`Upgrade bearbeiten: ${upgrade.name}`, `
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-control" value="${upgrade.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Grundpreis</label>
                    <input type="number" class="form-control" value="${upgrade.basePrice}">
                </div>
            `);
        }
    }

    deleteUpgrade(id) {
        if (confirm('Upgrade wirklich löschen?')) {
            this.gameData.upgrades = this.gameData.upgrades.filter(u => u.id !== id);
            this.loadUpgradesGrid();
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Add CSS for level up animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
    }
`;
document.head.appendChild(style);

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TelegramClickerApp();
});