# VoteQ Build System with ESBuild

## ✅ Build System Migration Complete!

Your frontend now uses a proper build process with esbuild to bundle JavaScript files from `src` into optimized bundles in `public`.

### 📁 **New Project Structure:**
```
src/                    # Source files (development)
├── app.js             # Main application entry point
├── i18n.js            # Indonesian language support
└── components/        # Mithril.js components
    ├── Login.js
    ├── Register.js
    ├── Dashboard.js
    ├── SubmissionForm.js
    ├── AdminPanel.js
    ├── AreaSetting.js
    └── CalegSetting.js

public/                # Static files served by Vercel
├── index.html         # Main HTML file
└── js/
    ├── app.js         # Bundled JavaScript (generated)
    └── app.js.map     # Source map (generated)
```

### 🔧 **Available Scripts:**

```bash
# Development build with sourcemaps
yarn build:dev
npm run build:dev

# Production build (minified)
yarn build  
npm run build

# Watch mode (rebuilds on file changes)
yarn watch
npm run watch

# Start development server with build
yarn dev
npm run dev

# Start production server with build
yarn start
npm run start
```

### 🚀 **Build Features:**

1. **ESBuild Bundling:**
   - Fast bundling and minification
   - ES2020 target for modern browsers
   - ESM module format
   - Source maps for debugging

2. **Development Workflow:**
   - Source files in `src/` directory
   - Bundled output in `public/js/`
   - Hot reload with `yarn watch`
   - Source maps for debugging

3. **Production Optimization:**
   - Minified JavaScript bundle
   - Tree shaking (unused code removal)
   - Optimized for Vercel deployment

### 📦 **Dependencies:**

- **esbuild** - Fast JavaScript bundler
- **Existing dependencies** - All backend libraries maintained

### 🔄 **Development Workflow:**

1. **Edit source files** in `src/` directory
2. **Run build command** to generate bundle:
   ```bash
   yarn build:dev  # Development build
   yarn watch      # Watch for changes
   ```
3. **Test locally** with Vercel dev:
   ```bash
   yarn dev
   ```

### 🚀 **Deployment to Vercel:**

1. **Automatic build** - Vercel runs `npm run build` automatically
2. **Serves bundled files** from `public/` directory
3. **Serverless APIs** from `api/` directory

### 🛡️ **Git Configuration:**

The following files are ignored in git:
```
public/js/app.js      # Generated bundle
public/js/app.js.map  # Generated source map
```

Source files in `src/` are tracked in version control.

### 💡 **Benefits:**

✅ **Better organization** - Source and build files separated  
✅ **Faster loading** - Minified and bundled JavaScript  
✅ **Better debugging** - Source maps for development  
✅ **Modern tooling** - ESBuild for fast builds  
✅ **Production ready** - Optimized for deployment  

Your VoteQ app now has a professional build system that's ready for both development and production! 🎉
