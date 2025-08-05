const express = require('express');
const cors = require('cors'); // CORS problem ko fix karne ke liye
const multer = require('multer'); // YAHAN PAR TYPO THA - AB FIX HO GAYA HAI
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
    const originalName = path.parse(req.file.originalname).name;
    const outputPath = path.join(os.tmpdir(), `${originalName}.${outputExtension}`);

    try {
        const fileBuffer = fs.readFileSync(inputPath);

        // LibreOffice se convert karna
        const done = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, `.${outputExtension}`, undefined, (err, result) => {
                if (err) {
                    console.error(`Error converting file: ${err}`);
                    return reject(new Error('File conversion failed using LibreOffice.'));
                }
                fs.writeFileSync(outputPath, result);
                resolve(result);
            });
        });

        // Converted file ko download ke liye bhejna
        res.download(outputPath, `${originalName}.${outputExtension}`, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Temporary files ko delete karna
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });

    } catch (error) {
        console.error("Conversion process error:", error);
        res.status(500).send(error.message || 'Error during file conversion.');
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

// 7. Compress PDF (Placeholder)
app.post('/compress-pdf', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    // Real compression is complex. This is a placeholder that just returns the file.
    const originalName = path.parse(req.file.originalname).name;
    res.download(req.file.path, `compressed-${originalName}.pdf`, () => {
        fs.unlinkSync(req.file.path);
    });
});

// 8. Image Compress
app.post('/compress-image', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    const inputPath = req.file.path;
    const originalName = path.parse(req.file.originalname).name;
    const fileExtension = path.extname(req.file.originalname);
    const outputPath = path.join(os.tmpdir(), `compressed-${originalName}${fileExtension}`);

    try {
        await sharp(inputPath)
            .jpeg({ quality: 80 }) // JPEG quality
            .png({ quality: 80 })  // PNG quality
            .toFile(outputPath);

        res.download(outputPath, `compressed-${originalName}${fileExtension}`, (err) => {
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

// Root URL ke liye simple response
app.get('/', (req, res) => {
    res.send('PDF Tools Backend is running!');
});

// Server ko start karna
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
