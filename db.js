const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addSignature = (first, last, signature) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)
        RETURNING id`, // id Monday 7.10
        [first, last, signature]
    );
};

module.exports.getNames = () => {
    return db.query("SELECT first AS first, last AS last FROM signatures");
};

module.exports.getNumber = () => {
    return db.query("SELECT COUNT(*) AS count FROM signatures");
};

// Monday 7.10
module.exports.getId = id => {
    return db.query(`SELECT first, signature FROM signatures WHERE id = $1`, [
        id
    ]);
};
