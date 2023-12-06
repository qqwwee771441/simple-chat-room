const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('../middlewares'); // req.isAuthenticated() check
const { renderMain, renderRoom, createRoom, enterRoom, removeRoom, sendChat, upload, sendGif } = require('../controllers/chat');
const router = express.Router();

//router.get('/', renderMain);
router.get('/room', isLoggedIn, renderRoom);
router.post('/room', isLoggedIn, createRoom);
router.get('/room/:id', isLoggedIn, enterRoom);
router.delete('/room/:id', isLoggedIn, removeRoom);
router.post('/room/:id/chat', isLoggedIn, sendChat);
router.post('/room/:id/gif', isLoggedIn, upload.single('gif'), sendGif);

module.exports = router;
