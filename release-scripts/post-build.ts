 (async () => {
  const CONTENT_BUILD_PATH = 'src/extension/content.js';
  const METAMASK_INJECT_PATH = 'src/extension/inject.js';

  const fs = (await import('fs')).default;
  const path = (await import('path')).default;

  const MANIFEST_PATH = 'dist/manifest.json';
  const DIST_ASSETS_DIR = 'dist/assets/';

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log('[post-build] dist/manifest.json not found, nothing to do');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

   if (Array.isArray(pkg.content_scripts) && pkg.content_scripts.length) {
     const contentBlock =
      pkg.content_scripts.find(
        (cs: any) => Array.isArray(cs?.js) && cs.js.some((p: string) => p.includes('content.js'))
      ) ?? pkg.content_scripts[0];

    if (Array.isArray(contentBlock?.js) && contentBlock.js.length > 0) {
      contentBlock.js[0] = CONTENT_BUILD_PATH;
      console.log('[post-build] content.js path normalized');
    }
  }

   let injectBlock: any | undefined = undefined;
  if (Array.isArray(pkg.content_scripts)) {
    injectBlock = pkg.content_scripts.find(
      (cs: any) => Array.isArray(cs?.js) && cs.js.some((p: string) => p.includes('inject.js'))
    );
  }

  if (injectBlock && Array.isArray(injectBlock.js) && injectBlock.js.length > 0) {
    injectBlock.js[0] = METAMASK_INJECT_PATH;
    console.log('[post-build] inject.js path normalized');
  } else {
    console.log('[post-build] no inject.js content script found — skipping');
  }

   fs.writeFileSync(MANIFEST_PATH, JSON.stringify(pkg, null, 2));

 
  if (fs.existsSync('src/extension/content.js')) {
    const distContentPath = path.join('dist', CONTENT_BUILD_PATH);
    fs.mkdirSync(path.dirname(distContentPath), { recursive: true });
    fs.writeFileSync(distContentPath, fs.readFileSync('src/extension/content.js', 'utf-8'));
  } else {
    console.warn('[post-build] src/extension/content.js not found');
  }

   if (injectBlock && fs.existsSync('src/extension/inject.js')) {
    const distInjectPath = path.join('dist', METAMASK_INJECT_PATH);
    fs.mkdirSync(path.dirname(distInjectPath), { recursive: true });
    fs.writeFileSync(distInjectPath, fs.readFileSync('src/extension/inject.js', 'utf-8'));
  }

   if (fs.existsSync(DIST_ASSETS_DIR)) {
    const files = fs.readdirSync(DIST_ASSETS_DIR);
    for (const file of files) {
      if (file.startsWith('content') || file.startsWith('inject')) {
        try {
          fs.unlinkSync(path.resolve(DIST_ASSETS_DIR, file));
        } catch {
        
        }
      }
    }
  }

  console.log('[post-build] done');
})();

