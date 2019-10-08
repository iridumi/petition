const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addSignature = (first, last, signature) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)
        RETURNING id`, //  Monday 7.10
        [first, last, signature]
    );
};

module.exports.getNames = () => {
    return db.query("SELECT first AS first, last AS last FROM signatures");
};

module.exports.getNumber = () => {
    return db.query("SELECT COUNT(*) FROM signatures");
};

// Monday 7.10
module.exports.getId = signId => {
    return db.query(`SELECT first, signature FROM signatures WHERE id = $1`, [
        signId
    ]);
};

// Tuesday 8.10
module.exports.addUser = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [first, last, email, password]
    );
};
