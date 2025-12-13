// Servidor Backend para Dragon's Legacy

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados em memória (em produção, use MongoDB/PostgreSQL)
const players = new Map();
const gameRooms = new Map();
const onlinePlayers = new Set();

// Configurar salas de jogo
const gameWorlds = {
    'erdrea': {
        name: 'Erdrea',
        maxPlayers: 100,
        players: new Set(),
        locations: {
            'starting-town': { players: new Set(), name: 'Vila de Início' },
            'forest': { players: new Set(), name: 'Floresta dos Sussurros' },
            'mountains': { players: new Set(), name: 'Montanhas do Dragão' }
        }
    }
};

// Sistema de salvamento
const savePlayerData = (playerId, data) => {
    // Em produção, salvar em banco de dados
    players.set(playerId, {
        ...data,
        lastSave: Date.now()
    });
    console.log(`Dados salvos para jogador ${playerId}`);
};

const loadPlayerData = (playerId) => {
    return players.get(playerId) || null;
};

// WebSocket Connection
io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);
    
    socket.playerData = {
        id: socket.id,
        username: null,
        world: null,
        location: null,
        character: null
    };
    
    onlinePlayers.add(socket.id);
    updateOnlineCount();
    
    // Eventos do cliente
    socket.on('join_game', (data) => {
        const { username, characterData } = data;
        
        socket.playerData.username = username;
        socket.playerData.character = characterData;
        socket.playerData.world = 'erdrea';
        socket.playerData.location = 'starting-town';
        
        // Adicionar ao mundo
        const world = gameWorlds['erdrea'];
        world.players.add(socket.id);
        world.locations['starting-town'].players.add(socket.id);
        
        // Carregar dados salvos
        const savedData = loadPlayerData(username);
        if (savedData) {
            socket.emit('load_game_data', savedData);
        }
        
        // Notificar outros jogadores
        socket.broadcast.emit('player_joined', {
            username,
            location: 'starting-town'
        });
        
        // Enviar dados do mundo
        socket.emit('world_data', {
            world: world.name,
            playersInWorld: world.players.size,
            currentLocation: world.locations['starting-town']
        });
        
        console.log(`${username} entrou no jogo`);
    });
    
    socket.on('player_move', (data) => {
        const { fromLocation, toLocation } = data;
        
        // Atualizar localização
        if (socket.playerData.location) {
            const world = gameWorlds[socket.playerData.world];
            if (world && world.locations[socket.playerData.location]) {
                world.locations[socket.playerData.location].players.delete(socket.id);
            }
        }
        
        socket.playerData.location = toLocation;
        
        const world = gameWorlds[socket.playerData.world];
        if (world && world.locations[toLocation]) {
            world.locations[toLocation].players.add(socket.id);
            
            // Notificar jogadores na nova localização
            socket.broadcast.to(toLocation).emit('player_moved_in', {
                username: socket.playerData.username,
                from: fromLocation
            });
            
            // Notificar jogadores na localização antiga
            socket.broadcast.to(fromLocation).emit('player_moved_out', {
                username: socket.playerData.username,
                to: toLocation
            });
        }
    });
    
    socket.on('chat_message', (data) => {
        const { message, channel } = data;
        
        // Em produção, validar e filtrar mensagem
        const chatData = {
            username: socket.playerData.username,
            message: message,
            timestamp: Date.now(),
            channel: channel
        };
        
        // Enviar para o canal apropriado
        if (channel === 'global') {
            io.emit('chat_message', chatData);
        } else if (channel === 'location') {
            io.to(socket.playerData.location).emit('chat_message', chatData);
        } else if (channel === 'party') {
            // Enviar para membros do grupo
            // Implementar lógica de grupos
        }
    });
    
    socket.on('start_battle', (data) => {
        const { enemyType } = data;
        
        // Gerar dados da batalha
        const battleId = `battle_${Date.now()}_${socket.id}`;
        const battleData = {
            id: battleId,
            player: socket.playerData.username,
            enemy: enemyType,
            turn: 'player',
            playerHP: 100,
            enemyHP: 50
        };
        
        // Em produção, salvar estado da batalha
        socket.emit('battle_started', battleData);
    });
    
    socket.on('battle_action', (data) => {
        const { battleId, action } = data;
        
        // Processar ação de batalha
        // Em produção, calcular dano, etc.
        
        const result = {
            damage: Math.floor(Math.random() * 20) + 10,
            enemyAction: 'attack',
            enemyDamage: Math.floor(Math.random() * 15) + 5
        };
        
        socket.emit('battle_result', result);
    });
    
    socket.on('save_game', (data) => {
        savePlayerData(socket.playerData.username, data);
        socket.emit('game_saved', { success: true });
    });
    
    socket.on('trade_request', (data) => {
        const { targetPlayer, items } = data;
        
        // Encontrar socket do jogador alvo
        // Em produção, usar sistema de matchmaking
        io.to(targetPlayer).emit('trade_invite', {
            from: socket.playerData.username,
            items: items
        });
    });
    
    socket.on('disconnect', () => {
        console.log(`Jogador desconectado: ${socket.id}`);
        
        // Remover do mundo
        if (socket.playerData.world && socket.playerData.location) {
            const world = gameWorlds[socket.playerData.world];
            if (world) {
                world.players.delete(socket.id);
                if (world.locations[socket.playerData.location]) {
                    world.locations[socket.playerData.location].players.delete(socket.id);
                }
            }
        }
        
        onlinePlayers.delete(socket.id);
        updateOnlineCount();
        
        // Notificar outros jogadores
        socket.broadcast.emit('player_left', {
            username: socket.playerData.username
        });
    });
    
    // Junta o socket a salas baseadas na localização
    socket.on('join_location', (location) => {
        socket.join(location);
    });
    
    socket.on('leave_location', (location) => {
        socket.leave(location);
    });
});

function updateOnlineCount() {
    io.emit('online_count_update', {
        count: onlinePlayers.size
    });
}

// Rotas HTTP
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        players: onlinePlayers.size,
        worlds: Object.keys(gameWorlds).length,
        uptime: process.uptime()
    });
});

app.get('/api/leaderboard', (req, res) => {
    // Em produção, buscar do banco de dados
    res.json({
        topPlayers: [
            { rank: 1, username: 'DragonSlayer', level: 50, gold: 100000 },
            { rank: 2, username: 'MageMaster', level: 48, gold: 85000 },
            { rank: 3, username: 'RogueShadow', level: 45, gold: 75000 }
        ]
    });
});

app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    
    // Em produção, validar e salvar no banco de dados
    // Por enquanto, simular registro
    
    if (players.has(username)) {
        return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    players.set(username, {
        username,
        email,
        createdAt: Date.now(),
        characters: []
    });
    
    res.json({ success: true, message: 'Usuário registrado com sucesso' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Em produção, verificar credenciais
    const playerData = players.get(username);
    
    if (playerData) {
        res.json({
            success: true,
            token: 'fake-jwt-token-' + Date.now(),
            user: {
                username: playerData.username,
                characters: playerData.characters || []
            }
        });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Servir o jogo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor Dragon's Legacy rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
