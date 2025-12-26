/**
 * Serviço de Configuração de Debug
 * Controla exibição de logs no console via Firestore
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

interface DebugConfig {
  enabled: boolean;
  level: 'info' | 'warn' | 'error' | 'debug';
  lastUpdated: number;
}

// Cache da configuração (para não fazer query toda vez)
let cachedConfig: DebugConfig | null = null;
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Busca configuração de debug do Firestore
 */
export async function getDebugConfig(): Promise<DebugConfig> {
  try {
    // Retorna cache se ainda válido
    if (cachedConfig && Date.now() - lastFetch < CACHE_TTL) {
      return cachedConfig;
    }

    const configRef = doc(db, 'app_config', 'debug');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const data = configSnap.data() as DebugConfig;
      cachedConfig = data;
      lastFetch = Date.now();
      return data;
    }

    // Configuração padrão (debug desabilitado em produção)
    const defaultConfig: DebugConfig = {
      enabled: import.meta.env.DEV, // Habilitado apenas em desenvolvimento
      level: 'info',
      lastUpdated: Date.now(),
    };

    // Cria documento se não existir
    await setDoc(configRef, defaultConfig);
    cachedConfig = defaultConfig;
    lastFetch = Date.now();

    return defaultConfig;
  } catch (error) {
    // Em caso de erro, retorna configuração padrão
    const fallbackConfig: DebugConfig = {
      enabled: import.meta.env.DEV,
      level: 'info',
      lastUpdated: Date.now(),
    };
    return fallbackConfig;
  }
}

/**
 * Atualiza configuração de debug no Firestore
 */
export async function setDebugConfig(enabled: boolean, level?: 'info' | 'warn' | 'error' | 'debug'): Promise<void> {
  try {
    const config: DebugConfig = {
      enabled,
      level: level || 'info',
      lastUpdated: Date.now(),
    };

    const configRef = doc(db, 'app_config', 'debug');
    await setDoc(configRef, config);

    // Atualiza cache
    cachedConfig = config;
    lastFetch = Date.now();
  } catch (error) {
    console.error('Erro ao atualizar configuração de debug:', error);
  }
}

/**
 * Verifica se debug está habilitado (com cache)
 */
export async function isDebugEnabled(): Promise<boolean> {
  const config = await getDebugConfig();
  return config.enabled;
}

/**
 * Limpa cache (força nova busca na próxima chamada)
 */
export function clearDebugCache(): void {
  cachedConfig = null;
  lastFetch = 0;
}
