// Estado e Comportamento do Jogador
// HDD — RPG 2D de Cartas e Exploração Medieval

class Player {
    constructor() {
        this.reset();
    }

    reset(classId = 'knight') {
        this.classId = classId === 'mage' ? 'mage' : 'knight';
        this.name = 'Aventureiro';
        this.maxHp = this.classId === 'mage' ? 80 : 100;
        this.hp = this.maxHp;
        this.level = 1;
        this.experience = 0;
        this.hasSeenCombatTutorial = false;
        this.gold = 50;
        this.shield = 0;
        this.relics = []; // Relíquias passivas

        // Posição no mundo
        this.currentArea = 'vila';
        this.x = 400;
        this.y = 360;
        this.speed = 3.6;
        this.direction = 'down';
        this.isMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;

        // Buffs de combate temporários (resetam no início da batalha ou por turno)
        this.combatBuffs = {
            sharp: 0,
            enchanted: false,
            magicBoost: 1,
            reflect: 0
        };

        // Status negativos temporários
        this.statuses = {
            burn: 0,
            bleed: 0,
            poison: 0
        };

        // Baralho inicial conforme especificação
        const startingCards = this.classId === 'mage'
            ? ['fogo', 'fogo', 'cura', 'concentrar']
            : ['afia', 'espada', 'espada', 'escudo'];
        this.deck = startingCards.map((templateId) => new Card(templateId, 1));

        // Sequência de combate pré-configurada salva (padrão)
        this.defaultSequence = this.classId === 'mage'
            ? ['concentrar', 'fogo', 'fogo', 'cura']
            : ['afia', 'espada', 'espada', 'escudo'];
    }

    addShield(amount) {
        this.shield += amount;
    }

    resetTurnShield() {
        this.shield = 0;
    }

    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    takeDamage(amount) {
        let remaining = amount;
        let shieldBlocked = 0;

        // Absorção de dano pelo Escudo
        if (this.shield > 0) {
            if (this.shield >= remaining) {
                this.shield -= remaining;
                shieldBlocked = remaining;
                remaining = 0;
            } else {
                shieldBlocked = this.shield;
                remaining -= this.shield;
                this.shield = 0;
            }
        }

        // Aplica o restante no HP
        this.hp = Math.max(0, this.hp - remaining);
        return { hpLost: remaining, shieldBlocked, currentHp: this.hp, isDead: this.hp <= 0 };
    }

    addGold(amount) {
        // Aplica relíquia Anel do Aventureiro se possuir
        let bonus = 0;
        if (this.hasRelic('anel_aventureiro')) {
            bonus = Math.floor(amount * 0.15);
        }
        const total = amount + bonus;
        this.gold += total;
        return total;
    }

    getExperienceToNextLevel() {
        return 100 + (this.level - 1) * 50;
    }

    addExperience(amount) {
        let remaining = Math.max(0, Math.floor(amount));
        const gained = remaining;
        const levelUps = [];
        let bonusGold = 0;

        while (remaining > 0) {
            const untilLevel = Math.max(0, this.getExperienceToNextLevel() - this.experience);
            if (remaining < untilLevel) {
                this.experience += remaining;
                remaining = 0;
                break;
            }

            remaining -= untilLevel;
            this.experience = 0;
            this.level++;
            this.maxHp += 10;
            this.heal(10);
            const levelGold = 30;
            bonusGold += this.addGold(levelGold);
            levelUps.push({ level: this.level, maxHp: this.maxHp, gold: levelGold });
        }

        return { gained, levelUps, bonusGold };
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    addCard(card) {
        this.deck.push(card);
    }

    removeCard(cardUid) {
        const idx = this.deck.findIndex(c => c.uid === cardUid);
        if (idx !== -1) {
            this.deck.splice(idx, 1);
            return true;
        }
        return false;
    }

    upgradeCard(cardUid) {
        const card = this.deck.find(c => c.uid === cardUid);
        if (card) {
            const cost = this.getBlacksmithDiscount(card.getUpgradeCost());
            if (this.spendGold(cost)) {
                card.upgrade();
                return { success: true, card, cost };
            }
        }
        return { success: false };
    }

    hasRelic(relicId) {
        return this.relics.some(r => r.id === relicId);
    }

    addRelic(relic) {
        if (!this.hasRelic(relic.id)) {
            this.relics.push(relic);
        }
    }

    getBlacksmithDiscount(baseCost) {
        if (this.hasRelic('martelo_ferreiro')) {
            return Math.floor(baseCost * 0.8); // 20% desconto
        }
        return baseCost;
    }

    clearNegativeStatuses() {
        this.statuses.burn = 0;
        this.statuses.bleed = 0;
        this.statuses.poison = 0;
    }

    resetCombatState() {
        this.shield = 0;
        this.combatBuffs = {
            sharp: 0,
            enchanted: false,
            magicBoost: 1,
            reflect: 0
        };
        this.clearNegativeStatuses();
    }

    // Salvar estado em JSON
    toJSON() {
        return {
            name: this.name,
            classId: this.classId,
            hp: this.hp,
            maxHp: this.maxHp,
            level: this.level,
            experience: this.experience,
            hasSeenCombatTutorial: this.hasSeenCombatTutorial,
            gold: this.gold,
            currentArea: this.currentArea,
            x: this.x,
            y: this.y,
            direction: this.direction,
            relics: this.relics,
            defaultSequence: this.defaultSequence,
            deck: this.deck.map(c => c.toJSON())
        };
    }

    // Carregar estado de JSON
    fromJSON(data) {
        this.name = data.name || 'Aventureiro';
        this.classId = data.classId === 'mage' ? 'mage' : 'knight';
        this.hp = data.hp;
        this.level = Math.max(1, data.level || 1);
        this.experience = Math.min(Math.max(0, data.experience || 0), this.getExperienceToNextLevel() - 1);
        this.hasSeenCombatTutorial = !!data.hasSeenCombatTutorial;
        this.maxHp = data.maxHp || (this.classId === 'mage' ? 80 : 100);
        if (this.classId === 'mage' && !data.level && !data.experience) {
            const oldMaxHp = this.maxHp;
            const oldHp = data.hp ?? oldMaxHp;
            this.maxHp = Math.max(80, oldMaxHp - 20);
            this.hp = Math.min(this.maxHp, Math.max(0, oldHp - 20));
        }
        this.gold = data.gold || 0;
        this.currentArea = data.currentArea || 'vila';
        this.x = data.x || 400;
        this.y = data.y || 300;
        this.direction = data.direction || 'down';
        this.relics = data.relics || [];
        this.defaultSequence = data.defaultSequence || (this.classId === 'mage'
            ? ['concentrar', 'fogo', 'fogo', 'cura']
            : ['afia', 'espada', 'espada', 'escudo']);
        if (data.deck && Array.isArray(data.deck)) {
            this.deck = data.deck.map(cd => Card.fromJSON(cd));
        }
        this.resetCombatState();
    }
}
