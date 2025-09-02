// SCRIPT SIMPLES PARA TESTAR CONEXÃO COM POSTGRESQL
// Execute: node test-connection.js

const { testConnection } = require('./src/config/database');

console.log('🔍 TESTANDO CONEXÃO COM POSTGRESQL...\n');

testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 TUDO FUNCIONANDO! Podemos continuar com segurança.');
      process.exit(0);
    } else {
      console.log('\n⚠️  PROBLEMA NA CONEXÃO! Vamos verificar...');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 ERRO CRÍTICO:', error);
    process.exit(1);
  });