const { exec } = require('child_process');

exec("gs -dNOPAUSE -dBATCH -sDEVICE=jpeg -r144 -sOutputFile=output.jpg input.pdf", (error, stdout, stderr) => {
    if (error) {
        console.error(`Ghostscript error: ${error}`);
        return;
    }
    console.log('Conversion done!');
});
