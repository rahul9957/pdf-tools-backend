const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const libre = require('libreoffice-convert');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const upload = multer({ dest: os.tmpdir() });

const handleConversion = async (req, res, outputExtension) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const outputPath = path.join(os.tmpdir(), `${originalName}.${outputExtension}`);

    try {
        const fileBuffer = fs.readFileSync(inputPath);

        const done = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, `.${outputExtension}`, undefined, (err, result) => {
                if (err) {
                    // Behtar error logging ke liye
                    console.error(`LibreOffice conversion error: ${err}`);
                    return reject(new Error('File conversion failed using LibreOffice.'));
                }
                fs.writeFileSync(outputPath, result);
                resolve(result);
            });
        });

        res.download(outputPath, `${originalName}.${outputExtension}`, (err) => {
            if (err) console.error("Error sending file:", err);
            // File cleanup ko hamesha finally block mein rakhein
        });

    } catch (error) {
        console.error("Conversion process error:", error);
        res.status(500).send(error.message || 'Error during file conversion.');
    } finally {
        // Ensure temporary files are always deleted
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

app.post('/compress-pdf', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.download(req.file.path, `compressed-${req.file.originalname}`, () => {
        fs.unlinkSync(req.file.path);
    });
});

app.post('/compress-image', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);
    try {
        await sharp(inputPath).jpeg({ quality: 80 }).png({ quality: 80 }).toFile(outputPath);
        res.download(outputPath, `compressed-${req.file.originalname}`, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error("Image compression error:", error);
        res.status(500).send('Error during image compression.');
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
});

app.get('/', (req, res) => res.send('PDF Tools Backend is running!'));

app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
