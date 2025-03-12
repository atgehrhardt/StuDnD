import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs';
import path from 'path';

// Detect environment
const production = !process.env.ROLLUP_WATCH; // Use production settings unless in watch mode

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy index.html to dist folder
const copyIndexHtml = () => {
  try {
    const source = path.resolve('src/index.html');
    const dest = path.resolve('dist/index.html');
    
    // Read the source file
    const content = fs.readFileSync(source, 'utf8');
    
    // Update content with proper references
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
      );
    
    // Write the file
    fs.writeFileSync(dest, updatedContent);
    console.log('index.html copied to dist folder with updated references');
  } catch (err) {
    console.error('Error copying index.html:', err);
  }
};
copyIndexHtml();

// Copy debug script and assets
function copyAssets() {
  // Create assets directory if it doesn't exist
  const assetsDir = path.resolve('dist/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  try {
    // Copy debug-renderer.js to dist
    const debugSrc = path.resolve('build_resources/debug-renderer.js');
    const debugDest = path.resolve('dist/debug-renderer.js');
    if (fs.existsSync(debugSrc)) {
      fs.copyFileSync(debugSrc, debugDest);
      console.log('Copied debug-renderer.js to dist folder');
    }
    
    // Create an empty CSS file as a fallback
    if (!fs.existsSync(path.resolve('dist/bundle.css'))) {
      fs.writeFileSync(path.resolve('dist/bundle.css'), '/* Bundled CSS */');
    }
  } catch (err) {
    console.error('Error creating/copying assets:', err);
  }
}
copyAssets();

export default {
  input: 'src/main.js',
  output: {
    sourcemap: !production, // Only include sourcemaps in development
    format: 'iife',
    name: 'app',
    file: 'dist/bundle.js',
    inlineDynamicImports: true,
  },
  plugins: [
    svelte({
      compilerOptions: {
        // Enable dev mode based on environment
        dev: !production,
        // Make sure to use hydratable mode
        hydratable: true,
        // Generate accessors for better reactivity
        accessors: true
      },
      // Make sure to emit CSS
      emitCss: true,
    }),
    
    // Extract CSS into a separate file
    css({ 
      output: 'bundle.css'
    }),

    // Resolve node_modules
    nodeResolve({
      browser: true,
      dedupe: ['svelte'],
      preferBuiltins: false
    }),
    
    commonjs({
      include: 'node_modules/**'
    }),

    // Minify for production only
    production && terser({
      compress: {
        drop_console: false,
      }
    }),
    
    // Custom build completion plugin
    {
      name: 'build-complete',
      generateBundle(outputOptions, bundle) {
        console.log('Build completed successfully.');
        console.log(`Bundle: ${outputOptions.file}`);
        
        // List all generated files
        for (const name in bundle) {
          const file = bundle[name];
          console.log(`- ${name}: ${Math.round((file.code?.length || 0) / 1024)} KB`);
        }
      }
    }
  ],
  watch: {
    clearScreen: false
  }
};