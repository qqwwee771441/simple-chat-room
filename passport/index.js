const passport = require('passport'); // passport
const local = require('./localStrategy'); // local
const db = require(process.cwd() + '/models'); // db

module.exports = () => { // outer user
    passport.serializeUser((user, done) => { // **************************************************
        done(null, user.id); // id
    });

    passport.deserializeUser(async (id, done) => { // ********************************************
        try {
            const [rows] = await db.execute('select id, nick from users where id = ?', [id]);
            if (rows.length > 0) {
                const user = rows[0]; // id nick
                done(null, user); // id nick
            }
        } catch (err) {
            console.error(err);
            done(err);
        }
    });

    local();
};
