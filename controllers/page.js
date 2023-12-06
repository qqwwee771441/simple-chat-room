const db = require(process.cwd() + '/models');

exports.renderJoin = (req, res) => {
    res.render('join', { title: '회원가입' });
};

exports.renderMain = async (req, res, next) => {
    try{
        res.render('main', { title: '메인' });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
