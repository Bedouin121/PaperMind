require("dotenv").config();
const b = require("bcryptjs");
const hash = process.env.PASSWORD_HASH;
console.log("Hash from .env:", hash);
b.compare("123", hash).then((r) => {
  console.log('Does "123" match:', r);
  if (!r) process.exit(1);
});
