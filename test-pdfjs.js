import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const data = new Uint8Array(fs.readFileSync('../Document title - eStatements-21792079-357023231854-2026-02-28-1772907767062.pdf'));

const loadingTask = pdfjsLib.getDocument({data});
const pdf = await loadingTask.promise;

console.log(`Pages: ${pdf.numPages}`);

for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    console.log(`--- Page ${i} ---`);
    console.log(strings.join(' '));
}
