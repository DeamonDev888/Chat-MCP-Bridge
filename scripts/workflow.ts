import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Antigravity Workspace Orchestrator
 * This script handles the full workflow for the decoupled MCP project.
 */

const ROOT = process.cwd();
const SERVER_DIR = path.join(ROOT, 'server');

function run(command: string, cwd: string = ROOT) {
    console.log(`\n🚀 Executing: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(`\n❌ Failed: ${command}`);
        process.exit(1);
    }
}

async function workflow() {
    console.log("🌌 Starting Antigravity Workflow...");

    // 1. Clean
    console.log("\n🧹 Step 1: Cleaning Workspace...");
    const cleanup = ['dist', 'server/dist', 'node_modules/.vite'];
    cleanup.forEach(dir => {
        const fullPath = path.join(ROOT, dir);
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`   - Deleted ${dir}`);
        }
    });

    // 2. Local Setup
    console.log("\n📦 Step 2: Synchronizing Dependencies...");
    run('pnpm install');
    if (fs.existsSync(SERVER_DIR)) {
        run('pnpm install', SERVER_DIR);
    }

    // 3. Compiling
    console.log("\n🏗️ Step 3: Building Packages...");
    run('pnpm build'); // This runs the multi-build script from package.json

    // 4. Verification
    console.log("\n🔍 Step 4: Verifying Build Artifacts...");
    const artifacts = [
        path.join(ROOT, 'dist/index.html'),
        path.join(ROOT, 'server/dist/index.js')
    ];
    
    artifacts.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ Found: ${path.relative(ROOT, file)}`);
        } else {
            console.error(`   ❌ Missing: ${path.relative(ROOT, file)}`);
            process.exit(1);
        }
    });

    console.log("\n✨ Workflow Complete! Ready for Deployment.");
    console.log("👉 Run 'pnpm dev' to start the environment.");
}

workflow().catch(err => {
    console.error(err);
    process.exit(1);
});
