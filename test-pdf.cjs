const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('../Document title - eStatements-21792079-357023231854-2026-02-28-1772907767062.pdf');

// Try both default and specific export if it fails
const parse = typeof pdf === 'function' ? pdf : pdf.default;

parse(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
