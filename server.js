const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GROQ_API_KEY = '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';

// Sorular
const questions = [
  { id: 1, question: "Görelilik teorisini geliştiren fizikçi kimdir?", answer: "Albert Einstein" },
  { id: 2, question: "Mona Lisa tablosunu yapan ressam kimdir?", answer: "Leonardo da Vinci" },
  { id: 3, question: "Ay'a ilk ayak basan astronot kimdir?", answer: "Neil Armstrong" },
  { id: 4, question: "Microsoft'un kurucusu kimdir?", answer: "Bill Gates" },
  { id: 5, question: "Osmanlı İmparatorluğu'nun kurucusu kimdir?", answer: "Osman Bey" },
  { id: 6, question: "Türkiye Cumhuriyeti'nin kurucusu kimdir?", answer: "Mustafa Kemal Atatürk" },
  { id: 7, question: "Telefonu icat eden kişi kimdir?", answer: "Alexander Graham Bell" },
  { id: 8, question: "Kütle çekim kanununu keşfeden bilim insanı kimdir?", answer: "Isaac Newton" },
  { id: 9, question: "Ampulü icat eden mucit kimdir?", answer: "Thomas Edison" },
  { id: 10, question: "Facebook'un kurucusu kimdir?", answer: "Mark Zuckerberg" },
  { id: 11, question: "Psikanalizin kurucusu olan bilim insanı kimdir?", answer: "Sigmund Freud" },
  { id: 12, question: "Evrim teorisini ortaya atan bilim insanı kimdir?", answer: "Charles Darwin" },
  { id: 13, question: "Tesla Motors ve SpaceX'in kurucusu kimdir?", answer: "Elon Musk" },
  { id: 14, question: "Apple şirketinin kurucusu kimdir?", answer: "Steve Jobs" },
  { id: 15, question: "Penisilin'i keşfeden bilim insanı kimdir?", answer: "Alexander Fleming" },
  { id: 16, question: "Amazon şirketinin kurucusu kimdir?", answer: "Jeff Bezos" },
  { id: 17, question: "Belirsizlik ilkesini ortaya atan fizikçi kimdir?", answer: "Werner Heisenberg" },
  { id: 18, question: "Radyoaktiviteyi keşfeden kadın bilim insanı kimdir?", answer: "Marie Curie" },
  { id: 19, question: "Sistine Şapeli'nin tavanını boyayan sanatçı kimdir?", answer: "Michelangelo" },
  { id: 20, question: "İstanbul'u fetheden Osmanlı padişahı kimdir?", answer: "Fatih Sultan Mehmet" }
];

// Oda yönetimi
const rooms = new Map();

// Groq API ile cevap doğrulama
async function validateAnswer(answer, playerName) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `Sen bir soru-cevap oyunu için cevap doğrulayıcısısın. Görevin, verilen cevabın geçerli bir kişi ismi olup olmadığını kontrol etmek. 
KURALLAR:
1. Cevap gerçek bir kişi ismi olmalıdır (ünlü veya tarihi bir kişi)
2. Cevap oyuncunun kendi ismi OLMAMALIDIR
3. "bilmiyorum", "bilmem", "hiç kimse", "yok", "pas", "geç" gibi kaçamak cevaplar KABUL EDİLMEZ
4. Rastgele harfler, sayılar veya anlamsız metinler KABUL EDİLMEZ
5. Küfür veya uygunsuz içerik KABUL EDİLMEZ
SADECE JSON formatında yanıt ver: {"valid": true} veya {"valid": false, "reason": "kısa açıklama"}`
          },
          {
            role: 'user',
            content: `Oyuncu ismi: "${playerName}". Verilen cevap: "${answer}". Bu cevap geçerli mi?`
          }
        ],
        temperature: 0,
        max_tokens: 80
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // JSON parse et
    try {
      const result = JSON.parse(content);
      return result;
    } catch {
      // JSON parse edilemezse, basit kontrol yap
      if (content.toLowerCase().includes('"valid": true') || content.toLowerCase().includes('"valid":true')) {
        return { valid: true };
      }
      return { valid: false, reason: 'Geçersiz cevap formatı' };
    }
  } catch (error) {
    console.error('Groq API hatası:', error);
    // API hatası durumunda basit doğrulama
    return basicValidation(answer, playerName);
  }
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
      owner: { id: socket.id, name: playerName },
      players: [{ id: socket.id, name: playerName }],
      maxPlayers: 15,
      status: 'waiting',
      playerAnswers: {},
      finishedPlayers: [],
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

    // Her oyuncu için boş cevap objesi oluştur
    room.players.forEach(p => {
      room.playerAnswers[p.id] = {};
    });

    io.to(currentRoom).emit('game-started', { 
      questions: questions.map(q => ({ id: q.id, question: q.question }))
    });

    console.log(`Oyun başladı: ${currentRoom}`);
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

  // Sonuçları getir
  socket.on('get-results', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const results = room.finishedPlayers.map(p => ({
      id: p.id,
      name: p.name,
      answers: p.answers,
      finishTime: p.finishTime
    }));

    // Doğru cevapları da gönder
    const correctAnswers = {};
    questions.forEach(q => {
      correctAnswers[q.id] = q.answer;
    });

    socket.emit('results-data', { 
      results, 
      correctAnswers,
      questions: questions.map(q => ({ id: q.id, question: q.question })),
      totalPlayers: room.players.length,
      finishedCount: room.finishedPlayers.length
    });
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
