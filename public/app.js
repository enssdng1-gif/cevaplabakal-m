// ===== QUIZ ARENA - Client =====
const socket = io();

// ===== STATE =====
let playerName = '';
let mySocketId = '';
let currentRoom = null;
let isOwner = false;
let questions = [];
let currentQuestionIndex = 0;
let myAnswers = {};
let isSubmitting = false;

// ===== REPOST STATE =====
let selectedGameType = 'quiz';
let repostPhotos = [];
let currentPhotoIndex = 0;
let repostScore = 0;

// ===== DOM ELEMENTS =====
const screens = document.querySelectorAll('.screen');

// Welcome
const welcomeScreen = document.getElementById('welcome-screen');
const welcomeText = document.getElementById('welcome-text');
const welcomeDesc = document.getElementById('welcome-desc');

// Name
const nameScreen = document.getElementById('name-screen');
const nameInput = document.getElementById('name-input');
const nameSubmitBtn = document.getElementById('name-submit-btn');

// Menu
const menuScreen = document.getElementById('menu-screen');
const playerGreeting = document.getElementById('player-greeting');
const createRoomBtn = document.getElementById('create-room-btn');
const browseRoomsBtn = document.getElementById('browse-rooms-btn');

// Create Room
const createRoomScreen = document.getElementById('create-room-screen');
const createBackBtn = document.getElementById('create-back-btn');
const roomNameInput = document.getElementById('room-name-input');
const roomPasswordInput = document.getElementById('room-password-input');
const createRoomSubmit = document.getElementById('create-room-submit');

// Rooms
const roomsScreen = document.getElementById('rooms-screen');
const roomsBackBtn = document.getElementById('rooms-back-btn');
const roomSearchInput = document.getElementById('room-search-input');
const roomSearchBtn = document.getElementById('room-search-btn');
const roomsList = document.getElementById('rooms-list');
const passwordModal = document.getElementById('password-modal');
const modalPasswordInput = document.getElementById('modal-password-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalJoinBtn = document.getElementById('modal-join-btn');

// Lobby
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyRoomName = document.getElementById('lobby-room-name');
const lobbyRoomId = document.getElementById('lobby-room-id');
const lobbyCloseBtn = document.getElementById('lobby-close-btn');
const lobbyLeaveBtn = document.getElementById('lobby-leave-btn');
const lobbyStatusText = document.getElementById('lobby-status-text');
const lobbyPlayerCount = document.getElementById('lobby-player-count');
const lobbyPlayers = document.getElementById('lobby-players');
const lobbyStartBtn = document.getElementById('lobby-start-btn');

// Game
const gameScreen = document.getElementById('game-screen');
const currentQuestionNum = document.getElementById('current-question-num');
const totalQuestions = document.getElementById('total-questions');
const progressFill = document.getElementById('progress-fill');
const questionCard = document.getElementById('question-card');
const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const answerFeedback = document.getElementById('answer-feedback');
const skipQuestionBtn = document.getElementById('skip-question-btn');

// Finish
const finishScreen = document.getElementById('finish-screen');
const viewResultsBtn = document.getElementById('view-results-btn');

// Results
const resultsScreen = document.getElementById('results-screen');
const resultsStatus = document.getElementById('results-status');
const resultsList = document.getElementById('results-list');
const resultsBackBtn = document.getElementById('results-back-btn');
const answersModal = document.getElementById('answers-modal');
const answersModalTitle = document.getElementById('answers-modal-title');
const answersModalClose = document.getElementById('answers-modal-close');
const answersList = document.getElementById('answers-list');

// Toast
const toast = document.getElementById('toast');

// ===== REPOST DOM ELEMENTS =====
const repostWelcomeScreen = document.getElementById('repost-welcome-screen');
const startRepostBtn = document.getElementById('start-repost-btn');

const repostGameScreen = document.getElementById('repost-game-screen');
const repostCurrentNum = document.getElementById('repost-current-num');
const repostTotalNum = document.getElementById('repost-total-num');
const repostProgressFill = document.getElementById('repost-progress-fill');
const repostCurrentScore = document.getElementById('repost-current-score');
const repostPhotoBadge = document.getElementById('repost-photo-badge');
const repostPhotoBadgeFront = document.getElementById('repost-photo-badge-front');
const repostPhotoImg = document.getElementById('repost-photo-img');
const repostFlipContainer = document.getElementById('repost-flip-container');
const repostFlipInner = document.getElementById('repost-flip-inner');
const repostAnswerSection = document.getElementById('repost-answer-section');
const repostAnswerInput = document.getElementById('repost-answer-input');
const repostSubmitBtn = document.getElementById('repost-submit-btn');
const repostFeedback = document.getElementById('repost-feedback');
const repostNavButtons = document.getElementById('repost-nav-buttons');
const repostNextBtn = document.getElementById('repost-next-btn');

const repostFinishScreen = document.getElementById('repost-finish-screen');
const repostFinalScore = document.getElementById('repost-final-score');
const repostViewResultsBtn = document.getElementById('repost-view-results-btn');

const repostResultsScreen = document.getElementById('repost-results-screen');
const repostResultsStatus = document.getElementById('repost-results-status');
const repostResultsList = document.getElementById('repost-results-list');
const repostRestartBtn = document.getElementById('repost-restart-btn');
const repostBackBtn = document.getElementById('repost-back-btn');

const repostAnswersModal = document.getElementById('repost-answers-modal');
const repostAnswersModalTitle = document.getElementById('repost-answers-modal-title');
const repostAnswersModalClose = document.getElementById('repost-answers-modal-close');
const repostAnswersList = document.getElementById('repost-answers-list');

// Chat & Restart
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatInput = document.getElementById('lobby-chat-input');
const lobbyChatSendBtn = document.getElementById('lobby-chat-send-btn');

const resultsChatMessages = document.getElementById('results-chat-messages');
const resultsChatInput = document.getElementById('results-chat-input');
const resultsChatSendBtn = document.getElementById('results-chat-send-btn');

const restartGameBtn = document.getElementById('restart-game-btn');

// ===== HELPERS =====
function showScreen(id, ignoreHistory = false) {
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  
  if (!ignoreHistory) {
    history.pushState({ screen: id }, '', window.location.href);
  }
}

// Geri tuşu (mobil/tarayıcı) kontrolü
window.addEventListener('popstate', (e) => {
  if (currentRoom) {
    const leave = confirm('Oyundan çıkmak istediğinize emin misiniz? İlerlemeniz kaybolacak.');
    if (leave) {
      socket.emit('leave-room');
      currentRoom = null;
      isOwner = false;
      showScreen('menu-screen', true);
    } else {
      // Çıkışı iptal et, bulunduğumuz sayfada kal
      const activeScreen = document.querySelector('.screen.active');
      history.pushState({ screen: activeScreen ? activeScreen.id : 'menu-screen' }, '', window.location.href);
    }
  } else {
    // Odada değilse bir önceki ekrana dön
    if (e.state && e.state.screen) {
      showScreen(e.state.screen, true);
    } else {
      showScreen('welcome-screen', true);
    }
  }
});

// Sayfayı yenileme veya kapatma kontrolü
window.addEventListener('beforeunload', (e) => {
  if (currentRoom) {
    e.preventDefault();
    e.returnValue = '';
  }
});

let toastTimeout;
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = 'toast';
  if (type === 'error') toast.classList.add('error');
  if (type === 'success') toast.classList.add('success');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

const avatarColors = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#22c55e'
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ===== WELCOME FLOW =====
setTimeout(() => {
  showScreen('name-screen');
}, 3500);

// ===== SOCKET ID =====
socket.on('connect', () => {
  mySocketId = socket.id;
});

// ===== NAME INPUT =====
nameInput.addEventListener('input', () => {
  nameSubmitBtn.disabled = nameInput.value.trim().length < 2;
});

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && nameInput.value.trim().length >= 2) {
    submitName();
  }
});

nameSubmitBtn.addEventListener('click', submitName);

function submitName() {
  playerName = nameInput.value.trim();
  socket.emit('set-name', playerName);
  playerGreeting.textContent = `Hoş geldin, ${playerName}! 👋`;
  showScreen('menu-screen');
}

// ===== MENU =====
createRoomBtn.addEventListener('click', () => showScreen('create-room-screen'));
browseRoomsBtn.addEventListener('click', () => {
  showScreen('rooms-screen');
  socket.emit('get-rooms');
});

// ===== CREATE ROOM =====
createBackBtn.addEventListener('click', () => showScreen('menu-screen'));

const gameTypeOptions = document.querySelectorAll('.game-type-option');
gameTypeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    gameTypeOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedGameType = opt.dataset.type;
  });
});

createRoomSubmit.addEventListener('click', () => {
  const roomName = roomNameInput.value.trim();
  if (!roomName) {
    showToast('Oda adı giriniz!', 'error');
    roomNameInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => roomNameInput.style.animation = '', 400);
    return;
  }

  socket.emit('create-room', {
    roomName: roomName,
    password: roomPasswordInput.value.trim() || null,
    gameType: selectedGameType
  });
});

// ===== ROOMS BROWSE =====
roomsBackBtn.addEventListener('click', () => showScreen('menu-screen'));

roomSearchBtn.addEventListener('click', () => {
  const query = roomSearchInput.value.trim();
  if (query) {
    socket.emit('search-rooms', { query });
  } else {
    socket.emit('get-rooms');
  }
});

roomSearchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') roomSearchBtn.click();
});

let pendingJoinRoomId = null;

function renderRooms(roomsData) {
  if (roomsData.length === 0) {
    roomsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>Henüz oda bulunmuyor</p>
      </div>
    `;
    return;
  }

  roomsList.innerHTML = roomsData.map(room => `
    <div class="room-item" data-room-id="${room.id}">
      <div class="room-info">
        <div class="room-name">
          ${room.hasPassword ? '<span class="lock-icon">🔒</span>' : ''}
          ${escapeHtml(room.name)}
        </div>
        <div class="room-meta">
          <span>👤 ${room.ownerName}</span>
          <span>👥 ${room.playerCount}/${room.maxPlayers}</span>
          <span>🎮 ${room.gameType === 'repost' ? 'Repost Bulmaca' : 'Soru-Cevap'}</span>
        </div>
      </div>
      ${room.hasPassword ? 
        `<button class="btn btn-small btn-blue" onclick="promptPassword('${room.id}')">Şifre ile Katıl</button>` :
        `<button class="btn btn-small btn-green" onclick="joinRoom('${room.id}')">Katıl</button>`
      }
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.promptPassword = function(roomId) {
  pendingJoinRoomId = roomId;
  modalPasswordInput.value = '';
  passwordModal.classList.remove('hidden');
  setTimeout(() => modalPasswordInput.focus(), 100);
};

window.joinRoom = function(roomId, password) {
  socket.emit('join-room', { roomId, password: password || null });
};

modalCancelBtn.addEventListener('click', () => {
  passwordModal.classList.add('hidden');
  pendingJoinRoomId = null;
});

modalJoinBtn.addEventListener('click', () => {
  const password = modalPasswordInput.value.trim();
  if (!password) {
    showToast('Şifre giriniz!', 'error');
    return;
  }
  if (pendingJoinRoomId) {
    joinRoom(pendingJoinRoomId, password);
    passwordModal.classList.add('hidden');
    pendingJoinRoomId = null;
  }
});

modalPasswordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') modalJoinBtn.click();
});

// ===== LOBBY =====
lobbyLeaveBtn.addEventListener('click', () => {
  socket.emit('leave-room');
  currentRoom = null;
  isOwner = false;
  showScreen('menu-screen');
});

lobbyCloseBtn.addEventListener('click', () => {
  if (confirm('Odayı kapatmak istediğinize emin misiniz?')) {
    socket.emit('close-room');
    currentRoom = null;
    isOwner = false;
    showScreen('menu-screen');
  }
});

lobbyStartBtn.addEventListener('click', () => {
  socket.emit('start-game');
});

function renderLobby(room) {
  currentRoom = room;
  isOwner = room.owner.id === mySocketId;

  lobbyRoomName.textContent = room.name;
  lobbyRoomId.textContent = `Oda: ${room.id}`;
  lobbyPlayerCount.textContent = room.players.length;

  if (isOwner) {
    lobbyCloseBtn.classList.remove('hidden');
    lobbyStartBtn.classList.remove('hidden');
    lobbyStatusText.textContent = 'Hazır olduğunuzda oyunu başlatın!';
  } else {
    lobbyCloseBtn.classList.add('hidden');
    lobbyStartBtn.classList.add('hidden');
    lobbyStatusText.textContent = 'Oda sahibi oyunu başlatmasını bekliyor...';
  }

  renderPlayers(room.players);
}

function renderPlayers(players) {
  lobbyPlayers.innerHTML = players.map(p => {
    const color = getAvatarColor(p.name);
    const initials = getInitials(p.name);
    const isMe = p.id === mySocketId;
    const isPlayerOwner = currentRoom && currentRoom.owner.id === p.id;

    return `
      <div class="player-item">
        <div class="player-name">
          <div class="player-avatar" style="background: ${color}">${initials}</div>
          <span>${escapeHtml(p.name)}${isMe ? ' (Sen)' : ''}</span>
          ${isPlayerOwner ? '<span class="owner-badge">👑 Sahip</span>' : ''}
        </div>
        ${isOwner && !isPlayerOwner ? 
          `<button class="kick-btn" onclick="kickPlayer('${p.id}')">At</button>` : 
          ''
        }
      </div>
    `;
  }).join('');
}

window.kickPlayer = function(playerId) {
  if (confirm('Bu oyuncuyu atmak istediğinize emin misiniz?')) {
    socket.emit('kick-player', { playerId });
  }
};

// ===== GAME =====
function startGame(questionsData) {
  questions = questionsData;
  currentQuestionIndex = 0;
  myAnswers = {};
  totalQuestions.textContent = questions.length;
  showQuestion();
  showScreen('game-screen');
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[currentQuestionIndex];
  currentQuestionNum.textContent = currentQuestionIndex + 1;
  progressFill.style.width = `${((currentQuestionIndex) / questions.length) * 100}%`;
  
  // Animate question
  questionCard.style.animation = 'none';
  void questionCard.offsetWidth;
  questionCard.style.animation = 'slideDown 0.4s ease';
  
  questionText.textContent = q.question;
  answerInput.value = myAnswers[currentQuestionIndex] || '';
  answerFeedback.classList.add('hidden');
  answerInput.focus();

  // Button text
  if (currentQuestionIndex === questions.length - 1) {
    skipQuestionBtn.textContent = 'Testi Bitir ✓';
    skipQuestionBtn.classList.remove('btn-primary');
    skipQuestionBtn.classList.add('btn-green');
  } else {
    skipQuestionBtn.textContent = 'Sonraki →';
    skipQuestionBtn.classList.add('btn-primary');
    skipQuestionBtn.classList.remove('btn-green');
  }
}

skipQuestionBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') submitAnswer();
});

async function submitAnswer() {
  const answer = answerInput.value.trim();
  if (!answer) {
    showToast('Bir cevap giriniz!', 'error');
    answerInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => answerInput.style.animation = '', 400);
    return;
  }

  if (isSubmitting) return;
  isSubmitting = true;
  skipQuestionBtn.disabled = true;
  skipQuestionBtn.innerHTML = 'Kontrol ediliyor...';

  socket.emit('submit-answer', {
    questionIndex: currentQuestionIndex,
    answer: answer
  });
}

function finishQuiz() {
  progressFill.style.width = '100%';
  socket.emit('finish-quiz');
  showScreen('finish-screen');
}

// ===== REPOST GAME LOGIC =====
startRepostBtn.addEventListener('click', () => {
  showRepostPhoto();
  showScreen('repost-game-screen');
});

function showRepostPhoto() {
  if (currentPhotoIndex >= repostPhotos.length) {
    socket.emit('finish-repost');
    return;
  }

  const p = repostPhotos[currentPhotoIndex];
  repostCurrentNum.textContent = currentPhotoIndex + 1;
  repostProgressFill.style.width = `${((currentPhotoIndex) / repostPhotos.length) * 100}%`;
  repostPhotoBadge.textContent = `#${currentPhotoIndex + 1}`;
  repostPhotoBadgeFront.textContent = `#${currentPhotoIndex + 1}`;
  repostPhotoImg.src = `/photos/${p.file}`;
  
  repostFlipInner.classList.remove('flipped');
  repostAnswerSection.classList.add('hidden');
  
  repostAnswerInput.value = '';
  repostAnswerInput.disabled = false;
  repostSubmitBtn.disabled = false;
  repostFeedback.classList.add('hidden');
  repostNavButtons.classList.add('hidden');
}

repostFlipContainer.addEventListener('click', () => {
  if (!repostFlipInner.classList.contains('flipped')) {
    repostFlipInner.classList.add('flipped');
    setTimeout(() => {
      repostAnswerSection.classList.remove('hidden');
      repostAnswerInput.focus();
    }, 300);
  }
});

repostSubmitBtn.addEventListener('click', submitRepostAnswer);
repostAnswerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') submitRepostAnswer();
});

function submitRepostAnswer() {
  const answer = repostAnswerInput.value.trim();
  if (!answer) {
    showToast('Bir isim giriniz!', 'error');
    repostAnswerInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => repostAnswerInput.style.animation = '', 400);
    return;
  }

  if (isSubmitting) return;
  isSubmitting = true;
  repostSubmitBtn.disabled = true;
  repostAnswerInput.disabled = true;
  repostSubmitBtn.innerHTML = 'Kontrol ediliyor...';

  socket.emit('submit-repost-answer', {
    photoIndex: currentPhotoIndex,
    answer: answer
  });
}

socket.on('repost-answer-result', (data) => {
  isSubmitting = false;
  repostSubmitBtn.innerHTML = 'Cevapla';
  
  repostScore = data.currentScore;
  repostCurrentScore.textContent = repostScore;
  
  repostFeedback.classList.remove('hidden', 'correct', 'wrong');
  if (data.isCorrect) {
    repostFeedback.classList.add('correct');
    repostFeedback.textContent = '🎉 Doğru Bildin!';
  } else {
    repostFeedback.classList.add('wrong');
    repostFeedback.textContent = `❌ Yanlış! Doğrusu: ${data.correctAnswer}`;
  }
  
  repostNavButtons.classList.remove('hidden');
  if (currentPhotoIndex === repostPhotos.length - 1) {
    repostNextBtn.textContent = 'Testi Bitir ✓';
    repostNextBtn.classList.remove('btn-blue');
    repostNextBtn.classList.add('btn-green');
  } else {
    repostNextBtn.textContent = 'Sıradaki Fotoğraf →';
    repostNextBtn.classList.add('btn-blue');
    repostNextBtn.classList.remove('btn-green');
  }
});

repostNextBtn.addEventListener('click', () => {
  currentPhotoIndex++;
  showRepostPhoto();
});

socket.on('repost-completed', (data) => {
  repostFinalScore.textContent = data.score;
  showScreen('repost-finish-screen');
});

socket.on('repost-player-finished', (data) => {
  showToast(`${data.playerName} oyunu tamamladı! (${data.finishedCount}/${data.totalPlayers})`, 'success');
  if (document.getElementById('repost-results-screen').classList.contains('active')) {
    socket.emit('get-repost-results');
  }
});

repostViewResultsBtn.addEventListener('click', () => {
  socket.emit('get-repost-results');
  showScreen('repost-results-screen');
});

socket.on('repost-results-data', (data) => {
  renderRepostResults(data);
});

function renderRepostResults(data) {
  const { results, photos, totalPhotos, finishedCount, totalPlayers } = data;

  if (finishedCount === 0) {
    repostResultsStatus.innerHTML = '⏳ Henüz kimse testi bitirmedi. Bekleniyor...';
    repostResultsStatus.classList.add('waiting-results');
  } else {
    repostResultsStatus.innerHTML = `✅ ${finishedCount} / ${totalPlayers} oyuncu testi tamamladı`;
    repostResultsStatus.classList.remove('waiting-results');
  }

  if (isOwner && finishedCount === totalPlayers && totalPlayers > 0) {
    repostRestartBtn.classList.remove('hidden');
  } else {
    repostRestartBtn.classList.add('hidden');
  }

  if (results.length === 0) {
    repostResultsList.innerHTML = `<div class="empty-state"><span class="empty-icon">⏳</span><p>Bekleniyor...</p></div>`;
    return;
  }

  repostResultsList.innerHTML = results.map((r, index) => {
    if (r.isFinished) {
      const rankClass = index === 0 ? 'repost-rank-1' : index === 1 ? 'repost-rank-2' : index === 2 ? 'repost-rank-3' : 'repost-rank-default';
      const crown = index === 0 ? '<div class="repost-result-crown">👑</div>' : '';
      return `
        <div class="repost-result-item ${index === 0 ? 'first-place' : ''}">
          ${crown}
          <div class="repost-result-rank ${rankClass}">${index + 1}</div>
          <div class="repost-result-info">
            <div class="repost-result-name">${escapeHtml(r.name)}</div>
            <div class="repost-result-score-text">${r.score} Puan</div>
          </div>
          <button class="repost-view-btn" onclick="viewRepostAnswers('${r.id}')">Cevapları Gör</button>
        </div>
      `;
    } else {
      return `
        <div class="repost-result-item" style="opacity: 0.6;">
          <div class="repost-result-rank repost-rank-default">-</div>
          <div class="repost-result-info">
            <div class="repost-result-name">${escapeHtml(r.name)}</div>
            <div class="repost-result-score-text">Hala test yapılıyor...</div>
          </div>
        </div>
      `;
    }
  }).join('');

  window._repostResultsData = data;
}

window.viewRepostAnswers = function(playerId) {
  const data = window._repostResultsData;
  if (!data) return;

  const player = data.results.find(r => r.id === playerId);
  if (!player) return;

  repostAnswersModalTitle.textContent = `${player.name} - Cevaplar`;

  repostAnswersList.innerHTML = data.photos.map((p, idx) => {
    const ans = player.answers[idx];
    const given = ans ? ans.given : '—';
    const isCorrect = ans ? ans.correct : false;

    return `
      <div class="repost-answer-modal-item">
        <div class="answer-num">${idx + 1}</div>
        <img src="/photos/${p.file}" class="repost-answer-thumb" alt="Photo">
        <div class="repost-answer-detail">
          <div class="repost-answer-correct-label">Doğru Cevap:</div>
          <div class="repost-answer-correct-name">${escapeHtml(p.answer)}</div>
          <div class="repost-answer-given-label">Verilen Cevap:</div>
          <div class="repost-answer-given-name ${isCorrect ? 'is-correct' : 'is-wrong'}">
            ${escapeHtml(given)}
          </div>
        </div>
        <div class="repost-answer-badge ${isCorrect ? 'correct-badge' : 'wrong-badge'}">
          ${isCorrect ? 'Doğru' : 'Yanlış'}
        </div>
      </div>
    `;
  }).join('');

  repostAnswersModal.classList.remove('hidden');
};

repostAnswersModalClose.addEventListener('click', () => {
  repostAnswersModal.classList.add('hidden');
});

repostBackBtn.addEventListener('click', () => {
  socket.emit('leave-room');
  currentRoom = null;
  isOwner = false;
  showScreen('menu-screen');
});

repostRestartBtn.addEventListener('click', () => {
  socket.emit('restart-game');
});

// ===== FINISH =====
viewResultsBtn.addEventListener('click', () => {
  socket.emit('get-results');
  showScreen('results-screen');
});

// ===== RESULTS =====
function renderResults(data) {
  const { results, correctAnswers, questions: qs, totalPlayers, finishedCount } = data;

  // Status
  if (finishedCount === 0) {
    resultsStatus.innerHTML = '⏳ Henüz kimse testi bitirmedi. Bekleniyor...';
    resultsStatus.classList.add('waiting-results');
  } else {
    resultsStatus.innerHTML = `✅ ${finishedCount} / ${totalPlayers} oyuncu testi tamamladı`;
    resultsStatus.classList.remove('waiting-results');
  }

  // Show restart button if owner and everyone finished
  if (isOwner && finishedCount === totalPlayers && totalPlayers > 0) {
    restartGameBtn.classList.remove('hidden');
  } else {
    restartGameBtn.classList.add('hidden');
  }

  if (results.length === 0) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⏳</span>
        <p>Henüz sonuç yok, bekleyin...</p>
      </div>
    `;
    return;
  }

  // Bitenleri ve bitirmeyenleri ayır
  const finished = results.filter(r => r.isFinished).sort((a, b) => a.finishTime - b.finishTime);
  const unfinished = results.filter(r => !r.isFinished);
  const allSorted = [...finished, ...unfinished];

  resultsList.innerHTML = allSorted.map((r, index) => {
    if (r.isFinished) {
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-default';
      return `
        <div class="result-item">
          <div class="result-rank ${rankClass}">${index + 1}</div>
          <div class="result-info">
            <div class="result-name">${escapeHtml(r.name)}</div>
            <div class="result-score">Testi Tamamladı</div>
          </div>
          <button class="view-answers-btn" onclick="viewAnswers('${r.id}')">Cevapları Gör</button>
        </div>
      `;
    } else {
      return `
        <div class="result-item" style="opacity: 0.6;">
          <div class="result-rank rank-default">-</div>
          <div class="result-info">
            <div class="result-name">${escapeHtml(r.name)}</div>
            <div class="result-score">Hala test yapılıyor...</div>
          </div>
        </div>
      `;
    }
  }).join('');

  // Store for modal
  window._resultsData = data;
}

window.viewAnswers = function(playerId) {
  const data = window._resultsData;
  if (!data) return;

  const player = data.results.find(r => r.id === playerId);
  if (!player) return;

  answersModalTitle.textContent = `${player.name} - Cevaplar`;

  answersList.innerHTML = data.questions.map((q, idx) => {
    const given = player.answers[idx] || '—';

    return `
      <div class="answer-item">
        <div class="answer-num">${idx + 1}</div>
        <div class="answer-detail">
          <div class="answer-question-text">${escapeHtml(q.question)}</div>
          <div class="answer-given answer-correct">
            ${escapeHtml(given)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  answersModal.classList.remove('hidden');
};

answersModalClose.addEventListener('click', () => {
  answersModal.classList.add('hidden');
});

resultsBackBtn.addEventListener('click', () => {
  socket.emit('leave-room');
  currentRoom = null;
  isOwner = false;
  showScreen('menu-screen');
});

// ===== SOCKET EVENTS =====

// Oda oluşturuldu
socket.on('room-created', (data) => {
  clearChat();
  renderLobby(data.room);
  showScreen('lobby-screen');
  showToast('Oda oluşturuldu!', 'success');
  roomNameInput.value = '';
  roomPasswordInput.value = '';
});

// Odaya katıldı
socket.on('room-joined', (data) => {
  clearChat();
  renderLobby(data.room);
  showScreen('lobby-screen');
  showToast('Odaya katıldınız!', 'success');
});

// Oyuncu güncelleme
socket.on('player-update', (data) => {
  if (currentRoom) {
    currentRoom.players = data.players;
  }
  lobbyPlayerCount.textContent = data.count;
  renderPlayers(data.players);
});

// Oyun başladı
socket.on('game-started', (data) => {
  resultsChatMessages.innerHTML = ''; // Yeni tur için sonuçlar sohbetini sıfırla
  startGame(data.questions);
  showToast('Oyun başladı!', 'success');
});

// Repost oyunu başladı
socket.on('repost-game-started', (data) => {
  resultsChatMessages.innerHTML = '';
  repostPhotos = data.photos;
  currentPhotoIndex = 0;
  repostScore = 0;
  repostTotalNum.textContent = repostPhotos.length;
  showScreen('repost-welcome-screen');
  showToast('Repost Bulmaca başladı!', 'success');
});

// Cevap kabul edildi
socket.on('answer-accepted', (data) => {
  isSubmitting = false;
  skipQuestionBtn.disabled = false;
  
  if (currentQuestionIndex === questions.length - 1) {
    skipQuestionBtn.textContent = 'Testi Bitir ✓';
  } else {
    skipQuestionBtn.textContent = 'Sonraki →';
  }
  
  myAnswers[data.questionIndex] = data.answer;
  
  answerFeedback.textContent = '✓ Kaydedildi!';
  answerFeedback.className = 'answer-feedback success';
  answerFeedback.classList.remove('hidden');
  
  setTimeout(() => {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      showQuestion();
    } else {
      finishQuiz();
    }
  }, 400);
});

// Cevap reddedildi
socket.on('answer-rejected', (data) => {
  isSubmitting = false;
  skipQuestionBtn.disabled = false;
  
  if (currentQuestionIndex === questions.length - 1) {
    skipQuestionBtn.textContent = 'Testi Bitir ✓';
  } else {
    skipQuestionBtn.textContent = 'Sonraki →';
  }
  
  answerFeedback.textContent = `✗ ${data.reason}`;
  answerFeedback.className = 'answer-feedback error';
  answerFeedback.classList.remove('hidden');
  
  answerInput.style.animation = 'shake 0.4s ease';
  setTimeout(() => answerInput.style.animation = '', 400);
});

// Oyuncu testi bitirdi
socket.on('player-finished', (data) => {
  showToast(`${data.playerName} testi tamamladı! (${data.finishedCount}/${data.totalPlayers})`, 'success');
  // Sonuçlar ekranındaysak listeyi anlık yenile
  if (document.getElementById('results-screen').classList.contains('active')) {
    socket.emit('get-results');
  }
});

// Quiz tamamlandı
socket.on('quiz-completed', () => {
  // Finish ekranına geçiş zaten finishQuiz() tarafından yapıldı
});

// Oda listesi
socket.on('rooms-list', (data) => {
  renderRooms(data.rooms);
});

// Sonuçlar
socket.on('results-data', (data) => {
  renderResults(data);
});

// Odadan atıldın
socket.on('kicked', (data) => {
  currentRoom = null;
  isOwner = false;
  showScreen('menu-screen');
  showToast(data.message, 'error');
});

// Oda kapandı
socket.on('room-closed', (data) => {
  currentRoom = null;
  isOwner = false;
  showScreen('menu-screen');
  showToast(data.message, 'error');
});

// Hata
socket.on('error-msg', (data) => {
  showToast(data.message, 'error');
  // Şifre modalında hata varsa geri aç
  if (data.message === 'Yanlış şifre!' && pendingJoinRoomId) {
    passwordModal.classList.remove('hidden');
    modalPasswordInput.value = '';
    modalPasswordInput.focus();
  }
});

// Bağlantı koptu
socket.on('disconnect', () => {
  showToast('Bağlantı kesildi! Yeniden bağlanılıyor...', 'error');
});

socket.on('connect', () => {
  if (playerName) {
    socket.emit('set-name', playerName);
  }
});

// ===== CHAT & RESTART LOGIC =====
function clearChat() {
  lobbyChatMessages.innerHTML = '';
  resultsChatMessages.innerHTML = '';
}

function sendChatMessage(inputEl) {
  const msg = inputEl.value.trim();
  if (!msg) return;
  socket.emit('send-chat', { message: msg });
  inputEl.value = '';
}

lobbyChatSendBtn.addEventListener('click', () => sendChatMessage(lobbyChatInput));
lobbyChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(lobbyChatInput); });

resultsChatSendBtn.addEventListener('click', () => sendChatMessage(resultsChatInput));
resultsChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(resultsChatInput); });

socket.on('chat-message', (data) => {
  const msgHTML = `
    <div class="chat-message ${data.isSystem ? 'system-msg' : ''}">
      <span class="sender">${escapeHtml(data.sender)}${data.isSystem ? '' : ':'}</span>
      <span class="text">${escapeHtml(data.message)}</span>
    </div>
  `;
  lobbyChatMessages.insertAdjacentHTML('beforeend', msgHTML);
  resultsChatMessages.insertAdjacentHTML('beforeend', msgHTML);
  
  lobbyChatMessages.scrollTop = lobbyChatMessages.scrollHeight;
  resultsChatMessages.scrollTop = resultsChatMessages.scrollHeight;
});

restartGameBtn.addEventListener('click', () => {
  socket.emit('restart-game');
});
