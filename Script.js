// Dragon's Legacy - Sistema Principal do Jogo

class DragonLegacy {
    constructor() {
        this.gameState = {
            player: null,
            location: { x: 5, y: 5, name: 'Vila de Início', type: 'town' },
            inventory: {
                items: [
                    { id: 1, name: 'Poção de Cura', type: 'consumable', quantity: 3, effect: { hp: 30 } },
                    { id: 2, name: 'Poção de Mana', type: 'consumable', quantity: 2, effect: { mp: 20 } },
                    { id: 3, name: 'Chave de Madeira', type: 'key', quantity: 1 }
                ],
                equipment: {
                    weapon: { name: 'Espada de Madeira', attack: 5 },
                    armor: { name: 'Túnica de Iniciante', defense: 3 },
                    accessory: null
                }
            },
            quests: [],
            party: [],
            gameTime: 0,
            enemiesDefeated: 0
        };

        this.socket = null;
        this.onlinePlayers = 0;
        this.currentEnemy = null;
        this.battleInterval = null;
        
        this.init();
    }

    init() {
        // Simular carregamento
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showMainMenu();
            this.setupEventListeners();
            this.connectToServer();
            this.setupAudio();
        }, 3000);
    }

    setupAudio() {
        this.bgMusic = document.getElementById('bg-music');
        this.battleSound = document.getElementById('battle-sound');
        this.victorySound = document.getElementById('victory-sound');
        
        // Configurar volume
        this.bgMusic.volume = 0.3;
        this.battleSound.volume = 0.5;
        this.victorySound.volume = 0.5;
        
        // Tentar tocar música de fundo
        this.bgMusic.play().catch(e => console.log("Auto-play bloqueado pelo navegador"));
    }

    connectToServer() {
        // Simular conexão com servidor
        setTimeout(() => {
            this.updateOnlinePlayers();
            this.showNotification('Conectado ao servidor!', 'success');
        }, 1000);
        
        // Atualizar contador de jogadores periodicamente
        setInterval(() => {
            this.updateOnlinePlayers();
        }, 30000);
    }

    updateOnlinePlayers() {
        // Simular jogadores online
        const basePlayers = Math.floor(Math.random() * 100) + 50;
        this.onlinePlayers = basePlayers;
        document.getElementById('online-players').textContent = this.onlinePlayers;
        document.getElementById('player-count').textContent = `Jogadores Online: ${this.onlinePlayers}`;
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
    }

    hideMainMenu() {
        document.getElementById('main-menu').classList.add('hidden');
    }

    showCharacterCreation() {
        document.getElementById('character-creation').classList.remove('hidden');
        this.setupClassSelection();
    }

    setupClassSelection() {
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            card.addEventListener('click', () => {
                classCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.updateClassStats(card.dataset.class);
            });
        });
        
        // Configurar botões
        document.getElementById('confirm-creation').addEventListener('click', () => this.createCharacter());
        document.getElementById('back-to-menu').addEventListener('click', () => {
            document.getElementById('character-creation').classList.add('hidden');
            this.showMainMenu();
        });
    }

    updateClassStats(className) {
        const stats = {
            warrior: { str: 15, def: 12, agi: 8, int: 5, maxhp: 70, maxmp: 20 },
            mage: { str: 6, def: 8, agi: 10, int: 16, maxhp: 50, maxmp: 50 },
            rogue: { str: 10, def: 9, agi: 15, int: 8, maxhp: 55, maxmp: 25 },
            cleric: { str: 8, def: 11, agi: 9, int: 14, maxhp: 60, maxmp: 40 }
        };

        const stat = stats[className];
        document.getElementById('stat-str').textContent = stat.str;
        document.getElementById('stat-def').textContent = stat.def;
        document.getElementById('stat-agi').textContent = stat.agi;
        document.getElementById('stat-int').textContent = stat.int;
        document.getElementById('stat-maxhp').textContent = stat.maxhp;
        document.getElementById('stat-maxmp').textContent = stat.maxmp;
    }

    createCharacter() {
        const heroName = document.getElementById('hero-name').value || 'Herói';
        const selectedClass = document.querySelector('.class-card.selected').dataset.class;
        
        this.gameState.player = {
            name: heroName,
            class: selectedClass,
            level: 1,
            exp: 0,
            nextExp: 100,
            hp: 50,
            maxhp: 50,
            mp: 20,
            maxmp: 20,
            str: 10,
            def: 8,
            agi: 10,
            int: 10,
            gold: 100
        };

        // Atualizar com stats da classe
        this.updateClassStats(selectedClass);
        Object.assign(this.gameState.player, {
            maxhp: parseInt(document.getElementById('stat-maxhp').textContent),
            maxmp: parseInt(document.getElementById('stat-maxmp').textContent),
            str: parseInt(document.getElementById('stat-str').textContent),
            def: parseInt(document.getElementById('stat-def').textContent),
            agi: parseInt(document.getElementById('stat-agi').textContent),
            int: parseInt(document.getElementById('stat-int').textContent)
        });
        
        this.gameState.player.hp = this.gameState.player.maxhp;
        this.gameState.player.mp = this.gameState.player.maxmp;

        document.getElementById('character-creation').classList.add('hidden');
        this.startGame();
    }

    startGame() {
        document.getElementById('game-screen').classList.remove('hidden');
        this.updatePlayerDisplay();
        this.generateWorldMap();
        this.setupGameEventListeners();
        
        this.bgMusic.play();
        
        this.addLogEntry('Bem-vindo ao mundo de Erdrea, ' + this.gameState.player.name + '!', 'system');
        this.addLogEntry('Use "Explorar" para encontrar aventuras.', 'system');
        
        // Adicionar missão inicial
        this.addQuest({
            id: 1,
            title: 'Primeiros Passos',
            description: 'Derrote 3 Slimes para provar seu valor.',
            objective: { type: 'defeat', target: 'Slime', count: 3 },
            reward: { exp: 100, gold: 50 },
            progress: 0
        });
    }

    updatePlayerDisplay() {
        const p = this.gameState.player;
        document.getElementById('player-display-name').textContent = p.name;
        document.getElementById('player-level').textContent = p.level;
        document.getElementById('hp-text').textContent = `${p.hp}/${p.maxhp}`;
        document.getElementById('mp-text').textContent = `${p.mp}/${p.maxmp}`;
        document.getElementById('exp-text').textContent = `${p.exp}/${p.nextExp}`;
        document.getElementById('gold-amount').textContent = p.gold;
        
        // Atualizar barras
        const hpPercent = (p.hp / p.maxhp) * 100;
        const mpPercent = (p.mp / p.maxmp) * 100;
        const expPercent = (p.exp / p.nextExp) * 100;
        
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('mp-bar').style.width = `${mpPercent}%`;
        document.getElementById('exp-bar').style.width = `${expPercent}%`;
    }

    generateWorldMap() {
        const mapGrid = document.getElementById('map-grid');
        mapGrid.innerHTML = '';
        
        const terrainTypes = ['plains', 'forest', 'forest', 'mountain', 'plains', 'town', 'plains', 'forest', 'plains', 'dungeon'];
        
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                
                // Determinar tipo de terreno
                let type = 'plains';
                if (x === 5 && y === 5) {
                    type = 'town'; // Vila inicial
                } else if (Math.random() > 0.7) {
                    type = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
                }
                
                cell.classList.add(type);
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                mapGrid.appendChild(cell);
            }
        }
        
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        const playerMarker = document.getElementById('player-marker');
        const cellSize = 40; // Tamanho aproximado de cada célula
        
        playerMarker.style.left = `${this.gameState.location.x * cellSize + 20}px`;
        playerMarker.style.top = `${this.gameState.location.y * cellSize + 20}px`;
        
        // Atualizar informação da localização
        document.getElementById('current-location').textContent = this.gameState.location.name;
        document.getElementById('location-desc').textContent = this.getLocationDescription(this.gameState.location.type);
    }

    getLocationDescription(type) {
        const descriptions = {
            town: 'Uma vila tranquila onde aventureiros se reúnem.',
            forest: 'Uma floresta densa cheia de mistérios.',
            plains: 'Campos abertos sob um céu claro.',
            mountain: 'Montanhas altas com caminhos perigosos.',
            dungeon: 'Uma masmorra escura cheia de perigos.'
        };
        return descriptions[type] || 'Uma terra desconhecida...';
    }

    setupEventListeners() {
        // Menu Principal
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.hideMainMenu();
            this.showCharacterCreation();
        });
        
        document.getElementById('load-game-btn').addEventListener('click', () => {
            this.loadGame();
        });
        
        document.getElementById('multiplayer-btn').addEventListener('click', () => {
            this.showNotification('Funcionalidade de multijogador em desenvolvimento!', 'info');
        });
        
        document.getElementById('options-btn').addEventListener('click', () => {
            this.showNotification('Opções em breve disponíveis!', 'info');
        });
        
        document.getElementById('credits-btn').addEventListener('click', () => {
            this.showNotification('Desenvolvido com ❤️ inspirado em Dragon Quest', 'info');
        });
    }

    setupGameEventListeners() {
        // Ações do jogo
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Chat
        document.getElementById('send-chat').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Batalha
        document.querySelectorAll('.battle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.classList[1].replace('-btn', '');
                this.handleBattleAction(action);
            });
        });
        
        // Fechar modais
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.add('hidden');
                });
            });
        });
        
        // Salvar jogo
        document.querySelector('[data-action="save"]').addEventListener('click', () => {
            this.saveGame();
        });
    }

    handleAction(action) {
        switch(action) {
            case 'explore':
                this.explore();
                break;
            case 'inventory':
                this.showInventory();
                break;
            case 'quests':
                this.showQuests();
                break;
            case 'party':
                this.showParty();
                break;
            case 'menu':
                this.showGameMenu();
                break;
            case 'save':
                this.saveGame();
                break;
        }
    }

    explore() {
        const encounterChance = Math.random();
        
        if (encounterChance < 0.4) {
            // Encontro com inimigo
            this.startBattle();
        } else if (encounterChance < 0.7) {
            // Encontro com NPC
            this.meetNPC();
        } else {
            // Achou item
            this.findItem();
        }
        
        // Mover player
        this.movePlayer();
    }

    movePlayer() {
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 }
        ];
        
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const newX = this.gameState.location.x + direction.x;
        const newY = this.gameState.location.y + direction.y;
        
        // Limitar movimento ao mapa
        if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10) {
            this.gameState.location.x = newX;
            this.gameState.location.y = newY;
            
            // Atualizar tipo de localização
            const cell = document.querySelector(`.map-cell[data-x="${newX}"][data-y="${newY}"]`);
            const cellClass = Array.from(cell.classList).find(c => c !== 'map-cell');
            this.gameState.location.type = cellClass;
            
            // Nomear localização baseada no tipo
            const locationNames = {
                town: ['Vila de Início', 'Cidade Real', 'Aldeia Esquecida'],
                forest: ['Floresta dos Sussurros', 'Bosque Encantado', 'Mata Sombria'],
                plains: ['Pradaria dos Ventos', 'Campos Dourados', 'Planície Serena'],
                mountain: ['Montanha do Dragão', 'Pico Gélido', 'Rochedos Altaneiros'],
                dungeon: ['Masmorra das Sombras', 'Caverna Profunda', 'Catacumbas Antigas']
            };
            
            const names = locationNames[cellClass] || ['Terra Desconhecida'];
            this.gameState.location.name = names[Math.floor(Math.random() * names.length)];
            
            this.updatePlayerPosition();
            this.addLogEntry(`Você se moveu para ${this.gameState.location.name}.`, 'event');
        }
    }

    startBattle() {
        // Parar música de fundo
        this.bgMusic.pause();
        
        // Escolher inimigo aleatório
        const enemies = [
            { name: 'Slime Vermelho', hp: 30, maxHp: 30, attack: 8, defense: 3, exp: 25, gold: 15, sprite: 'fa-ghost' },
            { name: 'Goblin', hp: 45, maxHp: 45, attack: 12, defense: 5, exp: 40, gold: 25, sprite: 'fa-user-ninja' },
            { name: 'Esqueleto', hp: 55, maxHp: 55, attack: 15, defense: 8, exp: 60, gold: 35, sprite: 'fa-skull' },
            { name: 'Orc', hp: 70, maxHp: 70, attack: 18, defense: 10, exp: 80, gold: 50, sprite: 'fa-user-injured' }
        ];
        
        this.currentEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        
        // Configurar display da batalha
        document.getElementById('enemy-name').textContent = this.currentEnemy.name;
        document.getElementById('enemy-hp-text').textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
        document.querySelector('.enemy-sprite i').className = `fas ${this.currentEnemy.sprite}`;
        
        // Atualizar barra de HP
        const hpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = `${hpPercent}%`;
        
        // Limpar log de batalha
        document.getElementById('battle-log').innerHTML = '<div class="battle-message">Um ' + this.currentEnemy.name + ' apareceu!</div>';
        
        // Mostrar modal de batalha
        document.getElementById('battle-modal').classList.remove('hidden');
        
        // Tocar som de batalha
        this.battleSound.currentTime = 0;
        this.battleSound.play();
        
        this.addLogEntry(`Você encontrou um ${this.currentEnemy.name}!`, 'warning');
    }

    handleBattleAction(action) {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;
        
        const player = this.gameState.player;
        
        switch(action) {
            case 'attack':
                const damage = Math.max(1, player.str + Math.floor(Math.random() * 6) - this.currentEnemy.defense);
                this.currentEnemy.hp -= damage;
                
                this.addBattleMessage(`Você atacou causando ${damage} de dano!`);
                
                // Verificar se inimigo foi derrotado
                if (this.currentEnemy.hp <= 0) {
                    this.winBattle();
                    return;
                }
                
                // Inimigo contra-ataca
                setTimeout(() => this.enemyAttack(), 1000);
                break;
                
            case 'magic':
                if (player.mp < 10) {
                    this.addBattleMessage('MP insuficiente!');
                    return;
                }
                
                player.mp -= 10;
                const magicDamage = Math.max(3, player.int * 2 + Math.floor(Math.random() * 10));
                this.currentEnemy.hp -= magicDamage;
                
                this.addBattleMessage(`Você usou Bola de Fogo causando ${magicDamage} de dano!`);
                this.updatePlayerDisplay();
                
                if (this.currentEnemy.hp <= 0) {
                    this.winBattle();
                    return;
                }
                
                setTimeout(() => this.enemyAttack(), 1000);
                break;
                
            case 'item':
                this.showInventory(true);
                break;
                
            case 'defend':
                player.defense *= 2; // Dobrar defesa por um turno
                this.addBattleMessage('Você assumiu posição defensiva!');
                
                setTimeout(() => {
                    this.enemyAttack();
                    player.defense /= 2; // Voltar defesa ao normal
                }, 1000);
                break;
                
            case 'flee':
                const fleeChance = 30 + player.agi;
                if (Math.random() * 100 < fleeChance) {
                    this.addBattleMessage('Você fugiu da batalha!');
                    setTimeout(() => {
                        document.getElementById('battle-modal').classList.add('hidden');
                        this.bgMusic.play();
                    }, 1500);
                } else {
                    this.addBattleMessage('Falha ao tentar fugir!');
                    setTimeout(() => this.enemyAttack(), 1000);
                }
                break;
        }
        
        // Atualizar display do inimigo
        const hpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('enemy-hp-text').textContent = `${this.currentEnemy.hp}/${this.curre
