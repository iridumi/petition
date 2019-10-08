let { hash, compare } = require("bcryptjs");
const { promisify } = require("util");

hash = promisify(hash);
compare = promisify(compare);
