import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processLogo() {
    const inputPath = path.join(__dirname, 'public', 'khrunch-icon-source.png');
    const outputPath = path.join(__dirname, 'public', 'khrunch-icon.png');

    console.log(`Processing ${inputPath}...`);

    try {
        // Try to read
        console.log("Reading image...");
        const image = await Jimp.read(inputPath);
        console.log("Image read successfully.");

        // Get corner color (assuming it's the background)
        const cornerColor = image.getPixelColor(0, 0);
        // Manual intToRGBA
        const r = (cornerColor >>> 24) & 0xFF;
        const g = (cornerColor >>> 16) & 0xFF;
        const b = (cornerColor >>> 8) & 0xFF;
        const a = cornerColor & 0xFF;
        console.log(`Corner color: rgba(${r}, ${g}, ${b}, ${a})`);

        console.log("Scanning pixels...");
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];

            // Check for white
            if (red > 240 && green > 240 && blue > 240) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
            // Check for gray checkerboard
            else if (Math.abs(red - green) < 10 && Math.abs(red - blue) < 10 && (red > 190 && red < 240)) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
            // Also check against corner color
            else if (red === r && green === g && blue === b) {
                this.bitmap.data[idx + 3] = 0;
            }
        });

        console.log("Autocropping...");
        image.autocrop();

        console.log("Writing output...");
        // Try writeAsync if available, else write
        if (image.writeAsync) {
            await image.writeAsync(outputPath);
        } else {
            await image.write(outputPath);
        }
        console.log(`Saved to ${outputPath}`);

    } catch (error) {
        console.error('Error processing image:', error);
        if (error.message) console.error(error.message);
        if (error.stack) console.error(error.stack);
    }
}

processLogo();
