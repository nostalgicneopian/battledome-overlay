/* === ENTITIES === */

class Player {
    constructor() {
        this.hp = null;
        this.items = [];
        this.abilities = [];
        this.damage = [];
    }

    getItems(round) {
        return this.items[round] || [];
    }
    getAbility(round) {
        return this.abilities[round] || null;
    }

    updateItemsaAndAbility(nodes) {
        let items = [];
        let ability = null;

        Array.from(nodes).forEach(node => {
            const backgroundImage = node.querySelector("div").style.backgroundImage;
            if (node.id.includes("e")) {
                items.push(backgroundImage);
            } else if (node.id.includes("a")) {
                ability = backgroundImage;
            }
        });

        this.items.push(items);
        this.abilities.push(ability);
    }

}

class GameState {
    constructor() {
        this.battleId = null;
        this.player1 = new Player();
        this.player2 = new Player();
        this.round = 0;
        this.logs = [];
    }

    loadFromJSON(json) {
        this.battleId = json.battleId;
        this.player1.hp = json.player1.hp;
        this.player1.items = json.player1.items || [];
        this.player1.abilities = json.player1.abilities || [];
        this.player1.damage = json.player1.damage || [];
        this.player2.hp = json.player2.hp;
        this.player2.items = json.player2.items || [];
        this.player2.damage = json.player2.damage || [];
        this.player2.abilities = json.player2.abilities || [];
        this.round = json.round || 0;
        this.logs = json.logs || [];
    }

    loadFromResponse(response) {
        this.battleId = response.battle.battleid;
        this.player1.hp = response.p1.hp;
        this.player2.hp = response.p2.hp;
        this.round = 0;
        this.logs = [];
    }

    updateRound(response) {
        this.logs.push(response.log);
        this.player1.hp = response.p1.hp;
        this.player2.hp = response.p2.hp;
        this.player1.damage.push(response.p1.last_damage);
        this.player2.damage.push(response.p2.last_damage);
        this.round += 1;
    }
}

/* === GLOBALS === */

const responses = [];
const gameState = new GameState();
var renderedRound = gameState.round;