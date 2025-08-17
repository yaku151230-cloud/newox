// 〇× 6x6 ゲーム 基本ロジック（PC & スマホ対応）

const SIZE = 6;
let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
let turn = '〇';
let gravityUsed = { '〇': false, '×': false };
let gameOver = false;

const turnInfo = document.getElementById('turn-info');
const resultDiv = document.getElementById('result');

// ===== 重力ボタン（PC版・スマホ版統合） =====
const gravityBtns = {
  up: document.getElementById('gravity-up') || document.getElementById('gravity-up-mobile'),
  down: document.getElementById('gravity-down') || document.getElementById('gravity-down-mobile'),
  left: document.getElementById('gravity-left') || document.getElementById('gravity-left-mobile'),
  right: document.getElementById('gravity-right') || document.getElementById('gravity-right-mobile'),
};

// ===== ゲームリセット =====
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

// 勝利・ドロー表示
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
    resultDiv.style.cursor = 'pointer';
    resultDiv.onclick = () => {
        resetGame();
        resultDiv.onclick = null;
        resultDiv.style.cursor = '';
    };
}

// 盤面クリック
const cells = document.querySelectorAll('#board td');
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (gameOver) return;
        const row = parseInt(cell.getAttribute('data-row'));
        const col = parseInt(cell.getAttribute('data-col'));
        if (board[row][col] !== '') return;
        board[row][col] = turn;
        cell.textContent = turn;

        if (checkWin(turn)) { highlightWin(turn); return; }

        if (checkThree(row, col)) {
            setTimeout(() => {
                if (isDraw()) { showResult('ドロー！'); gameOver = true; return; }
                turn = turn === '〇' ? '×' : '〇';
                turnInfo.textContent = `現在のターン: ${turn}`;
            }, 500);
        } else {
            if (isDraw()) { showResult('ドロー！'); gameOver = true; return; }
            turn = turn === '〇' ? '×' : '〇';
            turnInfo.textContent = `現在のターン: ${turn}`;
        }
    });
});

// 三つ消し
function checkThree(row, col, callback) {
    const directions = [
        { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
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

// 4つ以上判定
function checkWin(player) {
    const directions = [ { dr:0, dc:1 }, { dr:1, dc:0 }, { dr:1, dc:1 }, { dr:1, dc:-1 } ];
    for (let r=0; r<SIZE; r++) {
        for (let c=0; c<SIZE; c++) {
            if (board[r][c] !== player) continue;
            for (let dir of directions) {
                let count = 1, nr = r+dir.dr, nc = c+dir.dc;
                while(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && board[nr][nc]===player){
                    count++; nr+=dir.dr; nc+=dir.dc;
                }
                if(count>=4) return true;
            }
        }
    }
    return false;
}

// ドロー判定
function isDraw() {
    return board.flat().every(cell => cell !== '');
}

// ===== 重力ボタンイベント統合 =====
Object.entries(gravityBtns).forEach(([dir, btn]) => {
    if(!btn) return;
    btn.addEventListener('click', () => {
        if(gameOver || gravityUsed[turn]) return;
        gravityUsed[turn] = true;
        applyGravity(dir, () => {
            if(gameOver) return;
            if(isDraw()){ showResult('ドロー！（重力使用）'); gameOver=true; return; }
            turn = (turn==='〇') ? '×' : '〇';
            turnInfo.textContent = `現在のターン: ${turn}`;
        });
    });
});

// ===== applyGravity 以下の重力処理は既存ロジックをそのまま =====
// 省略（あなたの現在の script.js の applyGravity / tripleCascade / gravityStep などをそのまま使用）
