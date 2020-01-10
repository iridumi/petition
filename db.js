const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

module.exports.addSignature = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING id`,
        [signature, user_id]
    );
};

module.exports.getNumber = () => {
    return db.query("SELECT COUNT(*) FROM signatures");
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
    return db.query(
        `SELECT id
        FROM users
        WHERE email = $1`,
        [loginId]
    );
};

module.exports.addProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [age || null, city, url, user_id]
    );
};

module.exports.getSignature = signId => {
    return db.query(
        `SELECT signature, first
        FROM signatures
        LEFT JOIN users
        ON users.id = signatures.user_id
        WHERE user_id = $1
        `,
        [signId]
    );
};

module.exports.getSigners = () => {
    return db.query(
        `SELECT first, last, age, city, url
        FROM signatures
        LEFT JOIN users
        ON users.id = signatures.user_id
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        `
    );
};

module.exports.sigCheck = id => {
    return db.query("SELECT user_id FROM signatures WHERE user_id = $1", [id]);
};

module.exports.getSignersCity = city => {
    return db.query(
        `SELECT first, last, age, city, url
        FROM signatures
        LEFT JOIN users
        ON users.id = signatures.user_id
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1)
         `,
        [city]
    );
};

module.exports.showProfile = user_id => {
    return db.query(
        `SELECT first, last, email, password, age, city, url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1
        `,
        [user_id]
    );
};

module.exports.editProfile = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city =$2, url = $3
        `,
        [age || null, city, url, user_id]
    );
};

module.exports.editPassword = (first, last, email, password, user_id) => {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3, password = $4
        WHERE id =$5
        `,
        [first, last, email, password, user_id]
    );
};

module.exports.editUsers = (first, last, email, user_id) => {
    return db.query(
        `
        UPDATE users SET first = $1, last = $2, email = $3
        WHERE id = $4
        `,
        [first, last, email, user_id]
    );
};

module.exports.delSignature = id => {
    return db.query("DELETE FROM signatures WHERE user_id = $1", [id]);
};

module.exports.delUserProfile = id => {
    return db.query("DELETE FROM user_profiles WHERE user_id = $1", [id]);
};

module.exports.delUser = id => {
    return db.query("DELETE FROM users CASCADE WHERE id = $1", [id]);
};
