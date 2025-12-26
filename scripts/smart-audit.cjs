#!/usr/bin/env node

/**
 * Smart Security Audit
 *
 * Realiza npm audit com regras inteligentes:
 * - Vulnerabilidades HIGH/CRITICAL em dependencies de produção: FALHA
 * - Vulnerabilidades MODERATE em dev-only packages: ACEITA
 * - Vulnerabilidades em dependências transitivas de dev: ACEITA
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Pacotes que são exclusivamente de desenvolvimento
const DEV_ONLY_PACKAGES = new Set([
  'vite',
  'vitest',
  'esbuild',
  '@vitest/ui',
  '@vitest/coverage-v8',
  'vite-node',
  '@playwright/test',
  'eslint',
  '@types/',
  '@testing-library/'
]);

// Vulnerabilidades conhecidas aceitas (com justificativa)
const ACCEPTED_VULNERABILITIES = {
  'xlsx': {
    severity: 'high',
    reason: 'ReDoS vulnerability in SheetJS - Accepted because: ' +
            '1) Used only for controlled file upload by authenticated managers, ' +
            '2) No user-facing input parsing, ' +
            '3) Limited attack surface in controlled environment, ' +
            '4) No fix available from upstream'
  }
};

function isDevOnlyPackage(packageName) {
  if (DEV_ONLY_PACKAGES.has(packageName)) {
    return true;
  }

  // Checa se começa com algum padrão de dev
  for (const pattern of DEV_ONLY_PACKAGES) {
    if (pattern.endsWith('/') && packageName.startsWith(pattern)) {
      return true;
    }
  }

  return false;
}

try {
  console.log('🔍 Running smart security audit...\n');

  // Executa npm audit em formato JSON
  let auditResult;
  try {
    auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  } catch (error) {
    // npm audit retorna exit code 1 se há vulnerabilidades
    auditResult = error.stdout;
  }

  const audit = JSON.parse(auditResult);

  if (!audit.vulnerabilities || Object.keys(audit.vulnerabilities).length === 0) {
    console.log('✅ No vulnerabilities found!\n');
    process.exit(0);
  }

  // Analisa vulnerabilidades
  const critical = [];
  const high = [];
  const moderate = [];
  const low = [];
  const devOnly = [];
  const accepted = [];

  for (const [packageName, vuln] of Object.entries(audit.vulnerabilities)) {
    const severity = vuln.severity.toLowerCase();
    const isDevPackage = isDevOnlyPackage(packageName);
    const isAccepted = ACCEPTED_VULNERABILITIES[packageName];

    const vulnInfo = {
      package: packageName,
      severity: vuln.severity,
      title: vuln.via[0]?.title || 'Unknown',
      url: vuln.via[0]?.url || '',
      isDev: isDevPackage,
      reason: isAccepted?.reason
    };

    if (isAccepted && severity === isAccepted.severity) {
      accepted.push(vulnInfo);
    } else if (isDevPackage && severity === 'moderate') {
      devOnly.push(vulnInfo);
    } else {
      switch (severity) {
        case 'critical':
          critical.push(vulnInfo);
          break;
        case 'high':
          high.push(vulnInfo);
          break;
        case 'moderate':
          moderate.push(vulnInfo);
          break;
        case 'low':
          low.push(vulnInfo);
          break;
      }
    }
  }

  // Relatório
  console.log('📊 Security Audit Report:\n');

  if (critical.length > 0) {
    console.log('🔴 CRITICAL:', critical.length);
    critical.forEach(v => console.log(`   - ${v.package}: ${v.title}`));
    console.log('');
  }

  if (high.length > 0) {
    console.log('🟠 HIGH:', high.length);
    high.forEach(v => console.log(`   - ${v.package}: ${v.title}`));
    console.log('');
  }

  if (moderate.length > 0) {
    console.log('🟡 MODERATE (Production):', moderate.length);
    moderate.forEach(v => console.log(`   - ${v.package}: ${v.title}`));
    console.log('');
  }

  if (devOnly.length > 0) {
    console.log('⚪ MODERATE (Dev-only - Accepted):', devOnly.length);
    devOnly.forEach(v => console.log(`   - ${v.package}: ${v.title}`));
    console.log('');
  }

  if (accepted.length > 0) {
    console.log('✓ Accepted Vulnerabilities:', accepted.length);
    accepted.forEach(v => {
      console.log(`   - ${v.package} (${v.severity}): ${v.title}`);
      console.log(`     Reason: ${v.reason}`);
    });
    console.log('');
  }

  if (low.length > 0) {
    console.log('🔵 LOW:', low.length);
    console.log('');
  }

  // Decisão
  const hasProductionIssues = critical.length > 0 || high.length > 0 || moderate.length > 0;

  if (hasProductionIssues) {
    console.log('❌ FAILED: Found high-severity vulnerabilities in production dependencies\n');
    console.log('💡 Run `npm audit` for detailed report');
    console.log('🔧 Try `npm audit fix` or update packages manually\n');
    process.exit(1);
  } else {
    console.log('✅ PASSED: All production dependencies are secure');
    if (devOnly.length > 0) {
      console.log('ℹ️  Note: Some moderate vulnerabilities exist in dev-only packages (accepted)\n');
    }
    process.exit(0);
  }

} catch (error) {
  console.error('❌ Error running audit:', error.message);
  process.exit(1);
}
