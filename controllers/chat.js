const fs = require('fs'); // file
const path = require('path'); // path
const multer = require('multer'); // image

const db = require(process.cwd() + '/models'); // db
const { removeRoom: removeRoomService } = require('../services'); // remove service

exports.renderMain = async (req, res, next) => {
    try {
        const [rooms] = await db.execute('SELECT * FROM rooms'); // get rooms
        res.render('main', { rooms, title: 'GIF 채팅방', user: req.user }); // main view with rooms
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.renderRoom = (req, res) => {
    res.render('room', { title: 'GIF 채팅방 생성', user: req.user }); // make chat room
};

exports.createRoom = async (req, res, next) => {
    try {
        const [roomInsertResult] = await db.execute('INSERT INTO rooms (title, max, userId, password) VALUES (?, ?, ?, ?)',
            [req.body.title, req.body.max, req.user.id, req.body.password]); // make room
        const newRoomId = roomInsertResult.insertId; // room id
        const io = req.app.get('io'); // get socket io
        io.of('/room').emit('newRoom', { // io set newRoom feature
            id: newRoomId,
            title: req.body.title,
            max: req.body.max,
            owner: req.user.nick,
            password: req.body.password,
        });

        if (req.body.password) { // entrance room
            res.redirect(`/room/${newRoomId}?password=${req.body.password}`);
        } else {
            res.redirect(`/room/${newRoomId}`);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.enterRoom = async (req, res, next) => { // enter room function
    try {
        const [rooms] = await db.execute('SELECT * FROM rooms WHERE id=?', [req.params.id]); // get room
        if (rooms.length <= 0) {
            return res.redirect('/?error=존재하지 않는 방입니다.');
        }
        const room = rooms[0];
        if (room.password && room.password !== req.query.password) {
            return res.redirect('/?error=비밀번호가 틀렸습니다.');
        }
        const io = req.app.get('io'); // get io
        const userCount = io.of('/chat').adapter.rooms.get(req.params.id)?.size;
        if (room.max <= userCount) {
            return res.redirect('/?error=허용 인원을 초과했습니다.');
        }
        // 현재까지 채팅 내용 가져오기
        const [chats] = await db.execute('SELECT * FROM chats WHERE roomId=? ORDER BY createdAt', [room.id]);
        return res.render('chat', {room, title: room.title, chats, user: req.user});
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.removeRoom = async (req, res, next) => { // remove room
    try {
        await removeRoomService(req.params.id);
        res.send('ok');
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.sendChat = async (req, res, next) => { // send chat
    try {
        await db.execute('INSERT INTO chats (roomId, userId, chat) VALUES (?, ?, ?)', [req.params.id, req.user.id, req.body.chat]);
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
            roomId: req.params.id,
            user: req.user, // *********************************************************
            chat: req.body.chat,
        });
        res.send('ok');
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.upload = multer({ // image upload
    storage: multer.diskStorage({
        destination(req, file, done) {
            try {
                fs.readdirSync('uploads');
            } catch (err) {
                console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
                fs.mkdirSync('uploads');
            }
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: {LIMIT_FILE_SIZE: 5 * 1024 * 1024},
});

exports.sendGif = async (req, res, next) => { // send gif
    try {
        await db.execute('INSERT INTO chats (roomId, userId, gif) VALUES (?, ?, ?)', [req.params.id, req.user.id, req.file.filename]);
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
            roomId: req.params.id,
            user: req.user,
            gif: req.file.filename,
        });
        res.send('ok');
    } catch (err) {
        console.error(err);
        next(err);
    }
};
