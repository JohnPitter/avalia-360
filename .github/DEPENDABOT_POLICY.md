# Política de Dependabot

Este documento explica como lidamos com Pull Requests automáticos do Dependabot.

## Regra Principal: NUNCA Quebrar o Build

**Princípio #12**: Alteração da Aplicação com Build Funcional
- NUNCA commitar código que quebra o build
- NUNCA fazer merge de PRs que falham no CI/CD
- Atualizações major devem ser revisadas manualmente

## Análise de PRs - 26/12/2025

### ✅ Aceitos (Merged)

**GitHub Actions - Atualizações Seguras:**
- #1: `actions/upload-pages-artifact` v3 → v4 ✅
- #2: `actions/checkout` v4 → v6 ✅
- #4: `actions/configure-pages` v4 → v5 ✅

**Critério**: GitHub Actions geralmente são backwards compatible. Todos os checks passaram.

---

### ❌ Rejeitados (Fechados - Breaking Changes)

**TypeScript/ESLint:**
- #14: `@typescript-eslint/parser` v6.21.0 → v8.50.1 ❌
- #11: `eslint` v8.57.1 → v9.39.2 ❌

**Motivo**: Atualizações major quebram configuração ESLint existente. Requer migração manual.

**React:**
- #7: `react` e `@types/react` (atualização major) ❌

**Motivo**: Atualização de React pode quebrar componentes. Requer teste extensivo.

**Vitest:**
- #13: `@vitest/ui` v1.6.1 → v4.0.16 ❌
- #9: `@vitest/coverage-v8` v1.6.1 → v4.0.16 ❌

**Motivo**: Atualização major de Vitest v1 → v4 pode quebrar configuração e mocks.

**Form Libraries:**
- #12: `@hookform/resolvers` v3.10.0 → v5.2.2 ❌

**Motivo**: Atualização major pode quebrar validações de formulário.

**UI Libraries:**
- #8: `lucide-react` v0.303.0 → v0.562.0 ❌

**Motivo**: Atualização minor grande pode ter ícones renomeados/removidos.

**Email:**
- #10: `@emailjs/browser` v3.12.1 → v4.4.1 ❌

**Motivo**: Atualização major pode quebrar API de envio de emails.

**Types:**
- #6: `@types/dompurify` v3.0.5 → v3.2.0 ❌

**Motivo**: Atualização minor de types pode causar erros TypeScript.

---

## Política de Atualizações

### ✅ Auto-Merge (Permitido)

**GitHub Actions:**
- Atualizações minor/patch: ✅ Auto-merge se CI passar
- Atualizações major: ✅ Auto-merge se CI passar (actions são stable)

**Dependências de Produção:**
- Patch releases (bug fixes): ✅ Auto-merge se CI passar
- Exemplo: `1.2.3` → `1.2.4`

**Dependências de Desenvolvimento:**
- Patch releases: ✅ Auto-merge se CI passar

### ⚠️ Revisão Manual (Obrigatória)

**Dependências de Produção:**
- Minor releases: ⚠️ Revisar changelog + testar
- Exemplo: `1.2.3` → `1.3.0`
- Major releases: ⚠️ Revisar breaking changes + migração
- Exemplo: `1.2.3` → `2.0.0`

**Dependências de Desenvolvimento:**
- Minor releases: ⚠️ Revisar se CI falhar
- Major releases: ⚠️ Sempre revisar manualmente

### ❌ Rejeitar Automaticamente

**Qualquer atualização que:**
- ❌ Falha no CI/CD
- ❌ Quebra testes
- ❌ Quebra build TypeScript
- ❌ Falha no security audit

---

## Processo de Atualização Manual

Para dependências rejeitadas que precisam ser atualizadas:

### 1. Criar Branch de Teste
```bash
git checkout -b update/package-name-vX.X.X
```

### 2. Atualizar Dependência
```bash
npm install package-name@latest
```

### 3. Verificar Breaking Changes
- Ler CHANGELOG.md do package
- Identificar breaking changes
- Planejar migração

### 4. Atualizar Código
- Ajustar imports se necessário
- Atualizar configuração
- Ajustar mocks em testes

### 5. Validar Localmente
```bash
npm run build          # Build deve passar
npx tsc --noEmit       # TypeScript deve passar
npm test -- --run      # Testes devem passar
node scripts/smart-audit.cjs  # Security deve passar
```

### 6. Criar PR Manual
```bash
git add package.json package-lock.json
git commit -m "chore(deps): Update package-name to vX.X.X

Breaking changes addressed:
- Change 1
- Change 2

Tests: All passing
Build: OK
Security: OK"

git push origin update/package-name-vX.X.X
```

### 7. Aguardar CI e Fazer Merge
- CI DEVE estar verde
- Todos os checks DEVEM passar
- Então fazer merge

---

## Configuração Dependabot

Nossa configuração atual (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    groups:
      development-dependencies:
        patterns:
          - "@types/*"
          - "@testing-library/*"
    open-pull-requests-limit: 10

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
```

---

## Resumo

✅ **3 PRs aceitos** (GitHub Actions)
❌ **9 PRs rejeitados** (Breaking changes que falharam CI)

**Seguindo princípio #12**: Build funcional sempre, atualizações major apenas com revisão e testes completos.
