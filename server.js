const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
const upload = multer({ dest: os.tmpdir() });

// --- FINAL, CORRECTED CONVERSION FUNCTION ---
const handleConversion = (req, res, outputExtension) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const outputDir = os.tmpdir();
    const originalNameWithoutExt = path.parse(req.file.originalname).name;
    const tempFilenameWithoutExt = path.basename(inputPath);
    const expectedOutputPath = path.join(outputDir, `${tempFilenameWithoutExt}.${outputExtension}`);

    // LibreOffice command with a 30-second timeout
    const command = `timeout 30s libreoffice --headless --convert-to ${outputExtension} --outdir "${outputDir}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
        const cleanup = () => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(expectedOutputPath)) fs.unlinkSync(expectedOutputPath);
        };

        if (error) {
            console.error(`Exec Error: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            cleanup();
            // Agar process timeout hota hai (memory ki kami se), to yeh error aayega
            if (error.signal === 'SIGTERM' || error.code === 124) {
                return res.status(500).send('Conversion failed: The process took too long, possibly due to low server memory or a very complex file.');
            }
            return res.status(500).send('File conversion failed on the server. The file might be corrupt or unsupported.');
        }

        if (fs.existsSync(expectedOutputPath)) {
            res.download(expectedOutputPath, `${originalNameWithoutExt}.${outputExtension}`, (downloadErr) => {
                if (downloadErr) console.error("Download Error:", downloadErr);
                cleanup();
            });
        } else {
            console.error('Conversion succeeded but output file was not found.');
            console.error(`Expected path was: ${expectedOutputPath}`);
            console.error(`Files in output dir:`, fs.readdirSync(outputDir));
            cleanup();
            res.status(500).send('Conversion failed: Output file not created.');
        }
    });
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
    const qualityLevel = req.body.level || 'medium';
    const options = { low: 'screen', medium: 'ebook', high: 'printer' };
    const pdfSetting = options[qualityLevel] || options.medium;
    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Ghostscript Error: ${error.message}`);
            fs.unlinkSync(inputPath);
            return res.status(500).send('Error during PDF compression.');
        }
        res.download(outputPath, `compressed-${req.file.originalname}`, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
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
    }
});

app.get('/', (req, res) => res.send('PDF Tools Backend is running!'));
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
