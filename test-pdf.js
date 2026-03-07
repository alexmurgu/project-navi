import fs from 'fs';
import { PDFParse } from 'pdf-parse';

let dataBuffer = fs.readFileSync('../Document title - eStatements-21792079-357023231854-2026-02-28-1772907767062.pdf');

try {
    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getTable();
    console.log(JSON.stringify(data, null, 2));
} catch (err) {
    console.error(err);
}
