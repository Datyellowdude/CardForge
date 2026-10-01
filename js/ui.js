// Safe canvas roundRect helper to avoid exceptions across browsers
function drawSafeRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
    }
}

class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.cacheElements();
        this.battleScenePixelCanvas = document.createElement('canvas');
        this.battleScenePixelCanvas.width = Math.ceil(this.elements.battleSceneCanvas.width * 0.5);
        this.battleScenePixelCanvas.height = Math.ceil(this.elements.battleSceneCanvas.height * 0.5);
        this.battleSceneCtx = this.battleScenePixelCanvas.getContext('2d');
        this.battleSceneCtx.setTransform(
            this.battleScenePixelCanvas.width / this.elements.battleSceneCanvas.width, 0,
            0, this.battleScenePixelCanvas.height / this.elements.battleSceneCanvas.height, 0, 0
        );
        this.battleSceneCtx.imageSmoothingEnabled = false;
        this.battleSceneDisplayCtx = this.elements.battleSceneCanvas.getContext('2d');

        this.battleTime = 0;
        this.knightActionAnim = 0;
        this.knightHurtAnim = 0;
        this.knightActionType = 'slash';
        this.enemyActionAnim = 0;
        this.enemyHurtAnim = 0;
        this.activeVfx = [];
        this.floatingTexts = [];
        this.combatTutorialActive = false;
        this.combatTutorialStep = 0;

        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            hud: document.getElementById('hud'),
            gameContainer: document.getElementById('gameContainer'),
            playerHpBar: document.getElementById('hudHpFill'),
            playerHpText: document.getElementById('hudHpText'),
            playerHudHealth: document.getElementById('hudHpFill').closest('.hud-stat'),
            playerLevelText: document.getElementById('hudLevelText'),
            playerGoldText: document.getElementById('hudGoldText'),
            currentAreaText: document.getElementById('hudAreaText'),
            btnCodex: document.getElementById('btnOpenCodex'),
            btnDeck: document.getElementById('btnOpenDeck'),
            btnSave: document.getElementById('btnSaveGame'),
            btnSfx: document.getElementById('btnToggleSfx'),
            btnMusic: document.getElementById('btnToggleMusic'),
            
            // Modal Baralho
            deckModal: document.getElementById('deckModal'),
            deckList: document.getElementById('deckGrid'),
            deckCountText: document.getElementById('deckCountText'),
            deckCloseBtn: document.getElementById('deckCloseBtn'),
            deckFilterBtns: document.querySelectorAll('.deck-filter-btn'),
            defaultSeqSlots: document.getElementById('defaultSeqSlots'),

            // Livro de cartas e inimigos
            codexModal: document.getElementById('codexModal'),
            codexCloseBtn: document.getElementById('codexCloseBtn'),
            codexCardsTab: document.getElementById('codexCardsTab'),
            codexEnemiesTab: document.getElementById('codexEnemiesTab'),
            codexContent: document.getElementById('codexContent'),
            codexCount: document.getElementById('codexCount'),

            // Modal Ferreiro
            blacksmithModal: document.getElementById('blacksmithModal'),
            blacksmithList: document.getElementById('blacksmithGrid'),
            blacksmithCloseBtn: document.getElementById('blacksmithCloseBtn'),

            // Modal Loja
            shopModal: document.getElementById('shopModal'),
            shopItemsList: document.getElementById('shopGrid'),
            shopCloseBtn: document.getElementById('shopCloseBtn'),

            // Modal Diálogo / Eventos
            dialogModal: document.getElementById('dialogModal'),
            dialogSpeaker: document.getElementById('dialogSpeaker'),
            dialogText: document.getElementById('dialogContent'),
            dialogActionBtn: document.getElementById('dialogActionBtn'),
            dialogCloseBtn: document.getElementById('dialogCloseBtn'),

            // Palco de Batalha Pokémon & Status
            combatScreen: document.getElementById('combatScreen'),
            battleSceneCanvas: document.getElementById('battleSceneCanvas'),
            enemyBattlePlate: document.getElementById('enemyBattlePlate'),
            enemyBattleName: document.getElementById('enemyBattleName'),
            enemyBattleLevel: document.getElementById('enemyBattleLevel'),
            enemyBattleHpFill: document.getElementById('enemyBattleHpFill'),
            enemyBattleHpText: document.getElementById('enemyBattleHpText'),
            enemyBattleIntent: document.getElementById('enemyBattleIntent'),
            enemyBattleStatuses: document.getElementById('enemyBattleStatuses'),
            combatEnemySelector: document.getElementById('combatEnemySelector'),
            playerBattlePlate: document.getElementById('playerBattlePlate'),
            combatPlayerClassName: document.getElementById('combatPlayerClassName'),
            combatPlayerHpFill: document.getElementById('combatPlayerHpFill'),
            combatPlayerHpText: document.getElementById('combatPlayerHpText'),
            combatPlayerShieldText: document.getElementById('combatPlayerShieldText'),
            combatPlayerBuffs: document.getElementById('combatPlayerBuffs'),
            combatSequenceRow: document.getElementById('combatSequenceRow'),
            combatHandRow: document.getElementById('combatHandRow'),
            btnExecuteTurn: document.getElementById('btnExecuteTurn'),
            btnExecuteTurnAlt: document.getElementById('btnExecuteTurnAlt'),
            combatTutorial: document.getElementById('combatTutorial'),
            combatTutorialText: document.getElementById('combatTutorialText'),
            combatTutorialSpotlight: document.getElementById('combatTutorialSpotlight'),
            combatTutorialSpotlightSecondary: document.getElementById('combatTutorialSpotlightSecondary'),
            combatTutorialDimmer: document.getElementById('combatTutorialDimmer'),
            combatTutorialSkip: document.getElementById('combatTutorialSkip'),
            cardHoverTooltip: document.getElementById('cardHoverTooltip'),
            btnClearSequence: document.getElementById('btnClearSequence'),
            combatLogBox: document.getElementById('combatLogBox'),

            // Modal Recompensa (Draft de 3 Cartas)
            rewardModal: document.getElementById('rewardModal'),
            rewardGoldText: document.getElementById('rewardGoldText'),
            rewardCardsRow: document.getElementById('rewardCardsRow'),
            btnClaimReward: document.getElementById('btnClaimReward'),
            btnSkipReward: document.getElementById('btnSkipReward'),

            // Modal Derrota
            defeatModal: document.getElementById('defeatModal'),
            btnRespawn: document.getElementById('btnRespawn'),

            // Notificações Toast
            toastContainer: document.getElementById('toastContainer'),
            footerControls: document.getElementById('footerControls')
        };
    }

    bindEvents() {
        // Atalhos de HUD
        if (this.elements.btnCodex) {
            this.elements.btnCodex.addEventListener('click', () => this.openCodexModal());
        }
        if (this.elements.btnDeck) {
            this.elements.btnDeck.addEventListener('click', () => this.openDeckModal());
        }
        if (this.elements.btnSave) {
            this.elements.btnSave.addEventListener('click', () => {
                this.game.saveGame();
                this.showToast('💾 Progresso salvo com sucesso!');
            });
        }
        if (this.elements.btnSfx) {
            this.elements.btnSfx.addEventListener('click', () => {
                const state = audio.toggleSfx();
                this.elements.btnSfx.textContent = state ? '🔊 Som: ON' : '🔇 Som: OFF';
            });
        }
        if (this.elements.btnMusic) {
            this.elements.btnMusic.addEventListener('click', () => {
                const state = audio.toggleMusic();
                this.elements.btnMusic.textContent = state ? '🎵 Música: ON' : '🔇 Música: OFF';
            });
        }

        // Fechar modais
        if (this.elements.deckCloseBtn) {
            this.elements.deckCloseBtn.addEventListener('click', () => this.closeModals());
        }
        if (this.elements.codexCloseBtn) {
            this.elements.codexCloseBtn.addEventListener('click', () => this.closeModals());
        }
        this.elements.codexCardsTab.addEventListener('click', () => this.renderCodex('cards'));
        this.elements.codexEnemiesTab.addEventListener('click', () => this.renderCodex('enemies'));
        if (this.elements.blacksmithCloseBtn) {
            this.elements.blacksmithCloseBtn.addEventListener('click', () => this.closeModals());
        }
        if (this.elements.shopCloseBtn) {
            this.elements.shopCloseBtn.addEventListener('click', () => this.closeModals());
        }
        if (this.elements.dialogCloseBtn) {
            this.elements.dialogCloseBtn.addEventListener('click', () => this.closeModals());
        }

        // Filtro de cartas no baralho
        this.elements.deckFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.deckFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderDeckList(btn.dataset.type);
            });
        });

        // Controles de combate
        const executeAction = () => {
            if (this.game.combatEngine && !this.game.combatEngine.isExecuting) {
                const hasCards = this.game.combatEngine.sequence.some(c => c !== null);
                if (hasCards) {
                    this.game.combatEngine.executeTurn(
                        (step) => this.handleCombatStepUpdate(step),
                        (result) => this.handleCombatFinished(result)
                    );
                } else {
                    this.showToast('⚠️ Posicione ao menos 1 carta antes de iniciar!');
                }
            }
        };

        if (this.elements.btnExecuteTurn) {
            this.elements.btnExecuteTurn.addEventListener('click', executeAction);
        }
        if (this.elements.btnExecuteTurnAlt) {
            this.elements.btnExecuteTurnAlt.addEventListener('click', executeAction);
        }

        this.elements.combatTutorial.addEventListener('click', (event) => {
            if (event.target.closest('#combatTutorialSkip')) return;
            this.advanceCombatTutorial();
        });
        this.elements.combatTutorialSkip.addEventListener('click', (event) => {
            event.stopPropagation();
            this.finishCombatTutorial();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.game.state === 'COMBAT' && !this.combatTutorialActive) {
                executeAction();
            }
        });

        if (this.elements.btnClearSequence) {
            this.elements.btnClearSequence.addEventListener('click', () => {
                if (this.game.combatEngine && !this.game.combatEngine.isExecuting) {
                    this.game.combatEngine.clearSequence();
                    this.renderCombatSequence();
                    this.renderCombatHand();
                }
            });
        }

        if (this.elements.btnSkipReward) {
            this.elements.btnSkipReward.addEventListener('click', () => {
                this.closeModals();
                this.game.returnToWorldAfterCombat();
            });
        }

        if (this.elements.btnClaimReward) {
            this.elements.btnClaimReward.addEventListener('click', () => {
                if (this.pendingRewardClaim) this.pendingRewardClaim();
            });
        }

        if (this.elements.btnRespawn) {
            this.elements.btnRespawn.addEventListener('click', () => {
                this.closeModals();
                this.game.respawnPlayer();
            });
        }
    }

    updateHUD() {
        const player = this.game.player;
        const currentArea = this.game.world.getCurrentArea();

        const pct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        this.elements.playerHpBar.style.width = pct + '%';
        this.elements.playerHpText.textContent = `${player.hp} / ${player.maxHp}`;
        if (this.elements.playerLevelText) this.elements.playerLevelText.textContent = `Nv. ${player.level}`;
        this.elements.playerGoldText.textContent = player.gold;
        this.elements.currentAreaText.textContent = currentArea ? currentArea.name : 'Vila';
    }

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        this.pendingRewardClaim = null;
        if (this.game.state !== 'COMBAT') {
            this.game.state = 'EXPLORING';
        }
    }

    // 1. MODAL BARALHO & CONFIGURAÇÃO DA SEQUÊNCIA PADRÃO
    openDeckModal() {
        this.game.state = 'PAUSED';
        audio.cardSelect();
        this.elements.deckModal.classList.remove('hidden');
        this.renderDefaultSequenceConfig();
        this.renderDeckList('all');
    }

    openCodexModal(section = 'cards') {
        this.game.state = 'PAUSED';
        audio.cardSelect();
        this.elements.codexModal.classList.remove('hidden');
        this.renderCodex(section);
    }

    renderCodex(section = 'cards') {
        const showingCards = section === 'cards';
        this.elements.codexCardsTab.classList.toggle('active', showingCards);
        this.elements.codexEnemiesTab.classList.toggle('active', !showingCards);
        this.elements.codexContent.replaceChildren();

        if (showingCards) {
            const cards = Object.values(CARD_TEMPLATES);
            const weapons = cards.filter(card => (card.tags || []).includes('arma'));
            const otherCards = cards.filter(card => !(card.tags || []).includes('arma'));
            this.elements.codexCount.textContent = `${cards.length} cartas · armas por raridade`;
            const renderCardEntry = (card) => {
                const entry = document.createElement('article');
                entry.className = 'codex-entry';
                const icon = document.createElement('div');
                icon.className = 'codex-entry-icon';
                icon.textContent = card.icon;
                const copy = document.createElement('div');
                copy.className = 'codex-entry-copy';
                const title = document.createElement('h3');
                title.className = 'codex-entry-title';
                title.textContent = card.name;
                const meta = document.createElement('div');
                meta.className = 'codex-entry-meta';
                meta.textContent = `${card.type.name} · ${card.rarity.name}`;
                const effect = document.createElement('p');
                effect.className = 'codex-entry-description';
                const cardInstance = new Card(card.id, 1);
                effect.textContent = cardInstance.description.replace(/<[^>]*>/g, '');
                copy.append(title, meta, effect);
                if (card.comboText) {
                    const combo = document.createElement('p');
                    combo.className = 'codex-entry-combo';
                    combo.textContent = card.comboText;
                    copy.appendChild(combo);
                }
                entry.append(icon, copy);
                this.elements.codexContent.appendChild(entry);
            };
            const rarities = [...new Set(weapons.map(card => card.rarity))].sort((a, b) => {
                const order = { comum: 0, incomum: 1, rara: 2, epica: 3, lendaria: 4 };
                return order[a.id] - order[b.id];
            });
            for (const rarity of rarities) {
                const heading = document.createElement('h3');
                heading.className = 'codex-entry-title codex-rarity-heading';
                heading.textContent = `Armas · ${rarity.name}`;
                this.elements.codexContent.appendChild(heading);
                weapons.filter(card => card.rarity.id === rarity.id).forEach(renderCardEntry);
            }
            const otherHeading = document.createElement('h3');
            otherHeading.className = 'codex-entry-title codex-rarity-heading';
            otherHeading.textContent = 'Outras cartas';
            this.elements.codexContent.appendChild(otherHeading);
            for (const card of otherCards) {
                renderCardEntry(card);
            }
            return;
        }

        const descriptions = {
            slime: 'Uma criatura gelatinosa que ronda a planície e ataca com golpes simples.',
            goblin: 'Saqueador astuto que embosca viajantes e luta com armas improvisadas.',
            lobo: 'Predador veloz que usa mordidas e uivos para pressionar suas presas.',
            aranha: 'Aranha venenosa que prende e enfraquece seus alvos antes de atacar.',
            goblin_guerreiro: 'Goblin de armadura pesada que reduz passivamente em 50% o dano recebido.',
            esqueleto: 'Guardião de ossos das cavernas que golpeia e se protege com o escudo.',
            mago: 'Necromante que ataca com magia sombria e tem 33% de chance de invocar um esqueleto após atacar.',
            rei_goblin: 'Malakor, o chefe das ruínas. Usa golpes reais, fúria e ataques amplos.',
            guarda_real: 'Protetor do Rei Goblin, treinado para atacar com força e defender o trono.'
        };
        const enemiesByType = new Map();
        for (const area of Object.values(this.game.world.areas)) {
            for (const enemy of area.enemies || []) {
                if (!enemiesByType.has(enemy.typeId)) enemiesByType.set(enemy.typeId, { enemy, area: area.name });
            }
        }
        if (!enemiesByType.has('guarda_real')) {
            enemiesByType.set('guarda_real', {
                enemy: { typeId: 'guarda_real', name: 'Guarda Real Goblin', icon: '👹', sprite: 'armored_goblin.png' },
                area: 'Ruínas Esquecidas'
            });
        }
        const enemies = Array.from(enemiesByType.values());
        this.elements.codexCount.textContent = `${enemies.length} inimigos`;
        for (const { enemy, area } of enemies) {
            const entry = document.createElement('article');
            entry.className = 'codex-entry';
            const icon = document.createElement('div');
            icon.className = 'codex-entry-icon';
            if (enemy.sprite) {
                const sprite = document.createElement('img');
                sprite.className = 'codex-enemy-sprite';
                sprite.src = `assets/enemies/${enemy.sprite}`;
                sprite.alt = enemy.name;
                icon.appendChild(sprite);
            } else {
                icon.textContent = enemy.icon || '👾';
            }
            const copy = document.createElement('div');
            copy.className = 'codex-entry-copy';
            const title = document.createElement('h3');
            title.className = 'codex-entry-title';
            title.textContent = enemy.name;
            const meta = document.createElement('div');
            meta.className = 'codex-entry-meta';
            meta.textContent = area;
            const description = document.createElement('p');
            description.className = 'codex-entry-description';
            description.textContent = descriptions[enemy.typeId] || 'Uma criatura perigosa que habita este mundo.';
            copy.append(title, meta, description);
            entry.append(icon, copy);
            this.elements.codexContent.appendChild(entry);
        }
    }

    renderDefaultSequenceConfig() {
        if (!this.elements.defaultSeqSlots) return;
        const player = this.game.player;
        if (!player.defaultSequence) player.defaultSequence = ['afia', 'espada', 'fogo', 'escudo'];
        player.defaultSequence = player.defaultSequence.filter(Boolean);
        this.elements.defaultSeqSlots.innerHTML = '';
        const capacity = player.level >= 5 ? 5 : 4;
        this.elements.defaultSeqSlots.style.gridTemplateColumns = `repeat(${capacity}, minmax(72px, 100px))`;

        let usedSlots = 0;
        for (let i = 0; i < player.defaultSequence.length && usedSlots < capacity; i++) {
            const templateId = player.defaultSequence[i];
            const matchingCard = player.deck.find(c => c.templateId === templateId) || new Card(templateId, 1);
            const slotCost = matchingCard.sequenceSlots || 1;
            if (usedSlots + slotCost > capacity) continue;
            const slot = document.createElement('div');
            slot.className = 'default-slot filled';
            if (slotCost > 1) slot.classList.add('span-two');
            const cardEl = this.createCardElement(matchingCard, { inSequence: true, showLevel: true });
            const btnRemove = document.createElement('button');
            btnRemove.className = 'default-slot-btn-remove';
            btnRemove.innerHTML = '✕';
            btnRemove.title = 'Remover da sequência padrão';
            btnRemove.onclick = (e) => {
                e.stopPropagation();
                player.defaultSequence.splice(i, 1);
                SaveManager.saveGame(this.game);
                audio.cardSelect();
                this.renderDefaultSequenceConfig();
            };
            cardEl.appendChild(btnRemove);
            slot.appendChild(cardEl);
            this.elements.defaultSeqSlots.appendChild(slot);
            usedSlots += slotCost;
        }

        for (let i = usedSlots; i < capacity; i++) {
            const slot = document.createElement('div');
            slot.className = 'default-slot empty';
            slot.innerHTML = `<div class="slot-placeholder"><span class="slot-number">${i + 1}</span><span class="slot-hint">Espaço livre</span></div>`;
            this.elements.defaultSeqSlots.appendChild(slot);
        }
    }

    renderDeckList(filterType = 'all') {
        const player = this.game.player;
        this.elements.deckList.innerHTML = '';
        this.elements.deckCountText.textContent = `Todas as Cartas no Baralho: ${player.deck.length}`;

        const filtered = player.deck.filter(card => {
            if (filterType === 'all') return true;
            return card.type.id === filterType;
        });

        filtered.forEach(card => {
            const cardEl = this.createCardElement(card, { showLevel: true });
            
            // Ao clicar numa carta da coleção no modal do baralho, adiciona à sequência padrão!
            cardEl.onclick = () => {
                if (!player.defaultSequence) player.defaultSequence = [];
                const usedSlots = player.defaultSequence.reduce((total, id) => total + (CARD_TEMPLATES[id]?.sequenceSlots || 1), 0);
                const cardSlots = card.sequenceSlots || 1;
                const capacity = player.level >= 5 ? 5 : 4;
                if (usedSlots + cardSlots > capacity) {
                    this.showToast('A sequência padrão está cheia. Remova uma carta para abrir espaço.');
                    return;
                }
                const targetSlot = usedSlots;
                player.defaultSequence.push(card.templateId);
                SaveManager.saveGame(this.game);
                audio.cardPlace();
                this.showToast(`✨ [${card.name}] definida no Slot ${targetSlot + 1} da Sequência Padrão!`);
                this.renderDefaultSequenceConfig();
            };

            this.elements.deckList.appendChild(cardEl);
        });
    }

    // 2. MODAL FERREIRO
    openBlacksmithModal() {
        this.game.state = 'BLACKSMITH';
        audio.anvil();
        this.elements.blacksmithModal.classList.remove('hidden');
        this.renderBlacksmithList();
    }

    renderBlacksmithList() {
        const player = this.game.player;
        this.elements.blacksmithList.innerHTML = '';

        player.deck.forEach(card => {
            const row = document.createElement('div');
            row.className = 'blacksmith-card-row';

            const cardEl = this.createCardElement(card, { showLevel: true });
            
            const cost = player.getBlacksmithDiscount(card.getUpgradeCost());
            const nextLvl = card.level + 1;
            const nextVal = Math.round(card.baseValue * Math.pow(card.upgradeMultiplier, nextLvl - 1));

            const info = document.createElement('div');
            info.className = 'blacksmith-info';
            info.innerHTML = `
                <div class="blacksmith-title"><b>${card.name}</b> (Nível ${card.level} ➔ ${nextLvl})</div>
                <div class="blacksmith-stat">Poder: ${card.value} ➔ <b style="color: #4ade80;">${nextVal}</b></div>
                <div class="blacksmith-cost">Custo: 🪙 <b>${cost}</b> moedas</div>
            `;

            const btnUpgrade = document.createElement('button');
            btnUpgrade.className = 'btn-game btn-upgrade';
            btnUpgrade.innerHTML = '🔨 Forjar (+Nível)';
            btnUpgrade.disabled = player.gold < cost;
            btnUpgrade.onclick = () => {
                const res = player.upgradeCard(card.uid);
                if (res.success) {
                    audio.anvil();
                    this.showToast(`✨ ${card.name} foi aprimorada para o Nível ${res.card.level}!`);
                    this.updateHUD();
                    this.renderBlacksmithList();
                } else {
                    this.showToast('🪙 Moedas insuficientes!');
                }
            };

            row.appendChild(cardEl);
            row.appendChild(info);
            row.appendChild(btnUpgrade);
            this.elements.blacksmithList.appendChild(row);
        });
    }

    // 3. MODAL LOJA
    openShopModal() {
        this.game.state = 'SHOP';
        audio.coin();
        this.shopCardStock = this.rollShopCards();
        this.elements.shopModal.classList.remove('hidden');
        this.renderShopItems();
    }

    rollShopCards() {
        const stock = [];
        const templates = Object.keys(CARD_TEMPLATES);
        while (stock.length < 4) {
            const card = getRandomCard(templates);
            if (!stock.some(item => item.cardTemplate === card.templateId)) {
                const cost = card.rarity.id === 'lendaria' ? 240 : card.rarity.id === 'rara' ? 110 : 50;
                stock.push({ type: 'card', cardTemplate: card.templateId, cost });
            }
        }
        return stock;
    }

    rerollShop() {
        const player = this.game.player;
        if (!player.spendGold(30)) {
            this.showToast('Você precisa de 30 moedas para renovar as cartas.');
            return;
        }
        this.shopCardStock = this.rollShopCards();
        audio.coin();
        this.updateHUD();
        this.showToast('🪙 Mariah renovou o estoque de cartas por 30 moedas.');
        this.renderShopItems();
    }

    renderShopItems() {
        const player = this.game.player;
        this.elements.shopItemsList.innerHTML = '';

        // Catálogo de itens da loja
        const shopInventory = [
            { type: 'potion', id: 'pocao_vida', name: 'Poção de Vida', icon: '🧪', cost: 25, desc: 'Recupera +40 HP imediatamente.', buy: () => {
                player.heal(40);
                this.showToast('💖 Você bebeu a poção e recuperou +40 de Vida!');
            }},
            { type: 'relic', id: 'elixir_mente', name: 'Elixir de Vitalidade', icon: '🏺', cost: 70, desc: 'Aumenta permanentemente seu HP máximo em +15.', buy: () => {
                player.maxHp += 15;
                player.heal(15);
                this.showToast('✨ Seu HP Máximo aumentou em +15!');
            }},
            ...(this.shopCardStock || this.rollShopCards())
        ];

        shopInventory.forEach(item => {
            const itemBox = document.createElement('div');
            itemBox.className = 'shop-item-box';

            if (item.type === 'card') {
                const card = new Card(item.cardTemplate, 1);
                const cardEl = this.createCardElement(card);
                const action = document.createElement('div');
                action.className = 'shop-action';
                action.innerHTML = `<span class="shop-price">🪙 ${item.cost}</span>`;

                const btnBuy = document.createElement('button');
                btnBuy.className = 'btn-game btn-buy';
                btnBuy.textContent = 'Comprar Carta';
                btnBuy.disabled = player.gold < item.cost;
                btnBuy.onclick = () => {
                    if (player.spendGold(item.cost)) {
                        player.addCard(card);
                        this.shopCardStock = (this.shopCardStock || []).filter(stock => stock.cardTemplate !== item.cardTemplate);
                        audio.coin();
                        this.showToast(`✨ Adicionou "${card.name}" ao seu baralho!`);
                        this.updateHUD();
                        this.renderShopItems();
                    }
                };
                action.appendChild(btnBuy);
                itemBox.appendChild(cardEl);
                itemBox.appendChild(action);
            } else {
                itemBox.innerHTML = `
                    <div class="shop-consumable">
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-desc">${item.desc}</div>
                        </div>
                    </div>
                `;
                const action = document.createElement('div');
                action.className = 'shop-action';
                action.innerHTML = `<span class="shop-price">🪙 ${item.cost}</span>`;
                
                const btnBuy = document.createElement('button');
                btnBuy.className = 'btn-game btn-buy';
                btnBuy.textContent = 'Comprar Item';
                btnBuy.disabled = player.gold < item.cost;
                btnBuy.onclick = () => {
                    if (player.spendGold(item.cost)) {
                        item.buy();
                        audio.coin();
                        this.updateHUD();
                        this.renderShopItems();
                    }
                };
                action.appendChild(btnBuy);
                itemBox.appendChild(action);
            }

            this.elements.shopItemsList.appendChild(itemBox);
        });

        const rerollBox = document.createElement('div');
        rerollBox.className = 'shop-reroll-box';
        rerollBox.innerHTML = '<span>Não encontrou o que procura?</span>';
        const rerollButton = document.createElement('button');
        rerollButton.className = 'btn-game';
        rerollButton.textContent = 'Renovar cartas · 30 🪙';
        rerollButton.disabled = player.gold < 30;
        rerollButton.onclick = () => this.rerollShop();
        rerollBox.appendChild(rerollButton);
        this.elements.shopItemsList.appendChild(rerollBox);
    }

    // 4. MODAL DIÁLOGOS
    openDialog(title, text, actionText = null, onAction = null) {
        this.game.state = 'DIALOG';
        this.elements.dialogSpeaker.textContent = title;
        this.elements.dialogText.textContent = text;
        
        if (actionText && onAction) {
            this.elements.dialogActionBtn.style.display = 'inline-block';
            this.elements.dialogActionBtn.textContent = actionText;
            this.elements.dialogActionBtn.onclick = () => {
                this.closeModals();
                onAction();
            };
        } else {
            this.elements.dialogActionBtn.style.display = 'none';
        }

        this.elements.dialogModal.classList.remove('hidden');
    }

    // 5. RENDERIZAÇÃO DE COMBATE
    setupCombatView() {
        if (this.elements.footerControls) this.elements.footerControls.style.display = 'none';
        if (this.elements.playerHudHealth) this.elements.playerHudHealth.style.display = 'none';
        this.elements.combatScreen.classList.remove('hidden');
        this.updateCombatView();
    }

    hideCombatView() {
        if (this.elements.footerControls) this.elements.footerControls.style.display = 'flex';
        if (this.elements.playerHudHealth) this.elements.playerHudHealth.style.display = '';
        this.elements.combatScreen.classList.add('hidden');
    }

    startCombatTutorial() {
        this.combatTutorialActive = true;
        this.combatTutorialStep = 0;
        this.elements.cardHoverTooltip.classList.add('hidden');
        this.game.state = 'COMBAT';
        this.elements.combatTutorial.classList.remove('hidden');
        this.renderCombatTutorialStep();
    }

    renderCombatTutorialStep() {
        const steps = [
            { text: 'Bem-vindo ao tutorial de combate!' },
            { text: 'Estas são suas cartas. Elas serão ativadas da esquerda para a direita.', selectors: ['#combatHandRow', '#combatSequenceRow'] },
            { text: 'Se você tiver uma carta de aprimoramento, coloque-a antes da carta de ataque para ativar o efeito.', selectors: ['#combatSequenceRow'] },
            { text: 'Quando sua sequência estiver pronta, aperte em “Iniciar sequência”!', selectors: ['#btnExecuteTurn'] }
        ];
        const step = steps[this.combatTutorialStep];
        if (!step) {
            this.finishCombatTutorial();
            return;
        }

        this.elements.combatTutorialText.textContent = step.text;
        const targets = (step.selectors || []).map(selector => document.querySelector(selector)).filter(Boolean);
        const overlayRect = this.elements.combatTutorial.getBoundingClientRect();
        if (!targets.length || !overlayRect.width) {
            this.elements.combatTutorialSpotlight.classList.add('hidden');
            this.elements.combatTutorialSpotlightSecondary.classList.add('hidden');
            this.elements.combatTutorialDimmer.style.maskImage = '';
            this.elements.combatTutorialDimmer.style.webkitMaskImage = '';
            return;
        }

        const spotlights = [
            this.elements.combatTutorialSpotlight,
            this.elements.combatTutorialSpotlightSecondary
        ];
        const holes = targets.slice(0, spotlights.length).map((target, index) => {
            const rect = target.getBoundingClientRect();
            const x = rect.left - overlayRect.left - 10;
            const y = rect.top - overlayRect.top - 10;
            const width = rect.width + 20;
            const height = rect.height + 20;
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const spotlight = spotlights[index];
            spotlight.classList.remove('hidden');
            Object.assign(spotlight.style, {
                left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`
            });
            return `radial-gradient(ellipse ${width / 2}px ${height / 2}px at ${centerX}px ${centerY}px, transparent 97%, #000 100%)`;
        });
        spotlights.slice(targets.length).forEach(spotlight => spotlight.classList.add('hidden'));
        const holesMask = holes.join(', ');
        this.elements.combatTutorialDimmer.style.maskImage = holesMask;
        this.elements.combatTutorialDimmer.style.webkitMaskImage = holesMask;
    }

    advanceCombatTutorial() {
        if (!this.combatTutorialActive) return;
        this.combatTutorialStep++;
        this.renderCombatTutorialStep();
    }

    finishCombatTutorial() {
        if (!this.combatTutorialActive) return;
        this.combatTutorialActive = false;
        this.game.player.hasSeenCombatTutorial = true;
        this.elements.combatTutorial.classList.add('hidden');
        this.elements.combatTutorialSpotlight.classList.add('hidden');
        this.elements.combatTutorialSpotlightSecondary.classList.add('hidden');
        this.game.saveGame();
    }

    updateCombatView() {
        const combat = this.game.combatEngine;
        if (!combat) return;

        // Atualiza status do Jogador no combate
        const p = this.game.player;
        const pct = Math.max(0, (p.hp / p.maxHp) * 100);
        this.elements.combatPlayerHpFill.style.width = pct + '%';
        this.elements.combatPlayerHpText.textContent = `${p.hp} / ${p.maxHp}`;
        this.elements.combatPlayerClassName.textContent = p.classId === 'mage' ? '✨ Mago de Solária' : '🛡️ Cavaleiro de Solária';
        this.elements.combatPlayerShieldText.textContent = p.shield > 0 ? `🛡️ Escudo: ${p.shield}` : '';

        // Buffs do jogador
        let buffsHtml = '';
        if (p.combatBuffs.sharp > 0) buffsHtml += `<span class="buff-badge sharp">✨ Afiado x${p.combatBuffs.sharp} (+50% arma)</span>`;
        if (p.combatBuffs.enchanted) buffsHtml += `<span class="buff-badge enchanted">🔮 Encantado (Fogo)</span>`;
        if (p.combatBuffs.magicBoost > 1) buffsHtml += `<span class="buff-badge magic">🧘 Foco Arcano</span>`;
        if (p.statuses.bleed > 0) buffsHtml += `<span class="debuff-badge bleed">🩸 Sangrando</span>`;
        if (p.statuses.poison > 0) buffsHtml += `<span class="debuff-badge poison">🧪 Veneno</span>`;
        this.elements.combatPlayerBuffs.innerHTML = buffsHtml;

        // Inimigos
        this.renderCombatEnemies();

        // Linha da Sequência
        this.renderCombatSequence();

        // Mão de cartas
        this.renderCombatHand();

        // Logs
        this.renderCombatLogs();
    }

    renderCombatEnemies() {
        const combat = this.game.combatEngine;
        if (!combat) return;

        const target = combat.getTarget();
        if (target && this.elements.enemyBattlePlate) {
            this.elements.enemyBattleName.textContent = target.name;
            this.elements.enemyBattleLevel.textContent = target.isBoss ? '👑 CHEFE' : 'Lv. 1';

            const hpPct = Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100));
            this.elements.enemyBattleHpFill.style.width = hpPct + '%';
            this.elements.enemyBattleHpText.textContent = `${target.hp} / ${target.maxHp} HP`;

            // Cor dinâmica da barra de vida estilo Pokémon
            if (hpPct > 50) {
                this.elements.enemyBattleHpFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
            } else if (hpPct > 20) {
                this.elements.enemyBattleHpFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                this.elements.enemyBattleHpFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }

            // Intenção telegrafada
            if (target.intent) {
                this.elements.enemyBattleIntent.innerHTML = `${target.intent.icon} ${target.intent.label}`;
            } else {
                this.elements.enemyBattleIntent.textContent = 'Decidindo...';
            }

            // Badges de status do inimigo
            let statusBadges = '';
            if (target.statuses.burn > 0) statusBadges += `<span class="status-icon" title="Queimando">🔥</span>`;
            if (target.statuses.freeze > 0) statusBadges += `<span class="status-icon" title="Congelado">❄️</span>`;
            if (target.statuses.poison > 0) statusBadges += `<span class="status-icon" title="Envenenado">🧪</span>`;
            if (target.statuses.bleed > 0) statusBadges += `<span class="status-icon" title="Sangrando">🩸</span>`;
            if (target.statuses.stun > 0) statusBadges += `<span class="status-icon" title="Atordoado">💫</span>`;
            if (target.shield > 0) statusBadges += `<span class="status-icon" title="Escudo">🛡️ ${target.shield}</span>`;
            if (target.damageReduction > 0) statusBadges += `<span class="status-icon" title="Armadura passiva">🛡️ ${Math.round(target.damageReduction * 100)}%</span>`;
            this.elements.enemyBattleStatuses.innerHTML = statusBadges;
        }

        // Seletor de inimigo caso haja mais de 1
        if (this.elements.combatEnemySelector) {
            this.elements.combatEnemySelector.innerHTML = '';
            if (combat.enemies.length > 1) {
                combat.enemies.forEach((enemy, idx) => {
                    if (!enemy.isDead()) {
                        const btn = document.createElement('button');
                        btn.className = `target-tab-btn ${idx === combat.selectedTargetIndex ? 'active' : ''}`;
                        btn.innerHTML = `${enemy.icon} ${enemy.name}`;
                        btn.onclick = () => {
                            combat.setTargetIndex(idx);
                            audio.cardSelect();
                            this.renderCombatEnemies();
                        };
                        this.elements.combatEnemySelector.appendChild(btn);
                    }
                });
            }
        }
    }

    renderCombatSequence() {
        const combat = this.game.combatEngine;
        this.elements.combatSequenceRow.innerHTML = '';
        const previewData = combat.previewSequence();
        this.elements.combatSequenceRow.style.gridTemplateColumns = `repeat(${combat.sequence.length}, minmax(56px, 112px))`;

        for (let i = 0; i < combat.sequence.length; i++) {
            const card = combat.sequence[i];
            if (card && card[combat.sequenceMarkerKey]) continue;
            const slot = document.createElement('div');
            slot.className = `sequence-slot ${card ? 'filled' : 'empty'}`;
            slot.dataset.slotIndex = i;
            if (card && card.sequenceSlots > 1) slot.classList.add('span-two');

            if (card) {
                const preview = previewData[i];
                const cardEl = this.createCardElement(card, { inSequence: true });
                cardEl.draggable = true;
                cardEl.title = 'Arraste para mudar a posição na sequência';
                cardEl.ondragstart = (e) => {
                    if (e.target.closest('.sequence-controls')) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('application/x-combat-sequence-slot', String(i));
                    e.dataTransfer.setData('text/plain', `sequence:${i}`);
                };
                
                // Botões de swap e remoção
                const controls = document.createElement('div');
                controls.className = 'sequence-controls';
                
                if (i > 0) {
                    const btnLeft = document.createElement('button');
                    btnLeft.className = 'seq-btn';
                    btnLeft.innerHTML = '◀';
                    btnLeft.title = 'Mover para esquerda';
                    btnLeft.onclick = (e) => {
                        e.stopPropagation();
                        combat.moveSequenceCard(i, i - 1);
                        this.renderCombatSequence();
                        this.renderCombatHand();
                    };
                    controls.appendChild(btnLeft);
                }

                const btnRemove = document.createElement('button');
                btnRemove.className = 'seq-btn remove';
                btnRemove.innerHTML = '✕';
                btnRemove.title = 'Remover para a mão';
                btnRemove.onclick = (e) => {
                    e.stopPropagation();
                    combat.removeCardFromSequence(i);
                    this.renderCombatSequence();
                    this.renderCombatHand();
                };
                controls.appendChild(btnRemove);

                if (i + (card.sequenceSlots || 1) < combat.sequence.length) {
                    const btnRight = document.createElement('button');
                    btnRight.className = 'seq-btn';
                    btnRight.innerHTML = '▶';
                    btnRight.title = 'Mover para direita';
                    btnRight.onclick = (e) => {
                        e.stopPropagation();
                        combat.moveSequenceCard(i, i + (card.sequenceSlots || 1));
                        this.renderCombatSequence();
                        this.renderCombatHand();
                    };
                    controls.appendChild(btnRight);
                }

                cardEl.appendChild(controls);

                if (preview && preview.notes) {
                    const badge = document.createElement('div');
                    badge.className = 'sequence-combo-badge';
                    badge.textContent = preview.notes;
                    cardEl.appendChild(badge);
                }

                slot.appendChild(cardEl);
            } else {
                slot.innerHTML = `
                    <div class="slot-placeholder">
                        <span class="slot-number">${i + 1}</span>
                        <span class="slot-hint">Arraste ou clique numa carta</span>
                    </div>
                `;
            }

            // Drag over / drop
            slot.ondragover = (e) => e.preventDefault();
            slot.ondrop = (e) => {
                e.preventDefault();
                const plainData = e.dataTransfer.getData('text/plain');
                const sourceSlot = e.dataTransfer.getData('application/x-combat-sequence-slot') ||
                    (plainData.startsWith('sequence:') ? plainData.slice('sequence:'.length) : '');
                if (sourceSlot !== '') {
                    const from = Number(sourceSlot);
                    if (Number.isInteger(from) && from >= 0 && from < combat.sequence.length && from !== i) {
                        combat.moveSequenceCard(from, i);
                        this.renderCombatSequence();
                        this.renderCombatHand();
                    }
                    return;
                }

                const cardUid = plainData.startsWith('sequence:') ? '' : plainData;
                if (cardUid) {
                    combat.addCardToSequence(cardUid, i);
                    this.renderCombatSequence();
                    this.renderCombatHand();
                }
            };

            this.elements.combatSequenceRow.appendChild(slot);
        }

        // Atualiza banner de combo dinâmico
        // Prévia textual removida para liberar espaço no painel.

        // Atualiza estado do botão de executar (bem destacado)
        this.updateExecuteButtonsState();
    }

    updateExecuteButtonsState() {
        const combat = this.game.combatEngine;
        if (!combat) return;

        const hasCards = combat.sequence.some(c => c && !c[combat.sequenceMarkerKey]);
        const canExecute = hasCards && !combat.isExecuting;

        if (this.elements.btnExecuteTurn) {
            this.elements.btnExecuteTurn.disabled = !canExecute;
            if (canExecute) {
                this.elements.btnExecuteTurn.classList.add('ready-pulse');
            } else {
                this.elements.btnExecuteTurn.classList.remove('ready-pulse');
            }
        }

        if (this.elements.btnExecuteTurnAlt) {
            this.elements.btnExecuteTurnAlt.disabled = !canExecute;
        }
    }

    renderCombatHand() {
        const combat = this.game.combatEngine;
        this.elements.combatHandRow.innerHTML = '';

        combat.hand.forEach(card => {
            const cardEl = this.createCardElement(card, { isInteractive: true });
            
            cardEl.onclick = () => {
                if (!combat.isExecuting) {
                    combat.addCardToSequence(card.uid);
                    this.renderCombatSequence();
                    this.renderCombatHand();
                }
            };

            cardEl.draggable = true;
            cardEl.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', card.uid);
            };

            this.elements.combatHandRow.appendChild(cardEl);
        });

        this.updateExecuteButtonsState();
    }

    renderCombatLogs() {
        const combat = this.game.combatEngine;
        this.elements.combatLogBox.innerHTML = combat.combatLogs.map(l => `<div class="log-line">${l}</div>`).join('');
    }

    handleCombatStepUpdate(step) {
        if (step.type === 'card_start') {
            const slot = this.elements.combatSequenceRow.querySelector(`[data-slot-index="${step.slotIndex}"]`);
            if (slot) slot.classList.add('executing-pulse');
            this.triggerBattleKnightAction(step.card);
        } else if (step.type === 'card_end') {
            const slot = this.elements.combatSequenceRow.querySelector(`[data-slot-index="${step.slotIndex}"]`);
            if (slot) {
                slot.classList.remove('executing-pulse');
                slot.classList.add('executed');
            }
        } else if (step.type === 'enemy_hurt') {
            this.enemyHurtAnim = 1.0;
            this.addBattleFloatingText(580, 110, `-${step.dmg}`, '#ef4444');
            if (step.armorBlocked > 0) this.addBattleFloatingText(580, 145, `ARMADURA -${step.armorBlocked}`, '#cbd5e1');
        } else if (step.type === 'enemy_attack') {
            this.enemyActionAnim = 1.0;
            this.knightHurtAnim = 1.0;
            this.addBattleFloatingText(200, 200, `-${step.dmg}`, '#f87171');
        } else if (step.type === 'turn_ready') {
            this.updateCombatView();
        }
        this.renderCombatEnemies();
        this.renderCombatLogs();
    }

    // ANIMAÇÕES DO PALCO DE BATALHA POKÉMON
    triggerBattleKnightAction(card) {
        this.knightActionAnim = 1.0;
        this.knightActionType = card.tags.includes('arma') ? 'slash' :
                               (card.type.id === 'magia' ? (card.templateId === 'fogo' ? 'fire' : (card.templateId === 'raio' ? 'lightning' : 'ice')) :
                               (card.type.id === 'defesa' ? 'shield' : 'buff'));
        
        // Efeito de projétil voando do Cavaleiro ao Inimigo
        if (card.tags.includes('arma') || card.type.id === 'magia') {
            this.activeVfx.push({
                type: this.knightActionType,
                startX: 200,
                startY: 210,
                targetX: 580,
                targetY: 130,
                progress: 0,
                speed: 3.0
            });
        }
    }

    triggerBattleEnemyAction(enemy) {
        this.enemyActionAnim = 1.0;
        this.knightHurtAnim = 1.0;
    }

    addBattleFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x + (Math.random() * 24 - 12),
            y: y,
            text,
            color,
            alpha: 1,
            time: 0
        });
    }

    updateBattleScene(deltaTime) {
        this.battleTime += deltaTime;

        if (this.knightActionAnim > 0) this.knightActionAnim = Math.max(0, this.knightActionAnim - deltaTime * 2.6);
        if (this.knightHurtAnim > 0) this.knightHurtAnim = Math.max(0, this.knightHurtAnim - deltaTime * 3.5);
        if (this.enemyActionAnim > 0) this.enemyActionAnim = Math.max(0, this.enemyActionAnim - deltaTime * 3.0);
        if (this.enemyHurtAnim > 0) this.enemyHurtAnim = Math.max(0, this.enemyHurtAnim - deltaTime * 3.5);

        // Atualiza projéteis
        for (let i = this.activeVfx.length - 1; i >= 0; i--) {
            const vfx = this.activeVfx[i];
            vfx.progress += deltaTime * vfx.speed;
            if (vfx.progress >= 1) {
                this.activeVfx.splice(i, 1);
                this.enemyHurtAnim = 0.8;
            }
        }

        // Atualiza textos flutuantes
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.time += deltaTime;
            ft.y -= deltaTime * 35;
            ft.alpha = Math.max(0, 1 - (ft.time / 0.85));
            if (ft.time >= 0.85) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    renderBattleScene() {
        const ctx = this.battleSceneCtx;
        if (!ctx) return;

        const W = this.elements.battleSceneCanvas.width;   // 800
        const H = this.elements.battleSceneCanvas.height;  // 640

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#160d12';
        ctx.fillRect(0, 0, W, H);

        const currentArea = this.game.world.getCurrentArea();
        const theme = currentArea ? currentArea.bgTheme : 'grass_path';

        // ─── 1. CÉU / FUNDO ──────────────────────────────────────────────────
        const groundY = 240; // horizonte ajustado para deixar a arena na metade superior visível

        if (theme === 'deep_forest') {
            // Floresta: céu noturno esmeralda
            const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
            skyGrad.addColorStop(0, '#011a0e');
            skyGrad.addColorStop(1, '#04381f');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, groundY);

            // Lua
            ctx.fillStyle = 'rgba(240,240,200,0.9)';
            ctx.beginPath(); ctx.arc(680, 60, 34, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(30,40,20,0.5)';
            ctx.beginPath(); ctx.arc(698, 50, 28, 0, Math.PI * 2); ctx.fill();

            // Estrelas
            ctx.fillStyle = '#e2f5d0';
            for (let i = 0; i < 60; i++) {
                const sx = (i * 137.5) % W;
                const sy = (i * 73.3) % (groundY * 0.85);
                const sa = 0.4 + 0.6 * Math.sin(this.battleTime * 2 + i);
                ctx.globalAlpha = sa;
                ctx.fillRect(sx, sy, 2, 2);
            }
            ctx.globalAlpha = 1;

            // Silhuetas de árvores em parallax
            const drawTrees = (xOff, col, hMult) => {
                ctx.fillStyle = col;
                for (let x = -80 + xOff; x < W + 80; x += 90) {
                    const tw = 45 + (x % 30);
                    const th = groundY * hMult;
                    ctx.beginPath();
                    ctx.moveTo(x, groundY);
                    ctx.lineTo(x + tw / 2, groundY - th);
                    ctx.lineTo(x + tw, groundY);
                    ctx.fill();
                }
            };
            drawTrees((this.battleTime * 3) % 90, '#023d1a', 0.9);
            drawTrees((this.battleTime * 6) % 90, '#04602c', 0.75);

        } else if (theme === 'cave_ground') {
            // Caverna: pedra azul-escura
            ctx.fillStyle = '#060c1a';
            ctx.fillRect(0, 0, W, groundY);

            // Cristais brilhantes no teto
            const crystalColors = ['#0ea5e9', '#8b5cf6', '#06b6d4'];
            for (let i = 0; i < 12; i++) {
                const cx2 = 60 + i * 62;
                const ch = 40 + (i * 17) % 60;
                ctx.fillStyle = crystalColors[i % 3];
                ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.battleTime * 3 + i);
                ctx.beginPath();
                ctx.moveTo(cx2 - 12, 0); ctx.lineTo(cx2, ch); ctx.lineTo(cx2 + 12, 0);
                ctx.fill();

                // Brilho suave no chão
                const glowGrad = ctx.createRadialGradient(cx2, groundY, 0, cx2, groundY, 70);
                glowGrad.addColorStop(0, crystalColors[i % 3].replace(')', ', 0.15)').replace('rgb', 'rgba'));
                glowGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGrad;
                ctx.fillRect(cx2 - 70, groundY - 20, 140, 40);
            }
            ctx.globalAlpha = 1;

            // Estalactites
            ctx.fillStyle = '#1e293b';
            for (let i = 0; i < 10; i++) {
                const sx = 30 + i * 77;
                const sh = 25 + (i * 23) % 45;
                ctx.beginPath();
                ctx.moveTo(sx - 10, 0); ctx.lineTo(sx, sh); ctx.lineTo(sx + 10, 0);
                ctx.fill();
            }

        } else if (theme === 'ruins_floor') {
            // Ruínas: céu carmesim dramático
            const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
            skyGrad.addColorStop(0, '#1a0000');
            skyGrad.addColorStop(0.5, '#5a0a0a');
            skyGrad.addColorStop(1, '#8b1111');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, groundY);

            // Sol vermelho sombrio
            ctx.fillStyle = '#ff2200';
            ctx.globalAlpha = 0.7;
            ctx.beginPath(); ctx.arc(400, 90, 55, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.15;
            ctx.beginPath(); ctx.arc(400, 90, 90, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;

            // Pilares em perspectiva
            const drawPillar = (px) => {
                ctx.fillStyle = '#2d2d3a';
                ctx.fillRect(px - 20, 0, 40, groundY * 0.85);
                ctx.fillStyle = '#3d3d50';
                ctx.fillRect(px - 18, 0, 36, 15);
                ctx.fillRect(px - 18, groundY * 0.85 - 15, 36, 15);
                // Runas brilhantes
                ctx.fillStyle = '#dc2626';
                ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.battleTime * 2 + px);
                ctx.fillRect(px - 4, groundY * 0.3, 8, 8);
                ctx.fillRect(px - 4, groundY * 0.5, 8, 8);
                ctx.globalAlpha = 1;
            };
            [80, 200, 600, 720].forEach(drawPillar);

            // Nuvens de fumaça
            ctx.fillStyle = 'rgba(100,10,10,0.3)';
            for (let i = 0; i < 3; i++) {
                const cx2 = ((this.battleTime * 18 + i * 250) % (W + 200)) - 100;
                ctx.beginPath();
                ctx.ellipse(cx2, 50 + i * 30, 90, 30, 0, 0, Math.PI * 2);
                ctx.fill();
            }

        } else {
            // Planície / Vila: Céu azul luminoso estilo Pokémon
            const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
            skyGrad.addColorStop(0, '#1e90ff');
            skyGrad.addColorStop(0.5, '#63b8ff');
            skyGrad.addColorStop(1, '#b8e0ff');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, groundY);

            // Nuvens em parallax (2 camadas de velocidades diferentes)
            const drawClouds = (speedMult, alpha, scaleY) => {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#fff';
                const offset = (this.battleTime * 18 * speedMult) % (W + 300);
                [0, W + 300].forEach(wrap => {
                    const cx2 = -150 + offset + wrap;
                    ctx.beginPath();
                    ctx.arc(cx2, 55, 28 * scaleY, 0, Math.PI * 2);
                    ctx.arc(cx2 + 38, 42, 38 * scaleY, 0, Math.PI * 2);
                    ctx.arc(cx2 + 80, 55, 26 * scaleY, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(cx2 + 440, 75, 22 * scaleY, 0, Math.PI * 2);
                    ctx.arc(cx2 + 480, 64, 32 * scaleY, 0, Math.PI * 2);
                    ctx.arc(cx2 + 520, 75, 20 * scaleY, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
            };
            drawClouds(0.5, 0.5, 0.7);
            drawClouds(1.0, 0.9, 1.0);

            // Colinas distantes (parallax lento)
            const hillOff = Math.sin(this.battleTime * 0.2) * 2;
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.ellipse(150 + hillOff, groundY + 10, 260, 80, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(500 + hillOff, groundY + 15, 300, 70, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(780 + hillOff, groundY + 5, 220, 60, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ─── 2. CHÃO / TERRENO ──────────────────────────────────────────────
        // Faixa de terra profunda
        const groundCol = theme === 'cave_ground' ? '#0f1a2e'
            : theme === 'ruins_floor' ? '#1a1020'
            : '#0a1f06';
        ctx.fillStyle = groundCol;
        ctx.fillRect(0, groundY, W, H - groundY);

        // Superfície do chão (grama / pedra / etc.)
        const surfaceGrad = ctx.createLinearGradient(0, groundY - 8, 0, groundY + 40);
        if (theme === 'deep_forest') {
            surfaceGrad.addColorStop(0, '#065f46');
            surfaceGrad.addColorStop(1, '#022c22');
        } else if (theme === 'cave_ground') {
            surfaceGrad.addColorStop(0, '#1e3a5f');
            surfaceGrad.addColorStop(1, '#0f1a2e');
        } else if (theme === 'ruins_floor') {
            surfaceGrad.addColorStop(0, '#4a2c2c');
            surfaceGrad.addColorStop(1, '#1a0f0f');
        } else {
            surfaceGrad.addColorStop(0, '#2d8c44');
            surfaceGrad.addColorStop(1, '#0a4a18');
        }
        ctx.fillStyle = surfaceGrad;
        ctx.fillRect(0, groundY - 8, W, 50);

        // Detalhes do chão (graminha / pedras)
        if (theme !== 'cave_ground') {
            ctx.fillStyle = theme === 'ruins_floor' ? '#3d2020' : '#3ab55e';
            for (let gx = 20; gx < W; gx += 28) {
                const gh = 5 + (gx % 7);
                ctx.beginPath();
                ctx.moveTo(gx, groundY + 2);
                ctx.lineTo(gx + 5, groundY - gh);
                ctx.lineTo(gx + 10, groundY + 2);
                ctx.fill();
            }
        }

        // ─── 3. PLATAFORMAS ESTILO POKÉMON (MAIS DETALHADAS) ────────────────
        const enemyPlatX = 580;
        const enemyPlatY = 160;
        const playerPlatX = 200;
        const playerPlatY = 250;

        const drawPlatform = (px, py, rx, ry, colTop, colSide) => {
            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(px, py + ry + 8, rx + 8, ry * 0.5 + 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Lateral 3D
            ctx.fillStyle = colSide;
            ctx.beginPath();
            ctx.ellipse(px, py + 12, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // Topo
            ctx.fillStyle = colTop;
            ctx.beginPath();
            ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // Brilho no topo
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(px - rx * 0.15, py - ry * 0.2, rx * 0.5, ry * 0.35, -0.3, 0, Math.PI * 2);
            ctx.fill();
        };

        const topCol = theme === 'cave_ground' ? '#334155'
            : theme === 'ruins_floor' ? '#5c3a3a'
            : theme === 'deep_forest' ? '#064e3b'
            : '#4ade80';
        const sideCol = theme === 'cave_ground' ? '#1e293b'
            : theme === 'ruins_floor' ? '#3a1f1f'
            : theme === 'deep_forest' ? '#022c22'
            : '#15803d';

        drawPlatform(enemyPlatX, enemyPlatY, 95, 24, topCol, sideCol);
        drawPlatform(playerPlatX, playerPlatY, 115, 28, topCol, sideCol);

        // ─── 4. RENDERIZA INIMIGO ────────────────────────────────────────────
        const combat = this.game.combatEngine;
        const target = combat ? combat.getTarget() : null;
        if (target && !target.isDead()) {
            let eX = enemyPlatX;
            let eY = enemyPlatY - 26;

            const bob = Math.sin(this.battleTime * 3.8) * 4;
            eY += bob;

            if (this.enemyHurtAnim > 0) eX += Math.sin(this.enemyHurtAnim * 28) * 14;
            if (this.enemyActionAnim > 0) {
                const lunge = Math.sin(this.enemyActionAnim * Math.PI) * 65;
                eX -= lunge;
                eY += lunge * 0.25;
            }

            // Sombra do inimigo
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(enemyPlatX, enemyPlatY + 4, 35, 11, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            if (this.enemyHurtAnim > 0) {
                ctx.filter = `drop-shadow(0 0 14px #ef4444) brightness(${1.2 + this.enemyHurtAnim * 0.5})`;
            } else if (target.isBoss) {
                ctx.filter = `drop-shadow(0 0 10px ${target.color || '#dc2626'})`;
            }

            if (!target.sprite) {
                const emojiSize = target.isBoss ? 72 : 58;
                ctx.font = `${emojiSize}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(target.icon, eX, eY - 20);
            }

            // Inimigos com sprite são desenhados nítidos na camada final da cena.
            const companionWithoutSprite = combat.enemies.filter(enemy => enemy !== target && !enemy.isDead() && !enemy.sprite);
            companionWithoutSprite.forEach((enemy, index) => {
                const supportX = 480 - index * 105;
                const supportY = enemyPlatY + 14;
                ctx.font = '38px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(enemy.icon, supportX, supportY);
            });
            ctx.restore();

            // Barra de HP flutuante sobre o inimigo
            const hpFrac = Math.max(0, target.hp / target.maxHp);
            const barW = 80, barH = 7;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            drawSafeRoundRect(ctx, eX - barW / 2, eY - 75, barW, barH, 3);
            ctx.fill();
            const hpCol = hpFrac > 0.5 ? '#22c55e' : hpFrac > 0.25 ? '#f59e0b' : '#ef4444';
            ctx.fillStyle = hpCol;
            drawSafeRoundRect(ctx, eX - barW / 2, eY - 75, barW * hpFrac, barH, 3);
            ctx.fill();
        }

        // ─── 5. CAVALEIRO ──────────────────────────────────────────────────
        let kX = playerPlatX;
        let kY = playerPlatY - 38 + Math.sin(this.battleTime * 3) * 2.5;
        const sc = 1.6;

        if (this.knightActionAnim > 0) {
            const lunge = Math.sin(this.knightActionAnim * Math.PI) * 75;
            kX += lunge;
            kY -= lunge * 0.28;
        }
        if (this.knightHurtAnim > 0) kX -= Math.sin(this.knightHurtAnim * 28) * 12;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(playerPlatX, playerPlatY + 4, 36, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aura de escudo em torno do cavaleiro
        if (this.game.player.shield > 0) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(kX, kY - 12 * sc, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // ─── 6. VFX / PROJÉTEIS ─────────────────────────────────────────────
        for (const vfx of this.activeVfx) {
            const curX = vfx.startX + (vfx.targetX - vfx.startX) * vfx.progress;
            const curY = vfx.startY + (vfx.targetY - vfx.startY) * vfx.progress
                - Math.sin(vfx.progress * Math.PI) * 60; // arco parabólico

            ctx.save();
            if (vfx.type === 'fire') {
                // Bola de fogo com rastro
                const fireGrad = ctx.createRadialGradient(curX, curY, 2, curX, curY, 22);
                fireGrad.addColorStop(0, '#fff7aa');
                fireGrad.addColorStop(0.4, '#f97316');
                fireGrad.addColorStop(1, 'rgba(220,38,38,0)');
                ctx.fillStyle = fireGrad;
                ctx.beginPath(); ctx.arc(curX, curY, 22, 0, Math.PI * 2); ctx.fill();
                // Partículas de brasa
                for (let p = 0; p < 4; p++) {
                    const px = curX - (vfx.targetX - vfx.startX) * 0.12 * p + (Math.random() - 0.5) * 14;
                    const py = curY + (Math.random() - 0.5) * 14;
                    ctx.fillStyle = `rgba(251,146,60,${0.6 - p * 0.14})`;
                    ctx.beginPath(); ctx.arc(px, py, 5 - p, 0, Math.PI * 2); ctx.fill();
                }
            } else if (vfx.type === 'lightning') {
                ctx.strokeStyle = '#facc15';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 18;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(vfx.startX, vfx.startY);
                const mid1X = vfx.startX + (curX - vfx.startX) * 0.33 + (Math.random() - 0.5) * 40;
                const mid2X = vfx.startX + (curX - vfx.startX) * 0.66 + (Math.random() - 0.5) * 40;
                ctx.lineTo(mid1X, vfx.startY + (curY - vfx.startY) * 0.33);
                ctx.lineTo(mid2X, vfx.startY + (curY - vfx.startY) * 0.66);
                ctx.lineTo(curX, curY);
                ctx.stroke();
                ctx.fillStyle = '#fef9c3';
                ctx.beginPath(); ctx.arc(curX, curY, 10, 0, Math.PI * 2); ctx.fill();
            } else if (vfx.type === 'ice') {
                ctx.fillStyle = '#bae6fd';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 14;
                // Cristal hexagonal
                for (let a = 0; a < 6; a++) {
                    const ang = (a / 6) * Math.PI * 2;
                    const tip = a % 2 === 0 ? 18 : 12;
                    ctx.beginPath();
                    ctx.moveTo(curX, curY);
                    ctx.lineTo(curX + Math.cos(ang) * tip, curY + Math.sin(ang) * tip);
                    ctx.lineTo(curX + Math.cos(ang + Math.PI / 6) * 8, curY + Math.sin(ang + Math.PI / 6) * 8);
                    ctx.closePath();
                    ctx.fill();
                }
            } else {
                // Arco de golpe de espada
                ctx.strokeStyle = '#f8fafc';
                ctx.shadowColor = '#e2e8f0';
                ctx.shadowBlur = 10;
                ctx.lineWidth = 5;
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.arc(curX, curY, 32, -0.6 * Math.PI, 0.4 * Math.PI);
                ctx.stroke();
                // Rastro de luz
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(curX, curY, 40, -0.5 * Math.PI, 0.3 * Math.PI);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }

        // ─── 7. TEXTOS FLUTUANTES DE DANO / CURA ────────────────────────────
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = '13px \"Press Start 2P\", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        this.battleSceneDisplayCtx.imageSmoothingEnabled = false;
        this.battleSceneDisplayCtx.clearRect(0, 0, W, H);
        this.battleSceneDisplayCtx.drawImage(this.battleScenePixelCanvas, 0, 0, W, H);
        this.renderSharpBattleSprites();
    }

    renderBattleFallback() {
        const canvas = this.elements.battleSceneCanvas;
        const ctx = this.battleSceneDisplayCtx;
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const area = this.game.world.getCurrentArea();
        const isRuins = area && area.bgTheme === 'ruins_floor';
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, isRuins ? '#24070b' : '#14304a');
        sky.addColorStop(0.55, isRuins ? '#7c2020' : '#4383a3');
        sky.addColorStop(0.56, isRuins ? '#301719' : '#174223');
        sky.addColorStop(1, '#080d12');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        const platform = (x, y, rx, ry) => {
            ctx.fillStyle = 'rgba(0,0,0,.45)';
            ctx.beginPath(); ctx.ellipse(x, y + 16, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isRuins ? '#493333' : '#28633c';
            ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = isRuins ? '#bd6560' : '#76bf68';
            ctx.lineWidth = 3;
            ctx.stroke();
        };
        platform(580, 190, 105, 28);
        platform(200, 300, 120, 32);

        const combat = this.game.combatEngine;
        const target = combat && combat.getTarget();
        const targetDrawn = target && target.sprite
            ? this.game.drawEnemySprite(ctx, target, 580, 140 + Math.sin(this.battleTime * 3.8) * 4, target.battleSpriteSize || 100)
            : false;
        if (target && !targetDrawn) {
            ctx.font = '70px monospace'; ctx.textAlign = 'center'; ctx.fillText(target.icon || '👾', 580, 160);
        }
        if (combat) {
            combat.enemies.filter(enemy => enemy !== target && !enemy.isDead()).forEach((enemy, index) => {
                if (enemy.sprite) this.game.drawEnemySprite(ctx, enemy, 475 - index * 90, 205, enemy.battleSpriteSize || 65);
                else {
                    ctx.font = '42px monospace'; ctx.textAlign = 'center'; ctx.fillText(enemy.icon || '👾', 475 - index * 90, 205);
                }
            });
        }
        const player = this.game.player;
        const mage = player.classId === 'mage';
        const sprite = mage ? this.game.mageSprite : this.game.playerBodySprite;
        if (sprite && (sprite.complete === undefined || sprite.complete) && (sprite.naturalWidth || sprite.width)) {
            this.game.drawPlayerCharacter(ctx, 200, (mage ? 280 : 270) + Math.sin(this.battleTime * 3) * 2, mage ? 200 : 170, { horizontalScale: 1 });
        } else {
            ctx.font = '66px monospace'; ctx.textAlign = 'center'; ctx.fillText(mage ? '🧙' : '🛡️', 200, 275);
        }
        ctx.restore();
    }

    renderSharpBattleSprites() {
        const ctx = this.battleSceneDisplayCtx;
        const combat = this.game.combatEngine;
        const target = combat ? combat.getTarget() : null;
        if (!ctx) return;
        const canvasBounds = this.elements.battleSceneCanvas.getBoundingClientRect();
        const horizontalScale = canvasBounds.width && canvasBounds.height
            ? (canvasBounds.height / ctx.canvas.height) / (canvasBounds.width / ctx.canvas.width)
            : 1;

        const visibleEnemies = combat ? combat.enemies.filter(enemy => !enemy.isDead()) : [];
        const shouldFaceLeft = enemy => ['aranha', 'esqueleto', 'mago', 'necromante', 'necromancer'].includes(enemy.typeId);
        if (target && !target.isDead() && target.sprite) {
            let eX = 580;
            let eY = 160 - 26 + Math.sin(this.battleTime * 3.8) * 4;
            if (this.enemyHurtAnim > 0) eX += Math.sin(this.enemyHurtAnim * 28) * 14;
            if (this.enemyActionAnim > 0) {
                const lunge = Math.sin(this.enemyActionAnim * Math.PI) * 65;
                eX -= lunge;
                eY += lunge * 0.25;
            }

            ctx.save();
            if (this.enemyHurtAnim > 0) {
                ctx.filter = `drop-shadow(0 0 14px #ef4444) brightness(${1.2 + this.enemyHurtAnim * 0.5})`;
            }
            if (!this.game.drawEnemySprite(
                ctx,
                target,
                eX,
                eY - 20,
                target.battleSpriteSize || (target.isBoss ? 78 : 68),
                horizontalScale,
                shouldFaceLeft(target) ? true : null
            )) {
                const size = target.isBoss ? 72 : 58;
                ctx.font = `${size}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(target.icon, eX, eY - 20);
            }
            ctx.restore();
        }

        const supportingEnemies = visibleEnemies.filter(enemy => enemy !== target && enemy.sprite);
        supportingEnemies.forEach((enemy, index) => {
            const x = 490 - index * 105;
            const y = 205 + (index % 2) * 10 + Math.sin(this.battleTime * 3.4 + index) * 3;
            this.game.drawEnemySprite(
                ctx,
                enemy,
                x,
                y,
                enemy.battleSpriteSize || 58,
                horizontalScale,
                shouldFaceLeft(enemy) ? true : null
            );
        });

        const mageSelected = this.game.player.classId === 'mage';
        const activeSprite = mageSelected ? this.game.mageSprite : this.game.playerBodySprite;
        const spriteReady = mageSelected
            ? activeSprite && activeSprite.complete && activeSprite.naturalWidth
            : activeSprite && activeSprite.width && activeSprite.height;
        if (spriteReady) {
            let kX = 200;
            let kY = 250 - 38 + Math.sin(this.battleTime * 3) * 2.5;
            if (this.knightActionAnim > 0) {
                const lunge = Math.sin(this.knightActionAnim * Math.PI) * 75;
                kX += lunge;
                kY -= lunge * 0.28;
            }
            if (this.knightHurtAnim > 0) kX -= Math.sin(this.knightHurtAnim * 28) * 12;

            const height = mageSelected ? 202 : 170;
            ctx.save();
            if (this.knightHurtAnim > 0) {
                ctx.filter = `drop-shadow(0 0 16px #ef4444) brightness(${1.3 + this.knightHurtAnim * 0.5})`;
            }
            this.game.drawPlayerCharacter(ctx, kX, kY, height, {
                horizontalScale,
                bodyAngle: Math.sin(this.battleTime * 1.5) * (mageSelected ? 0.03 : 0.012),
                plumeAngle: Math.sin(this.battleTime * 3.1) * 0.12
            });
            ctx.restore();
        }
    }

    handleCombatFinished(result) {
        if (result.result === 'victory') {
            this.openRewardModal(result.gold, result.rewardCards, result.experience, result.levelUps, result.rewardCardPicks || 1);
        } else if (result.result === 'defeat') {
            this.elements.defeatModal.classList.remove('hidden');
        }
    }

    // 6. MODAL RECOMPENSA (DRAFT)
    openRewardModal(gold, cards, experience = 0, levelUps = [], requiredPicks = 1) {
        const player = this.game.player;
        const progressText = `+${experience} XP · Nv. ${player.level} (${player.experience}/${player.getExperienceToNextLevel()} XP)`;
        const levelText = levelUps.length
            ? ` Subiu ${levelUps.length} nível(is)! +${levelUps.length * 10} de vida máxima e +${levelUps.length * 30} moedas.${levelUps.some(level => level.level >= 5) ? ' Desbloqueou o 5º espaço da sequência!' : ''}`
            : '';
        this.elements.rewardGoldText.textContent = `+${gold} 🪙 Moedas · ${progressText}${levelText}`;
        this.elements.rewardCardsRow.innerHTML = '';
        const prompt = document.getElementById('rewardCardPrompt');
        const selectedCards = new Set();
        const cardButtons = new Map();
        this.pendingRewardClaim = null;
        const updatePrompt = () => {
            if (prompt) prompt.textContent = `Escolha ${requiredPicks} carta${requiredPicks > 1 ? 's' : ''} para adicionar ao baralho (${selectedCards.size}/${requiredPicks}):`;
            for (const [card, button] of cardButtons) {
                const selected = selectedCards.has(card);
                button.classList.toggle('selected', selected);
                button.textContent = selected ? 'Selecionada' : 'Escolher Carta';
            }
        };
        const claimSelectedCards = () => {
            if (selectedCards.size !== requiredPicks) {
                this.showToast(`Selecione ${requiredPicks} cartas para confirmar.`);
                return;
            }
            const names = [...selectedCards].map(card => card.name);
            for (const card of selectedCards) this.game.player.addCard(card);
            audio.cardSelect();
            this.showToast(`✨ Adicionou ao baralho: ${names.join(', ')}!`);
            this.pendingRewardClaim = null;
            this.closeModals();
            this.game.returnToWorldAfterCombat();
        };
        this.pendingRewardClaim = claimSelectedCards;

        cards.forEach(card => {
            const draftBox = document.createElement('div');
            draftBox.className = 'reward-draft-item';

            const cardEl = this.createCardElement(card);
            
            const btnPick = document.createElement('button');
            btnPick.className = 'btn-game btn-pick';
            btnPick.textContent = 'Escolher Carta';
            btnPick.onclick = () => {
                if (selectedCards.has(card)) {
                    selectedCards.delete(card);
                } else if (selectedCards.size < requiredPicks) {
                    selectedCards.add(card);
                } else {
                    return;
                }
                updatePrompt();
            };
            cardButtons.set(card, btnPick);

            draftBox.appendChild(cardEl);
            draftBox.appendChild(btnPick);
            this.elements.rewardCardsRow.appendChild(draftBox);
        });

        updatePrompt();
        this.elements.rewardModal.classList.remove('hidden');
    }

    getCardEffectSummary(card) {
        const summaries = {
            afia: 'Aprimora o próximo ataque com arma.',
            encantar: 'Fortalece a próxima arma e causa queimadura.',
            concentrar: 'Aumenta o poder das magias e concede escudo.',
            repetidor: 'Repete a próxima carta uma vez.',
            barreira: 'Escudo e reflexão de dano.',
            cura: `Cura ${card.value} de vida.`,
            escudo: `Bloqueia ${card.value} de dano.`,
            veneno: `Dano ${card.value} e envenena.`,
            fogo: `Dano ${card.value} e queimadura.`,
            gelo: `Dano ${card.value} e congela.`,
            raio: `Dano ${card.value} e chance de atordoar.`,
            lanca: `Dano ${card.value} e atinge outro alvo.`,
            arco: `Dano ${card.value}; atravessa escudo.`,
            apocalipse: `Dano ${card.value} em todos e cura.`,
            furor: `Dano ${card.value}; aumenta com pouca vida.`
        };
        return summaries[card.templateId] || (card.type.id === 'ataque' || card.type.id === 'magia'
            ? `Dano ${card.value}.`
            : `${card.type.name} · efeito ${card.value}.`);
    }

    // Construtor Visual de Carta compacto; detalhes completos aparecem no hover.
    createCardElement(card, options = {}) {
        const el = document.createElement('div');
        el.className = `game-card rarity-${card.rarity.id} type-${card.type.id} ${options.inSequence ? 'card-compact' : ''}`;
        el.style.borderColor = card.rarity.border;

        let stars = '';
        for (let i = 0; i < card.level; i++) stars += '★';

        el.innerHTML = `
            <div class="card-header" style="background: ${card.rarity.bg};">
                <span class="card-type-tag" style="background: ${card.type.tagColor};">${card.type.icon} ${card.type.name}</span>
                ${options.showLevel ? `<span class="card-stars">${stars}</span>` : ''}
            </div>
            <div class="card-rarity-line" style="color:${card.rarity.color};">${card.rarity.name}</div>
            <div class="card-art-box">
                <div class="card-icon-art">${card.icon}</div>
                <div class="card-value-badge">${card.value}</div>
            </div>
            <div class="card-body">
                <div class="card-title">${card.name}</div>
                <div class="card-desc">${this.getCardEffectSummary(card)}</div>
            </div>
        `;

        el.addEventListener('pointerenter', (event) => this.showCardTooltip(card, event));
        el.addEventListener('pointermove', (event) => this.positionCardTooltip(event));
        el.addEventListener('pointerleave', () => this.elements.cardHoverTooltip.classList.add('hidden'));

        return el;
    }

    showCardTooltip(card, event) {
        if (event.pointerType && event.pointerType !== 'mouse') return;
        const tooltip = this.elements.cardHoverTooltip;
        const title = document.createElement('strong');
        title.className = 'card-tooltip-title';
        title.textContent = `${card.icon} ${card.name} · Nv. ${card.level}`;
        const description = document.createElement('p');
        description.className = 'card-tooltip-description';
        description.textContent = card.description.replace(/<[^>]*>/g, '');
        tooltip.replaceChildren(title, description);
        if (card.comboText) {
            const combo = document.createElement('p');
            combo.className = 'card-tooltip-combo';
            combo.textContent = card.comboText;
            tooltip.appendChild(combo);
        }
        tooltip.classList.remove('hidden');
        this.positionCardTooltip(event);
    }

    positionCardTooltip(event) {
        const tooltip = this.elements.cardHoverTooltip;
        if (tooltip.classList.contains('hidden')) return;
        const bounds = this.elements.gameContainer.getBoundingClientRect();
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;
        let left = event.clientX - bounds.left + 14;
        let top = event.clientY - bounds.top + 14;
        left = Math.max(8, Math.min(bounds.width - tipWidth - 8, left));
        if (top + tipHeight > bounds.height - 8) top = event.clientY - bounds.top - tipHeight - 12;
        top = Math.max(8, Math.min(bounds.height - tipHeight - 8, top));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-bubble';
        toast.textContent = message;
        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}
