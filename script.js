// 〇× 6x6 ゲーム 基本ロジック

const SIZE = 6;
let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
let turn = '〇';
let gravityUsed = { '〇': false, '×': false };
let gameOver = false;

const turnInfo = document.getElementById('turn-info');
const resultDiv = document.getElementById('result');
const gravityBtns = {
    up: document.getElementById('gravity-up'),
    down: document.getElementById('gravity-down'),
    left: document.getElementById('gravity-left'),
    right: document.getElementById('gravity-right'),
};

function resetGame() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
    turn = '〇';
    gravityUsed = { '〇': false, '×': false };
    gameOver = false;
    turnInfo.textContent = `現在のターン: 〇`;
    resultDiv.textContent = '';
    resultDiv.style = '';
    const cells = document.querySelectorAll('#board td');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.style.background = '';
    });
}

// 勝利・ドロー時のメッセージ表示
function showResult(message) {
    resultDiv.textContent = '';
    resultDiv.style.position = 'absolute';
    resultDiv.style.top = '50%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translate(-50%, -50%)';
    resultDiv.style.background = 'rgba(255,255,255,0.9)';
    resultDiv.style.border = '3px solid #333';
    resultDiv.style.borderRadius = '20px';
    resultDiv.style.padding = '40px 60px';
    resultDiv.style.fontSize = '48px';
    resultDiv.style.fontWeight = 'bold';
    resultDiv.style.textAlign = 'center';
    resultDiv.style.zIndex = '100';
    resultDiv.textContent = message;
    // 終了時はクリックでリセット
    resultDiv.style.cursor = 'pointer';
    resultDiv.onclick = () => {
        resetGame();
        resultDiv.onclick = null;
        resultDiv.style.cursor = '';
    };
}

// 盤面クリックイベント
const cells = document.querySelectorAll('#board td');
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (gameOver) return;
        const row = parseInt(cell.getAttribute('data-row'));
        const col = parseInt(cell.getAttribute('data-col'));
        if (board[row][col] !== '') return;
        board[row][col] = turn;
        cell.textContent = turn;
        if (checkWin(turn)) {
            setTimeout(() => {
                showResult(`${turn}の勝利！`);
                gameOver = true;
            }, 500);
            return;
        }
        if (checkThree(row, col)) {
            setTimeout(() => {
                if (isDraw()) {
                    showResult('ドロー！');
                    gameOver = true;
                    return;
                }
                turn = turn === '〇' ? '×' : '〇';
                turnInfo.textContent = `現在のターン: ${turn}`;
            }, 500);
        } else {
            if (isDraw()) {
                showResult('ドロー！');
                gameOver = true;
                return;
            }
            turn = turn === '〇' ? '×' : '〇';
            turnInfo.textContent = `現在のターン: ${turn}`;
        }
    });
});

// 3つ並びの消去（0.5秒後に消す）
function checkThree(row, col, callback) {
    const directions = [
        { dr: 0, dc: 1 }, // 横
        { dr: 1, dc: 0 }, // 縦
        { dr: 1, dc: 1 }, // 斜め右下
        { dr: 1, dc: -1 } // 斜め左下
    ];
    let toErase = [];
    const player = board[row][col];
    if (!player) return false;
    directions.forEach(dir => {
        for (let i = -2; i <= 0; i++) {
            let cells = [];
            for (let j = 0; j < 3; j++) {
                let r = row + dir.dr * (i + j);
                let c = col + dir.dc * (i + j);
                if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
                    cells.push({ r, c });
                }
            }
            if (cells.length === 3 && cells.every(cell => board[cell.r][cell.c] === player)) {
                toErase.push(...cells);
            }
        }
    });
    if (toErase.length > 0) {
        toErase.forEach(cell => {
            document.querySelector(`[data-row='${cell.r}'][data-col='${cell.c}']`).style.background = '#ffcccc';
        });
        setTimeout(() => {
            toErase.forEach(cell => {
                board[cell.r][cell.c] = '';
                const td = document.querySelector(`[data-row='${cell.r}'][data-col='${cell.c}']`);
                td.textContent = '';
                td.style.background = '';
            });
            if (callback) callback();
        }, 500);
        return true;
    }
    return false;
}

// 4つ以上並びの判定
function checkWin(player) {
    // 縦・横・斜め・逆斜めの4つ以上
    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 }
    ];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== player) continue;
            for (let dir of directions) {
                let count = 1;
                let nr = r + dir.dr;
                let nc = c + dir.dc;
                while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
                    count++;
                    nr += dir.dr;
                    nc += dir.dc;
                }
                if (count >= 4) return true;
            }
        }
    }
    return false;
}

// ドロー判定
function isDraw() {
    return board.flat().every(cell => cell !== '');
}

// 重力ボタン
Object.entries(gravityBtns).forEach(([dir, btn]) => {
    btn.addEventListener('click', () => {
        if (gameOver || gravityUsed[turn]) return;
        applyGravity(dir);
        gravityUsed[turn] = true;
        if (checkWin(turn)) {
            showResult(`${turn}の勝利！（重力使用）`);
            gameOver = true;
            return;
        }
        if (isDraw()) {
            showResult('ドロー！（重力使用）');
            gameOver = true;
            return;
        }
        turn = turn === '〇' ? '×' : '〇';
        turnInfo.textContent = `現在のターン: ${turn}`;
    });
});

// 重力処理
function applyGravity(direction) {
    function gravityStep() {
        let changed = false;
        if (direction === 'down') {
            for (let c = 0; c < SIZE; c++) {
                let stack = [];
                for (let r = SIZE - 1; r >= 0; r--) {
                    if (board[r][c] !== '') stack.push(board[r][c]);
                }
                for (let r = SIZE - 1; r >= 0; r--) {
                    let val = stack[SIZE - 1 - r] || '';
                    if (board[r][c] !== val) changed = true;
                    board[r][c] = val;
                    document.querySelector(`[data-row='${r}'][data-col='${c}']`).textContent = val;
                }
            }
        } else if (direction === 'up') {
            for (let c = 0; c < SIZE; c++) {
                let stack = [];
                for (let r = 0; r < SIZE; r++) {
                    if (board[r][c] !== '') stack.push(board[r][c]);
                }
                for (let r = 0; r < SIZE; r++) {
                    let val = stack[r] || '';
                    if (board[r][c] !== val) changed = true;
                    board[r][c] = val;
                    document.querySelector(`[data-row='${r}'][data-col='${c}']`).textContent = val;
                }
            }
        } else if (direction === 'left') {
            for (let r = 0; r < SIZE; r++) {
                let stack = [];
                for (let c = 0; c < SIZE; c++) {
                    if (board[r][c] !== '') stack.push(board[r][c]);
                }
                for (let c = 0; c < SIZE; c++) {
                    let val = stack[c] || '';
                    if (board[r][c] !== val) changed = true;
                    board[r][c] = val;
                    document.querySelector(`[data-row='${r}'][data-col='${c}']`).textContent = val;
                }
            }
        } else if (direction === 'right') {
            for (let r = 0; r < SIZE; r++) {
                let stack = [];
                for (let c = SIZE - 1; c >= 0; c--) {
                    if (board[r][c] !== '') stack.push(board[r][c]);
                }
                for (let c = SIZE - 1; c >= 0; c--) {
                    let val = stack[SIZE - 1 - c] || '';
                    if (board[r][c] !== val) changed = true;
                    board[r][c] = val;
                    document.querySelector(`[data-row='${r}'][data-col='${c}']`).textContent = val;
                }
            }
        }
        return changed;
    }
    function gravityLoop() {
        setTimeout(() => {
            let erased = false;
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (board[r][c] !== '') {
                        erased = checkThree(r, c) || erased;
                    }
                }
            }
            if (erased) {
                setTimeout(() => {
                    gravityStep();
                    setTimeout(() => {
                        // 三つ消し後に埋めた直後、勝利判定を最優先で出す
                        if (checkWin('〇')) {
                            showResult('〇の勝利！（重力使用）');
                            gameOver = true;
                            return;
                        }
                        if (checkWin('×')) {
                            showResult('×の勝利！（重力使用）');
                            gameOver = true;
                            return;
                        }
                        gravityLoop();
                    }, 500);
                }, 500);
            } else {
                let changed = gravityStep();
                if (changed) {
                    setTimeout(() => {
                        // 埋めた直後にも勝利判定
                        if (checkWin('〇')) {
                            showResult('〇の勝利！（重力使用）');
                            gameOver = true;
                            return;
                        }
                        if (checkWin('×')) {
                            showResult('×の勝利！（重力使用）');
                            gameOver = true;
                            return;
                        }
                        gravityLoop();
                    }, 500);
                } else {
                    setTimeout(() => {
                        if (isDraw()) {
                            showResult('ドロー！（重力使用）');
                            gameOver = true;
                            return;
                        }
                    }, 500);
                }
            }
        }, 500);
    }
    gravityStep();
    gravityLoop();
}
