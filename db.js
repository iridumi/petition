const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

module.exports.addSignature = (first, last, signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [first, last, signature, user_id]
    );
};

module.exports.getNames = () => {
    return db.query("SELECT first AS first, last AS last FROM signatures");
};

module.exports.getNumber = () => {
    return db.query("SELECT COUNT(*) FROM signatures");
};

module.exports.getId = signId => {
    return db.query(`SELECT first, signature FROM signatures WHERE id = $1`, [
        signId
    ]);
};

module.exports.addUser = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [first, last, email, password]
    );
};

module.exports.getHashPassword = email => {
    return db.query(`SELECT password FROM users WHERE email = $1`, [email]);
};

module.exports.getLoginUserId = loginId => {
    return db.query(`SELECT id FROM users WHERE email = $1`, [loginId]);
};
