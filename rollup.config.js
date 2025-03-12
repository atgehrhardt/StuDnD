import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs';
import path from 'path';

const production = !process.env.ROLLUP_WATCH;

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
    
    // Update content with proper CSS reference
    const updatedContent = content
      .replace(
        /<link rel="stylesheet" href="[^"]*">/,
        '<link rel="stylesheet" href="bundle.css">'
      )
      .replace(
        /<meta http-equiv="Content-Security-Policy"[^>]*>/,
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; connect-src \'self\' https://generativelanguage.googleapis.com; style-src \'self\' \'unsafe-inline\';">'
      );
    
    // Write the file
    fs.writeFileSync(dest, updatedContent);
    console.log('index.html copied to dist folder with updated CSS reference');
  } catch (err) {
    console.error('Error copying index.html:', err);
  }
};
copyIndexHtml();

export default {
  input: 'src/main.js',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'dist/bundle.js'
  },
  plugins: [
    svelte({
      compilerOptions: {
        // Enable run-time checks when not in production
        dev: !production
      }
    }),
    
    // Extract CSS into a separate file
    css({ 
      output: function(styles, styleNodes) {
        fs.writeFileSync('dist/bundle.css', styles);
      }
    }),

    // Resolve node_modules
    nodeResolve({
      browser: true,
      dedupe: ['svelte']
    }),
    
    commonjs(),

    // Minify in production
    production && terser(),
    
    // Custom plugin to copy index.html on change
    {
      name: 'watch-html',
      buildEnd() {
        if (this.meta.watchMode) {
          copyIndexHtml();
        }
      }
    }
  ],
  watch: {
    clearScreen: false
  }
};