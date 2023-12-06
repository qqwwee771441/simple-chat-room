/**
 * Simple Chat Room
 * 1. Passport를 이용한 로그인
 * 2. Socket IO를 이용한 채팅
 */

const morgan = require('morgan'); // log
const express = require('express'); // api
const session = require('express-session'); // session
const cookieParser = require('cookie-parser'); // cookie

const path = require('path'); // dir
const dotenv = require('dotenv'); // env
const nunjucks = require('nunjucks'); // view
const passport = require('passport'); // login

dotenv.config(); // env enable
const db = require('./models'); // db connect
const webSocket = require('./socket'); // ********************************************************
const pageRouter = require('./routes/page'); // page router
const authRouter = require('./routes/auth'); // join loign router
const chatRouter = require('./routes/chat');
const passportConfig = require('./passport'); // passport index.js localstrategy.js

const app = express(); // run api
passportConfig(); // enable passport index.js localstategy.js ************************************
app.set('port', process.env.PORT || 8001); // port
app.set('view engine', 'html'); // run view
nunjucks.configure('views', { express: app, watch: true }); // setting nunjucks
const sessionMiddleware = session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
});

app.use(morgan('dev')); // logging
app.use(express.static(path.join(__dirname, 'public'))); // public dir
app.use('/gif', express.static(path.join(__dirname, 'uploads'))); // image dir
app.use(express.json()); // json
app.use(express.urlencoded({ extended: false })); // query parameter
app.use(cookieParser(process.env.COOKIE_SECRET)); // cookie
app.use(sessionMiddleware); // use session
app.use(passport.initialize()); // init passport *************************************************
app.use(passport.session()); // sesssion for passport ********************************************

app.use('/', pageRouter, chatRouter); // PAGE CHAT API
app.use('/auth', authRouter); // JOIN LOGIN API

app.use((req, res, next) => { // make 404
    const err = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => { // send error
    res.toLocaleString.message = err.statusMessage;
    res.toLocaleString.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

const server = app.listen(app.get('port'), () => { // connect port *******************************
    console.log(`${app.get('port')}번 포트에서 대기 중`);
});

webSocket(server, app, sessionMiddleware); // ****************************************************************************
