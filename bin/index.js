
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function safeMkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } else {
    console.log(`⚠️  ${dir} already exists, skipping creation.`);
  }
}

function safeExec(command, options = {}) {
  try {
    execSync(command, { ...options, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}



function setupFrontend() {
  console.log('\n💻 Setting up Frontend...');

  if (!safeExec('npm create vite@latest frontend -- --template react-ts')) return false;
  if (!safeExec('cd frontend && npm install')) return false;
  if (!safeExec('cd frontend && npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss')) return false;

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

  const postcssConfig = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}`;

  try {
    fs.writeFileSync(path.join('frontend', 'tailwind.config.js'), tailwindConfig);
    fs.writeFileSync(path.join('frontend', 'postcss.config.js'), postcssConfig);
    console.log('✅ Created Tailwind and PostCSS config files');
  } catch (error) {
    console.error('❌ Error creating config files:', error.message);
    return false;
  }

  const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

  try {
    fs.writeFileSync(path.join('frontend', 'src', 'index.css'), cssContent);
    console.log('✅ Updated frontend/src/index.css');
  } catch (error) {
    console.error('❌ Error updating index.css:', error.message);
    return false;
  }

  return true;
}





function setupBackend() {
  console.log('\n📦 Setting up Backend...');
  safeMkdir('backend/src');

  const serverContent = `import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the MERN API' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`;

  try {
    fs.writeFileSync(path.join('backend', 'src', 'index.ts'), serverContent);
    console.log('✅ Created backend/src/index.ts');
  } catch (error) {
    console.error('❌ Error creating index.ts:', error.message);
    return false;
  }

  try {
    if (!safeExec('cd backend && npm init -y')) return false;
    if (!safeExec('cd backend && npm install express')) return false;
    if (!safeExec('cd backend && npm install -D typescript ts-node nodemon @types/node @types/express')) return false;

    const tsconfigContent = `{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`;

    fs.writeFileSync(path.join('backend', 'tsconfig.json'), tsconfigContent);
    console.log('✅ Created backend/tsconfig.json');

    const packageJsonPath = path.join('backend', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
      packageJson.scripts = {
        ...packageJson.scripts,
        "start": "node dist/index.js",
        "build": "tsc",
        "dev": "nodemon --exec ts-node src/index.ts"
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated backend/package.json');
    }
  } catch (error) {
    console.error('❌ Error setting up backend:', error.message);
    return false;
  }

  return true;
}

async function setupProject() {
  console.log('Initializing MERN Stack project with TypeScript...\n');

  if (!setupBackend()) {
    console.error('❌ Backend setup failed');
    process.exit(1);
  }

  if (!setupFrontend()) {
    console.error('❌ Frontend setup failed');
    process.exit(1);
  }

  console.log('\n✨ Project setup complete! Next steps:');
  console.log('1. cd backend && npm run dev     # Start the backend server');
  console.log('2. cd frontend && npm run dev    # Start the frontend dev server');
}

setupProject().catch(console.error);