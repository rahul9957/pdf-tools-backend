const express = require('express');
const cors = require('cors'); // CORS problem ko fix karne ke liye
const multer = aequire('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const libre = require('libreoffice-convert');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// YEH LINE CORS ERROR KO FIX KARTI HAI
app.use(cors());

// File upload ke liye temporary directory set karna
const upload = multer({ dest: os.tmpdir() });

// --- API ROUTES FOR ALL TOOLS ---

// Helper function to handle file conversion
const handleConversion = async (req, res, outputExtension) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `${Date.now()}.${outputExtension}`);

    try {
        const fileBuffer = fs.readFileSync(inputPath);

        // LibreOffice se convert karna
        const done = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, `.${outputExtension}`, undefined, (err, result) => {
                if (err) {
                    return reject(err);
                }
                fs.writeFileSync(outputPath, result);
                resolve(result);
            });
        });

        // Converted file ko download ke liye bhejna
        res.download(outputPath, `converted.${outputExtension}`, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Temporary files ko delete karna
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });

    } catch (error) {
        console.error("Conversion error:", error);
        res.status(500).send('Error during file conversion.');
        // Error hone par bhi temporary file delete karna
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};

// 1. PDF to Word
app.post('/convert/pdf-to-word', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'docx');
});

// 2. Word to PDF
app.post('/convert/word-to-pdf', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'pdf');
});

// 3. PDF to PowerPoint
app.post('/convert/pdf-to-ppt', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'pptx');
});

// 4. PowerPoint to PDF
app.post('/convert/ppt-to-pdf', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'pdf');
});

// 5. PDF to Excel
app.post('/convert/pdf-to-excel', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'xlsx');
});

// 6. Excel to PDF
app.post('/convert/excel-to-pdf', upload.single('file'), (req, res) => {
    handleConversion(req, res, 'pdf');
});

// 7. Compress PDF (Placeholder - compression is complex, often requires Ghostscript)
app.post('/compress-pdf', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    // Simple passthrough for now, as real compression is very complex
    res.download(req.file.path, 'compressed.pdf', () => {
        fs.unlinkSync(req.file.path);
    });
});

// 8. Image Compress
app.post('/compress-image', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);

    try {
        await sharp(inputPath)
            .jpeg({ quality: 80 }) // 80% quality compression
            .toFile(outputPath);

        res.download(outputPath, `compressed-${req.file.originalname}`, (err) => {
            if (err) console.error(err);
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


// Server ko start karna
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
