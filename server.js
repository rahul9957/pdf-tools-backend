const express = require('express');
const multer = require('multer');
const libre = require('libreoffice-convert');
const ghostscript = require('ghostscript4js');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // Optional for frontend

// Word to PDF
app.post('/api/word-to-pdf', upload.single('file'), (req, res) => {
    const ext = '.pdf';
    const inputPath = req.file.path;

    const input = fs.readFileSync(inputPath);
    libre.convert(input, ext, undefined, (err, done) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Conversion failed');
        }
        fs.unlinkSync(inputPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
        res.send(done);
    });
});

// PDF to Word
app.post('/api/pdf-to-word', upload.single('file'), (req, res) => {
    const ext = '.docx';
    const inputPath = req.file.path;

    const input = fs.readFileSync(inputPath);
    libre.convert(input, ext, undefined, (err, done) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Conversion failed');
        }
        fs.unlinkSync(inputPath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=converted.docx');
        res.send(done);
    });
});

// Compress PDF
app.post('/api/compress-pdf', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `${inputPath}_compressed.pdf`;

    const args = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputPath
    ];

    ghostscript.execute(args)
        .then(() => {
            const data = fs.readFileSync(outputPath);
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=compressed.pdf');
            res.send(data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Compression failed');
        });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});