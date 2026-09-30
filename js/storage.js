// Sistema de Salvamento e Carregamento com LocalStorage
// HDD — RPG 2D de Cartas e Exploração Medieval

const SAVE_STORAGE_KEY = 'HDD_CARD_RPG_SAVE_V1';

class SaveManager {
    static hasSaveData() {
        return !!localStorage.getItem(SAVE_STORAGE_KEY);
    }

    static saveGame(game) {
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                player: game.player.toJSON(),
                world: game.world.toJSON()
            };
            localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Falha ao salvar o jogo:', e);
            return false;
        }
    }

    static loadGame(game) {
        try {
            const raw = localStorage.getItem(SAVE_STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (data.player) {
                game.player.fromJSON(data.player);
            }
            if (data.world) {
                game.world.fromJSON(data.world);
            }
            return true;
        } catch (e) {
            console.error('Falha ao carregar o jogo:', e);
            return false;
        }
    }

    static clearSaveData() {
        localStorage.removeItem(SAVE_STORAGE_KEY);
    }
}
