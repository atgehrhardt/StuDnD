import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs';
import path from 'path';

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy index.html to dist folder with test configuration
const copyIndexHtml = () => {
  try {
    const source = path.resolve('src/index.html');
    const dest = path.resolve('dist/index.html');
    
    // Read the source file
    const content = fs.readFileSync(source, 'utf8');
    
    // Copy the debug renderer script
    try {
      const debugRendererPath = path.resolve('build_resources/debug-renderer.js');
      if (fs.existsSync(debugRendererPath)) {
        const debugRendererDest = path.resolve('dist/debug-renderer.js');
        fs.copyFileSync(debugRendererPath, debugRendererDest);
        console.log('Copied debug-renderer.js to dist folder');
      }
    } catch (err) {
      console.error('Error copying debug-renderer.js:', err);
    }
    
    // Copy the minimal bundle
    try {
      const minimalBundlePath = path.resolve('build_resources/minimal-bundle.js');
      const minimalBundleDest = path.resolve('dist/minimal-bundle.js');
      fs.copyFileSync(minimalBundlePath, minimalBundleDest);
      console.log('Copied minimal-bundle.js to dist folder');
    } catch (err) {
      console.error('Error copying minimal-bundle.js:', err);
    }
    
    // Update content with proper references for test build
    const updatedContent = content
      .replace(
        /<link rel="stylesheet" href="[^"]*">/,
        '<link rel="stylesheet" href="bundle.css">'
      )
      .replace(
        /<meta http-equiv="Content-Security-Policy"[^>]*>/,
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; connect-src \'self\' https://generativelanguage.googleapis.com; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:;">'
      )
      .replace(
        /<script src="\.\.\/build_resources\/debug-renderer\.js"><\/script>/,
        '<script src="debug-renderer.js"></script>'
      )
      .replace(
        /<script src="bundle\.js"><\/script>/,
        '<script src="minimal-bundle.js"></script>'
      );
    
    // Write the file
    fs.writeFileSync(dest, updatedContent);
    console.log('index.html copied to dist folder with updated test references');
  } catch (err) {
    console.error('Error copying index.html:', err);
  }
};
copyIndexHtml();

export default {
  input: 'src/main-test.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'dist/test-bundle.js'
  },
  plugins: [
    // Resolve node_modules
    nodeResolve({
      browser: true
    }),
    
    commonjs(),

    // Simple plugin to log build details
    {
      name: 'debug-build',
      generateBundle(outputOptions, bundle) {
        console.log(`Test bundle generated: ${outputOptions.file}`);
        for (const name in bundle) {
          const file = bundle[name];
          console.log(`- ${name} (${file.type}): ${Math.round(file.code?.length / 1024) || 0} KB`);
        }
      }
    }
  ],
  watch: {
    clearScreen: false
  }
};