import { PDFParse } from "pdf-parse";
import { readFileSync } from "fs";

// Quick smoke test — create a minimal 1-page PDF in memory isn't easy,
// so just verify the class instantiates and getText() exists
const parser = new PDFParse({ data: Buffer.alloc(0) });
console.log("PDFParse instantiated OK");
console.log("getText is:", typeof parser.getText);
