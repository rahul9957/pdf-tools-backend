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

const handleConversion = async (req, res, outputExtension) => {
    // This function for other conversions remains the same
    if (!req.file) return res.status(400).send('No file uploaded.');
    const inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const outputPath = path.join(os.tmpdir(), `${originalName}.${outputExtension}`);
    try {
        const fileBuffer = fs.readFileSync(inputPath);
        const done = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, `.${outputExtension}`, undefined, (err, result) => {
                if (err) return reject(new Error('File conversion failed using LibreOffice.'));
                fs.writeFileSync(outputPath, result);
                resolve(result);
            });
        });
        res.download(outputPath, `${originalName}.${outputExtension}`);
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};

// --- API ROUTES ---
app.post('/convert/pdf-to-word', upload.single('file'), (req, res) => handleConversion(req, res, 'docx'));
app.post('/convert/word-to-pdf', upload.single('file'), (req, res) => handleConversion(req, res, 'pdf'));
app.post('/convert/pdf-to-ppt', upload.single('file'), (req, res) => handleConversion(req, res, 'pptx'));
app.post('/convert/ppt-to-pdf', upload.single('file'), (req, res) => handleConversion(req, res, 'pdf'));
app.post('/convert/pdf-to-excel', upload.single('file'), (req, res) => handleConversion(req, res, 'xlsx'));
app.post('/convert/excel-to-pdf', upload.single('file'), (req, res) => handleConversion(req, res, 'pdf'));

// --- UPDATED AND FIXED COMPRESS PDF ROUTE ---
app.post('/compress-pdf', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const qualityLevel = req.body.level || 'medium'; // Default level
    const options = {
        low: 'screen',
        medium: 'ebook',
        high: 'printer'
    };
    const pdfSetting = options[qualityLevel] || options.medium;

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);

    // Safer command with quotes around paths
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Ghostscript Error: ${error.message}`);
            fs.unlinkSync(inputPath); // Clean up input file on error
            return res.status(500).send('Error during PDF compression.');
        }
        
        res.download(outputPath, `compressed-${req.file.originalname}`, (downloadErr) => {
            // Clean up both files after download is complete or failed
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            if (downloadErr) {
                console.error("Download Error:", downloadErr);
            }
        });
    });
});

app.post('/compress-image', upload.single('file'), async (req, res) => { /* ... Unchanged ... */ });
app.get('/', (req, res) => res.send('PDF Tools Backend is running!'));
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
