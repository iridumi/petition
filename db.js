const spicedPg = require("spiced-pg");

const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addSignature = (first, last, signature) => {
    return db.query(
        "INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3);",
        [first, last, signature]
    );
};

module.exports.getNames = () => {
    return db.query("SELECT first AS first, last AS last FROM signatures");
};
