// Definição das Áreas, Mapa, Obstáculos, NPCs, Inimigos e Transições
// HDD — RPG 2D de Cartas e Exploração Medieval

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 560;

class WorldManager {
    constructor() {
        this.areas = {};
        this.currentAreaId = 'vila';
        this.openedChests = new Set();
        this.defeatedEnemies = new Set();
        this.transitioning = false;
        this.fadeAlpha = 0;
        this.initAreas();
    }

    initAreas() {
        // 1. VILA INICIAL
        this.areas['vila'] = {
            id: 'vila',
            name: 'Vila de Solária',
            music: 'vila',
            bgTheme: 'grass_path',
            exits: {
                right: { targetArea: 'planicie', targetX: 40, targetY: 280 }
            },
            boundaries: {
                top: true,
                bottom: true,
                left: true,
                right: false
            },
            obstacles: [
                // Casa do Ferreiro (Noroeste)
                { x: 60, y: 50, w: 180, h: 120, type: 'house', label: 'Ferraria', sprite: 'blacksmith' },
                // Loja do Comerciante (Nordeste)
                { x: 540, y: 50, w: 180, h: 120, type: 'house', label: 'Taverna', sprite: 'market' },
                // Poço Central
                { x: 380, y: 250, w: 50, h: 50, type: 'well' },
                // Árvores decorativas
                { x: 260, y: 80, w: 40, h: 50, type: 'tree' },
                { x: 480, y: 80, w: 40, h: 50, type: 'tree' },
                { x: 300, y: 480, w: 45, h: 55, type: 'tree' },
                { x: 440, y: 480, w: 45, h: 55, type: 'tree' }
            ],
            bushes: [
                { variant: 0, x: 300, y: 365, size: 40 },
                { variant: 2, x: 420, y: 400, size: 42 },
                { variant: 4, x: 500, y: 355, size: 38 },
                { variant: 1, x: 65, y: 365, size: 40 },
                { variant: 3, x: 280, y: 205, size: 38 },
                { variant: 5, x: 555, y: 395, size: 42 },
                { variant: 2, x: 250, y: 420, size: 40 },
                { variant: 0, x: 735, y: 220, size: 38 }
            ],
            npcs: [
                {
                    id: 'mariah',
                    name: 'Mariah',
                    role: 'shopkeeper',
                    x: 630,
                    y: 190,
                    color: '#0284c7',
                    sprite: 'merchant',
                    dialogue: 'Olá, viajante! Tenho poções, equipamentos e cartas especiais para sua jornada.'
                },
                {
                    id: 'anciao',
                    name: 'Mestre Oakhaven',
                    role: 'npc',
                    x: 320,
                    y: 260,
                    color: '#65a30d',
                    sprite: 'sage',
                    spriteHeight: 58,
                    dialogue: 'Lembre-se: em combate, a ORDEM das suas cartas define seu destino! Use "Afiar" antes de armas como a Espada para golpear com +50% de dano!'
                }
            ],
            chests: [
                { id: 'chest_vila_1', x: 720, y: 380, gold: 35, cardTemplate: 'adaga', opened: false }
            ],
            enemies: [] // Vila segura sem monstros
        };

        // 2. PLANÍCIE VERDEJANTE (NÓ CENTRAL)
        this.areas['planicie'] = {
            id: 'planicie',
            name: 'Planície Verdejante',
            music: 'planicie',
            bgTheme: 'grass_crossroad',
            exits: {
                left: { targetArea: 'vila', targetX: 740, targetY: 280 },
                right: { targetArea: 'ruinas', targetX: 40, targetY: 280 },
                top: { targetArea: 'floresta', targetX: 400, targetY: 510 },
                bottom: { targetArea: 'caverna', targetX: 400, targetY: 40 }
            },
            boundaries: {
                top: false,
                bottom: false,
                left: false,
                right: false
            },
            obstacles: [
                // Lago pequeno à esquerda
                { x: 80, y: 80, w: 130, h: 90, type: 'water' },
                // Bosque de árvores no canto sudeste
                { x: 620, y: 380, w: 50, h: 60, type: 'tree' },
                { x: 690, y: 410, w: 50, h: 60, type: 'tree' },
                { x: 640, y: 460, w: 50, h: 60, type: 'tree' },
                // Pedras antigas
                { x: 180, y: 420, w: 60, h: 45, type: 'rock' },
                { x: 580, y: 120, w: 55, h: 40, type: 'rock' }
            ],
            bushes: [
                { variant: 1, x: 270, y: 90, size: 42 },
                { variant: 3, x: 280, y: 350, size: 40 },
                { variant: 5, x: 520, y: 490, size: 42 },
                { variant: 0, x: 520, y: 210, size: 38 },
                { variant: 2, x: 275, y: 500, size: 40 }
            ],
            npcs: [],
            chests: [
                { id: 'chest_planicie_1', x: 100, y: 470, gold: 40, cardTemplate: 'arco', opened: false }
            ],
            enemies: [
                {
                    id: 'enemy_plains_slime',
                    typeId: 'slime',
                    name: 'Slime Gosmento',
                    icon: '🟢',
                    sprite: 'slime.png',
                    x: 260,
                    y: 190,
                    patrolRadius: 60,
                    hp: 55,
                    maxHp: 55,
                    goldReward: 20,
                    baseDamage: 11,
                    actions: ['attack', 'buff'],
                    color: '#22c55e'
                },
                {
                    id: 'enemy_plains_goblin',
                    typeId: 'goblin',
                    name: 'Goblin Salteador',
                    icon: '👺',
                    sprite: 'goblin.png',
                    spriteFacesLeft: true,
                    x: 520,
                    y: 360,
                    patrolRadius: 75,
                    hp: 70,
                    maxHp: 70,
                    goldReward: 28,
                    baseDamage: 16,
                    actions: ['attack', 'bleed_attack'],
                    color: '#eab308'
                },
                {
                    id: 'enemy_plains_wolf',
                    typeId: 'lobo',
                    name: 'Lobo Cinzento',
                    icon: '🐺',
                    sprite: 'wolf.png',
                    spriteSize: 50,
                    battleSpriteSize: 86,
                    x: 350,
                    y: 430,
                    patrolRadius: 80,
                    hp: 65,
                    maxHp: 65,
                    goldReward: 25,
                    baseDamage: 17,
                    actions: ['bite', 'howl'],
                    color: '#78716c'
                },
                {
                    id: 'enemy_plains_slime_2',
                    typeId: 'slime',
                    name: 'Slime Gosmento',
                    icon: '🟢',
                    sprite: 'slime.png',
                    x: 440,
                    y: 250,
                    patrolRadius: 52,
                    hp: 55,
                    maxHp: 55,
                    goldReward: 20,
                    baseDamage: 11,
                    actions: ['attack', 'buff'],
                    color: '#22c55e'
                }
            ]
        };

        // 3. FLORESTA DOS MURMÚRIOS (NORTE)
        this.areas['floresta'] = {
            id: 'floresta',
            name: 'Floresta dos Murmúrios',
            music: 'floresta',
            bgTheme: 'deep_forest',
            exits: {
                bottom: { targetArea: 'planicie', targetX: 400, targetY: 40 }
            },
            boundaries: {
                top: true,
                bottom: false,
                left: true,
                right: true
            },
            obstacles: [
                // Densas fileiras de árvores cercando clareira
                { x: 30, y: 30, w: 160, h: 200, type: 'tree_cluster' },
                { x: 600, y: 30, w: 170, h: 220, type: 'tree_cluster' },
                { x: 40, y: 340, w: 140, h: 180, type: 'tree_cluster' },
                { x: 620, y: 340, w: 150, h: 180, type: 'tree_cluster' }
            ],
            bushes: [
                { variant: 0, x: 230, y: 200, size: 42 },
                { variant: 1, x: 560, y: 100, size: 40 },
                { variant: 3, x: 560, y: 300, size: 42 },
                { variant: 4, x: 250, y: 465, size: 40 },
                { variant: 5, x: 520, y: 470, size: 42 }
            ],
            npcs: [],
            chests: [
                { id: 'chest_floresta_1', x: 230, y: 70, gold: 60, cardTemplate: 'encantar', opened: false, relic: { id: 'pedra_fogo', name: 'Pedra de Fogo', desc: '+20% de dano para magias de fogo!' } }
            ],
            enemies: [
                {
                    id: 'enemy_forest_spider',
                    typeId: 'aranha',
                    name: 'Aranha Venenosa',
                    icon: '🕷️',
                    sprite: 'spider.png',
                    spriteFacesLeft: true,
                    x: 270,
                    y: 280,
                    patrolRadius: 70,
                    hp: 76,
                    maxHp: 76,
                    goldReward: 35,
                    baseDamage: 15,
                    actions: ['poison_bite', 'web'],
                    color: '#16a34a'
                },
                {
                    id: 'enemy_forest_spider_2',
                    typeId: 'aranha',
                    name: 'Aranha Venenosa',
                    icon: '🕷️',
                    sprite: 'spider.png',
                    spriteFacesLeft: true,
                    spriteSize: 42,
                    x: 480,
                    y: 95,
                    patrolRadius: 55,
                    hp: 76,
                    maxHp: 76,
                    goldReward: 35,
                    baseDamage: 15,
                    actions: ['poison_bite', 'web'],
                    color: '#16a34a'
                },
                {
                    id: 'enemy_forest_spider_3',
                    typeId: 'aranha',
                    name: 'Aranha Venenosa',
                    icon: '🕷️',
                    sprite: 'spider.png',
                    spriteFacesLeft: true,
                    spriteSize: 42,
                    x: 385,
                    y: 440,
                    patrolRadius: 55,
                    hp: 76,
                    maxHp: 76,
                    goldReward: 35,
                    baseDamage: 15,
                    actions: ['poison_bite', 'web'],
                    color: '#16a34a'
                },
                {
                    id: 'enemy_forest_goblin',
                    typeId: 'goblin_guerreiro',
                    name: 'Goblin Armadurado',
                    icon: '👹',
                    sprite: 'armored_goblin.png',
                    x: 480,
                    y: 270,
                    patrolRadius: 60,
                    hp: 92,
                    maxHp: 92,
                    goldReward: 42,
                    baseDamage: 20,
                    actions: ['heavy_cleave', 'shield_up'],
                    color: '#ca8a04'
                }
            ]
        };

        // 4. CAVERNA DE CRISTAL (SUL)
        this.areas['caverna'] = {
            id: 'caverna',
            name: 'Caverna de Cristal',
            music: 'caverna',
            bgTheme: 'cave_ground',
            exits: {
                top: { targetArea: 'planicie', targetX: 400, targetY: 510 }
            },
            boundaries: {
                top: false,
                bottom: true,
                left: true,
                right: true
            },
            obstacles: [
                // Paredes rochosas e estalagmites
                { x: 30, y: 60, w: 120, h: 320, type: 'rock_wall' },
                { x: 650, y: 60, w: 120, h: 320, type: 'rock_wall' },
                // Abismo subterrâneo
                { x: 300, y: 430, w: 200, h: 90, type: 'chasm' }
            ],
            npcs: [],
            chests: [
                { id: 'chest_caverna_1', x: 600, y: 440, gold: 75, cardTemplate: 'raio', opened: false }
            ],
            enemies: [
                {
                    id: 'enemy_cave_skeleton',
                    typeId: 'esqueleto',
                    name: 'Guardião Esqueleto',
                    icon: '💀',
                    sprite: 'skeleton.png',
                    spriteSize: 54,
                    battleSpriteSize: 96,
                    x: 230,
                    y: 330,
                    patrolRadius: 65,
                    hp: 85,
                    maxHp: 85,
                    goldReward: 38,
                    baseDamage: 18,
                    actions: ['bone_slash', 'shield_bash'],
                    color: '#e2e8f0'
                },
                {
                    id: 'enemy_cave_darkmage',
                    typeId: 'mago',
                    name: 'Necromante das Sombras',
                    icon: '🧙‍♂️',
                    sprite: 'necromancer.png',
                    spriteSize: 54,
                    battleSpriteSize: 96,
                    x: 540,
                    y: 330,
                    patrolRadius: 65,
                    hp: 80,
                    maxHp: 80,
                    goldReward: 48,
                    baseDamage: 21,
                    actions: ['shadow_bolt', 'curse'],
                    color: '#7c3aed'
                },
                {
                    id: 'enemy_cave_skeleton_2',
                    typeId: 'esqueleto',
                    name: 'Guardião Esqueleto',
                    icon: '💀',
                    sprite: 'skeleton.png',
                    spriteSize: 54,
                    battleSpriteSize: 96,
                    x: 200,
                    y: 205,
                    patrolRadius: 48,
                    hp: 85,
                    maxHp: 85,
                    goldReward: 38,
                    baseDamage: 18,
                    actions: ['bone_slash', 'shield_bash'],
                    color: '#e2e8f0'
                },
                {
                    id: 'enemy_cave_skeleton_3',
                    typeId: 'esqueleto',
                    name: 'Guardião Esqueleto',
                    icon: '💀',
                    sprite: 'skeleton.png',
                    spriteSize: 54,
                    battleSpriteSize: 96,
                    x: 560,
                    y: 210,
                    patrolRadius: 48,
                    hp: 85,
                    maxHp: 85,
                    goldReward: 38,
                    baseDamage: 18,
                    actions: ['bone_slash', 'shield_bash'],
                    color: '#e2e8f0'
                }
            ]
        };

        // 5. RUÍNAS ANTIGAS (LESTE - CHEFE DA REGIÃO)
        this.areas['ruinas'] = {
            id: 'ruinas',
            name: 'Ruínas Esquecidas',
            music: 'castelo',
            bgTheme: 'ruins_floor',
            exits: {
                left: { targetArea: 'planicie', targetX: 740, targetY: 280 }
            },
            boundaries: {
                top: true,
                bottom: true,
                left: false,
                right: true
            },
            obstacles: [
                // Colunas antigas quebradas
                { x: 180, y: 100, w: 45, h: 45, type: 'pillar' },
                { x: 180, y: 400, w: 45, h: 45, type: 'pillar' },
                { x: 380, y: 100, w: 45, h: 45, type: 'pillar' },
                { x: 380, y: 400, w: 45, h: 45, type: 'pillar' },
                { x: 580, y: 100, w: 45, h: 45, type: 'pillar' },
                { x: 580, y: 400, w: 45, h: 45, type: 'pillar' },
                // Altar do trono
                { x: 670, y: 220, w: 90, h: 120, type: 'throne' }
            ],
            npcs: [],
            chests: [
                { id: 'chest_ruinas_boss', x: 700, y: 120, gold: 120, cardTemplate: 'apocalipse', opened: false, relic: { id: 'martelo_ferreiro', name: 'Martelo do Ferreiro Ancestral', desc: 'Melhorias de cartas em ferreiros custam 20% menos!' } }
            ],
            enemies: [
                {
                    id: 'boss_rei_goblin',
                    typeId: 'rei_goblin',
                    isBoss: true,
                    name: 'Rei Goblin Malakor',
                    icon: '👑👺',
                    sprite: 'king_goblin.png',
                    spriteSize: 68,
                    battleSpriteSize: 112,
                    x: 560,
                    y: 260,
                    patrolRadius: 40,
                    hp: 200,
                    maxHp: 200,
                    goldReward: 85,
                    baseDamage: 27,
                    actions: ['royal_slam', 'goblin_rage', 'cleave'],
                    color: '#dc2626'
                }
            ]
        };

        // Aumenta em 20% a vida e o dano de todos os inimigos, mantendo
        // as proporções de dificuldade entre as áreas e tipos de inimigo.
        for (const area of Object.values(this.areas)) {
            for (const enemy of area.enemies || []) {
                enemy.maxHp = Math.round(enemy.maxHp * 1.2);
                enemy.hp = Math.round(enemy.hp * 1.2);
                enemy.baseDamage = Math.round(enemy.baseDamage * 1.2);
            }
        }
    }

    getCurrentArea() {
        return this.areas[this.currentAreaId] || this.areas['vila'];
    }

    // Checagem de colisões com paredes, obstáculos e limites
    checkCollision(x, y, radius = 16) {
        const area = this.getCurrentArea();

        // Limites externos da tela
        if (area.boundaries.left && x - radius < 15) return true;
        if (area.boundaries.right && x + radius > WORLD_WIDTH - 15) return true;
        if (area.boundaries.top && y - radius < 20) return true;
        if (area.boundaries.bottom && y + radius > WORLD_HEIGHT - 20) return true;

        // Obstáculos sólidos da área
        for (const obs of area.obstacles) {
            // AABB vs Círculo
            const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
            const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
            const distX = x - closestX;
            const distY = y - closestY;
            if ((distX * distX + distY * distY) < (radius * radius)) {
                return true;
            }
        }

        // NPCs agem como obstáculos sólidos
        for (const npc of area.npcs) {
            const dx = x - npc.x;
            const dy = y - npc.y;
            if (Math.hypot(dx, dy) < radius + 14) {
                return true;
            }
        }

        return false;
    }

    // Checa transição de tela estilo Undertale
    checkTransitions(player, onTransitionCallback) {
        if (this.transitioning) return;
        const area = this.getCurrentArea();

        let target = null;
        if (player.x <= 10 && area.exits.left) {
            target = area.exits.left;
        } else if (player.x >= WORLD_WIDTH - 15 && area.exits.right) {
            target = area.exits.right;
        } else if (player.y <= 15 && area.exits.top) {
            target = area.exits.top;
        } else if (player.y >= WORLD_HEIGHT - 20 && area.exits.bottom) {
            target = area.exits.bottom;
        }

        if (target) {
            this.triggerTransition(player, target.targetArea, target.targetX, target.targetY, onTransitionCallback);
        }
    }

    triggerTransition(player, newAreaId, newX, newY, callback) {
        this.transitioning = true;
        audio.transition();
        
        let fade = 0;
        const fadeInterval = setInterval(() => {
            fade += 0.15;
            this.fadeAlpha = Math.min(1, fade);
            if (fade >= 1) {
                clearInterval(fadeInterval);
                // Muda a área e teleporta o jogador para a entrada correta
                this.currentAreaId = newAreaId;
                player.currentArea = newAreaId;
                player.x = newX;
                player.y = newY;

                const newArea = this.getCurrentArea();
                audio.playMusic(newArea.music);

                if (callback) callback(newArea);

                // Fade in
                const fadeInInterval = setInterval(() => {
                    fade -= 0.15;
                    this.fadeAlpha = Math.max(0, fade);
                    if (fade <= 0) {
                        clearInterval(fadeInInterval);
                        this.transitioning = false;
                        this.fadeAlpha = 0;
                    }
                }, 25);
            }
        }, 25);
    }

    // Atualiza movimento dos inimigos pelo mapa
    updateEnemies(deltaTime) {
        const area = this.getCurrentArea();
        for (const enemy of area.enemies) {
            if (this.defeatedEnemies.has(enemy.id)) continue;

            if (!enemy.startX) {
                enemy.startX = enemy.x;
                enemy.startY = enemy.y;
                enemy.timer = Math.random() * 5;
                enemy.vx = 0;
                enemy.vy = 0;
            }

            enemy.timer += deltaTime;
            if (enemy.timer > 2.5) {
                enemy.timer = 0;
                // Chance de andar um pouco em raio de patrulha
                if (Math.random() < 0.6) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 0.8 + Math.random() * 0.6;
                    enemy.vx = Math.cos(angle) * speed;
                    enemy.vy = Math.sin(angle) * speed;
                } else {
                    enemy.vx = 0;
                    enemy.vy = 0;
                }
            }

            // Move dentro do raio
            const nextX = enemy.x + enemy.vx;
            const nextY = enemy.y + enemy.vy;
            const distFromStart = Math.hypot(nextX - enemy.startX, nextY - enemy.startY);

            if (distFromStart < enemy.patrolRadius && !this.checkCollision(nextX, nextY, 14)) {
                enemy.x = nextX;
                enemy.y = nextY;
            } else {
                enemy.vx = -enemy.vx;
                enemy.vy = -enemy.vy;
            }
        }
    }

    // Checa se o jogador tocou em um inimigo
    checkEnemyEncounter(player) {
        const area = this.getCurrentArea();
        for (const enemy of area.enemies) {
            if (this.defeatedEnemies.has(enemy.id)) continue;
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < 26) {
                return enemy;
            }
        }
        return null;
    }

    // Interações com NPCs e baús ao apertar E ou Barra de Espaço
    checkInteractions(player) {
        const area = this.getCurrentArea();

        // 1. Checa Baús próximos
        for (const chest of area.chests) {
            if (this.openedChests.has(chest.id) || chest.opened) continue;
            const dist = Math.hypot(player.x - (chest.x + 15), player.y - (chest.y + 15));
            if (dist < 40) {
                return { type: 'chest', target: chest };
            }
        }

        // 2. Checa NPCs próximos
        for (const npc of area.npcs) {
            const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
            if (dist < 45) {
                return { type: 'npc', target: npc };
            }
        }

        // 3. Ferraria: E abre a lista de aprimoramentos ao chegar perto da construção.
        const blacksmith = area.obstacles.find(obs => obs.type === 'house' && obs.sprite === 'blacksmith');
        if (blacksmith) {
            const dx = Math.max(blacksmith.x - player.x, 0, player.x - (blacksmith.x + blacksmith.w));
            const dy = Math.max(blacksmith.y - player.y, 0, player.y - (blacksmith.y + blacksmith.h));
            if (Math.hypot(dx, dy) < 58) {
                return { type: 'blacksmith', target: blacksmith };
            }
        }

        return null;
    }

    markEnemyDefeated(enemyId) {
        this.defeatedEnemies.add(enemyId);
    }

    markChestOpened(chestId) {
        this.openedChests.add(chestId);
    }

    // Serialização do progresso no mundo
    toJSON() {
        return {
            currentAreaId: this.currentAreaId,
            openedChests: Array.from(this.openedChests),
            defeatedEnemies: Array.from(this.defeatedEnemies)
        };
    }

    fromJSON(data) {
        if (data.currentAreaId) this.currentAreaId = data.currentAreaId;
        if (data.openedChests) this.openedChests = new Set(data.openedChests);
        if (data.defeatedEnemies) this.defeatedEnemies = new Set(data.defeatedEnemies);
    }
}
