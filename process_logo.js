const Jimp = require('jimp');
const path = require('path');

async function processLogo() {
    const inputPath = path.join(__dirname, 'public', 'khrunch-logo-v2.png');
    const outputPath = path.join(__dirname, 'public', 'khrunch-logo-transparent.png');

    console.log(`Processing ${inputPath}...`);

    try {
        const image = await Jimp.read(inputPath);

        // Get corner color (assuming it's the background)
        const cornerColor = image.getPixelColor(0, 0);
        const { r, g, b, a } = Jimp.intToRGBA(cornerColor);
        console.log(`Corner color: rgba(${r}, ${g}, ${b}, ${a})`);

        // Also define white and gray checkerboard colors
        // White: 255, 255, 255
        // Gray: 204, 204, 204 (approx)

        // We will scan all pixels. If a pixel matches the background or checkerboard, make it transparent.
        // We need a threshold because of potential compression artifacts or antialiasing.

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // Check for white
            if (red > 240 && green > 240 && blue > 240) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
            // Check for gray checkerboard (approx 204 or 238)
            else if (Math.abs(red - green) < 10 && Math.abs(red - blue) < 10 && (red > 190 && red < 240)) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
            // Also check against corner color if it's different
            else if (red === r && green === g && blue === b) {
                this.bitmap.data[idx + 3] = 0;
            }
        });

        // Auto-crop to remove transparent borders
        image.autocrop();

        await image.writeAsync(outputPath);
        console.log(`Saved to ${outputPath}`);

    } catch (error) {
        console.error('Error processing image:', error);
    }
}

processLogo();
