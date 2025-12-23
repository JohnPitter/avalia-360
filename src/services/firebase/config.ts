import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log das variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente do Firebase...');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Configurado' : '❌ Ausente');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Ausente');

// Validação das variáveis de ambiente
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingVars: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    console.error(`❌ Missing environment variable: ${envVar}`);
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  const errorMsg = `Firebase configuration incomplete. Missing: ${missingVars.join(', ')}`;
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
export const db = getFirestore(app);

// Log de inicialização (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔥 Firebase inicializado com sucesso');
  console.log('📊 Firestore conectado ao projeto:', firebaseConfig.projectId);
}
