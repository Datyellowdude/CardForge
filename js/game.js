// Motor Principal do Jogo, Renderização de Pixel Art e Loop de Jogo
// HDD — RPG 2D de Cartas e Exploração Medieval

class Game {
    constructor() {
        this.canvas = document.getElementById('worldCanvas');
        this.displayCtx = this.canvas.getContext('2d');
        this.pixelCanvas = document.createElement('canvas');
        this.pixelCanvas.width = Math.ceil(this.canvas.width * 0.5);
        this.pixelCanvas.height = Math.ceil(this.canvas.height * 0.5);
        this.ctx = this.pixelCanvas.getContext('2d');
        this.ctx.setTransform(this.pixelCanvas.width / this.canvas.width, 0, 0, this.pixelCanvas.height / this.canvas.height, 0, 0);
        this.ctx.imageSmoothingEnabled = false;

        this.state = 'TITLE'; // TITLE, EXPLORING, COMBAT, SHOP, BLACKSMITH, DIALOG, PAUSED
        this.player = new Player();
        this.world = new WorldManager();
        this.enemySprites = {};
        for (const name of ['slime.png', 'wolf.png', 'goblin.png', 'spider.png', 'armored_goblin.png', 'skeleton.png', 'necromancer.png', 'king_goblin.png']) {
            const sprite = new Image();
            sprite.src = `assets/enemies/${name}`;
            this.enemySprites[name] = sprite;
        }
        this.playerSprite = new Image();
        this.playerBodySprite = null;
        this.playerPlumeSprite = null;
        this.playerPlumeCrop = { x: 4, y: 3, width: 82, height: 31, pivotX: 72, pivotY: 29 };
        this.playerSprite.onload = () => {
            const { x, y, width, height } = this.playerPlumeCrop;
            const body = document.createElement('canvas');
            body.width = this.playerSprite.naturalWidth;
            body.height = this.playerSprite.naturalHeight;
            const bodyCtx = body.getContext('2d');
            bodyCtx.drawImage(this.playerSprite, 0, 0);
            bodyCtx.clearRect(x, y, width, height);
            this.playerBodySprite = body;

            const plume = document.createElement('canvas');
            plume.width = width;
            plume.height = height;
            plume.getContext('2d').drawImage(this.playerSprite, x, y, width, height, 0, 0, width, height);
            this.playerPlumeSprite = plume;
        };
        this.playerSprite.src = 'assets/player/knight.png';
        this.mageSprite = new Image();
        this.mageSprite.src = 'assets/characters/mage.png';
        this.terrainTextures = {};
        for (const [name, file] of Object.entries({
            grass: 'grass.png',
            bricks: 'gray_bricks.png',
            dirt: 'dirt.png',
            stone: 'stone.png'
        })) {
            const texture = new Image();
            texture.src = `assets/terrain/${file}`;
            this.terrainTextures[name] = texture;
        }
        this.treeSprite = new Image();
        this.treeSprite.src = 'assets/terrain/pine_tree.png';
        this.chestSprite = new Image();
        this.chestSprite.src = 'assets/chests/chest.png';
        this.bushSprites = Array.from({ length: 6 }, (_, index) => {
            const sprite = new Image();
            sprite.src = `assets/foliage/bush-${index + 1}.png`;
            return sprite;
        });
        this.buildingSprites = {};
        for (const [name, file] of Object.entries({ market: 'tavern.png', blacksmith: 'blacksmith.png' })) {
            const sprite = new Image();
            sprite.src = `assets/buildings/${file}`;
            this.buildingSprites[name] = sprite;
        }
        this.npcSprites = {};
        for (const [name, file] of Object.entries({
            merchant: 'mariah.png',
            sage: 'oakhaven.png'
        })) {
            const sprite = new Image();
            sprite.src = `assets/npcs/${file}`;
            this.npcSprites[name] = sprite;
        }
        this.terrainPatterns = {};
        this.combatEngine = new CombatEngine(this.player);
        this.ui = new UIManager(this);

        this.keys = {};
        this.touchMove = { x: 0, y: 0 };
        this.lastTime = performance.now();
        this.idleTime = 0;
        this.pendingEncounterEnemy = null;
        this.interactTarget = null;
        this.dustParticles = [];
        this.backdropAreaId = null;

        this.initInput();
        this.initTitleScreen();
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            if (this.state === 'COMBAT' && this.ui.combatTutorialActive && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                this.ui.advanceCombatTutorial();
                return;
            }

            // Atalhos rápidos
            if (this.state === 'EXPLORING') {
                if (e.key.toLowerCase() === 'b') {
                    this.ui.openDeckModal();
                } else if (e.key.toLowerCase() === 'e' || e.code === 'Space') {
                    this.handleInteraction();
                }
            } else if (e.key === 'Escape') {
                this.ui.closeModals();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        const joystick = document.getElementById('touchJoystick');
        const thumb = joystick?.querySelector('.touch-joystick-thumb');
        const interactButton = document.getElementById('touchInteract');
        if (joystick && thumb) {
            let activePointer = null;
            const releaseJoystick = (event) => {
                if (activePointer !== event.pointerId) return;
                activePointer = null;
                this.touchMove.x = 0;
                this.touchMove.y = 0;
                thumb.style.transform = 'translate(-50%, -50%)';
                if (joystick.hasPointerCapture(event.pointerId)) joystick.releasePointerCapture(event.pointerId);
            };
            const moveJoystick = (event) => {
                if (activePointer !== event.pointerId) return;
                const rect = joystick.getBoundingClientRect();
                const maxDistance = rect.width * 0.31;
                let dx = event.clientX - (rect.left + rect.width / 2);
                let dy = event.clientY - (rect.top + rect.height / 2);
                const distance = Math.hypot(dx, dy);
                if (distance > maxDistance) {
                    dx = dx / distance * maxDistance;
                    dy = dy / distance * maxDistance;
                }
                this.touchMove.x = dx / maxDistance;
                this.touchMove.y = dy / maxDistance;
                thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            };
            joystick.addEventListener('pointerdown', (event) => {
                if (this.state !== 'EXPLORING') return;
                event.preventDefault();
                activePointer = event.pointerId;
                joystick.setPointerCapture(activePointer);
                moveJoystick(event);
            });
            joystick.addEventListener('pointermove', moveJoystick);
            joystick.addEventListener('pointerup', releaseJoystick);
            joystick.addEventListener('pointercancel', releaseJoystick);
        }
        interactButton?.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            if (this.state === 'EXPLORING') this.handleInteraction();
        });
    }

    initTitleScreen() {
        const titleScreen = document.getElementById('titleScreen');
        titleScreen.addEventListener('pointerdown', () => {
            audio.ensureContext();
            audio.playMusic('menu');
        }, { once: true });
        const titleCanvas = document.getElementById('titleCanvas');
        const titleCtx = titleCanvas.getContext('2d');
        const grass = this.terrainTextures.grass;
        const drawGrassMenu = () => {
            const scale = window.devicePixelRatio || 1;
            titleCanvas.width = Math.ceil(titleCanvas.clientWidth * scale);
            titleCanvas.height = Math.ceil(titleCanvas.clientHeight * scale);
            titleCtx.setTransform(scale, 0, 0, scale, 0, 0);
            const width = titleCanvas.clientWidth;
            const height = titleCanvas.clientHeight;
            titleCtx.clearRect(0, 0, width, height);
            if (grass.complete && grass.naturalWidth) {
                const tile = document.createElement('canvas');
                tile.width = 192; tile.height = 192;
                const tileCtx = tile.getContext('2d');
                tileCtx.drawImage(grass, 0, 0, tile.width, tile.height);
                titleCtx.fillStyle = titleCtx.createPattern(tile, 'repeat');
                titleCtx.fillRect(0, 0, width, height);
            }
            titleCtx.fillStyle = 'rgba(5, 10, 8, 0.34)';
            titleCtx.fillRect(0, 0, width, height);
        };
        drawGrassMenu();
        grass.addEventListener('load', drawGrassMenu, { once: true });
        window.addEventListener('resize', drawGrassMenu);
        const btnNewGame = document.getElementById('btnNewGame');
        const btnContinue = document.getElementById('btnContinue');
        const classSelectModal = document.getElementById('classSelectModal');
        const classSelectBackBtn = document.getElementById('classSelectBackBtn');

        // Checa se há jogo salvo
        if (SaveManager.hasSaveData()) {
            btnContinue.disabled = false;
            btnContinue.classList.remove('disabled');
        } else {
            btnContinue.disabled = true;
            btnContinue.classList.add('disabled');
        }

        btnNewGame.addEventListener('click', () => {
            audio.ensureContext();
            audio.playMusic('menu');
            audio.cardSelect();
            classSelectModal.classList.remove('hidden');
        });

        classSelectBackBtn.addEventListener('click', () => {
            classSelectModal.classList.add('hidden');
        });

        for (const [buttonId, classId] of [['chooseKnightBtn', 'knight'], ['chooseMageBtn', 'mage']]) {
            document.getElementById(buttonId).addEventListener('click', () => {
                audio.cardSelect();
                classSelectModal.classList.add('hidden');
                titleScreen.classList.add('hidden');
                this.startNewGame(classId);
            });
        }

        btnContinue.addEventListener('click', () => {
            audio.ensureContext();
            audio.cardSelect();
            if (SaveManager.loadGame(this)) {
                titleScreen.classList.add('hidden');
                this.resumeGame();
                this.ui.showToast('Progresso restaurado!');
            }
        });
    }

    startNewGame(classId = 'knight') {
        this.player.reset(classId);
        this.world = new WorldManager();
        this.combatEngine = new CombatEngine(this.player);
        this.state = 'EXPLORING';
        this.ui.updateHUD();
        audio.playMusic(this.world.getCurrentArea().music);
        const className = this.player.classId === 'mage' ? 'Mago' : 'Cavaleiro';
        this.ui.showToast(`${className}: sua aventura em Solária começou!`);
    }

    resumeGame() {
        this.combatEngine = new CombatEngine(this.player);
        this.state = 'EXPLORING';
        this.ui.updateHUD();
        audio.playMusic(this.world.getCurrentArea().music);
    }

    saveGame() {
        SaveManager.saveGame(this);
    }

    // Interações com NPCs e Baús
    handleInteraction() {
        const target = this.world.checkInteractions(this.player);
        if (!target) return;

        if (target.type === 'chest') {
            const chest = target.target;
            this.world.markChestOpened(chest.id);
            audio.coin();
            this.player.addGold(chest.gold);
            
            let extraMsg = '';
            if (chest.cardTemplate) {
                const newCard = new Card(chest.cardTemplate, 1);
                this.player.addCard(newCard);
                extraMsg = ` e a carta [${newCard.name}]`;
            }
            if (chest.relic) {
                this.player.addRelic(chest.relic);
                extraMsg += ` e a relíquia [${chest.relic.name}]`;
            }

            this.ui.openDialog('Baú de Tesouro', `Você abriu o baú antigo e encontrou 🪙 ${chest.gold} moedas${extraMsg}!`);
            this.ui.updateHUD();
        } else if (target.type === 'npc') {
            const npc = target.target;
            audio.cardSelect();
            if (npc.role === 'blacksmith') {
                this.ui.openDialog(npc.name, npc.dialogue, '🔨 Abrir Ferraria', () => {
                    this.ui.openBlacksmithModal();
                });
            } else if (npc.role === 'shopkeeper') {
                this.ui.openDialog(npc.name, npc.dialogue, '🛒 Abrir Loja', () => {
                    this.ui.openShopModal();
                });
            } else {
                this.ui.openDialog(npc.name, npc.dialogue);
            }
        } else if (target.type === 'blacksmith') {
            audio.anvil();
            this.ui.openBlacksmithModal();
        }
    }

    // Gatilho de Combate
    triggerCombat(enemy) {
        this.state = 'COMBAT';
        this.pendingEncounterEnemy = enemy;
        audio.playTone(150, 'sawtooth', 0.3, 0.3, 40);

        // Se for o chefe das Ruínas, pode ter um guarda de apoio
        const enemiesToFight = [enemy];
        if (enemy.isBoss) {
            enemiesToFight.push({
                typeId: 'goblin_guerreiro',
                name: 'Guarda Real Goblin',
                icon: '👹',
                sprite: 'armored_goblin.png',
                spriteFacesLeft: true,
                spriteSize: 56,
                battleSpriteSize: 104,
                hp: 90,
                maxHp: 90,
                goldReward: 75,
                cardRewardPicks: 2,
                damageReduction: 0.5,
                baseDamage: 14,
                actions: ['heavy_cleave', 'shield_up'],
                color: '#ca8a04'
            });
        }

        this.combatEngine.startCombat(enemiesToFight, (result) => {
            this.ui.handleCombatFinished(result);
        }, this.world.getCurrentArea().music);

        this.ui.setupCombatView();
        if (!this.player.hasSeenCombatTutorial) this.ui.startCombatTutorial();
    }

    returnToWorldAfterCombat() {
        if (this.pendingEncounterEnemy) {
            this.world.markEnemyDefeated(this.pendingEncounterEnemy.id);
            this.pendingEncounterEnemy = null;
        }

        this.ui.hideCombatView();
        this.state = 'EXPLORING';
        this.ui.updateHUD();
        audio.playMusic(this.world.getCurrentArea().music);
        this.saveGame();
    }

    respawnPlayer() {
        this.pendingEncounterEnemy = null;
        this.ui.hideCombatView();
        this.player.currentArea = 'vila';
        this.world.currentAreaId = 'vila';
        this.player.x = 400;
        this.player.y = 360;
        this.player.hp = Math.floor(this.player.maxHp * 0.6);
        this.state = 'EXPLORING';
        this.ui.updateHUD();
        audio.playMusic('vila');
        this.ui.showToast('Você acordou na enfermaria da Vila de Solária.');
    }

    // Loop de Atualização
    update(deltaTime) {
        this.idleTime += deltaTime;
        if (this.state === 'COMBAT') {
            this.ui.updateBattleScene(deltaTime);
            return;
        }

        if (this.state !== 'EXPLORING') return;

        let moveX = 0;
        let moveY = 0;

        if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
        moveX += this.touchMove.x;
        moveY += this.touchMove.y;
        const inputLength = Math.hypot(moveX, moveY);
        if (inputLength > 1) {
            moveX /= inputLength;
            moveY /= inputLength;
        }
        if (Math.abs(moveX) > Math.abs(moveY) && Math.abs(moveX) > 0.15) this.player.direction = moveX < 0 ? 'left' : 'right';
        else if (Math.abs(moveY) > 0.15) this.player.direction = moveY < 0 ? 'up' : 'down';

        if (moveX !== 0 || moveY !== 0) {
            const nextX = this.player.x + moveX * this.player.speed;
            const nextY = this.player.y + moveY * this.player.speed;

            // Checagem de colisões eixo a eixo
            if (!this.world.checkCollision(nextX, this.player.y)) {
                this.player.x = nextX;
            }
            if (!this.world.checkCollision(this.player.x, nextY)) {
                this.player.y = nextY;
            }

            this.player.isMoving = true;
            this.player.animTimer += deltaTime;
            if (this.player.animTimer > 0.16) {
                this.player.animTimer = 0;
                this.player.animFrame = (this.player.animFrame + 1) % 4;
                if (this.player.animFrame % 2 === 0) {
                    audio.step();
                }
            }

            // Partículas de poeira dos passos
            if (Math.random() < 0.35) {
                this.dustParticles.push({
                    x: this.player.x + (Math.random() * 8 - 4),
                    y: this.player.y + 12,
                    alpha: 0.6,
                    radius: 2 + Math.random() * 2
                });
            }
        } else {
            this.player.isMoving = false;
            this.player.animFrame = 0;
        }

        // Atualiza poeira
        for (let i = this.dustParticles.length - 1; i >= 0; i--) {
            const dp = this.dustParticles[i];
            dp.alpha -= deltaTime * 1.5;
            dp.radius += deltaTime * 2;
            if (dp.alpha <= 0) this.dustParticles.splice(i, 1);
        }

        // Checa transições de tela estilo Undertale
        this.world.checkTransitions(this.player, (newArea) => {
            this.ui.updateHUD();
            this.ui.showToast(`Entrou em: ${newArea.name}`);
        });

        // Atualiza patrulha dos monstros
        this.world.updateEnemies(deltaTime);
        this.world.updateNpcs(deltaTime);

        // Checa encontro com inimigo
        const encounter = this.world.checkEnemyEncounter(this.player);
        if (encounter) {
            this.triggerCombat(encounter);
        }

        // Checa alvo de interação próximo
        this.interactTarget = this.world.checkInteractions(this.player);
        const touchInteract = document.getElementById('touchInteract');
        if (touchInteract) {
            touchInteract.disabled = !this.interactTarget;
            touchInteract.textContent = this.interactTarget ? 'INTERAGIR' : 'SEM ALVO';
        }
    }

    // Renderização no Canvas
    render() {
        if (this.state === 'COMBAT') {
            this.canvas.style.visibility = 'hidden';
            try {
                this.ui.renderBattleScene();
            } catch (error) {
                if (!this._battleRenderErrorReported) {
                    console.error('Falha ao desenhar o cenário de combate:', error);
                    this._battleRenderErrorReported = true;
                }
                this.ui.renderBattleFallback();
            }
            return;
        }

        this.canvas.style.visibility = '';

        this.ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        const area = this.world.getCurrentArea();
        this.updateViewportBackdrop(area);

        // 1. Cenário e Terreno
        this.renderTerrain(area);

        // 2. Obstáculos e Decoração
        this.renderObstacles(area);
        this.renderDecorations(area);

        // 3. Baús
        this.renderChests(area);

        // 4. NPCs
        this.renderNPCs(area);

        // 5. Inimigos
        this.renderEnemies(area);

        // Partículas de poeira dos passos
        for (const dp of this.dustParticles) {
            this.ctx.fillStyle = `rgba(148, 163, 184, ${dp.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 6. Jogador
        this.renderPlayer();

        // 7. Prompt de Interação [E]
        // 8. Efeito de Fade de Transição
        if (this.world.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(15, 23, 42, ${this.world.fadeAlpha})`;
            this.ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        }

        this.presentPixelatedFrame();
        this.renderSharpSprites(area);
    }

    updateViewportBackdrop(area) {
        if (!area || this.backdropAreaId === area.id) return;
        const terrain = area.bgTheme === 'cave_ground' || area.bgTheme === 'ruins_floor' ? 'stone.png' : 'grass.png';
        const viewport = document.getElementById('mainViewport');
        viewport.style.backgroundImage = `linear-gradient(rgba(3, 5, 10, 0.58), rgba(3, 5, 10, 0.58)), url("assets/terrain/${terrain}")`;
        viewport.style.backgroundSize = '100% 100%, 220px 220px';
        viewport.style.backgroundRepeat = 'no-repeat, repeat';
        this.backdropAreaId = area.id;
    }

    presentPixelatedFrame() {
        this.displayCtx.imageSmoothingEnabled = false;
        this.displayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.displayCtx.drawImage(this.pixelCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    getTerrainPattern(name) {
        if (this.terrainPatterns[name]) return this.terrainPatterns[name];
        const texture = this.terrainTextures[name];
        if (!texture || !texture.complete || !texture.naturalWidth) return null;

        const scale = { grass: 0.2, bricks: 0.22, dirt: 0.42, stone: 0.2 }[name] || 0.2;
        const tile = document.createElement('canvas');
        tile.width = Math.max(1, Math.round(texture.naturalWidth * scale));
        tile.height = Math.max(1, Math.round(texture.naturalHeight * scale));
        const tileCtx = tile.getContext('2d');
        tileCtx.imageSmoothingEnabled = true;
        tileCtx.drawImage(texture, 0, 0, tile.width, tile.height);
        this.terrainPatterns[name] = this.ctx.createPattern(tile, 'repeat');
        return this.terrainPatterns[name];
    }

    fillTexturedRect(name, x, y, width, height, fallbackColor, overlayColor = null) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, width, height);
        const pattern = this.getTerrainPattern(name);
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(x, y, width, height);
        }
        if (overlayColor) {
            ctx.fillStyle = overlayColor;
            ctx.fillRect(x, y, width, height);
        }
        ctx.restore();
    }

    fillTexturedEllipse(name, centerX, centerY, radiusX, radiusY, fallbackColor) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.clip();
        this.fillTexturedRect(name, centerX - radiusX, centerY - radiusY, radiusX * 2, radiusY * 2, fallbackColor);
        ctx.restore();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    }

    drawTreeObstacle(obs) {
        const tree = this.treeSprite;
        if (!tree.complete || !tree.naturalWidth) return false;

        const ctx = this.ctx;
        const count = obs.type === 'tree_cluster' ? 3 : 1;
        const spacing = obs.w / count;
        const width = obs.type === 'tree_cluster' ? Math.max(54, spacing * 1.2) : Math.max(54, obs.w * 1.5);
        const height = width * tree.naturalHeight / tree.naturalWidth;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < count; i++) {
            const centerX = obs.x + spacing * (i + 0.5);
            const scale = count > 1 ? 0.86 + ((i + 1) % 2) * 0.18 : 1;
            const treeWidth = width * scale;
            const treeHeight = height * scale;
            const bottom = obs.y + obs.h;
            ctx.drawImage(tree, centerX - treeWidth / 2, bottom - treeHeight, treeWidth, treeHeight);
        }
        ctx.restore();
        return true;
    }

    drawBuildingSprite(obs) {
        const sprite = this.buildingSprites[obs.sprite];
        if (!sprite || !sprite.complete || !sprite.naturalWidth) return false;

        const height = obs.h + 50;
        const width = height * sprite.naturalWidth / sprite.naturalHeight;
        const x = obs.x + obs.w / 2 - width / 2;
        const y = obs.y + obs.h - height;
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(sprite, x, y, width, height);
        this.ctx.restore();
        return true;
    }

    renderSharpSprites(area) {
        const ctx = this.displayCtx;
        for (const npc of area.npcs) {
            const sprite = npc.sprite && this.npcSprites[npc.sprite];
            if (!sprite || !sprite.complete || !sprite.naturalWidth) continue;
            const height = npc.spriteHeight || 64;
            const width = height * sprite.naturalWidth / sprite.naturalHeight;
            const bob = npc.isMoving
                ? Math.abs(Math.sin((npc.animTime || this.idleTime) * 10)) * 2
                : Math.sin(this.idleTime * (npc.idleAnimation ? 2.5 : 1.8) + (npc.id === 'mariah' ? 0.4 : 0)) * (npc.idleAnimation ? 1.8 : 0.8);
            const sway = Math.sin((npc.animTime || this.idleTime) * (npc.isMoving ? 10 : 1.8)) * (npc.isMoving ? 0.025 : (npc.idleAnimation ? 0.022 : 0.012));
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.translate(npc.x, npc.y + bob);
            ctx.rotate(sway);
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
            ctx.restore();
        }

        for (const enemy of area.enemies) {
            if (this.world.defeatedEnemies.has(enemy.id) || !enemy.sprite) continue;
            if (!this.drawEnemySprite(ctx, enemy, enemy.x, enemy.y, enemy.spriteSize || (enemy.isBoss ? 42 : 38))) {
                ctx.save();
                ctx.font = enemy.isBoss ? '32px monospace' : '24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(enemy.icon, enemy.x, enemy.y);
                ctx.restore();
            }
        }

        const p = this.player;
        const isMage = p.classId === 'mage';
        const bob = p.isMoving
            ? Math.sin(p.animFrame * Math.PI) * 2
            : Math.sin(this.idleTime * 2.2) * (isMage ? 1.7 : 1.1);
        const idleSway = p.isMoving ? 0 : Math.sin(this.idleTime * (isMage ? 1.7 : 1.25)) * (isMage ? 0.035 : 0.015);
        const plumeSway = Math.sin(this.idleTime * 3.1) * (p.isMoving ? 0.07 : 0.12);
        const playerHeight = p.classId === 'mage' ? 72 : 52;
        this.drawPlayerCharacter(ctx, p.x, p.y - 6 + bob, playerHeight, {
            flip: p.direction === 'left',
            bodyAngle: idleSway,
            plumeAngle: plumeSway
        });

        for (const npc of area.npcs) {
            const height = npc.spriteHeight || 64;
            this.drawOutlinedName(ctx, npc.name, npc.x, npc.y - height / 2 - 7);
        }
        for (const enemy of area.enemies) {
            if (this.world.defeatedEnemies.has(enemy.id)) continue;
            const spriteSize = enemy.spriteSize || (enemy.isBoss ? 42 : 38);
            this.drawOutlinedName(ctx, enemy.name, enemy.x, enemy.y - spriteSize / 2 - 9, enemy.isBoss ? '#ffe082' : '#ffffff');
        }
        this.drawOutlinedName(ctx, p.name, p.x, p.y - 6 + bob - playerHeight / 2 - 7, '#fff1a8');
        if (this.interactTarget && this.state === 'EXPLORING') this.renderInteractPrompt();
        this.renderBuildingLabels(area);
    }

    renderBuildingLabels(area) {
        const ctx = this.displayCtx;
        for (const obs of area.obstacles) {
            if (obs.type !== 'house' || !obs.label) continue;
            const centerX = obs.x + obs.w / 2;
            const centerY = obs.y + 35;
            ctx.save();
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const boxWidth = ctx.measureText(obs.label).width + 20;
            ctx.fillStyle = 'rgba(20, 13, 5, 0.94)';
            ctx.fillRect(centerX - boxWidth / 2, centerY - 14, boxWidth, 28);
            ctx.strokeStyle = '#ffe28a';
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - boxWidth / 2, centerY - 14, boxWidth, 28);
            ctx.lineJoin = 'round';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#21170a';
            ctx.strokeText(obs.label, centerX, centerY);
            ctx.fillStyle = '#fff6d4';
            ctx.fillText(obs.label, centerX, centerY);
            ctx.restore();
        }
    }

    drawOutlinedName(ctx, name, x, y, color = '#ffffff') {
        ctx.save();
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const textWidth = ctx.measureText(name).width;
        x = Math.max(textWidth / 2 + 5, Math.min(ctx.canvas.width - textWidth / 2 - 5, x));
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(5, 8, 12, 0.96)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.strokeText(name, x, y);
        ctx.fillStyle = color;
        ctx.fillText(name, x, y);
        ctx.restore();
    }

    drawPlayerCharacter(ctx, x, y, height, options = {}) {
        if (this.player.classId !== 'mage') {
            return this.drawKnightSprite(ctx, x, y, height, options);
        }

        const sprite = this.mageSprite;
        if (!sprite || !sprite.complete || !sprite.naturalWidth || !sprite.naturalHeight) return false;
        const horizontalScale = options.horizontalScale || 1;
        const width = height * sprite.naturalWidth / sprite.naturalHeight * horizontalScale;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, y);
        if (options.flip) ctx.scale(-1, 1);
        if (options.bodyAngle) ctx.rotate(options.bodyAngle);
        ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
    }

    drawKnightSprite(ctx, x, y, height, options = {}) {
        const body = this.playerBodySprite;
        const plume = this.playerPlumeSprite;
        if (!body || !body.width || !body.height) return false;

        const horizontalScale = options.horizontalScale || 1;
        const width = height * body.width / body.height * horizontalScale;
        const scaleX = width / body.width;
        const scaleY = height / body.height;
        const crop = this.playerPlumeCrop;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, y);
        if (options.flip) ctx.scale(-1, 1);
        if (options.bodyAngle) ctx.rotate(options.bodyAngle);
        ctx.drawImage(body, -width / 2, -height / 2, width, height);

        if (plume) {
            ctx.save();
            ctx.translate((crop.pivotX - body.width / 2) * scaleX, (crop.pivotY - body.height / 2) * scaleY);
            ctx.rotate(options.plumeAngle || 0);
            ctx.drawImage(
                plume,
                (crop.x - crop.pivotX) * scaleX,
                (crop.y - crop.pivotY) * scaleY,
                crop.width * scaleX,
                crop.height * scaleY
            );
            ctx.restore();
        }
        ctx.restore();
        return true;
    }

    renderTerrain(area) {
        if (area.bgTheme === 'grass_path') {
            // Vila: Gramado com estradas de paralelepípedo
            this.fillTexturedRect('grass', 0, 0, WORLD_WIDTH, WORLD_HEIGHT, '#2d6a4f');

            // Caminhos de terra na vila
            this.fillTexturedRect('dirt', 0, 240, WORLD_WIDTH, 80, '#92400e');

            // Estrada norte-sul para as casas
            this.fillTexturedRect('dirt', 110, 160, 80, 90, '#92400e');
            this.fillTexturedRect('dirt', 590, 160, 80, 90, '#92400e');
        } else if (area.bgTheme === 'grass_crossroad') {
            // Planície: Grama vibrante com encruzilhada
            this.fillTexturedRect('grass', 0, 0, WORLD_WIDTH, WORLD_HEIGHT, '#38b000');

            // Encruzilhada de terra
            this.fillTexturedRect('dirt', 0, 250, WORLD_WIDTH, 60, '#92400e'); // Leste-Oeste
            this.fillTexturedRect('dirt', 370, 0, 60, WORLD_HEIGHT, '#92400e'); // Norte-Sul

            // Flores decorativas
            const flowers = [
                { x: 140, y: 320, c: '#facc15' },
                { x: 260, y: 120, c: '#f43f5e' },
                { x: 480, y: 440, c: '#38bdf8' },
                { x: 670, y: 200, c: '#facc15' }
            ];
            flowers.forEach(f => {
                this.ctx.fillStyle = f.c;
                this.ctx.beginPath();
                this.ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else if (area.bgTheme === 'deep_forest') {
            // Floresta: Tons profundos de musgo
            this.fillTexturedRect('grass', 0, 0, WORLD_WIDTH, WORLD_HEIGHT, '#14532d');
            this.ctx.fillStyle = 'rgba(4, 35, 19, 0.5)';
            this.ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

            // Clareira central
            this.fillTexturedEllipse('grass', 400, 280, 260, 180, '#166534');
            this.ctx.fillStyle = 'rgba(12, 60, 32, 0.28)';
            this.ctx.beginPath();
            this.ctx.ellipse(400, 280, 260, 180, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (area.bgTheme === 'cave_ground') {
            // Caverna: Pedra escura
            this.fillTexturedRect('stone', 0, 0, WORLD_WIDTH, WORLD_HEIGHT, '#1e293b');
            this.ctx.fillStyle = 'rgba(10, 19, 34, 0.38)';
            this.ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

            // Veios de cristal brilhante no chão
            this.ctx.strokeStyle = '#0284c7';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(180, 100);
            this.ctx.lineTo(260, 280);
            this.ctx.lineTo(340, 360);
            this.ctx.stroke();
        } else if (area.bgTheme === 'ruins_floor') {
            // Ruínas: Lajes de pedra rachadas
            this.fillTexturedRect('stone', 0, 0, WORLD_WIDTH, WORLD_HEIGHT, '#334155');
            this.ctx.fillStyle = 'rgba(20, 25, 38, 0.42)';
            this.ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

            // Tapete vermelho central para o trono
            this.ctx.fillStyle = '#991b1b';
            this.ctx.fillRect(80, 260, 600, 40);
        }
    }

    renderObstacles(area) {
        for (const obs of area.obstacles) {
            if (obs.type === 'house') {
                if (obs.sprite && this.drawBuildingSprite(obs)) {
                    continue;
                }

                // Casas de madeira com telhado colonial
                this.ctx.fillStyle = '#7c2d12'; // Telhado
                this.ctx.fillRect(obs.x, obs.y, obs.w, 45);

                this.ctx.fillStyle = '#d97706'; // Paredes
                this.ctx.fillRect(obs.x + 10, obs.y + 45, obs.w - 20, obs.h - 45);

                // Porta
                this.ctx.fillStyle = '#451a03';
                this.ctx.fillRect(obs.x + obs.w / 2 - 15, obs.y + obs.h - 35, 30, 35);

            } else if (obs.type === 'well') {
                // Poço de pedra
                this.ctx.fillStyle = '#64748b';
                this.ctx.beginPath();
                this.ctx.arc(obs.x + 25, obs.y + 25, 24, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#0284c7';
                this.ctx.beginPath();
                this.ctx.arc(obs.x + 25, obs.y + 25, 14, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obs.type === 'tree' || obs.type === 'tree_cluster') {
                if (!this.drawTreeObstacle(obs)) {
                    this.ctx.fillStyle = '#15803d';
                    this.ctx.beginPath();
                    this.ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2 - 10, Math.max(obs.w, obs.h) / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (obs.type === 'rock') {
                this.fillTexturedEllipse('stone', obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, '#64748b');
                this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else if (obs.type === 'rock_wall') {
                this.fillTexturedRect('stone', obs.x, obs.y, obs.w, obs.h, '#475569');
                this.ctx.strokeStyle = '#1e293b';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            } else if (obs.type === 'chasm') {
                this.ctx.fillStyle = '#080b12';
                this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                this.fillTexturedRect('stone', obs.x, obs.y, obs.w, 10, '#475569');
                this.fillTexturedRect('stone', obs.x, obs.y + obs.h - 10, obs.w, 10, '#475569');
                this.fillTexturedRect('stone', obs.x, obs.y, 10, obs.h, '#475569');
                this.fillTexturedRect('stone', obs.x + obs.w - 10, obs.y, 10, obs.h, '#475569');
            } else if (obs.type === 'water') {
                // Lago
                this.ctx.fillStyle = '#0284c7';
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 20);
                } else {
                    this.ctx.rect(obs.x, obs.y, obs.w, obs.h);
                }
                this.ctx.fill();
            } else if (obs.type === 'fence') {
                // Cercado de madeira
                this.ctx.fillStyle = '#b45309';
                this.ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            } else if (obs.type === 'pillar') {
                // Colunas antigas
                this.fillTexturedRect('stone', obs.x, obs.y, obs.w, obs.h, '#94a3b8');
                this.ctx.strokeStyle = '#475569';
                this.ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            } else if (obs.type === 'crystal') {
                // Cristais da caverna
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.w / 2, obs.y);
                this.ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                this.ctx.lineTo(obs.x, obs.y + obs.h);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }

    renderDecorations(area) {
        const ctx = this.ctx;
        for (const bush of area.bushes || []) {
            const sprite = this.bushSprites[bush.variant];
            if (!sprite || !sprite.complete || !sprite.naturalWidth) continue;

            const width = bush.size || 42;
            const height = width * sprite.naturalHeight / sprite.naturalWidth;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, bush.x - width / 2, bush.y - height / 2, width, height);
            ctx.restore();
        }
    }

    renderChests(area) {
        for (const chest of area.chests) {
            const isOpened = this.world.openedChests.has(chest.id) || chest.opened;

            const sprite = this.chestSprite;
            if (sprite.complete && sprite.naturalWidth) {
                const width = 44;
                const height = width * sprite.naturalHeight / sprite.naturalWidth;
                this.ctx.save();
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.globalAlpha = isOpened ? 0.6 : 1;
                this.ctx.drawImage(sprite, chest.x + 15 - width / 2, chest.y + 11 - height / 2, width, height);
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = isOpened ? '#78716c' : '#d97706';
                this.ctx.fillRect(chest.x, chest.y, 30, 22);
            }

            if (!isOpened) {
                // Brilho pulsante
                this.ctx.strokeStyle = '#fef08a';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(chest.x + 15 - 24, chest.y + 11 - 21, 48, 42);
            }
        }
    }

    renderNPCs(area) {
        for (const npc of area.npcs) {
            if (npc.sprite && this.npcSprites[npc.sprite]) {
                continue;
            }

            // Sombra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.beginPath();
            this.ctx.ellipse(npc.x, npc.y + 12, 12, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Corpo
            this.ctx.fillStyle = npc.color;
            this.ctx.beginPath();
            this.ctx.arc(npc.x, npc.y, 13, 0, Math.PI * 2);
            this.ctx.fill();

            // Cabeça / Rosto
            this.ctx.fillStyle = '#fed7aa';
            this.ctx.beginPath();
            this.ctx.arc(npc.x, npc.y - 5, 8, 0, Math.PI * 2);
            this.ctx.fill();

        }
    }

    renderEnemies(area) {
        for (const enemy of area.enemies) {
            if (this.world.defeatedEnemies.has(enemy.id)) continue;

            // Sombra
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(enemy.x, enemy.y + 12, 14, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Sprites personalizados são desenhados na camada nítida após a cena.
            if (!enemy.sprite) {
                this.ctx.font = enemy.isBoss ? '32px monospace' : '24px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(enemy.icon, enemy.x, enemy.y);
            }

            // Barra de HP visível no mapa
            const barW = enemy.isBoss ? 44 : 32;
            const barH = 5;
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(enemy.x - barW / 2, enemy.y - 22, barW, barH);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillRect(enemy.x - barW / 2, enemy.y - 22, (enemy.hp / enemy.maxHp) * barW, barH);

        }
    }

    drawEnemySprite(ctx, enemy, x, y, maxSize, horizontalScale = 1, faceLeft = null) {
        if (!enemy.sprite) return false;
        const image = this.enemySprites[enemy.sprite];
        if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) return false;

        const scale = maxSize / Math.max(image.naturalWidth, image.naturalHeight);
        const width = image.naturalWidth * scale * horizontalScale;
        const height = image.naturalHeight * scale;
        const flip = faceLeft === true
            ? !enemy.spriteFacesLeft
            : faceLeft === false
                ? enemy.spriteFacesLeft
                : enemy.spriteFacesLeft ? enemy.vx >= 0 : enemy.vx < 0;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, y);
        if (flip) ctx.scale(-1, 1);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
    }

    renderPlayer() {
        const p = this.player;
        const bob = p.isMoving ? Math.sin(p.animFrame * Math.PI) * 2 : 0;

        // Sombra suave sob o herói
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y + 14, 14, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

    }

    renderInteractPrompt() {
        const p = this.player;
        const target = this.interactTarget;
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        const label = target.type === 'chest'
            ? (isTouch ? 'TOQUE: ABRIR BAÚ' : '[E] ABRIR BAÚ')
            : target.type === 'blacksmith'
                ? (isTouch ? 'TOQUE: MELHORAR CARTAS' : '[E] MELHORAR CARTAS')
                : `${isTouch ? 'TOQUE: FALAR COM ' : '[E] FALAR COM '}${target.target.name.toLocaleUpperCase('pt-BR')}`;
        const playerHeight = p.classId === 'mage' ? 72 : 52;
        this.drawOutlinedName(this.displayCtx, label, p.x, p.y - 6 - playerHeight / 2 - 30, '#fff1a8');
    }

    // Loop do Motor de Jogo
    start() {
        const loop = (currentTime) => {
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

// Inicialização Global
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
    window.gameInstance = game;
});
