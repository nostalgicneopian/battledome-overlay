/* === SETUP === */

function initializeBattleLog() {
    const roundCont = document.querySelector('#flround');
    const logCont = document.querySelector('#log');
    const logTotalsCont = document.querySelector('#log_totals');

    const roundClone = roundCont.cloneNode(true);
    const logClone = logCont.cloneNode(true);
    const logTotalsClone = logTotalsCont.cloneNode(true);

    Array.from([roundClone, logClone, logTotalsClone]).forEach(node => {
        node.classList.add('cloned');
        if (!settings.showExpandedLog)
            node.classList.add('hidden');
    });

    Array.from([roundCont, logCont, logTotalsCont]).forEach(node => {
        node.classList.add('original');
        if (settings.showExpandedLog)
            node.classList.add('hidden');
    });

    roundCont.parentNode.insertBefore(roundClone, roundCont.nextSibling);
    logCont.parentNode.insertBefore(logClone, logCont.nextSibling);
    logTotalsCont.parentNode.insertBefore(logTotalsClone, logTotalsCont.nextSibling);

    const wrapper = document.createElement('div');
    wrapper.id = 'log-buttons'
    const previousRoundButton = document.createElement('a');
    previousRoundButton.id = 'previous-round-button';
    const prevDiv = document.createElement('div');
    previousRoundButton.appendChild(prevDiv);

    const nextRoundButton = document.createElement('a');
    nextRoundButton.id = 'next-round-button';
    const nextDiv = document.createElement('div');
    nextRoundButton.appendChild(nextDiv);

    const currentRoundButton = document.createElement('a');
    currentRoundButton.id = 'current-round-button';
    const currDiv = document.createElement('div');
    currDiv.textContent = 'Go to current round';
    currentRoundButton.appendChild(currDiv);

    wrapper.appendChild(previousRoundButton);
    wrapper.appendChild(currentRoundButton);
    wrapper.appendChild(nextRoundButton);
    document.querySelector('#statusmsg').after(wrapper);

    initializeRoundButtons();
    renderBattleLog();
}

function initializeRoundButtons() {
    document.querySelector('#previous-round-button').addEventListener('click', function() {
        if (gameState.round > 0 && renderedRound > 0) {
            renderedRound -= 1;
            renderBattleLog();
            renderRound(gameState.player1);
            renderRound(gameState.player2);

            document.querySelectorAll('#menu-icon').forEach(node => { node.classList.add('hidden'); });
            document.querySelectorAll('#custom-icon').forEach(node => { node.classList.remove('hidden'); });
        }
    });

    document.querySelector('#next-round-button').addEventListener('click', function() {
        if (gameState.round > 0 && renderedRound < (gameState.logs.length - 1)) {
            renderedRound += 1;
            renderBattleLog();
            renderRound(gameState.player1);
            renderRound(gameState.player2);

            if (renderedRound === (gameState.round - 1)) {
            document.querySelectorAll('#custom-icon').forEach(node => { node.classList.add('hidden'); });
            document.querySelectorAll('#menu-icon').forEach(node => { node.classList.remove('hidden'); });
            }
        }
    });

    document.querySelector('#current-round-button').addEventListener('click', function() {
        if (gameState.round > 0 && renderedRound !== gameState.round - 1) {
            renderedRound = gameState.round - 1;
            renderBattleLog();
            renderRound(gameState.player1);
            renderRound(gameState.player2);
            document.querySelectorAll('#menu-icon').forEach(node => { node.classList.add('hidden'); });
            document.querySelectorAll('#custom-icon').forEach(node => { node.classList.remove('hidden'); });
        }
    });
}

function initializePastItemsView() {
    const itemDivs = document.getElementsByClassName('menu');

    Array.from(itemDivs).forEach(node => {
        node.querySelector('div').id = 'menu-icon';
        node.querySelector('div').classList = 'original';
        const div = document.createElement('div');
        div.id = 'custom-icon';
        div.classList.add('hidden', 'cloned');
        node.appendChild(div);
    });
}

/* === RENDERING === */

function renderBattleLog() {
    const containers = document.querySelectorAll('.cloned');
    containers.forEach(container => {
        if (gameState.round > 0) {
            if (container.id === 'flround') 
                container.textContent = renderedRound + 1;
            else if (container.id === 'log')
                container.innerHTML = gameState.logs[renderedRound];     
            else if (container.id === 'log_totals') {
                if (gameState.round > 0) {
                    console.log(container);
                    container.querySelector('#fltp1').textContent = gameState.player1.damage[renderedRound];
                    container.querySelector('#fltp2').textContent = gameState.player2.damage[renderedRound];
                }
            }
        }
    });
}

function renderRound(player) {
    const roundInfo = player.getRound(renderedRound);
    const nodeIds = Object.keys(roundInfo);
    const nodes = document.querySelectorAll(`#${nodeIds.join(', #')}`);

    nodes.forEach(node => {
        node.querySelector('#custom-icon').style.backgroundImage = roundInfo[node.id].backgroundImage || '';
        if (roundInfo[node.id].backgroundImage) 
            node.querySelector('#custom-icon').classList.add('has-icon');
        else {
            node.querySelector('#custom-icon').classList.remove('has-icon');
            node.querySelector('#custom-icon').style.backgroundSize = '';
        }
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

function addFightButtonEventListener() {
    document.querySelectorAll('#start, #fight').forEach(element => {
    element.addEventListener('click', async function() {
        if (element.id === 'start') {
            await waitForServerResponse().then(response => {
                const cachedGameState = JSON.parse(GM_getValue('gameState', null));
                const battleId = response.battle.battleid;
                if (battleId !== cachedGameState?.battleId) {
                    gameState.loadFromResponse(response);
                    GM_setValue('gameState', JSON.stringify(gameState));
                }
                else {
                    gameState.loadFromJSON(cachedGameState);
                    renderedRound = gameState.round - 1;
                }         
                initializeBattleLog();
            })
        }
        else if (element.id === 'fight') {
            await waitForServerResponse().then(response => {
                if (response.p1.fight_step === response.p2.fight_step && response.p1.fight_step > gameState.round) {
                    gameState.updateRound(response);
                    gameState.player1.addRound(document.getElementsByClassName('menu p1'));
                    gameState.player2.addRound(document.getElementsByClassName('menu p2'));
                    GM_setValue('gameState', JSON.stringify(gameState));

                    renderedRound = gameState.round - 1;
                    renderBattleLog();   
                }
            })
        }
    });
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
            reject(new Error('Timeout waiting for server response'));
        }, 10000); // might need to add more time if neo is lagging
    });
}

function loadExpandedLogModule() {
    const style = GM_getResourceText('log-css');
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    initializePastItemsView();
    addFightButtonEventListener();
}

function renderExpandedLogModule() {
    if (settings.showExpandedLog) {
        document.querySelectorAll('.original').forEach(element => {
            element.classList.add('hidden');
        });
        document.querySelectorAll('.cloned, #log-buttons').forEach(element => {
            element.classList.remove('hidden');
        });
    }
    else {
        document.querySelectorAll('.cloned, #log-buttons').forEach(element => {
            element.classList.add('hidden');
        });
        document.querySelectorAll('.original').forEach(element => {
            element.classList.remove('hidden');
        });
    }
}