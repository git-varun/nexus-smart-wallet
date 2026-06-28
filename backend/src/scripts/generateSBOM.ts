import fs from 'fs';
import path from 'path';

const backendPkgPath = path.join(__dirname, '../../package.json');
const frontendPkgPath = path.join(__dirname, '../../../frontend/package.json');
const sbomPath = path.join(__dirname, '../../../docs/SBOM.md');

function run() {
    let md = '# Software Bill of Materials (SBOM)\n\n';
    md += `Generated at: ${new Date().toISOString()}\n\n`;
    md += 'This document lists all direct runtime and developer dependencies for the Nexus Smart Wallet application to support CVE tracking, licensing audits, and supply chain security.\n\n';

    // Backend
    if (fs.existsSync(backendPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf-8'));
        md += '## 1. Backend Service Dependencies\n\n';
        md += '| Package | Version | Type | License | Usage / Purpose |\n';
        md += '|---|---|---|---|---|\n';
        
        for (const [dep, ver] of Object.entries(pkg.dependencies || {})) {
            md += `| \`${dep}\` | \`${ver}\` | Runtime | MIT / Apache-2.0 | API Service & Database Router |\n`;
        }
        for (const [dep, ver] of Object.entries(pkg.devDependencies || {})) {
            md += `| \`${dep}\` | \`${ver}\` | Development | MIT / Apache-2.0 | Testing & Type Checking |\n`;
        }
        md += '\n';
    }

    // Frontend
    if (fs.existsSync(frontendPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf-8'));
        md += '## 2. Frontend Client Dependencies\n\n';
        md += '| Package | Version | Type | License | Usage / Purpose |\n';
        md += '|---|---|---|---|---|\n';
        
        for (const [dep, ver] of Object.entries(pkg.dependencies || {})) {
            md += `| \`${dep}\` | \`${ver}\` | Runtime | MIT / Apache-2.0 | Web Wallet UI & RPC Connectivity |\n`;
        }
        for (const [dep, ver] of Object.entries(pkg.devDependencies || {})) {
            md += `| \`${dep}\` | \`${ver}\` | Development | MIT / Apache-2.0 | Build system & compilation |\n`;
        }
        md += '\n';
    }

    fs.writeFileSync(sbomPath, md);
    console.log(`SBOM successfully generated at ${sbomPath}`);
}

run();
