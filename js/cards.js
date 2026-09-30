// Sistema de Cartas, Tipos, Raridades e Combos
// HDD — RPG 2D de Cartas e Exploração Medieval

const CardRarity = {
    COMUM: { id: 'comum', name: 'Comum', color: '#75632c', border: '#9a8541', bg: '#f3e7ad' },
    INCOMUM: { id: 'incomum', name: 'Incomum', color: '#356b38', border: '#4c8c4e', bg: '#f3e7ad' },
    RARA: { id: 'rara', name: 'Rara', color: '#425b8a', border: '#5672a7', bg: '#f3e7ad' },
    EPICA: { id: 'epica', name: 'Épica', color: '#714586', border: '#86569e', bg: '#f3e7ad' },
    LENDARIA: { id: 'lendaria', name: 'Lendária', color: '#806519', border: '#aa8727', bg: '#f3e7ad' }
};

const CardType = {
    ATAQUE: { id: 'ataque', name: 'Ataque', icon: '⚔️', tagColor: '#ef4444' },
    MAGIA: { id: 'magia', name: 'Magia', icon: '✨', tagColor: '#8b5cf6' },
    PREPARACAO: { id: 'preparacao', name: 'Preparação', icon: '⚡', tagColor: '#f59e0b' },
    DEFESA: { id: 'defesa', name: 'Defesa', icon: '🛡️', tagColor: '#06b6d4' },
    UTILIDADE: { id: 'utilidade', name: 'Utilidade', icon: '🧪', tagColor: '#10b981' }
};

// Base de cartas mestras
const CARD_TEMPLATES = {
    espada: {
        id: 'espada',
        name: 'Espada',
        type: CardType.ATAQUE,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 20,
        tags: ['arma', 'fisico'],
        icon: '🗡️',
        description: 'Causa {val} de dano físico a um inimigo.',
        comboText: 'Aproveita bônus de Afiar e Preparações.',
        upgradeMultiplier: 1.5,
        execute(context) {
            // context: { player, target, allEnemies, sequenceIndex, queue, combatLog, addEffect }
            let dmg = this.value;
            let logMsg = '';
            
            // Verifica bônus de afiação / buff
            if (context.player.combatBuffs.sharp > 0) {
                const bonus = Math.floor(dmg * 0.5);
                dmg += bonus;
                context.player.combatBuffs.sharp--;
                logMsg = ` (Afiado! +${bonus} DMG)`;
                context.addVfx('sharp_slash', context.target);
            } else {
                context.addVfx('slash', context.target);
            }

            // Se arma estiver encantada por fogo/magia prévia
            if (context.player.combatBuffs.enchanted) {
                const elemDmg = 12;
                dmg += elemDmg;
                context.target.addStatus('burn', 2);
                context.player.combatBuffs.enchanted = false;
                logMsg += ` + Encantada (+${elemDmg} & Queimadura)!`;
                context.addVfx('fire_slash', context.target);
            }

            context.dealDamageToTarget(context.target, dmg, 'Espada' + logMsg);
        }
    },

    machado: {
        id: 'machado',
        name: 'Machado Pesado',
        type: CardType.ATAQUE,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 32,
        tags: ['arma', 'pesado'],
        icon: '🪓',
        description: 'Golpe brutal causando {val} de dano. Aplica Sangramento.',
        comboText: 'Dano massivo se fortalecido por Afiar.',
        upgradeMultiplier: 1.45,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.sharp > 0) {
                const bonus = Math.floor(dmg * 0.5);
                dmg += bonus;
                context.player.combatBuffs.sharp--;
                context.addVfx('heavy_slash', context.target);
            } else {
                context.addVfx('slash', context.target);
            }
            context.dealDamageToTarget(context.target, dmg, 'Machado Pesado');
            context.target.addStatus('bleed', 2);
        }
    },

    adaga: {
        id: 'adaga',
        name: 'Adaga Ágil',
        type: CardType.ATAQUE,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 14,
        tags: ['arma', 'agil'],
        icon: '🔪',
        description: 'Ataque rápido de {val} dano. Se o inimigo estiver queimando ou sangrando, causa dano crítico (+100%).',
        comboText: 'Coloque depois de Fogo ou Machado.',
        upgradeMultiplier: 1.5,
        execute(context) {
            let dmg = this.value;
            let crit = false;
            if (context.target.hasStatus('burn') || context.target.hasStatus('bleed') || context.target.hasStatus('poison')) {
                dmg *= 2;
                crit = true;
            }
            if (context.player.combatBuffs.sharp > 0) {
                dmg += Math.floor(this.value * 0.5);
                context.player.combatBuffs.sharp--;
            }
            context.addVfx('quick_slice', context.target);
            context.dealDamageToTarget(context.target, dmg, crit ? 'Adaga Ágil (CRÍTICO!)' : 'Adaga Ágil');
        }
    },

    arco: {
        id: 'arco',
        name: 'Disparo de Arco',
        type: CardType.ATAQUE,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 24,
        tags: ['arma', 'distancia'],
        icon: '🏹',
        description: 'Dispara uma flecha precisa causando {val} de dano direto ignorando 50% do escudo.',
        comboText: 'Perfeito contra inimigos com armadura.',
        upgradeMultiplier: 1.4,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.sharp > 0) {
                dmg += Math.floor(dmg * 0.5);
                context.player.combatBuffs.sharp--;
            }
            context.addVfx('arrow', context.target);
            context.dealDamageToTarget(context.target, dmg, 'Disparo de Arco', { pierceShieldPercent: 0.5 });
        }
    },

    lanca: {
        id: 'lanca',
        name: 'Golpe de Lança',
        type: CardType.ATAQUE,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 20,
        tags: ['arma', 'perfurante'],
        icon: '🔱',
        description: 'Perfura o alvo por {val} de dano e atinge todos os outros inimigos por 50% do dano.',
        comboText: 'Ideal para combates contra múltiplos alvos.',
        upgradeMultiplier: 1.45,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.sharp > 0) {
                dmg += Math.floor(dmg * 0.5);
                context.player.combatBuffs.sharp--;
            }
            context.addVfx('spear_thrust', context.target);
            context.dealDamageToTarget(context.target, dmg, 'Golpe de Lança (Principal)');
            
            // Dano colateral
            context.allEnemies.forEach(e => {
                if (e !== context.target && !e.isDead()) {
                    context.dealDamageToTarget(e, Math.floor(dmg * 0.5), 'Perfuração de Lança');
                }
            });
        }
    },

    afia: {
        id: 'afia',
        name: 'Afiar Lâmina',
        type: CardType.PREPARACAO,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 50, // +50%
        tags: ['preparacao', 'buff'],
        icon: '✨',
        description: 'Afia as armas seguintes. Concede +50% de dano à próxima carta de arma.',
        comboText: 'Coloque SEMPRE antes de uma arma (Espada, Machado, Arco).',
        upgradeMultiplier: 1.25,
        execute(context) {
            context.player.combatBuffs.sharp = (context.player.combatBuffs.sharp || 0) + 1;
            context.addVfx('sharpen', context.player);
            context.log('✨ Você afiou sua arma! Próximo ataque causará +50% de dano.');
        }
    },

    encantar: {
        id: 'encantar',
        name: 'Encantar Lâmina',
        type: CardType.PREPARACAO,
        rarity: CardRarity.RARA,
        cost: 0,
        baseValue: 15,
        tags: ['preparacao', 'magia'],
        icon: '🔮',
        description: 'Concede poder elemental à próxima arma (+15 dano mágico extra e aplica Queimadura).',
        comboText: 'Combine com Espada ou Arco para ataques incendiários.',
        upgradeMultiplier: 1.4,
        execute(context) {
            context.player.combatBuffs.enchanted = true;
            context.addVfx('enchant', context.player);
            context.log('🔮 Lâmina encantada com energia flamejante arcana!');
        }
    },

    concentrar: {
        id: 'concentrar',
        name: 'Concentração',
        type: CardType.PREPARACAO,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 1,
        tags: ['preparacao', 'utilidade'],
        icon: '🧘',
        description: 'Aumenta o efeito de TODAS as cartas mágicas deste turno em +40%. Concede 8 de Escudo.',
        comboText: 'Coloque antes de Fogo, Raio ou Gelo.',
        upgradeMultiplier: 1.3,
        execute(context) {
            context.player.combatBuffs.magicBoost = 1.4 + (this.level - 1) * 0.15;
            context.player.addShield(8 + (this.level - 1) * 4);
            context.addVfx('focus', context.player);
            context.log('🧘 Mente concentrada! Magias fortalecidas em +40% e +8 Escudo.');
        }
    },

    fogo: {
        id: 'fogo',
        name: 'Bola de Fogo',
        type: CardType.MAGIA,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 22,
        tags: ['magia', 'fogo'],
        icon: '🔥',
        description: 'Lança fogo causando {val} de dano e inflige Queimadura por 3 turnos.',
        comboText: 'Se o alvo já tiver Queimadura, explode causando 15 de dano adicional.',
        upgradeMultiplier: 1.45,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.magicBoost) {
                dmg = Math.floor(dmg * context.player.combatBuffs.magicBoost);
            }
            context.addVfx('fireball', context.target);
            
            let extraMsg = '';
            if (context.target.hasStatus('burn')) {
                const explodeDmg = 15;
                dmg += explodeDmg;
                extraMsg = ' (COMBO DE EXPLOSÃO! +15 DMG)';
                context.addVfx('explosion', context.target);
            }

            context.dealDamageToTarget(context.target, dmg, 'Bola de Fogo' + extraMsg);
            context.target.addStatus('burn', 3);
        }
    },

    raio: {
        id: 'raio',
        name: 'Relâmpago Arcano',
        type: CardType.MAGIA,
        rarity: CardRarity.RARA,
        cost: 0,
        baseValue: 35,
        tags: ['magia', 'eletrico'],
        icon: '⚡',
        description: 'Atinge com choque estrondoso de {val} dano e tem 50% de chance de Atordoar o inimigo.',
        comboText: 'Atordoa inimigos para interromper ataques perigosos.',
        upgradeMultiplier: 1.4,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.magicBoost) {
                dmg = Math.floor(dmg * context.player.combatBuffs.magicBoost);
            }
            context.addVfx('lightning', context.target);
            context.dealDamageToTarget(context.target, dmg, 'Relâmpago Arcano');
            
            if (Math.random() < 0.6) {
                context.target.addStatus('stun', 1);
                context.log(`⚡ ${context.target.name} ficou Atordoado!`);
            }
        }
    },

    gelo: {
        id: 'gelo',
        name: 'Estaca de Gelo',
        type: CardType.MAGIA,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 18,
        tags: ['magia', 'gelo'],
        icon: '❄️',
        description: 'Causa {val} de dano e Congela o inimigo, reduzindo seu próximo ataque em 50%.',
        comboText: 'Excelente para controlar o dano do adversário.',
        upgradeMultiplier: 1.4,
        execute(context) {
            let dmg = this.value;
            if (context.player.combatBuffs.magicBoost) {
                dmg = Math.floor(dmg * context.player.combatBuffs.magicBoost);
            }
            context.addVfx('ice_spike', context.target);
            context.dealDamageToTarget(context.target, dmg, 'Estaca de Gelo');
            context.target.addStatus('freeze', 1);
        }
    },

    veneno: {
        id: 'veneno',
        name: 'Frasco Venenoso',
        type: CardType.MAGIA,
        rarity: CardRarity.INCOMUM,
        cost: 0,
        baseValue: 12,
        tags: ['magia', 'veneno'],
        icon: '🧪',
        description: 'Causa {val} de dano e infecta com Veneno virulento (causa dano progressivo).',
        comboText: 'Combina perfeitamente com Adaga Ágil.',
        upgradeMultiplier: 1.35,
        execute(context) {
            let dmg = this.value;
            context.addVfx('poison_cloud', context.target);
            context.dealDamageToTarget(context.target, dmg, 'Frasco Venenoso');
            context.target.addStatus('poison', 4);
        }
    },

    escudo: {
        id: 'escudo',
        name: 'Escudo Protetor',
        type: CardType.DEFESA,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 10,
        tags: ['defesa', 'escudo'],
        icon: '🛡️',
        description: 'Concede {val} de Escudo para bloquear essa quantidade total de dano recebido.',
        comboText: 'O escudo pode absorver dano de mais de um ataque até se esgotar.',
        upgradeMultiplier: 1.45,
        execute(context) {
            const shieldAmount = this.value;
            context.player.addShield(shieldAmount);
            context.addVfx('shield', context.player);
            context.log(`🛡️ Você ergueu o Escudo! (+${shieldAmount} de proteção)`);
        }
    },

    barreira: {
        id: 'barreira',
        name: 'Barreira Sagrada',
        type: CardType.DEFESA,
        rarity: CardRarity.RARA,
        cost: 0,
        baseValue: 35,
        tags: ['defesa', 'sagrado'],
        icon: '✨🛡️',
        description: 'Cria uma muralha de luz com {val} de Escudo e reflete 30% do dano absorvido de volta.',
        comboText: 'Defesa pesada para turnos de ataques devastadores.',
        upgradeMultiplier: 1.4,
        execute(context) {
            context.player.addShield(this.value);
            context.player.combatBuffs.reflect = 0.3;
            context.addVfx('holy_barrier', context.player);
            context.log(`✨🛡️ Barreira Sagrada erguida! (+${this.value} Escudo e reflexão de dano ativada)`);
        }
    },

    cura: {
        id: 'cura',
        name: 'Oração de Cura',
        type: CardType.UTILIDADE,
        rarity: CardRarity.COMUM,
        cost: 0,
        baseValue: 22,
        tags: ['utilidade', 'cura'],
        icon: '💖',
        description: 'Restaura {val} pontos de Vida (HP) e limpa efeitos negativos (queimadura/sangramento).',
        comboText: 'Sustentabilidade essencial durante batalhas difíceis.',
        upgradeMultiplier: 1.45,
        execute(context) {
            const healVal = this.value;
            context.player.heal(healVal);
            context.player.clearNegativeStatuses();
            context.addVfx('heal', context.player);
            context.log(`💖 Oração de Cura recuperou +${healVal} de Vida!`);
        }
    },

    furor: {
        id: 'furor',
        name: 'Golpe de Furor',
        type: CardType.ATAQUE,
        rarity: CardRarity.EPICA,
        cost: 0,
        baseValue: 45,
        tags: ['arma', 'pesado', 'epico'],
        icon: '💥',
        description: 'Um golpe devastador de {val} dano. Se o jogador tiver menos de 50% de HP, causa +50% dano extra.',
        comboText: 'Poder supremo de virada em momentos críticos.',
        upgradeMultiplier: 1.5,
        execute(context) {
            let dmg = this.value;
            const lowHp = context.player.hp <= (context.player.maxHp * 0.5);
            if (lowHp) {
                dmg = Math.floor(dmg * 1.5);
            }
            if (context.player.combatBuffs.sharp > 0) {
                dmg += Math.floor(this.value * 0.5);
                context.player.combatBuffs.sharp--;
            }
            context.addVfx('meteor_strike', context.target);
            context.dealDamageToTarget(context.target, dmg, lowHp ? '💥 Golpe de Furor (DESESPERO CRÍTICO!)' : '💥 Golpe de Furor');
        }
    },

    apocalipse: {
        id: 'apocalipse',
        name: 'Espada Lendária da Alvorada',
        type: CardType.ATAQUE,
        rarity: CardRarity.LENDARIA,
        cost: 0,
        baseValue: 60,
        tags: ['lendaria', 'arma', 'sagrado'],
        icon: '☀️🗡️',
        description: 'Causa {val} de dano a TODOS os inimigos, cura 15 de Vida e aplica Queimadura Sagrada.',
        comboText: 'A relíquia dos antigos heróis.',
        upgradeMultiplier: 1.4,
        execute(context) {
            context.addVfx('holy_nova', context.target);
            context.allEnemies.forEach(e => {
                if (!e.isDead()) {
                    context.dealDamageToTarget(e, this.value, '☀️ Espada da Alvorada');
                    e.addStatus('burn', 3);
                }
            });
            context.player.heal(15);
            context.log('☀️ O brilho da alvorada varreu os inimigos e restaurou 15 HP!');
        }
    }
};

// Classe para instâncias individuais de cartas
class Card {
    constructor(templateId, level = 1) {
        const template = CARD_TEMPLATES[templateId] || CARD_TEMPLATES.espada;
        this.uid = 'card_' + Math.random().toString(36).substr(2, 9);
        this.templateId = template.id;
        this.name = template.name;
        this.type = template.type;
        this.rarity = template.rarity;
        this.tags = [...template.tags];
        this.icon = template.icon;
        this.comboText = template.comboText;
        this.upgradeMultiplier = template.upgradeMultiplier || 1.4;
        this.level = level;
        this.executeMethod = template.execute;
        this.baseValue = template.baseValue;
        this.calculateStats();
    }

    calculateStats() {
        // Cálculo de valor por nível: Nível 1: baseValue, Nível 2: ~baseValue * 1.5, etc.
        let mult = Math.pow(this.upgradeMultiplier, this.level - 1);
        this.value = Math.round(this.baseValue * mult);
        const template = CARD_TEMPLATES[this.templateId];
        this.description = template.description.replace('{val}', `<b>${this.value}</b>`);
    }

    getUpgradeCost() {
        // Custo para melhorar: Nível 1->2: 40 moedas, Nível 2->3: 75 moedas, etc.
        const baseCost = this.rarity === CardRarity.COMUM ? 35 :
                         this.rarity === CardRarity.INCOMUM ? 50 :
                         this.rarity === CardRarity.RARA ? 75 :
                         this.rarity === CardRarity.EPICA ? 110 : 160;
        return Math.round(baseCost * Math.pow(1.6, this.level - 1));
    }

    upgrade() {
        this.level++;
        this.calculateStats();
        return this;
    }

    execute(context) {
        if (this.executeMethod) {
            this.executeMethod.call(this, context);
        }
    }

    // Serialização para salvamento no LocalStorage
    toJSON() {
        return {
            templateId: this.templateId,
            level: this.level
        };
    }

    static fromJSON(data) {
        return new Card(data.templateId, data.level);
    }
}

// Criação de cartas aleatórias para recompensas e lojas
function getRandomCard(pool = null, rarityWeightModifier = 1) {
    const keys = pool || Object.keys(CARD_TEMPLATES);
    const rand = Math.random();
    
    let targetRarity = CardRarity.COMUM;
    if (rand < 0.05 * rarityWeightModifier) targetRarity = CardRarity.LENDARIA;
    else if (rand < 0.15 * rarityWeightModifier) targetRarity = CardRarity.EPICA;
    else if (rand < 0.35 * rarityWeightModifier) targetRarity = CardRarity.RARA;
    else if (rand < 0.65 * rarityWeightModifier) targetRarity = CardRarity.INCOMUM;
    else targetRarity = CardRarity.COMUM;

    // Filtra cartas com a raridade alvo
    const matching = keys.filter(k => CARD_TEMPLATES[k].rarity.id === targetRarity.id);
    const chosenKey = matching.length > 0 ? matching[Math.floor(Math.random() * matching.length)] : keys[Math.floor(Math.random() * keys.length)];
    
    return new Card(chosenKey, 1);
}

// Retorna 3 cartas distintas para escolha de recompensa
function generateCardRewardDraft(classId = null) {
    const choices = [];
    const usedIds = new Set();
    const allKeys = Object.keys(CARD_TEMPLATES);
    const preferredKeys = allKeys.filter(key => {
        const template = CARD_TEMPLATES[key];
        const tags = template.tags || [];
        if (classId === 'mage') return template.type.id === 'magia' || tags.includes('magia') || tags.includes('cura') || key === 'concentrar';
        if (classId === 'knight') return template.type.id === 'ataque' || template.type.id === 'defesa' || tags.includes('arma') || tags.includes('fisico');
        return false;
    });
    const affinityPool = preferredKeys.length ? preferredKeys : allKeys;

    while (choices.length < 3) {
        const pool = Math.random() < 0.75 ? affinityPool : allKeys;
        const card = getRandomCard(pool);
        if (!usedIds.has(card.templateId)) {
            usedIds.add(card.templateId);
            choices.push(card);
        }
    }
    return choices;
}
