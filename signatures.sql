DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    user_id INT REFERENCES users(id)
);

SELECT * FROM signatures;
