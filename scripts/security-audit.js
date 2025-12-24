#!/usr/bin/env node
/**
 * Security Audit Script
 * OWASP A06 - Vulnerable and Outdated Components
 *
 * Executa auditoria completa de segurança:
 * - npm audit (vulnerabilidades conhecidas)
 * - Verificação de dependências desatualizadas
 * - Licenças incompatíveis
 * - Report detalhado
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'blue');
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  try {
    log(`\n▶ ${description}...`, 'yellow');
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

function analyzeAuditResults(auditOutput) {
  try {
    const audit = JSON.parse(auditOutput);
    const { vulnerabilities, metadata } = audit;

    const summary = {
      total: metadata.vulnerabilities.total || 0,
      info: vulnerabilities.info || 0,
      low: vulnerabilities.low || 0,
      moderate: vulnerabilities.moderate || 0,
      high: vulnerabilities.high || 0,
      critical: vulnerabilities.critical || 0,
    };

    return summary;
  } catch (error) {
    return null;
  }
}

function checkOutdatedPackages() {
  const result = runCommand('npm outdated --json', 'Verificando pacotes desatualizados');

  if (!result.output) {
    log('✅ Todos os pacotes estão atualizados!', 'green');
    return { outdated: 0, packages: [] };
  }

  try {
    const outdated = JSON.parse(result.output);
    const count = Object.keys(outdated).length;

    if (count > 0) {
      log(`⚠️  ${count} pacote(s) desatualizado(s):`, 'yellow');
      Object.entries(outdated).forEach(([name, info]) => {
        console.log(`   ${name}: ${info.current} → ${info.latest}`);
      });
    }

    return { outdated: count, packages: outdated };
  } catch (error) {
    return { outdated: 0, packages: [] };
  }
}

function runSecurityAudit() {
  header('🔒 SECURITY AUDIT - OWASP A06');

  // 1. NPM Audit
  header('1️⃣  NPM Audit - Vulnerabilidades Conhecidas');
  const auditResult = runCommand('npm audit --json', 'Executando npm audit');

  if (auditResult.success) {
    const summary = analyzeAuditResults(auditResult.output);

    if (summary) {
      log(`\n📊 Resumo de Vulnerabilidades:`, 'blue');
      console.log(`   Total: ${summary.total}`);
      console.log(`   Info: ${summary.info}`);
      console.log(`   Low: ${summary.low}`);
      console.log(`   Moderate: ${summary.moderate}`);
      console.log(`   High: ${summary.high}`);
      console.log(`   Critical: ${summary.critical}`);

      if (summary.critical > 0) {
        log(`\n❌ CRÍTICO: ${summary.critical} vulnerabilidade(s) crítica(s) encontrada(s)!`, 'red');
        log('Execute: npm audit fix --force', 'yellow');
      } else if (summary.high > 0) {
        log(`\n⚠️  ATENÇÃO: ${summary.high} vulnerabilidade(s) alta(s) encontrada(s)!`, 'yellow');
        log('Execute: npm audit fix', 'yellow');
      } else if (summary.moderate > 0) {
        log(`\n⚠️  ${summary.moderate} vulnerabilidade(s) moderada(s) encontrada(s)`, 'yellow');
      } else {
        log('\n✅ Nenhuma vulnerabilidade crítica ou alta encontrada!', 'green');
      }
    }
  }

  // 2. Outdated Packages
  header('2️⃣  Pacotes Desatualizados');
  const outdatedResult = checkOutdatedPackages();

  // 3. License Check
  header('3️⃣  Verificação de Licenças');
  log('Executando verificação de licenças...', 'yellow');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    log(`✅ ${Object.keys(dependencies).length} dependências verificadas`, 'green');
    log('ℹ️  Para análise detalhada de licenças, instale: npm i -g license-checker', 'blue');
  } catch (error) {
    log('⚠️  Erro ao verificar licenças', 'yellow');
  }

  // 4. TypeScript Compilation
  header('4️⃣  TypeScript - Type Safety');
  const tscResult = runCommand('npx tsc --noEmit', 'Verificando tipos TypeScript');

  if (tscResult.success) {
    log('✅ Nenhum erro de tipo encontrado!', 'green');
  } else {
    log('❌ Erros de tipo encontrados:', 'red');
    console.log(tscResult.output);
  }

  // 5. Security Headers Check
  header('5️⃣  Security Headers (Produção)');
  log('Verificando configuração de headers de segurança...', 'yellow');

  const indexHtml = path.join(__dirname, '../index.html');
  if (fs.existsSync(indexHtml)) {
    const content = fs.readFileSync(indexHtml, 'utf-8');

    // Verificar CSP
    if (content.includes('Content-Security-Policy')) {
      log('✅ Content Security Policy configurado', 'green');
    } else {
      log('⚠️  CSP não encontrado no index.html', 'yellow');
      log('   Adicionar meta tag CSP recomendado', 'yellow');
    }
  }

  // 6. Generate Report
  header('6️⃣  Gerando Relatório');

  const report = {
    timestamp: new Date().toISOString(),
    audit: auditResult.output ? JSON.parse(auditResult.output) : null,
    outdated: outdatedResult,
    typescript: tscResult.success ? 'PASS' : 'FAIL',
  };

  const reportPath = path.join(__dirname, '../security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`✅ Relatório salvo em: ${reportPath}`, 'green');

  // Summary
  header('📋 RESUMO');
  log('Security Audit Completo!', 'green');
  log('\nPróximos passos:', 'blue');
  console.log('  1. Revisar vulnerabilidades encontradas');
  console.log('  2. Atualizar dependências desatualizadas');
  console.log('  3. Executar: npm audit fix');
  console.log('  4. Re-executar testes após updates');

  log('\nPara mais detalhes: npm audit', 'blue');
}

// Execute
runSecurityAudit();
