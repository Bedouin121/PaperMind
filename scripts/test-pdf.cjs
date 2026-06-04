const { PDFParse } = require("pdf-parse");
const fs = require("fs");

// Create a minimal test - just check the API
const parser = new PDFParse();
console.log(
  "PDFParse instance methods:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(parser)),
);
