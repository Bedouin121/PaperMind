const b = require("bcryptjs");
const hash = process.env.TEST_HASH;
if (hash) {
  b.compare("123", hash).then((r) => {
    console.log("match:", r);
    process.exit(0);
  });
} else {
  b.hash("123", 12).then((h) => {
    console.log("HASH=" + h);
    process.exit(0);
  });
}
