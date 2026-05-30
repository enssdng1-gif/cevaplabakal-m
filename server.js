const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Sorular havuzu
const questionsRound1 = [
  { id: 1, question: "Film olsa kimi başrol yaparsınız?", answer: "" },
  { id: 2, question: "İstediğin zaman birini susturma özelliğin olsa kimde kullanırdın?", answer: "" },
  { id: 3, question: "Kim yapay zekayla evlenme kapasitesine sahip?", answer: "" },
  { id: 4, question: "Kimin eşi evlendiği gün boşanma davası açar?", answer: "" },
  { id: 5, question: "Kim çiçek yerine kaktüs alır?", answer: "" },
  { id: 6, question: "Kim yoklukta gider?", answer: "" },
  { id: 7, question: "Kim evde kalır?", answer: "" },
  { id: 8, question: "Kimin fetöyle bağlantısı olduğunu düşünüyorsun?", answer: "" },
  { id: 9, question: "Kim evrimini tamamlayamamıştır?", answer: "" },
  { id: 10, question: "18'de karıya/kocaya kim kaçar?", answer: "" },
  { id: 11, question: "En azgın kim?", answer: "" },
  { id: 12, question: "LGBT üyesi olmaya en yakın kim?", answer: "" },
  { id: 13, question: "Sizden sır sakladığını düşündüğünüz kişi kim?", answer: "" },
  { id: 14, question: "Sizden hoşlandığını düşündüğünüz kişi kim?", answer: "" },
  { id: 15, question: "Kim İstiklal Marşı'nı ezbere bilmiyordur?", answer: "" },
  { id: 16, question: "Kiminle yalnız kalmaktan korkarsın?", answer: "" },
  { id: 17, question: "Grupta en çok sevilen kişi kim?", answer: "" },
  { id: 18, question: "Cehenneme garanti gider dediğiniz kim?", answer: "" },
  { id: 19, question: "En hiperaktif olan kim?", answer: "" },
  { id: 20, question: "Rahat duramayan, garip hareketleri olan kim?", answer: "" }
];

const questionsRound2 = [
  { id: 21, question: "Kim kendini acındırır?", answer: "" },
  { id: 22, question: "Kendini en çok öven kim?", answer: "" },
  { id: 23, question: "Para karşılığında meydanda kim çıplak koşar?", answer: "" },
  { id: 24, question: "En zorba kim?", answer: "" },
  { id: 25, question: "Gereksiz yere tartışma çıkarma potansiyeline sahip kim?", answer: "" },
  { id: 26, question: "Ağzı en iyi laf yapan kim?", answer: "" },
  { id: 27, question: "İntihar etmeye en yakın kim?", answer: "" },
  { id: 28, question: "En keko kim?", answer: "" },
  { id: 29, question: "Sevgilisini ilk kim aldatır?", answer: "" },
  { id: 30, question: "Hemcinsiyle sevgili olma potansiyeline sahip kim?", answer: "" },
  { id: 31, question: "Karşı cinsle iletişimi en kötü olan kim?", answer: "" },
  { id: 32, question: "Eğlence anlayışı en garip olan kişi kim?", answer: "" },
  { id: 33, question: "En ciddi kim?", answer: "" },
  { id: 34, question: "En rahat kim?", answer: "" },
  { id: 35, question: "En boş konuşan kim?", answer: "" },
  { id: 36, question: "Adaya düşsen yanına en son kimi alırdın?", answer: "" },
  { id: 37, question: "Kendi rahatlığı için kim herkesi satar?", answer: "" },
  { id: 38, question: "Kimin senden gizlice nefret ettiğini düşünüyorsun?", answer: "" },
  { id: 39, question: "Kimi tanımamak istersin?", answer: "" },
  { id: 40, question: "Herkesi yalayan, herkese yalakalık yapan kim?", answer: "" }
];

function getQuestions(round) {
  if (round === 2) {
    return questionsRound2;
  }
  return questionsRound1;
}

// Repost Bulmaca - Fotoğraf veritabanı
const repostPhotos = [
  { file: '707475620_1533342331914249_7159384094907662995_n.jpg', answer: 'enes' },
  { file: '712158439_1226741949397809_4401024723693449074_n.jpg', answer: 'enes' },
  { file: '707842948_36069368626042781_7658150129740875112_n.jpg', answer: 'nergis' },
  { file: '709405500_3081234488731047_7074074060262491781_n.jpg', answer: 'nergis' },
  { file: '707990067_935006406230212_2668336883768175161_n.jpg', answer: 'ceyda' },
  { file: '708889876_4524693934523225_4773328969032231606_n.jpg', answer: 'ceyda' },
  { file: '709782226_982421451308498_7360292453048314791_n.jpg', answer: 'efe' },
  { file: '709980655_878241871961608_5665050889342713714_n.jpg', answer: 'efe' },
  { file: '710737710_1496420658883358_2523395995339556873_n.jpg', answer: 'emre' },
  { file: '711135356_1222690723216366_856494303259830602_n.jpg', answer: 'emre' },
  { file: '707125341_1576218014512139_5729708611200865711_n.jpg', answer: 'musa' },
  { file: '707267552_2775167672883604_4299707425369127044_n.jpg', answer: 'musa' },
  { file: '707544472_3546996722117140_2545164829959273981_n.jpg', answer: 'naz' },
  { file: '707930725_1250039480330419_3330030380091924875_n.jpg', answer: 'naz' },
  { file: '708876812_1718171175849688_5247874808744350295_n.jpg', answer: 'yağmur' },
  { file: '709225538_1478611464279040_6549281798316128013_n.jpg', answer: 'yağmur' },
  { file: '707580228_2057363355133049_6156550600933590971_n.jpg', answer: 'yunus' },
  { file: '708978765_1315900536556312_2371646116293002854_n.jpg', answer: 'yunus' }
];

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Oda yönetimi
const rooms = new Map();

// Groq API ile cevap doğrulama (İptal edildi, arkadaşlar arası olduğu için sadece basit doğrulama)
async function validateAnswer(answer, playerName) {
  return basicValidation(answer, playerName);
}

// Yedek basit doğrulama
function basicValidation(answer, playerName) {
  const trimmed = answer.trim().toLowerCase();
  const invalidAnswers = ['bilmiyorum', 'bilmem', 'hiç kimse', 'kimse', 'yok', 'pas', 'geç', 'bilmiyom', 'hic kimse', 'bos', 'boş'];
  
  if (trimmed.length < 2) return { valid: false, reason: 'Cevap çok kısa' };
  if (invalidAnswers.includes(trimmed)) return { valid: false, reason: 'Geçerli bir isim giriniz' };
  if (trimmed === playerName.trim().toLowerCase()) return { valid: false, reason: 'Kendi isminizi yazamazsınız' };
  if (/^\d+$/.test(trimmed)) return { valid: false, reason: 'Sayı değil, isim giriniz' };
  if (/^[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(trimmed)) return { valid: false, reason: 'Geçerli bir isim giriniz' };
  
  return { valid: true };
}

// Oda ID oluşturucu
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`Bağlandı: ${socket.id}`);
  let currentRoom = null;
  let playerName = '';

  // İsim ayarla
  socket.on('set-name', (name) => {
    playerName = name;
  });

  // Oda oluştur
  socket.on('create-room', (data) => {
    const roomId = generateRoomId();
    const room = {
      id: roomId,
      name: data.roomName,
      password: data.password || null,
      hasPassword: !!data.password,
      gameType: data.gameType || 'quiz',
      round: 1,
      owner: { id: socket.id, name: playerName },
      players: [{ id: socket.id, name: playerName }],
      maxPlayers: 15,
      status: 'waiting',
      playerAnswers: {},
      finishedPlayers: [],
      gameQuestions: [],
      createdAt: Date.now()
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    currentRoom = roomId;

    socket.emit('room-created', { room: sanitizeRoom(room) });
    console.log(`Oda oluşturuldu: ${roomId} - ${data.roomName}`);
  });

  // Odaya katıl
  socket.on('join-room', (data) => {
    const room = rooms.get(data.roomId);
    
    if (!room) {
      return socket.emit('error-msg', { message: 'Oda bulunamadı!' });
    }
    if (room.status !== 'waiting') {
      return socket.emit('error-msg', { message: 'Oyun zaten başlamış!' });
    }
    if (room.players.length >= room.maxPlayers) {
      return socket.emit('error-msg', { message: 'Oda dolu!' });
    }
    if (room.hasPassword && room.password !== data.password) {
      return socket.emit('error-msg', { message: 'Yanlış şifre!' });
    }
    // Zaten odada mı kontrol et
    if (room.players.find(p => p.id === socket.id)) {
      return socket.emit('error-msg', { message: 'Zaten bu odadasınız!' });
    }

    room.players.push({ id: socket.id, name: playerName });
    socket.join(data.roomId);
    currentRoom = data.roomId;

    socket.emit('room-joined', { room: sanitizeRoom(room) });
    io.to(data.roomId).emit('player-update', { 
      players: room.players.map(p => ({ id: p.id, name: p.name })),
      count: room.players.length
    });
    
    console.log(`${playerName} odaya katıldı: ${data.roomId}`);
  });

  // Odadan ayrıl
  socket.on('leave-room', () => {
    leaveCurrentRoom(socket);
  });

  // Oyuncu at
  socket.on('kick-player', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.owner.id !== socket.id) return;

    const kickedPlayer = room.players.find(p => p.id === data.playerId);
    if (!kickedPlayer || kickedPlayer.id === socket.id) return;

    room.players = room.players.filter(p => p.id !== data.playerId);
    
    io.to(data.playerId).emit('kicked', { message: 'Oda sahibi tarafından atıldınız!' });
    const kickedSocket = io.sockets.sockets.get(data.playerId);
    if (kickedSocket) {
      kickedSocket.leave(currentRoom);
    }

    io.to(currentRoom).emit('player-update', {
      players: room.players.map(p => ({ id: p.id, name: p.name })),
      count: room.players.length
    });

    console.log(`${kickedPlayer.name} odadan atıldı: ${currentRoom}`);
  });

  // Oyunu başlat
  socket.on('start-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.owner.id !== socket.id) return;
    if (room.status !== 'waiting') return;

    room.status = 'playing';
    room.playerAnswers = {};
    room.finishedPlayers = [];
    room.playerScores = {};

    // Her oyuncu için boş cevap objesi ve skor oluştur
    room.players.forEach(p => {
      room.playerAnswers[p.id] = {};
      room.playerScores[p.id] = 0;
    });

    if (room.gameType === 'repost') {
      // Repost Bulmaca modu
      room.repostPhotos = shuffleArray(repostPhotos);
      io.to(currentRoom).emit('repost-game-started', {
        photos: room.repostPhotos.map((p, idx) => ({ index: idx, file: p.file })),
        totalPhotos: room.repostPhotos.length
      });
      console.log(`Repost Bulmaca başladı: ${currentRoom}`);
    } else {
      // Normal quiz modu
      room.gameQuestions = getQuestions(room.round);
      io.to(currentRoom).emit('game-started', { 
        questions: room.gameQuestions.map(q => ({ id: q.id, question: q.question }))
      });
      console.log(`Oyun başladı: ${currentRoom}`);
    }
  });

  // Cevap gönder
  socket.on('submit-answer', async (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing') return;

    const { questionIndex, answer } = data;
    
    // Cevap doğrulama
    const validation = await validateAnswer(answer, playerName);
    
    if (validation.valid) {
      if (!room.playerAnswers[socket.id]) {
        room.playerAnswers[socket.id] = {};
      }
      room.playerAnswers[socket.id][questionIndex] = answer;
      socket.emit('answer-accepted', { questionIndex, answer });
    } else {
      socket.emit('answer-rejected', { 
        questionIndex, 
        reason: validation.reason || 'Geçersiz cevap. Lütfen gerçek bir kişi ismi giriniz.' 
      });
    }
  });

  // Testi bitir
  socket.on('finish-quiz', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing') return;

    // Zaten bitirmiş mi kontrol et
    if (room.finishedPlayers.find(p => p.id === socket.id)) return;

    room.finishedPlayers.push({
      id: socket.id,
      name: playerName,
      finishTime: Date.now(),
      answers: room.playerAnswers[socket.id] || {}
    });

    // Tüm odaya bildir
    io.to(currentRoom).emit('player-finished', {
      playerId: socket.id,
      playerName: playerName,
      finishedCount: room.finishedPlayers.length,
      totalPlayers: room.players.length
    });

    socket.emit('quiz-completed', { message: 'Testi tamamladınız!' });
  });

  // ===== REPOST BULMACA EVENT'LERİ =====

  // Repost cevap gönder
  socket.on('submit-repost-answer', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'repost') return;

    const { photoIndex, answer } = data;
    const trimmedAnswer = answer.trim().toLowerCase();

    // Fotoğrafın doğru cevabını bul
    const photo = room.repostPhotos[photoIndex];
    if (!photo) return;

    const correctAnswer = photo.answer.toLowerCase();
    const isCorrect = trimmedAnswer === correctAnswer;

    // Cevabı kaydet
    if (!room.playerAnswers[socket.id]) {
      room.playerAnswers[socket.id] = {};
    }
    room.playerAnswers[socket.id][photoIndex] = {
      given: answer.trim(),
      correct: isCorrect
    };

    // Puan ver
    if (isCorrect) {
      if (!room.playerScores[socket.id]) room.playerScores[socket.id] = 0;
      room.playerScores[socket.id]++;
    }

    socket.emit('repost-answer-result', {
      photoIndex,
      isCorrect,
      correctAnswer: photo.answer,
      givenAnswer: answer.trim(),
      currentScore: room.playerScores[socket.id] || 0
    });
  });

  // Repost oyununu bitir
  socket.on('finish-repost', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'repost') return;

    // Zaten bitirmiş mi kontrol et
    if (room.finishedPlayers.find(p => p.id === socket.id)) return;

    room.finishedPlayers.push({
      id: socket.id,
      name: playerName,
      finishTime: Date.now(),
      score: room.playerScores[socket.id] || 0,
      answers: room.playerAnswers[socket.id] || {}
    });

    // Tüm odaya bildir
    io.to(currentRoom).emit('repost-player-finished', {
      playerId: socket.id,
      playerName: playerName,
      finishedCount: room.finishedPlayers.length,
      totalPlayers: room.players.length
    });

    socket.emit('repost-completed', {
      message: 'Oyunu tamamladınız!',
      score: room.playerScores[socket.id] || 0,
      totalPhotos: room.repostPhotos.length
    });
  });

  // Repost sonuçlarını getir
  socket.on('get-repost-results', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameType !== 'repost') return;

    // Tüm oyuncuları puana göre sırala
    const results = room.players.map(p => {
      const finished = room.finishedPlayers.find(fp => fp.id === p.id);
      return {
        id: p.id,
        name: p.name,
        isFinished: !!finished,
        score: room.playerScores[p.id] || 0,
        answers: room.playerAnswers[p.id] || {},
        finishTime: finished ? finished.finishTime : null
      };
    });

    // Puana göre sırala (yüksekten düşüğe)
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Puanlar eşitse, erken bitirene öncelik
      if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
      if (a.finishTime) return -1;
      if (b.finishTime) return 1;
      return 0;
    });

    // Fotoğraf bilgilerini de gönder (doğru cevaplarla birlikte)
    const photos = room.repostPhotos.map((p, idx) => ({
      index: idx,
      file: p.file,
      answer: p.answer
    }));

    socket.emit('repost-results-data', {
      results,
      photos,
      totalPhotos: room.repostPhotos.length,
      finishedCount: room.finishedPlayers.length,
      totalPlayers: room.players.length
    });
  });

  // Sonuçları getir
  socket.on('get-results', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const results = room.players.map(p => {
      const finished = room.finishedPlayers.find(fp => fp.id === p.id);
      if (finished) {
        return {
          id: p.id,
          name: p.name,
          isFinished: true,
          answers: finished.answers,
          finishTime: finished.finishTime
        };
      } else {
        return {
          id: p.id,
          name: p.name,
          isFinished: false,
          answers: room.playerAnswers[p.id] || {},
          finishTime: null
        };
      }
    });

    // Doğru cevapları da gönder
    const correctAnswers = {};
    room.gameQuestions.forEach(q => {
      correctAnswers[q.id] = q.answer;
    });

    socket.emit('results-data', { 
      results, 
      correctAnswers,
      questions: room.gameQuestions.map(q => ({ id: q.id, question: q.question })),
      totalPlayers: room.players.length,
      finishedCount: room.finishedPlayers.length
    });
  });

  // Sohbet mesajı
  socket.on('send-chat', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    // Testi bitirmeyenler oyun sırasında konuşamaz
    if (room.status === 'playing') {
      const isFinished = room.finishedPlayers.find(p => p.id === socket.id);
      if (!isFinished) {
        socket.emit('error-msg', { message: 'Sadece testi bitirenler sohbet edebilir!' });
        return;
      }
    }

    // Mesajı odadaki herkese gönder
    io.to(currentRoom).emit('chat-message', {
      sender: playerName,
      senderId: socket.id,
      message: data.message,
      timestamp: Date.now()
    });
  });

  // Oyunu yeniden başlat
  socket.on('restart-game', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.owner.id !== socket.id) return;
    
    room.status = 'playing';
    room.playerAnswers = {};
    room.finishedPlayers = [];
    room.playerScores = {};

    room.players.forEach(p => {
      room.playerAnswers[p.id] = {};
      room.playerScores[p.id] = 0;
    });

    if (room.gameType === 'repost') {
      room.repostPhotos = shuffleArray(repostPhotos);
      io.to(currentRoom).emit('repost-game-started', {
        photos: room.repostPhotos.map((p, idx) => ({ index: idx, file: p.file })),
        totalPhotos: room.repostPhotos.length,
        isRestart: true
      });
      
      io.to(currentRoom).emit('chat-message', {
        sender: 'Sistem',
        senderId: 'system',
        message: 'Oyun oda sahibi tarafından yeniden başlatıldı! Repost Bulmaca başlıyor.',
        timestamp: Date.now(),
        isSystem: true
      });
      console.log(`Repost Bulmaca yeniden başladı: ${currentRoom}`);
    } else {
      room.round = room.round === 1 ? 2 : 1; // Tur değiştir
      room.gameQuestions = getQuestions(room.round);

      io.to(currentRoom).emit('game-started', { 
        questions: room.gameQuestions.map(q => ({ id: q.id, question: q.question })),
        isRestart: true
      });
      
      io.to(currentRoom).emit('chat-message', {
        sender: 'Sistem',
        senderId: 'system',
        message: `Oyun oda sahibi tarafından yeniden başlatıldı! ${room.round}. Tur başlıyor.`,
        timestamp: Date.now(),
        isSystem: true
      });
      console.log(`Oyun yeniden başladı (Tur ${room.round}): ${currentRoom}`);
    }
  });

  // Odaları listele
  socket.on('get-rooms', () => {
    const roomList = [];
    rooms.forEach((room) => {
      if (room.status === 'waiting') {
        roomList.push({
          id: room.id,
          name: room.name,
          hasPassword: room.hasPassword,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers,
          gameType: room.gameType,
          ownerName: room.owner.name
        });
      }
    });
    socket.emit('rooms-list', { rooms: roomList });
  });

  // Oda ara
  socket.on('search-rooms', (data) => {
    const query = data.query.toLowerCase();
    const roomList = [];
    rooms.forEach((room) => {
      if (room.status === 'waiting' && room.name.toLowerCase().includes(query)) {
        roomList.push({
          id: room.id,
          name: room.name,
          hasPassword: room.hasPassword,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers,
          gameType: room.gameType,
          ownerName: room.owner.name
        });
      }
    });
    socket.emit('rooms-list', { rooms: roomList });
  });

  // Odayı kapat
  socket.on('close-room', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.owner.id !== socket.id) return;

    io.to(currentRoom).emit('room-closed', { message: 'Oda sahibi odayı kapattı!' });
    
    // Tüm oyuncuları odadan çıkar
    room.players.forEach(p => {
      const s = io.sockets.sockets.get(p.id);
      if (s) s.leave(currentRoom);
    });

    rooms.delete(currentRoom);
    currentRoom = null;
    console.log(`Oda kapatıldı: ${currentRoom}`);
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    console.log(`Ayrıldı: ${socket.id}`);
    leaveCurrentRoom(socket);
  });

  function leaveCurrentRoom(sock) {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) { currentRoom = null; return; }

    // Oda sahibi ayrılırsa odayı kapat
    if (room.owner.id === sock.id) {
      io.to(currentRoom).emit('room-closed', { message: 'Oda sahibi ayrıldı, oda kapatıldı!' });
      room.players.forEach(p => {
        const s = io.sockets.sockets.get(p.id);
        if (s) s.leave(currentRoom);
      });
      rooms.delete(currentRoom);
    } else {
      // Normal oyuncu ayrılırsa
      room.players = room.players.filter(p => p.id !== sock.id);
      sock.leave(currentRoom);
      io.to(currentRoom).emit('player-update', {
        players: room.players.map(p => ({ id: p.id, name: p.name })),
        count: room.players.length
      });
    }
    currentRoom = null;
  }
});

function sanitizeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    hasPassword: room.hasPassword,
    gameType: room.gameType,
    owner: room.owner,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Quiz Arena sunucusu çalışıyor: http://localhost:${PORT}`);
});
