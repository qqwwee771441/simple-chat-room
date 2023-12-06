const express = require('express'); // api
const { isLoggedIn, isNotLoggedIn } = require('../middlewares'); // req.isAuthenticated() check
const { /*renderProfile,*/ renderJoin/*, renderMain*/ } = require('../controllers/page'); // page
const { renderMain } = require('../controllers/chat');

const router = express.Router(); // router

router.use((req, res, next) => { // who? where? req.user******************************************
    res.locals.user = req.user; // to use for view
    next();
});

router.get('/', renderMain); // main
router.get('/join', isNotLoggedIn, renderJoin); // join

module.exports = router;
