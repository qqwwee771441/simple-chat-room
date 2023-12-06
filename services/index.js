const db = require(process.cwd() + '/models');

exports.removeRoom = async (roomId) => {
    try {
        await db.execute('DELETE FROM rooms WHERE id=?', [roomId]);
    } catch (err) {
        throw(err);
    }
}

exports.getUserProfile = async (userId) => {
    try {
        const [rows] = await db.execute('select id, nick from users where id = ?', [userId]);
        return rows[0];
    } catch (err) {
        throw(err);
    }
}
