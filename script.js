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
            highlightWin(turn);
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

// ===== 重力ボタン（IDは既存のまま使用） =====
Object.entries(gravityBtns).forEach(([dir, btn]) => {
  btn.addEventListener('click', () => {
    if (gameOver || gravityUsed[turn]) return;

    gravityUsed[turn] = true; // このゲーム中に各自1回だけ

    // 重力の一連処理が完了したら呼ばれる
    const done = () => {
      if (gameOver) return; // 途中で決着していれば何もしない

      if (isDraw()) {
        showResult('ドロー！（重力使用）');
        gameOver = true;
        return;
      }
      // 勝敗が出ていなければターン交代
      turn = (turn === '〇') ? '×' : '〇';
      turnInfo.textContent = `現在のターン: ${turn}`;
    };

    applyGravity(dir, done);
  });
});

// ===== 重力処理（勝利→三つ消しカスケード） =====
function applyGravity(direction, onComplete) {
  if (gameOver) return;

  gravityStep(direction);

tripleCascade(() => {
  // 三つ消しが全て終わった後に判定
  if (isDraw()) {
    showResult('ドロー！（重力使用）');
    gameOver = true;
    return;
  }
  if (checkWinCells('〇')) { highlightWin('〇'); return; }
  if (checkWinCells('×')) { highlightWin('×'); return; }

  if (!gameOver && typeof onComplete === 'function') onComplete();
});


  // ====== ユーティリティ群 ======

  function checkWinCells(player) {
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
          let cells = [{ r, c }];
          let nr = r + dir.dr;
          let nc = c + dir.dc;
          while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
            cells.push({ r: nr, c: nc });
            nr += dir.dr;
            nc += dir.dc;
          }
          if (cells.length >= 4) return cells;
        }
      }
    }
    return null;
  }

  function showWin(player) {
    const cells = checkWinCells(player);
    if (cells) {
      cells.forEach(({ r, c }) => {
        const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        td.style.background = '#00f'; // 青
        td.style.color = '#fff';
      });
    }
    setTimeout(() => {
      showResult(`${player}の勝利！（重力使用）`);
      gameOver = true;
    }, 500);
  }

  function checkWinAfterDelayEnd() {
    if (gameOver) return true;
    if (getWinCells('〇')) { highlightWin('〇'); return true; }
    if (getWinCells('×')) { highlightWin('×'); return true; }
    return false;
  }

  function gravityStep(direction) {
    if (direction === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const stack = [];
        for (let r = SIZE - 1; r >= 0; r--) if (board[r][c] !== '') stack.push(board[r][c]);
        for (let r = SIZE - 1; r >= 0; r--) {
          const val = stack[SIZE - 1 - r] || '';
          board[r][c] = val;
          const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
          td.textContent = val;
          td.style.color = '#000';
        }
      }
    } else if (direction === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const stack = [];
        for (let r = 0; r < SIZE; r++) if (board[r][c] !== '') stack.push(board[r][c]);
        for (let r = 0; r < SIZE; r++) {
          const val = stack[r] || '';
          board[r][c] = val;
          const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
          td.textContent = val;
          td.style.color = '#000';
        }
      }
    } else if (direction === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const stack = [];
        for (let c = 0; c < SIZE; c++) if (board[r][c] !== '') stack.push(board[r][c]);
        for (let c = 0; c < SIZE; c++) {
          const val = stack[c] || '';
          board[r][c] = val;
          const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
          td.textContent = val;
          td.style.color = '#000';
        }
      }
    } else if (direction === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const stack = [];
        for (let c = SIZE - 1; c >= 0; c--) if (board[r][c] !== '') stack.push(board[r][c]);
        for (let c = SIZE - 1; c >= 0; c--) {
          const val = stack[SIZE - 1 - c] || '';
          board[r][c] = val;
          const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
          td.textContent = val;
          td.style.color = '#000';
        }
      }
    }
  }

  function collectAllTriples() {
    const dirs = [
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
      { dr: 1, dc: -1 }
    ];
    const set = new Set();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const p = board[r][c];
        if (!p) continue;
        for (const { dr, dc } of dirs) {
          const r1 = r + dr, c1 = c + dc;
          const r2 = r + 2*dr, c2 = c + 2*dc;
          if (r2 < 0 || r2 >= SIZE || c2 < 0 || c2 >= SIZE) continue;
          if (board[r1][c1] === p && board[r2][c2] === p) {
            set.add(`${r},${c}`);
            set.add(`${r1},${c1}`);
            set.add(`${r2},${c2}`);
          }
        }
      }
    }
    return Array.from(set).map(s => {
      const [rr, cc] = s.split(',').map(Number);
      return { r: rr, c: cc };
    });
  }

  function eraseTriplesOnce(callback) {
    const targets = collectAllTriples();
    if (targets.length === 0) { callback(false); return; }

    targets.forEach(({ r, c }) => {
      const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
      td.style.background = '#ffcccc';
    });

    setTimeout(() => {
      targets.forEach(({ r, c }) => {
        board[r][c] = '';
        const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
        td.textContent = '';
        td.style.background = '';
      });
      callback(true);
    }, 500);
  }

  function tripleCascade(finalCallback) {
    if (gameOver) return;

    eraseTriplesOnce((erased) => {
      if (!erased) { finalCallback(); return; }
      gravityStep(direction);
      setTimeout(() => {
        if (checkWinAfterDelayEnd()) return;
        tripleCascade(finalCallback);
      }, 500);
    });
  }
}

// 4つ以上揃った勝利セルを取得
function getWinCells(player) {
    const directions = [
        { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 }
    ];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== player) continue;
            for (let dir of directions) {
                let cells = [{ r, c }];
                let nr = r + dir.dr;
                let nc = c + dir.dc;
                while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
                    cells.push({ r: nr, c: nc });
                    nr += dir.dr;
                    nc += dir.dc;
                }
                if (cells.length >= 4) return cells;
            }
        }
    }
    return null;
}

// 勝利セルをハイライトして結果表示
function highlightWin(player) {
    const cells = getWinCells(player);
    if (cells) {
        cells.forEach(({ r, c }) => {
            const td = document.querySelector(`[data-row='${r}'][data-col='${c}']`);
            td.style.background = '#add8e6'; // 薄青
            td.style.color = '#000';
        });
        setTimeout(() => {
            showResult(`${player}の勝利！`);
            gameOver = true;
        }, 500);
    }
}

