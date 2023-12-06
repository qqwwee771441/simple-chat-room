const passport = require('passport'); // passport
const LocalStrategy = require('passport-local').Strategy; // local
const bcrypt = require('bcrypt'); // crypt
const db = require(process.cwd() + '/models'); // db

module.exports = () => {
    passport.use(new LocalStrategy({ // local login
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: false
    }, async (email, password, done) => { // email password
        try {
            const [rows] = await db.execute('select * from users where email = ?', [email]);
            if (rows.length > 0) {
                const result = await bcrypt.compare(password, rows[0].password); // crypt password
                if (result) done(null, rows[0]); // user all info
                else done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
            } else {
                done(null, false, { message: '가입되지 않은 회원입니다.' });
            }
        } catch (err) {
            console.error(err);
            done(err);
        }
    }))
};
