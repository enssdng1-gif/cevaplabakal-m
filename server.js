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

const allQuizQuestions = [...questionsRound1, ...questionsRound2];

function startQuizRound(roomId, room) {
  room.status = 'playing';
  room.finishedPlayers = [];
  room.gameQuestions = room.quizRounds[room.currentQuizRoundIndex];
  
  io.to(roomId).emit('game-started', {
    questions: room.gameQuestions.map(q => ({ id: q.id, question: q.question })),
    totalQuestions: allQuizQuestions.length,
    roundIndex: room.currentQuizRoundIndex + 1,
    totalRounds: room.quizRounds.length
  });
}

// Kimi Tarif Ediyorum - Tur başlat
function startDescribeTurn(roomId, room) {
  const describer = room.describeOrder[room.currentDescriberIndex];
  if (!describer) return;

  room.describeTarget = null;
  room.describeText = null;
  room.describeGuessers = [];
  room.describeCorrectCount = 0;

  // Tanıtıcıya form ekranını gönder
  io.to(describer.id).emit('describe-your-turn', {
    turnIndex: room.currentDescriberIndex + 1,
    totalTurns: room.describeOrder.length
  });

  // Diğer oyunculara bekleme ekranını gönder
  room.players.forEach(p => {
    if (p.id !== describer.id) {
      io.to(p.id).emit('describe-wait-turn', {
        describerName: describer.name,
        turnIndex: room.currentDescriberIndex + 1,
        totalTurns: room.describeOrder.length
      });
    }
  });
}

// Kimi Tarif Ediyorum - Tur bitir
function endDescribeTurn(roomId, room) {
  // Tanıtıcıya bonus puan ver (bilen kişi sayısı x 2)
  const describer = room.describeOrder[room.currentDescriberIndex];
  if (describer && room.describeCorrectCount > 0) {
    const bonus = room.describeCorrectCount * 2;
    room.playerScores[describer.id] = (room.playerScores[describer.id] || 0) + bonus;
  }

  const scores = room.players.map(p => ({
    id: p.id,
    name: p.name,
    score: room.playerScores[p.id] || 0
  }));

  // Tur sonucunu herkese gönder
  io.to(roomId).emit('describe-turn-ended', {
    correctAnswer: room.describeTarget,
    correctCount: room.describeCorrectCount,
    describerBonus: room.describeCorrectCount * 2,
    describerName: describer ? describer.name : '',
    scores
  });

  // Sonraki tura geç (3 saniye sonra)
  setTimeout(() => {
    room.currentDescriberIndex++;
    if (room.currentDescriberIndex < room.describeOrder.length) {
      startDescribeTurn(roomId, room);
    } else {
      // Oyun bitti
      room.status = 'finished';
      const finalScores = room.players.map(p => ({
        id: p.id,
        name: p.name,
        score: room.playerScores[p.id] || 0
      }));
      finalScores.sort((a, b) => b.score - a.score);
      io.to(roomId).emit('describe-game-finished', { results: finalScores });
    }
  }, 3500);
}

// Repost Bulmaca - Fotoğraf veritabanı
const repostPhotos = [
  { file: '707990067_935006406230212_2668336883768175161_n.jpg', answer: 'ceyda' },
  { file: '708289280_1405440348013865_767604396719341488_n.jpg', answer: 'ceyda' },
  { file: '708289280_1511610353849482_5360352173647150663_n.jpg', answer: 'ceyda' },
  { file: '708792735_880490918416137_2385018582005240632_n.jpg', answer: 'ceyda' },
  { file: '708889876_4524693934523225_4773328969032231606_n.jpg', answer: 'ceyda' },
  { file: '709634612_1305404494485750_3631968482930178354_n.jpg', answer: 'ceyda' },
  { file: '710057917_2053430852183934_5266896832339771494_n.jpg', answer: 'ceyda' },
  { file: '711774697_1305730631077328_6369799507243975475_n.jpg', answer: 'ceyda' },
  { file: '711885123_1532154195242074_5257170927500983973_n.jpg', answer: 'ceyda' },
  { file: '709782226_982421451308498_7360292453048314791_n.jpg', answer: 'efe' },
  { file: '709980655_878241871961608_5665050889342713714_n.jpg', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161008.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161019.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161033.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161042.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161058.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161110.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161119.png', answer: 'efe' },
  { file: 'Ekran görüntüsü 2026-05-30 161130.png', answer: 'efe' },
  { file: '703110382_967798749353912_8339653513031090203_n.jpg', answer: 'emre' },
  { file: '703501711_969792859141222_6377167223991994424_n.jpg', answer: 'emre' },
  { file: '704652093_1731344484548931_2010297192086261605_n.jpg', answer: 'emre' },
  { file: '705227971_974526905185639_2321115894174303342_n.jpg', answer: 'emre' },
  { file: '709762401_1375144811103387_7278478810030582644_n.jpg', answer: 'emre' },
  { file: '710215376_1619930325749292_2841170138680584600_n.jpg', answer: 'emre' },
  { file: '710737710_1496420658883358_2523395995339556873_n.jpg', answer: 'emre' },
  { file: '711135356_1222690723216366_856494303259830602_n.jpg', answer: 'emre' },
  { file: '707475620_1533342331914249_7159384094907662995_n.jpg', answer: 'enes' },
  { file: '712158439_1226741949397809_4401024723693449074_n.jpg', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164503.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164510.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164518.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164525.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164531.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164540.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164547.png', answer: 'enes' },
  { file: 'Ekran görüntüsü 2026-05-30 164559.png', answer: 'enes' },
  { file: '707125341_1576218014512139_5729708611200865711_n.jpg', answer: 'musa' },
  { file: '707267552_2775167672883604_4299707425369127044_n.jpg', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163516.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163536.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163545.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163553.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163601.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163610.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163624.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163835.png', answer: 'musa' },
  { file: 'Ekran görüntüsü 2026-05-30 163846.png', answer: 'musa' },
  { file: '694714841_1648143996398286_459444052162933938_n.jpg', answer: 'naz' },
  { file: '702657990_3441123262722937_3542449366085497265_n.jpg', answer: 'naz' },
  { file: '703913891_1309070194706019_3690769050172976737_n.jpg', answer: 'naz' },
  { file: '706436836_1650303496180018_1476816649474582395_n.jpg', answer: 'naz' },
  { file: '706610224_973591512189147_5062789501104369331_n.jpg', answer: 'naz' },
  { file: '707227544_786948094384678_32746367145694358_n.jpg', answer: 'naz' },
  { file: '707307609_921349044300791_1863362340343172518_n.jpg', answer: 'naz' },
  { file: '707544472_3546996722117140_2545164829959273981_n.jpg', answer: 'naz' },
  { file: '707930725_1250039480330419_3330030380091924875_n.jpg', answer: 'naz' },
  { file: '708889849_1303476081329353_6209957132692301088_n.jpg', answer: 'naz' },
  { file: '711065164_1289058439978093_4902467591618249014_n.jpg', answer: 'naz' },
  { file: '707842948_36069368626042781_7658150129740875112_n.jpg', answer: 'nergis' },
  { file: '709405500_3081234488731047_7074074060262491781_n.jpg', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164144.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164150.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164155.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164202.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164208.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164215.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164226.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164232.png', answer: 'nergis' },
  { file: 'Ekran görüntüsü 2026-05-30 164239.png', answer: 'nergis' },
  { file: '685770590_1285840486863072_6681583986893201720_n.jpg', answer: 'yağmur' },
  { file: '695011696_1528344445508181_3544693207585126280_n.jpg', answer: 'yağmur' },
  { file: '695232253_3422803647886466_5636443375573724962_n.jpg', answer: 'yağmur' },
  { file: '703501711_1364859865551078_932608403372405692_n.jpg', answer: 'yağmur' },
  { file: '703744235_912793245166467_4356197987698235319_n.jpg', answer: 'yağmur' },
  { file: '705437811_1121979797048937_7925109003988707354_n.jpg', answer: 'yağmur' },
  { file: '706236879_2586457885143195_7522255636505435455_n.jpg', answer: 'yağmur' },
  { file: '706809828_1882317068987781_1046561269553749942_n.jpg', answer: 'yağmur' },
  { file: '706990300_1951388322248621_7128580819547505857_n.jpg', answer: 'yağmur' },
  { file: '707048343_1533555988129890_2753863769804358714_n.jpg', answer: 'yağmur' },
  { file: '708450284_1698824668102389_7162442973119725424_n.jpg', answer: 'yağmur' },
  { file: '685177503_1314460630162141_5183390757877871796_n.jpg', answer: 'yunus' },
  { file: '706296854_998274705930041_1002666495939981305_n.jpg', answer: 'yunus' },
  { file: '706867512_890869793280827_2256786232877618093_n.jpg', answer: 'yunus' },
  { file: '707580228_2057363355133049_6156550600933590971_n.jpg', answer: 'yunus' },
  { file: '707865984_2446402205838053_8273659836937226998_n.jpg', answer: 'yunus' },
  { file: '708014864_1544081297466401_315659250232990748_n.jpg', answer: 'yunus' },
  { file: '708041864_1717834882551930_742729930704332510_n.jpg', answer: 'yunus' },
  { file: '708852651_2046099962993991_1068760346532175980_n.jpg', answer: 'yunus' },
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

// Fotoğrafları dengeli kırpan fonksiyon
function balancePhotos(photos, maxLimit = 80) {
  if (photos.length <= maxLimit) return shuffleArray(photos);

  const groups = {};
  photos.forEach(p => {
    const key = p.answer.toLowerCase();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  let total = photos.length;
  while (total > maxLimit) {
    let maxGroup = null;
    let maxCount = -1;
    for (const key in groups) {
      if (groups[key].length > maxCount) {
        maxCount = groups[key].length;
        maxGroup = key;
      }
    }
    groups[maxGroup].pop();
    total--;
  }

  const balanced = [];
  for (const key in groups) {
    balanced.push(...groups[key]);
  }
  return shuffleArray(balanced);
}

// Repost turunu başlatan yardımcı
function startRepostRound(roomId, room) {
  room.status = 'playing';
  room.finishedPlayers = [];
  room.repostPhotos = room.repostRounds[room.currentRepostRoundIndex];
  
  io.to(roomId).emit('repost-game-started', {
    photos: room.repostPhotos.map((p, idx) => ({ index: idx, file: p.file })),
    totalPhotos: room.repostPhotos.length,
    roundIndex: room.currentRepostRoundIndex + 1,
    totalRounds: room.repostRounds.length
  });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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
      // Repost Bulmaca modu - Turlu Sistem
      const finalPhotos = balancePhotos(repostPhotos, 80);
      const chunks = [];
      for (let i = 0; i < finalPhotos.length; i += 10) {
        chunks.push(finalPhotos.slice(i, i + 10));
      }
      room.repostRounds = chunks;
      room.currentRepostRoundIndex = 0;

      startRepostRound(currentRoom, room);
      console.log(`Repost Bulmaca başladı (Tur 1): ${currentRoom}`);
    } else if (room.gameType === 'describe') {
      // Kimi Tarif Ediyorum modu
      const order = shuffleArray([...room.players]);
      room.describeOrder = order;
      room.currentDescriberIndex = 0;
      room.describeCorrectCount = 0;
      room.describeTimer = null;
      room.describeGuessers = [];

      startDescribeTurn(currentRoom, room);
      console.log(`Kimi Tarif Ediyorum başladı: ${currentRoom}`);
    } else {
      // Normal quiz modu - Turlu Sistem
      const shuffledQs = shuffleArray(allQuizQuestions);
      const chunks = [];
      for (let i = 0; i < shuffledQs.length; i += 10) {
        chunks.push(shuffledQs.slice(i, i + 10));
      }
      room.quizRounds = chunks;
      room.currentQuizRoundIndex = 0;

      startQuizRound(currentRoom, room);
      console.log(`Quiz başladı (Tur 1): ${currentRoom}`);
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

    const isLastRound = room.currentQuizRoundIndex + 1 === room.quizRounds.length;
    const allFinished = room.finishedPlayers.length === room.players.length;

    // Tüm odaya bildir
    io.to(currentRoom).emit('quiz-player-finished', {
      playerId: socket.id,
      playerName: playerName,
      finishedCount: room.finishedPlayers.length,
      totalPlayers: room.players.length,
      allFinished,
      isLastRound
    });

    socket.emit('quiz-completed', { 
      message: 'Turu tamamladınız!',
      isLastRound,
      allFinished
    });
  });

  // Sonraki Quiz turuna geç
  socket.on('next-quiz-round', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameType !== 'quiz') return;
    if (room.owner.id !== socket.id) return;

    if (room.currentQuizRoundIndex + 1 < room.quizRounds.length) {
      room.currentQuizRoundIndex++;
      startQuizRound(currentRoom, room);
    }
  });

  // ===== REPOST BULMACA EVENT'LERİ =====

  // Repost cevap gönder
  socket.on('submit-repost-answer', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'repost') return;

    const { photoIndex, answer } = data;
    const trimmedAnswer = answer.trim().toLowerCase();

    // Tüm turlardan düz fotoğraf listesi oluştur ve global index ile bul
    const allPhotos = room.repostRounds.flat();
    const photo = allPhotos[photoIndex];
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

  // Sonraki Repost turuna geç
  socket.on('next-repost-round', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameType !== 'repost') return;
    if (room.owner.id !== socket.id) return;

    if (room.currentRepostRoundIndex + 1 < room.repostRounds.length) {
      room.currentRepostRoundIndex++;
      startRepostRound(currentRoom, room);
    }
  });

  // Repost oyununu bitir (Turu Bitir)
  socket.on('finish-repost', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'repost') return;

    // Zaten bitirmiş mi kontrol et
    if (room.finishedPlayers.find(p => p.id === socket.id)) return;

    room.finishedPlayers.push({
      id: socket.id,
      name: playerName,
      finishTime: Date.now()
    });

    const isLastRound = room.currentRepostRoundIndex + 1 === room.repostRounds.length;
    const allFinished = room.finishedPlayers.length === room.players.length;

    // Tüm odaya bildir
    io.to(currentRoom).emit('repost-player-finished', {
      playerId: socket.id,
      playerName: playerName,
      finishedCount: room.finishedPlayers.length,
      totalPlayers: room.players.length,
      allFinished,
      isLastRound
    });

    socket.emit('repost-completed', {
      message: 'Turu tamamladınız!',
      isLastRound,
      allFinished
    });
  });

  // Repost sonuçlarını getir (TÜM turların fotoğraflarını topla)
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
      if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
      if (a.finishTime) return -1;
      if (b.finishTime) return 1;
      return 0;
    });

    // TÜM turlardan fotoğrafları topla (sıralı global index ile)
    const allPhotos = [];
    let globalIdx = 0;
    for (const chunk of room.repostRounds) {
      for (const p of chunk) {
        allPhotos.push({
          index: globalIdx++,
          file: p.file,
          answer: p.answer
        });
      }
    }

    socket.emit('repost-results-data', {
      results,
      photos: allPhotos,
      totalPhotos: allPhotos.length,
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

    // Doğru cevapları da gönder (Tüm turlardan)
    const allQuestionsFlat = room.quizRounds.flat();
    const correctAnswers = {};
    allQuestionsFlat.forEach(q => {
      correctAnswers[q.id] = q.answer;
    });

    socket.emit('results-data', { 
      results, 
      correctAnswers,
      questions: allQuestionsFlat.map(q => ({ id: q.id, question: q.question })),
      totalPlayers: room.players.length,
      finishedCount: room.finishedPlayers.length
    });
  });

  // Sohbet mesajı
  socket.on('send-chat', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    // Testi bitirmeyenler oyun sırasında konuşamaz (describe modunda herkes konuşabilir)
    if (room.status === 'playing' && room.gameType !== 'describe') {
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

  // ===== KIMI TARIF EDIYORUM EVENT'LERİ =====

  // Tanıtıcı tarifini gönder
  socket.on('submit-description', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'describe') return;

    const describer = room.describeOrder[room.currentDescriberIndex];
    if (!describer || describer.id !== socket.id) return;

    const { target, description } = data;
    if (!target || !description) return;

    room.describeTarget = target.trim();
    room.describeText = description.trim();
    room.describeGuessers = [];
    room.describeCorrectCount = 0;

    // Puanları skora gönder
    const scores = room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.playerScores[p.id] || 0
    }));

    // Tüm odaya tahmin ekranını gönder
    io.to(currentRoom).emit('start-guessing', {
      describerName: describer.name,
      describerId: describer.id,
      description: room.describeText,
      scores,
      turnIndex: room.currentDescriberIndex + 1,
      totalTurns: room.describeOrder.length
    });

    // 15 saniye geri sayım başlat
    let timeLeft = 15;
    room.describeTimer = setInterval(() => {
      timeLeft--;
      io.to(currentRoom).emit('describe-timer-tick', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(room.describeTimer);
        room.describeTimer = null;
        endDescribeTurn(currentRoom, room);
      }
    }, 1000);

    console.log(`${describer.name} tarif gönderdi: ${currentRoom}`);
  });

  // Tahmin gönder
  socket.on('submit-describe-guess', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.status !== 'playing' || room.gameType !== 'describe') return;

    const describer = room.describeOrder[room.currentDescriberIndex];
    if (!describer) return;

    // Tanıtıcı kendisi tahmin edemez
    if (describer.id === socket.id) return;

    // Zaten tahmin ettiyse
    if (room.describeGuessers.find(g => g.id === socket.id)) {
      return socket.emit('describe-guess-locked', { message: 'Zaten tahmin hakkınızı kullandınız!' });
    }

    const guess = (data.guess || '').trim().toLowerCase();
    const correctAnswer = (room.describeTarget || '').toLowerCase();
    const isCorrect = guess === correctAnswer;

    room.describeGuessers.push({
      id: socket.id,
      name: playerName,
      isCorrect
    });

    if (isCorrect) {
      room.describeCorrectCount++;
      const order = room.describeCorrectCount;
      let points = 1;
      if (order === 1) points = 5;
      else if (order === 2) points = 3;
      else if (order === 3) points = 2;

      room.playerScores[socket.id] = (room.playerScores[socket.id] || 0) + points;
    }

    // Tahmin sonucunu sadece tahmin edene gönder
    socket.emit('describe-guess-result', {
      isCorrect,
      correctAnswer: room.describeTarget,
      guess: data.guess
    });

    // Herkese güncel puanları ve kimin bildiğini yolla
    const scores = room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.playerScores[p.id] || 0
    }));
    const guessStatus = room.players.map(p => {
      if (p.id === describer.id) return { id: p.id, name: p.name, status: 'describer' };
      const g = room.describeGuessers.find(gg => gg.id === p.id);
      if (!g) return { id: p.id, name: p.name, status: 'waiting' };
      return { id: p.id, name: p.name, status: g.isCorrect ? 'correct' : 'wrong' };
    });

    io.to(currentRoom).emit('describe-scores-update', { scores, guessStatus });

    // Herkes tahmin ettiyse süreyi bitir
    const nonDescriberCount = room.players.length - 1;
    if (room.describeGuessers.length >= nonDescriberCount) {
      if (room.describeTimer) {
        clearInterval(room.describeTimer);
        room.describeTimer = null;
      }
      // Küçük gecikme ile bitir (animasyonlar için)
      setTimeout(() => endDescribeTurn(currentRoom, room), 1500);
    }
  });

  // Sonuçları getir
  socket.on('get-describe-results', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.gameType !== 'describe') return;

    const results = room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.playerScores[p.id] || 0
    }));
    results.sort((a, b) => b.score - a.score);

    socket.emit('describe-results-data', { results });
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
      const finalPhotos = balancePhotos(repostPhotos, 80);
      const chunks = [];
      for (let i = 0; i < finalPhotos.length; i += 10) {
        chunks.push(finalPhotos.slice(i, i + 10));
      }
      room.repostRounds = chunks;
      room.currentRepostRoundIndex = 0;
      startRepostRound(currentRoom, room);
      io.to(currentRoom).emit('chat-message', { sender: 'Sistem', senderId: 'system', message: 'Oyun yeniden başlatıldı! Repost Bulmaca başlıyor.', timestamp: Date.now(), isSystem: true });
    } else if (room.gameType === 'describe') {
      const order = shuffleArray([...room.players]);
      room.describeOrder = order;
      room.currentDescriberIndex = 0;
      room.describeCorrectCount = 0;
      room.describeTimer = null;
      room.describeGuessers = [];
      startDescribeTurn(currentRoom, room);
      io.to(currentRoom).emit('chat-message', { sender: 'Sistem', senderId: 'system', message: 'Oyun yeniden başlatıldı! Kimi Tarif Ediyorum? başlıyor.', timestamp: Date.now(), isSystem: true });
    } else {
      const shuffledQs = shuffleArray(allQuizQuestions);
      const chunks = [];
      for (let i = 0; i < shuffledQs.length; i += 10) {
        chunks.push(shuffledQs.slice(i, i + 10));
      }
      room.quizRounds = chunks;
      room.currentQuizRoundIndex = 0;
      startQuizRound(currentRoom, room);
      io.to(currentRoom).emit('chat-message', { sender: 'Sistem', senderId: 'system', message: 'Oyun yeniden başlatıldı! Soru-Cevap başlıyor.', timestamp: Date.now(), isSystem: true });
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
