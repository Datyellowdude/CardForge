// Motor de Combate por Sequência de Cartas
// HDD — RPG 2D de Cartas e Exploração Medieval

class CombatEnemy {
    constructor(data) {
        this.id = data.id || 'enemy_' + Math.random().toString(36).substr(2, 6);
        this.name = data.name;
        this.icon = data.icon || '👺';
        this.sprite = data.sprite || null;
        this.spriteFacesLeft = !!data.spriteFacesLeft;
        this.spriteSize = data.spriteSize || null;
        this.battleSpriteSize = data.battleSpriteSize || null;
        // Na cena de combate, o inimigo fica à direita e encara o jogador à esquerda.
        this.vx = -1;
        const originalMaxHp = data.maxHp || data.hp;
        this.maxHp = Math.ceil(originalMaxHp * 1.4);
        this.hp = Math.min(this.maxHp, Math.ceil(data.hp * 1.4));
        this.shield = 0;
        this.baseDamage = data.baseDamage || 10;
        this.goldReward = data.goldReward || 25;
        this.xpReward = data.xpReward || 0;
        this.color = data.color || '#ef4444';
        this.isBoss = !!data.isBoss;
        this.actions = data.actions || ['attack'];

        // Status negativos
        this.statuses = {
            burn: 0,
            freeze: 0,
            poison: 0,
            bleed: 0,
            stun: 0
        };

        this.intent = null;
        this.decideNextIntent();
    }

    isDead() {
        return this.hp <= 0;
    }

    hasStatus(statusName) {
        return (this.statuses[statusName] || 0) > 0;
    }

    addStatus(statusName, duration = 2) {
        this.statuses[statusName] = Math.max(this.statuses[statusName] || 0, duration);
    }

    takeDamage(amount, pierceShieldPercent = 0) {
        let remaining = amount;
        let shieldBlocked = 0;

        if (this.shield > 0 && pierceShieldPercent < 1) {
            const shieldEffective = Math.round(this.shield * (1 - pierceShieldPercent));
            if (shieldEffective >= remaining) {
                this.shield -= remaining;
                shieldBlocked = remaining;
                remaining = 0;
            } else {
                shieldBlocked = shieldEffective;
                remaining -= shieldEffective;
                this.shield = Math.max(0, this.shield - shieldEffective);
            }
        }

        this.hp = Math.max(0, this.hp - remaining);
        return { hpLost: remaining, shieldBlocked, currentHp: this.hp, isDead: this.isDead() };
    }

    addShield(val) {
        this.shield += val;
    }

    resetTurnShield() {
        this.shield = 0;
    }

    decideNextIntent() {
        const rand = Math.random();
        if (this.isBoss) {
            if (rand < 0.45) {
                this.intent = { type: 'attack', value: this.baseDamage, label: `Golpe Real (${this.baseDamage} Dano)`, icon: '⚔️' };
            } else if (rand < 0.75) {
                this.intent = { type: 'cleave', value: Math.floor(this.baseDamage * 1.3), label: `Fúria Devastadora (${Math.floor(this.baseDamage * 1.3)} Dano)`, icon: '💥' };
            } else {
                this.intent = { type: 'defend', value: 20, label: 'Muralha de Guarda (+20 Escudo)', icon: '🛡️' };
            }
            return;
        }

        if (this.actions.includes('bleed_attack') && rand < 0.35) {
            this.intent = { type: 'bleed_attack', value: Math.floor(this.baseDamage * 0.9), label: `Estocada Sangrenta (${Math.floor(this.baseDamage * 0.9)} Dano + Sangramento)`, icon: '🩸' };
        } else if (this.actions.includes('shield_up') && rand < 0.3) {
            this.intent = { type: 'defend', value: 15, label: 'Erguer Escudo (+15 Escudo)', icon: '🛡️' };
        } else if (this.actions.includes('poison_bite') && rand < 0.4) {
            this.intent = { type: 'poison_attack', value: Math.floor(this.baseDamage * 0.8), label: `Picada Venenosa (${Math.floor(this.baseDamage * 0.8)} Dano + Veneno)`, icon: '🧪' };
        } else if (this.actions.includes('shadow_bolt') && rand < 0.5) {
            this.intent = { type: 'magic_attack', value: this.baseDamage + 4, label: `Seta das Sombras (${this.baseDamage + 4} Dano)`, icon: '🔮' };
        } else {
            this.intent = { type: 'attack', value: this.baseDamage, label: `Ataque Direto (${this.baseDamage} Dano)`, icon: '⚔️' };
        }
    }

    applyStatusDamage(combat) {
        let msgs = [];
        // Queimadura
        if (this.statuses.burn > 0) {
            const burnDmg = 8;
            this.takeDamage(burnDmg);
            this.statuses.burn--;
            combat.addFloatingText(this, `🔥 -${burnDmg}`, '#f97316');
            msgs.push(`${this.name} queimou por ${burnDmg} de dano!`);
        }
        // Veneno
        if (this.statuses.poison > 0) {
            const poisonDmg = 6 * this.statuses.poison;
            this.takeDamage(poisonDmg);
            this.statuses.poison--;
            combat.addFloatingText(this, `🧪 -${poisonDmg}`, '#22c55e');
            msgs.push(`${this.name} sofreu ${poisonDmg} por envenenamento!`);
        }
        // Sangramento
        if (this.statuses.bleed > 0) {
            const bleedDmg = 10;
            this.takeDamage(bleedDmg);
            this.statuses.bleed--;
            combat.addFloatingText(this, `🩸 -${bleedDmg}`, '#dc2626');
            msgs.push(`${this.name} sangrou por ${bleedDmg} de dano!`);
        }
        return msgs;
    }
}

class CombatEngine {
    constructor(player) {
        this.player = player;
        this.enemies = [];
        this.selectedTargetIndex = 0;
        this.hand = [];
        this.drawPile = [];
        this.discardPile = [];
        this.sequence = [null, null, null, null]; // 4 slots de execução
        this.isExecuting = false;
        this.turnCount = 1;
        this.combatLogs = [];
        this.vfxQueue = [];
        this.onCombatEndCallback = null;
        this.onTurnStepCallback = null;
    }

    startCombat(enemyDataList, onEndCallback, musicTrack = 'combate') {
        this.onCombatEndCallback = onEndCallback;
        this.player.resetCombatState();
        this.enemies = enemyDataList.map(data => new CombatEnemy(data));
        this.selectedTargetIndex = 0;
        this.turnCount = 1;
        this.combatLogs = [`⚔️ Início do combate contra ${this.enemies.map(e => e.name).join(' e ')}!`];
        
        // Prepara baralho e mão
        this.drawPile = this.player.deck.map(c => new Card(c.templateId, c.level));
        this.shuffle(this.drawPile);
        this.discardPile = [];
        this.hand = [];
        this.sequence = [null, null, null, null];
        this.isExecuting = false;

        audio.playMusic(musicTrack);
        this.drawHand(5);
        this.applyDefaultSequence();
    }

    applyDefaultSequence() {
        if (!this.player.defaultSequence || !Array.isArray(this.player.defaultSequence)) return;

        // Para cada slot da sequência pré-configurada salva
        for (let slot = 0; slot < this.player.defaultSequence.length && slot < 4; slot++) {
            const templateId = this.player.defaultSequence[slot];
            if (!templateId) continue;

            // 1. Procura na mão
            let cardIndex = this.hand.findIndex(c => c.templateId === templateId);
            if (cardIndex !== -1) {
                const [card] = this.hand.splice(cardIndex, 1);
                this.sequence[slot] = card;
                continue;
            }

            // 2. Procura na pilha de compra
            cardIndex = this.drawPile.findIndex(c => c.templateId === templateId);
            if (cardIndex !== -1) {
                const [card] = this.drawPile.splice(cardIndex, 1);
                this.sequence[slot] = card;
                continue;
            }
        }

        // Garante que a mão tenha 5 cartas para opções de troca
        const needed = Math.max(0, 5 - this.hand.length);
        this.drawHand(needed);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    drawHand(amount) {
        for (let i = 0; i < amount; i++) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) break;
                this.drawPile = [...this.discardPile];
                this.discardPile = [];
                this.shuffle(this.drawPile);
            }
            if (this.drawPile.length > 0) {
                this.hand.push(this.drawPile.pop());
            }
        }
    }

    getTarget() {
        if (!this.enemies[this.selectedTargetIndex] || this.enemies[this.selectedTargetIndex].isDead()) {
            // Escolhe o primeiro inimigo vivo
            const aliveIdx = this.enemies.findIndex(e => !e.isDead());
            if (aliveIdx !== -1) {
                this.selectedTargetIndex = aliveIdx;
            }
        }
        return this.enemies[this.selectedTargetIndex];
    }

    setTargetIndex(index) {
        if (this.enemies[index] && !this.enemies[index].isDead()) {
            this.selectedTargetIndex = index;
            audio.cardSelect();
        }
    }

    // Gerenciamento de Sequência de Cartas
    addCardToSequence(cardUid, slotIndex = null) {
        if (this.isExecuting) return false;
        const handIndex = this.hand.findIndex(c => c.uid === cardUid);
        if (handIndex === -1) return false;

        // Se slot não for especificado, pega o primeiro vazio
        let targetSlot = slotIndex;
        if (targetSlot === null || targetSlot < 0 || targetSlot >= this.sequence.length) {
            targetSlot = this.sequence.findIndex(s => s === null);
        }

        if (targetSlot === -1) return false; // Sequência cheia

        // Remove da mão e coloca na sequência
        const [card] = this.hand.splice(handIndex, 1);
        
        // Se já havia carta no slot, devolve pra mão
        if (this.sequence[targetSlot] !== null) {
            this.hand.push(this.sequence[targetSlot]);
        }

        this.sequence[targetSlot] = card;
        audio.cardPlace();
        return true;
    }

    removeCardFromSequence(slotIndex) {
        if (this.isExecuting) return false;
        if (this.sequence[slotIndex]) {
            this.hand.push(this.sequence[slotIndex]);
            this.sequence[slotIndex] = null;
            audio.cardSelect();
            return true;
        }
        return false;
    }

    swapSequenceSlots(slotA, slotB) {
        if (this.isExecuting) return;
        const temp = this.sequence[slotA];
        this.sequence[slotA] = this.sequence[slotB];
        this.sequence[slotB] = temp;
        audio.cardPlace();
    }

    clearSequence() {
        if (this.isExecuting) return;
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.sequence[i]) {
                this.hand.push(this.sequence[i]);
                this.sequence[i] = null;
            }
        }
    }

    // Análise e Previsão de Combos em Cadeia
    previewSequence() {
        const preview = [];
        let simSharp = this.player.combatBuffs.sharp;
        let simEnchanted = this.player.combatBuffs.enchanted;
        let simMagicBoost = this.player.combatBuffs.magicBoost;

        for (let i = 0; i < this.sequence.length; i++) {
            const card = this.sequence[i];
            if (!card) {
                preview.push(null);
                continue;
            }

            let bonusNotes = [];
            let estimatedValue = card.value;

            if (card.tags.includes('arma')) {
                if (simSharp > 0) {
                    const bonus = Math.floor(estimatedValue * 0.5);
                    estimatedValue += bonus;
                    bonusNotes.push(`+50% Afiado (+${bonus})`);
                    simSharp--;
                }
                if (simEnchanted) {
                    estimatedValue += 12;
                    bonusNotes.push('+12 Fogo Arcano');
                    simEnchanted = false;
                }
            } else if (card.templateId === 'afia') {
                simSharp++;
                bonusNotes.push('Fortalece próxima arma');
            } else if (card.templateId === 'encantar') {
                simEnchanted = true;
                bonusNotes.push('Encanta próxima arma com Fogo');
            } else if (card.type.id === 'magia' && simMagicBoost > 1) {
                const bonus = Math.floor(estimatedValue * (simMagicBoost - 1));
                estimatedValue += bonus;
                bonusNotes.push(`+${Math.round((simMagicBoost - 1) * 100)}% Magia (+${bonus})`);
            } else if (card.templateId === 'concentrar') {
                simMagicBoost = 1.4;
                bonusNotes.push('+40% Magias neste turno');
            }

            preview.push({
                card,
                estimatedValue,
                notes: bonusNotes.join(' | ')
            });
        }
        return preview;
    }

    // EXECUÇÃO DO TURNO: DA ESQUERDA PARA A DIREITA
    async executeTurn(onStepUpdate, onCombatFinished) {
        if (this.isExecuting) return;
        const activeCards = this.sequence.filter(c => c !== null);
        if (activeCards.length === 0) {
            this.addLog('⚠️ Adicione ao menos uma carta na sequência antes de atacar!');
            return;
        }

        this.isExecuting = true;
        this.player.resetTurnShield();
        this.enemies.forEach(e => e.resetTurnShield());

        // Contexto de execução para as cartas
        const context = {
            player: this.player,
            target: this.getTarget(),
            allEnemies: this.enemies,
            sequenceIndex: 0,
            queue: this.sequence,
            log: (msg) => this.addLog(msg),
            addVfx: (type, target) => this.triggerVfx(type, target),
            dealDamageToTarget: (target, amount, sourceName, options = {}) => {
                const finalDamage = this.player.classId === 'mage' ? Math.max(1, Math.floor(amount * 1.2)) : amount;
                const result = target.takeDamage(finalDamage, options.pierceShieldPercent || 0);
                this.addFloatingText(target, `-${result.hpLost}`, '#f87171');
                if (result.shieldBlocked > 0) {
                    this.addFloatingText(target, `🛡️ Bloqueou ${result.shieldBlocked}`, '#38bdf8');
                }
                if (onStepUpdate) onStepUpdate({ type: 'enemy_hurt', enemy: target, dmg: finalDamage });
                this.addLog(`💥 ${sourceName} causou ${finalDamage} de dano a ${target.name}!`);
                if (result.isDead) {
                    this.addLog(`💀 ${target.name} foi derrotado!`);
                    audio.defeat();
                }
            }
        };

        // 1. EXECUÇÃO ESQUERDA -> DIREITA
        for (let i = 0; i < this.sequence.length; i++) {
            const card = this.sequence[i];
            if (!card) continue;

            context.sequenceIndex = i;
            context.target = this.getTarget(); // Atualiza alvo vivo caso o anterior tenha morrido

            // Notifica interface para destacar a carta ativa
            if (onStepUpdate) onStepUpdate({ type: 'card_start', slotIndex: i, card });
            audio.cardActivate();

            // Executa efeito da carta
            card.execute(context);
            this.playCardAudio(card);

            // Aguarda tempo para visualização da animação e suspense de combo
            await this.sleep(700);

            if (onStepUpdate) onStepUpdate({ type: 'card_end', slotIndex: i, card });

            // Checa se todos os inimigos morreram após a carta
            if (this.allEnemiesDead()) {
                await this.sleep(400);
                this.finishCombatVictory(onCombatFinished);
                return;
            }
        }

        // 2. RESOLUÇÃO DE STATUS DE FIM DE TURNO NOS INIMIGOS
        for (const enemy of this.enemies) {
            if (!enemy.isDead()) {
                const statusMsgs = enemy.applyStatusDamage(this);
                statusMsgs.forEach(m => this.addLog(m));
            }
        }

        if (this.allEnemiesDead()) {
            await this.sleep(400);
            this.finishCombatVictory(onCombatFinished);
            return;
        }

        // 3. CONTRA-ATAQUE DOS INIMIGOS
        this.addLog('🛡️ Turno dos Inimigos!');
        await this.sleep(500);

        for (const enemy of this.enemies) {
            if (enemy.isDead()) continue;

            // Checagem de Atordoamento
            if (enemy.statuses.stun > 0) {
                enemy.statuses.stun--;
                this.addFloatingText(enemy, '💫 ATORDOADO!', '#fbbf24');
                this.addLog(`💫 ${enemy.name} está atordoado e perdeu a ação!`);
                await this.sleep(500);
                continue;
            }

            const intent = enemy.intent;
            if (!intent) continue;

            if (intent.type === 'attack' || intent.type === 'cleave' || intent.type === 'bleed_attack' || intent.type === 'poison_attack' || intent.type === 'magic_attack') {
                let dmg = intent.value;
                
                // Se congelado, reduz dano
                if (enemy.statuses.freeze > 0) {
                    dmg = Math.floor(dmg * 0.5);
                    enemy.statuses.freeze--;
                    this.addLog(`❄️ ${enemy.name} congelado atacou com dano reduzido pela metade!`);
                }

                if (onStepUpdate) onStepUpdate({ type: 'enemy_attack', enemy, dmg });
                audio.hurt();
                this.triggerVfx('enemy_attack', this.player);
                const res = this.player.takeDamage(dmg);

                this.addFloatingText(this.player, `-${res.hpLost}`, '#ef4444');
                if (res.shieldBlocked > 0) {
                    this.addFloatingText(this.player, `🛡️ Escudo absorveu ${res.shieldBlocked}`, '#38bdf8');
                }
                this.addLog(`⚔️ ${enemy.name} atacou por ${dmg} de dano!`);

                // Reflexão de dano da Barreira Sagrada
                if (this.player.combatBuffs.reflect > 0 && res.shieldBlocked > 0) {
                    const reflected = Math.floor(res.shieldBlocked * this.player.combatBuffs.reflect);
                    enemy.takeDamage(reflected);
                    this.addFloatingText(enemy, `💥 Refletiu -${reflected}`, '#a855f7');
                    this.addLog(`✨🛡️ Barreira refletiu ${reflected} de dano de volta em ${enemy.name}!`);
                }

                // Efeitos adicionais do golpe
                if (intent.type === 'bleed_attack') {
                    this.player.statuses.bleed = 2;
                    this.addLog('🩸 Você está sangrando!');
                } else if (intent.type === 'poison_attack') {
                    this.player.statuses.poison = 2;
                    this.addLog('🧪 Você foi envenenado!');
                }

                if (res.isDead) {
                    await this.sleep(400);
                    this.finishCombatDefeat(onCombatFinished);
                    return;
                }
            } else if (intent.type === 'defend') {
                enemy.addShield(intent.value);
                audio.shield();
                this.addFloatingText(enemy, `🛡️ +${intent.value} Escudo`, '#38bdf8');
                this.addLog(`🛡️ ${enemy.name} ergueu defesa com +${intent.value} de escudo!`);
            }

            await this.sleep(500);
        }

        // 4. PREPARAÇÃO DO PRÓXIMO TURNO
        // Move cartas da sequência para descarte
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.sequence[i]) {
                this.discardPile.push(this.sequence[i]);
                this.sequence[i] = null;
            }
        }

        // Compra até ter 5 na mão
        const needed = Math.max(0, 5 - this.hand.length);
        this.drawHand(needed);

        // Decide novas intenções dos inimigos
        this.enemies.forEach(e => {
            if (!e.isDead()) e.decideNextIntent();
        });

        this.turnCount++;
        this.isExecuting = false;
        if (onStepUpdate) onStepUpdate({ type: 'turn_ready' });
    }

    allEnemiesDead() {
        return this.enemies.every(e => e.isDead());
    }

    finishCombatVictory(callback) {
        audio.victory();
        let totalGold = 0;
        let totalExperience = 0;
        this.enemies.forEach(e => totalGold += e.goldReward);
        this.enemies.forEach(e => {
            totalExperience += e.xpReward || Math.max(20, Math.floor(e.maxHp * 0.65 + e.baseDamage * 1.5));
        });
        let earnedGold = this.player.addGold(totalGold);
        const experienceResult = this.player.addExperience(totalExperience);
        earnedGold += experienceResult.bonusGold;

        const cardChoices = generateCardRewardDraft(this.player.classId);

        this.addLog(`🏆 VITÓRIA! +${experienceResult.gained} XP e +${earnedGold} moedas!`);
        if (callback) {
            callback({
                result: 'victory',
                gold: earnedGold,
                experience: experienceResult.gained,
                levelUps: experienceResult.levelUps,
                enemies: this.enemies,
                rewardCards: cardChoices
            });
        }
    }

    finishCombatDefeat(callback) {
        audio.defeat();
        this.addLog('💀 VOCÊ CAIU EM BATALHA...');
        if (callback) {
            callback({
                result: 'defeat'
            });
        }
    }

    playCardAudio(card) {
        switch (card.templateId) {
            case 'espada':
                audio.slash();
                break;
            case 'machado':
                audio.heavySlash();
                break;
            case 'afia':
                audio.sharpen();
                break;
            case 'fogo':
                audio.fireball();
                break;
            case 'raio':
                audio.lightning();
                break;
            case 'gelo':
                audio.ice();
                break;
            case 'escudo':
            case 'barreira':
                audio.shield();
                break;
            case 'cura':
                audio.heal();
                break;
            default:
                audio.slash();
                break;
        }
    }

    addLog(msg) {
        this.combatLogs.unshift(msg);
        if (this.combatLogs.length > 25) this.combatLogs.pop();
    }

    triggerVfx(type, target) {
        this.vfxQueue.push({ type, target, time: Date.now() });
    }

    addFloatingText(target, text, color) {
        if (!target.floatingTexts) target.floatingTexts = [];
        target.floatingTexts.push({
            text,
            color,
            x: 0,
            y: 0,
            opacity: 1,
            time: Date.now()
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
