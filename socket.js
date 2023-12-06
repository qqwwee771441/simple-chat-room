const socketIO = require('socket.io');
const { removeRoom, getUserProfile } = require('./services');
const passport = require('passport');

module.exports = (server, app, sessionMiddleware) => {
    const io = socketIO(server, {path: '/socket.io'});
    app.set('io', io);
    const room = io.of('/room');
    const chat = io.of('/chat');

    // io.use(fn)은 fn(socket,next)를 미들웨어로 등록
    // 이후 클라이언트 요청마다 fn이 실행되며, fn은 sessionMiddleware을 호출
    // sessionMiddleware는 express 미들웨어인 session(option)이고, 이는 session(req, res, next)라는 함수를 return
    // 즉, sessionMiddleware 호출이란, return된 session(req, res, next) 형태의 함수를 session(socket.request, {}, next)로 호출하는 것
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    chat.use(wrap(sessionMiddleware));
    chat.use(wrap(passport.initialize()));
    chat.use(wrap(passport.session()));

    room.on('connection', (socket) => {
        console.log('room namespace에 접속');
        socket.on('disconnect', () => { console.log('클라이언트 접속 해제'); });
    });

    chat.on('connection', (socket) => {
        console.log('chat namespace에 접속');

        // join event handler: data는 브라우저에서 보낸 방 ID
        socket.on('join', async (data) => {
            const user = await getUserProfile(socket.request.session.passport.user); // *******************
            socket.join(data);
            socket.to(data).emit('join', { chat: `${user.nick}님이 입장하셨습니다.`, });
        });

        socket.on('disconnect', async () => {
            const user = await getUserProfile(socket.request.session.passport.user); // *******************
            console.log('chat namespace 접속 해제');
            const { referer } = socket.request.headers; // 브라우저 주소
            const roomId = new URL(referer).pathname.split('/').at(-1);
            const curRoom = chat.adapter.rooms.get(roomId);
            const userCount = curRoom?.size || 0;
            if (userCount === 0) { // 접속자가 0명이면 방 삭제
                // await removeRoom(roomId); // 컨트롤러 대신 서비스 사용 (미들웨어가 아님)
                await new Promise((resolve) => setTimeout(async () => {
                    await removeRoom(roomId);
                    resolve();
                }, 100)); // 마지막 사용자 나가기 -> 방 제거 후 -> 마지막 사용자 room ns join
                room.emit('removeRoom', roomId);
                console.log('방 제거 요청 성공');
            } else {
                socket.to(roomId).emit('exit', { chat: `${user.nick}님이 퇴장하셨습니다.`, });
            }
        });
    });
};
