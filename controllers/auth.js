const bcrypt = require('bcrypt'); // crypt
const passport = require('passport'); // login
const db = require(process.cwd() + '/models'); // db

exports.join = async (req, res, next) => {
    const { email, nick, password } = req.body; // posted data
    try {
        const [ rows ] = await db.execute('select * from users where email = ? ', [email]);
        if (rows.length > 0) return res.redirect('/join?error=exist');
        const hash = await bcrypt.hash(password, 12); // crypt passwpord
        await db.execute('insert into users(email, nick, password) values(?, ?, ?)', [email, nick, hash]);
        return res.redirect('/');
    } catch (err) {
        console.error(err);
        return next(err);
    }
};

exports.login = (req, res, next) => {
    passport.authenticate('local', (authErr, user, info) => { // *********************************
        if (authErr) {
            console.error(authErr);
            return next(authErr);
        }
        if (!user) return res.redirect(`/?loginError=${info.message}`);
        return req.login(user, (loginErr) => { // login ******************************************
            if (loginErr) {
                console.error(loginErr);
                return next(loginErr);
            }
            return res.redirect('/');
        });
    })(req, res, next);
};

exports.logout = (req, res) => {
    req.logout(() => { // logout *****************************************************************
        res.redirect('/') 
    });
};
