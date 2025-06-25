/* === RENDERING === */

function initializeBattleLog() {
    const roundCont = document.querySelector("#flround");
    const logCont = document.querySelector("#log");
    const logTotalsCont = document.querySelector("#log_totals");

    const roundClone = roundCont.cloneNode(true);
    const logClone = logCont.cloneNode(true);
    const logTotalsClone = logTotalsCont.cloneNode(true);

    roundCont.id = "hide";
    logCont.id = "hide";
    logTotalsCont.id = "hide";

    roundCont.parentNode.insertBefore(roundClone, roundCont.nextSibling);
    logCont.parentNode.insertBefore(logClone, logCont.nextSibling);
    logTotalsCont.parentNode.insertBefore(logTotalsClone, logTotalsCont.nextSibling);

    document.querySelectorAll("#hide").forEach(element => {
        element.style.display = "none";
    });

    const beforeLogButton = document.createElement("button");
    beforeLogButton.textContent = "Previous Round";
    beforeLogButton.id = "beforeLogButton";

    const afterLogButton = document.createElement("button");
    afterLogButton.textContent = "Next Round";
    afterLogButton.id = "afterLogButton";

    logCont.parentNode.insertBefore(beforeLogButton, logCont);
    logCont.parentNode.insertBefore(afterLogButton, logCont.nextSibling);

    initializeRoundButtons();
    renderBattleLog();
}

function renderBattleLog() {
    const roundCont = document.querySelector("#flround");
    const logCont = document.querySelector("#log");
    const logTotalsCont = document.querySelector("#log_totals");

    roundCont.textContent = renderedRound + 1;
    if (gameState.round > 0) {
        logCont.innerHTML = gameState.logs[renderedRound];
        logTotalsCont.querySelector("#fltp1").textContent = gameState.player1.damage[renderedRound];
        logTotalsCont.querySelector("#fltp2").textContent = gameState.player2.damage[renderedRound];
    }

}

function renderItemsAndAbility(nodes, player) {
    items = player.items[renderedRound] || [];
    ability = player.abilities[renderedRound] || null;

    Array.from(nodes).forEach(node => {
        if (node.id.includes("e1")) {
            node.querySelector("div").style.backgroundImage = items[0];
        }
        else if (node.id.includes("e2")) {
            node.querySelector("div").style.backgroundImage = items[1];
        }
        else if (node.id.includes("a")) {
            node.querySelector("div").style.backgroundImage = ability; 
        }

        if (renderedRound !== gameState.round - 1) 
            node.querySelector("div").style.opacity = "0.5";
        else
            node.querySelector("div").style.opacity = "1";
    });
}

/* === EVENT HANDLING === */

(function() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(...args) {
        this.addEventListener('load', function() {
            responses.push(JSON.parse(this.responseText));
        });
        originalOpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
        originalSend.apply(this, args);
    };
})();

document.querySelectorAll("#start, #fight").forEach(element => {
    element.addEventListener("click", async function() {
        if (element.id === "start") {
            await waitForServerResponse().then(response => {
                const cachedGameState = JSON.parse(GM_getValue("gameState", null));
                const battleId = response.battle.battleid;
                if (battleId !== cachedGameState?.battleId) {
                    gameState.loadFromResponse(response);
                    GM_setValue("gameState", JSON.stringify(gameState));
                }
                else {
                    gameState.loadFromJSON(cachedGameState);
                    renderedRound = gameState.round - 1;
                }
                initializeBattleLog();
                renderItemsAndAbility(document.getElementsByClassName("menu p1"), gameState.player1);
                renderItemsAndAbility(document.getElementsByClassName("menu p2"), gameState.player2);
            })
        }
        else if (element.id === "fight") {
            await waitForServerResponse().then(response => {
                if (response.p1.fight_step === response.p2.fight_step && response.p1.fight_step > gameState.round) {
                    gameState.updateRound(response);
                    gameState.player1.updateItemsaAndAbility(document.getElementsByClassName("menu p1"));
                    gameState.player2.updateItemsaAndAbility(document.getElementsByClassName("menu p2"));

                    renderedRound = gameState.round - 1;
                    renderBattleLog();
                    
                    GM_setValue("gameState", JSON.stringify(gameState));
                }
            })
        }
        
    });
});

function initializeRoundButtons() {
    document.querySelector("#beforeLogButton").addEventListener("click", function() {
        if (gameState.round > 0 && renderedRound > 0) {
            renderedRound -= 1;
            renderBattleLog();
            renderItemsAndAbility(document.getElementsByClassName("menu p1"), gameState.player1);
            renderItemsAndAbility(document.getElementsByClassName("menu p2"), gameState.player2);
        }
    });

    document.querySelector("#afterLogButton").addEventListener("click", function() {
        if (gameState.round > 0 && renderedRound < gameState.round - 1) {
            renderedRound += 1;
            renderBattleLog();
            renderItemsAndAbility(document.getElementsByClassName("menu p1"), gameState.player1);
            renderItemsAndAbility(document.getElementsByClassName("menu p2"), gameState.player2);
        }
    });
}

function waitForServerResponse() {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (responses.length > 0) {
                clearInterval(interval);
                resolve(responses.pop());
            }
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            reject(new Error("Timeout waiting for server response"));
        }, 10000); // might need to add more time if neo is lagging
    });
}