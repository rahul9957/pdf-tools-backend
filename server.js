const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const libre = require('libreoffice-convert');
const sharp = require('sharp');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
const upload = multer({ dest: os.tmpdir() });

const handleConversion = async (req, res, outputExtension) => { /* ... (This function remains the same as before) ... */ };

// --- API ROUTES ---
// ... (All other conversion routes are the same)

// UPDATED COMPRESS PDF ROUTE
app.post('/compress-pdf', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const qualityLevel = req.body.level || 'ebook'; // Default to medium
    const options = {
        low: '/screen',      // 72 dpi
        medium: '/ebook',    // 150 dpi
        high: '/printer'   // 300 dpi
    };
    const pdfSetting = options[qualityLevel] || options.medium;

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);

    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ghostscript Error: ${error.message}`);
            return res.status(500).send('Error during PDF compression.');
        }
        if (stderr) {
            console.error(`Ghostscript Stderr: ${stderr}`);
        }
        
        res.download(outputPath, `compressed-${req.file.originalname}`, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    });
});

// ... (Image Compress and other routes are the same as before)

app.get('/', (req, res) => res.send('PDF Tools Backend is running!'));
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
