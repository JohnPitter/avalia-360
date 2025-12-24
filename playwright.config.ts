import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Testa fluxos completos de usuário:
 * - Gestor: Criar avaliação → Enviar emails → Ver resultados
 * - Colaborador: Login → Avaliar membros → Completar
 */

export default defineConfig({
  // Diretório de testes E2E
  testDir: './e2e',

  // Timeout para cada teste
  timeout: 60000, // 1 minuto por teste

  // Retry em caso de falha (CI)
  retries: process.env.CI ? 2 : 0,

  // Workers (paralelização)
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: process.env.CI
    ? [['html'], ['github'], ['list']]
    : [['html'], ['list']],

  // Global setup/teardown
  use: {
    // Base URL
    baseURL: process.env.VITE_BASE_URL || 'http://localhost:5173',

    // Trace apenas em falhas
    trace: 'retain-on-failure',

    // Screenshot apenas em falhas
    screenshot: 'only-on-failure',

    // Video apenas em falhas
    video: 'retain-on-failure',

    // Timeout para ações (click, fill, etc)
    actionTimeout: 10000,

    // Timeout para navegação
    navigationTimeout: 30000,

    // Locale
    locale: 'pt-BR',

    // Timezone
    timezoneId: 'America/Sao_Paulo',
  },

  // Projetos (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Descomentar para testar em múltiplos browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile (opcional)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Dev server local
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutos para iniciar
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output folder
  outputDir: 'e2e-results',

  // Forbid only() em CI
  forbidOnly: !!process.env.CI,
});
