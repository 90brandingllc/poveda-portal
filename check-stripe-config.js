#!/usr/bin/env node
/**
 * Script to check Stripe configuration in both frontend and backend
 * Run: node check-stripe-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🔍 STRIPE CONFIGURATION CHECKER');
console.log('='.repeat(60));

// Check 1: Frontend Stripe Key
console.log('\n1️⃣  FRONTEND CONFIGURATION');
console.log('-'.repeat(60));

const srcStripeServicePath = path.join(__dirname, 'src', 'services', 'stripeService.js');
if (fs.existsSync(srcStripeServicePath)) {
  const content = fs.readFileSync(srcStripeServicePath, 'utf8');
  
  if (content.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY')) {
    console.log('✅ stripeService.js usa REACT_APP_STRIPE_PUBLISHABLE_KEY');
  } else {
    console.log('❌ No se encontró REACT_APP_STRIPE_PUBLISHABLE_KEY en stripeService.js');
  }
  
  // Check if there's a hardcoded key (bad practice)
  if (content.match(/loadStripe\(['"`]pk_/)) {
    console.log('⚠️  WARNING: Parece haber una clave de Stripe hardcoded');
  }
} else {
  console.log('❌ No se encontró src/services/stripeService.js');
}

// Check 2: Environment variables in .env files
console.log('\n2️⃣  ENVIRONMENT FILES');
console.log('-'.repeat(60));

const envFiles = ['.env', '.env.local', '.env.production', '.env.example'];
let foundEnvConfig = false;

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    console.log(`📄 Encontrado: ${envFile}`);
    const content = fs.readFileSync(envPath, 'utf8');
    
    if (content.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY')) {
      foundEnvConfig = true;
      const match = content.match(/REACT_APP_STRIPE_PUBLISHABLE_KEY=(.+)/);
      if (match) {
        const key = match[1].trim();
        if (key.startsWith('pk_test_')) {
          console.log(`   🧪 Clave de TEST encontrada: ${key.substring(0, 20)}...`);
        } else if (key.startsWith('pk_live_')) {
          console.log(`   🟢 Clave de PRODUCCIÓN encontrada: ${key.substring(0, 20)}...`);
        } else if (key.startsWith('pk_')) {
          console.log(`   ⚠️  Clave encontrada pero formato desconocido: ${key.substring(0, 20)}...`);
        } else {
          console.log(`   ❌ Valor no parece ser una clave válida de Stripe`);
        }
      }
    }
  }
});

if (!foundEnvConfig) {
  console.log('❌ No se encontró REACT_APP_STRIPE_PUBLISHABLE_KEY en ningún archivo .env');
  console.log('   💡 Debe configurarse en Vercel Dashboard > Environment Variables');
}

// Check 3: Backend Firebase Functions
console.log('\n3️⃣  BACKEND CONFIGURATION (Firebase Functions)');
console.log('-'.repeat(60));

const functionsIndexPath = path.join(__dirname, 'functions', 'index.js');
if (fs.existsSync(functionsIndexPath)) {
  const content = fs.readFileSync(functionsIndexPath, 'utf8');
  
  // Check Stripe initialization
  const stripeInitMatch = content.match(/const stripe = require\('stripe'\)\(([\s\S]*?)\);/);
  if (stripeInitMatch) {
    console.log('✅ Stripe SDK inicializado en functions/index.js');
    console.log('   Configuración detectada:');
    
    if (content.includes('functions.config().stripe')) {
      console.log('   📌 Usa Firebase Functions Config (stripe.live_secret_key)');
    }
    if (content.includes('process.env.STRIPE_')) {
      console.log('   📌 Usa Variables de Entorno (process.env.STRIPE_*)');
    }
    if (content.includes('NODE_ENV')) {
      console.log('   📌 Tiene lógica de desarrollo/producción basada en NODE_ENV');
    }
  } else {
    console.log('❌ No se encontró inicialización de Stripe en functions/index.js');
  }
  
  // Check if createPaymentIntent exists
  if (content.includes('exports.createPaymentIntent')) {
    console.log('✅ Función createPaymentIntent existe');
  } else {
    console.log('❌ No se encontró exports.createPaymentIntent');
  }
  
  // Check if confirmPayment exists
  if (content.includes('exports.confirmPayment')) {
    console.log('✅ Función confirmPayment existe');
  } else {
    console.log('❌ No se encontró exports.confirmPayment');
  }
} else {
  console.log('❌ No se encontró functions/index.js');
}

// Check 4: Package.json dependencies
console.log('\n4️⃣  DEPENDENCIES');
console.log('-'.repeat(60));

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (allDeps['@stripe/stripe-js']) {
    console.log(`✅ @stripe/stripe-js: ${allDeps['@stripe/stripe-js']}`);
  } else {
    console.log('❌ @stripe/stripe-js no está instalado en frontend');
  }
  
  if (allDeps['@stripe/react-stripe-js']) {
    console.log(`✅ @stripe/react-stripe-js: ${allDeps['@stripe/react-stripe-js']}`);
  } else {
    console.log('❌ @stripe/react-stripe-js no está instalado en frontend');
  }
}

const functionsPackageJsonPath = path.join(__dirname, 'functions', 'package.json');
if (fs.existsSync(functionsPackageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(functionsPackageJsonPath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (allDeps['stripe']) {
    console.log(`✅ stripe (backend): ${allDeps['stripe']}`);
  } else {
    console.log('❌ stripe no está instalado en functions');
  }
}

// Check 5: Firebase config
console.log('\n5️⃣  FIREBASE CONFIGURATION');
console.log('-'.repeat(60));

const firebaseJsonPath = path.join(__dirname, 'firebase.json');
if (fs.existsSync(firebaseJsonPath)) {
  console.log('✅ firebase.json existe');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  
  if (firebaseConfig.functions) {
    console.log('✅ Configuración de Functions encontrada');
  }
} else {
  console.log('❌ firebase.json no encontrado');
}

console.log('\n' + '='.repeat(60));
console.log('📋 RESUMEN Y PRÓXIMOS PASOS');
console.log('='.repeat(60));
console.log('\n🔧 Para verificar la configuración de Firebase Functions, ejecuta:');
console.log('   firebase functions:config:get stripe');
console.log('\n🔧 Para configurar las claves de Stripe en Firebase:');
console.log('   firebase functions:config:set stripe.live_secret_key="sk_live_..."');
console.log('\n🔧 Para Vercel, agrega la variable de entorno:');
console.log('   Variable: REACT_APP_STRIPE_PUBLISHABLE_KEY');
console.log('   Valor: pk_live_... (tu clave pública de producción)');
console.log('\n📚 Documentación:');
console.log('   - Stripe Dashboard: https://dashboard.stripe.com/apikeys');
console.log('   - Vercel Env Vars: https://vercel.com/docs/environment-variables');
console.log('   - Firebase Config: https://firebase.google.com/docs/functions/config-env');
console.log('\n' + '='.repeat(60));

