const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = [
  './build_resources/icons/mac',
  './build_resources/icons/win',
  './build_resources/icons/linux',
  './build_resources/icons/png'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Define icon sizes for each platform
const icons = [
  { size: 16, platforms: ['win', 'mac', 'linux'] },
  { size: 24, platforms: ['win'] },
  { size: 32, platforms: ['win', 'mac', 'linux'] },
  { size: 48, platforms: ['win', 'linux'] },
  { size: 64, platforms: ['win', 'mac'] },
  { size: 96, platforms: ['win'] },
  { size: 128, platforms: ['mac', 'linux'] },
  { size: 256, platforms: ['win', 'mac', 'linux'] },
  { size: 512, platforms: ['mac', 'linux'] },
  { size: 1024, platforms: ['mac', 'linux'] }
];

// Source SVG
const svgPath = path.join(__dirname, 'icons', 'icon.svg');

// Create a high-res PNG first
sharp(svgPath)
  .png()
  .toFile(path.join(__dirname, 'icons', 'icon.png'))
  .then(() => {
    // Now create all sized PNGs
    const sourcePng = path.join(__dirname, 'icons', 'icon.png');
    
    // Generate all sizes
    icons.forEach(({ size, platforms }) => {
      sharp(sourcePng)
        .resize(size, size)
        .toFile(path.join(__dirname, 'icons', 'png', `${size}x${size}.png`))
        .then(() => {
          console.log(`Created ${size}x${size}.png`);
          
          // Copy to platform-specific folders
          platforms.forEach(platform => {
            fs.copyFileSync(
              path.join(__dirname, 'icons', 'png', `${size}x${size}.png`),
              path.join(__dirname, 'icons', platform, `${size}x${size}.png`)
            );
            console.log(`Copied to ${platform} folder`);
          });
        })
        .catch(err => console.error(`Error processing ${size}x${size}.png:`, err));
    });
    
    console.log('All icons generated successfully!');
  })
  .catch(err => console.error('Error converting SVG to PNG:', err));