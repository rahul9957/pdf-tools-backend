
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Upload folder setup
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// PDF to JPG using Ghostscript CLI
app.post('/api/pdf-to-jpg', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `${req.file.filename}-%03d.jpg`);

    const gsCmd = `gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r144 -sOutputFile=${outputPath} ${inputPath}`;
    exec(gsCmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Ghostscript error:', error);
            return res.status(500).send('Conversion failed');
        }
        res.send('PDF converted to JPG successfully');
    });
});

app.get('/', (req, res) => {
    res.send('PDF Tools Backend is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
