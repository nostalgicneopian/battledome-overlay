/* === ENTITIES === */

class Player {
    constructor() {
        this.hp = null;
        this.rounds = [];
        this.damage = [];
    }

    getRound(round) {
        return this.rounds[round] || null;
    }

    addRound(nodes) {
        let round = {};

        Array.from(nodes).forEach(node => {
            round[node.id] = {
                backgroundImage: node.querySelector('div').style.backgroundImage
            };
        });
        this.rounds.push(round);
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
        this.player1.rounds = json.player1.rounds || [];
        this.player1.damage = json.player1.damage || [];
        this.player2.hp = json.player2.hp;
        this.player2.rounds = json.player2.rounds || [];
        this.player2.damage = json.player2.damage || [];
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

loadExpandedLogModule();