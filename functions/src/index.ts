/**
 * Firebase Cloud Functions - Avalia 360°
 *
 * ✨ CLEAN ARCHITECTURE IMPLEMENTADA ✨
 *
 * Estrutura:
 * - Domain: Entities + Repository Interfaces (núcleo puro)
 * - Application: Use Cases (regras de negócio)
 * - Infrastructure: Repositories + Services (Firestore, Crypto)
 * - Presentation: Controllers + HTTP (Cloud Functions)
 *
 * Benefícios:
 * ✅ Testabilidade: Cada camada pode ser testada isoladamente
 * ✅ Manutenibilidade: Mudanças isoladas por responsabilidade
 * ✅ Escalabilidade: Fácil adicionar novos use cases
 * ✅ Independência: Domain não depende de frameworks
 */

import * as admin from 'firebase-admin';

// Inicializa Firebase Admin (apenas uma vez)
admin.initializeApp();

// Exporta todas as Cloud Functions implementadas com Clean Architecture
export * from './presentation/http/functions';

// Exporta Cloud Functions de gerenciamento de membros (COM CRIPTOGRAFIA)
export * from './members.functions';
