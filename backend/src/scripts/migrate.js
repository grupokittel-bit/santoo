// SCRIPT DE MIGRAÇÃO
// Cria todas as tabelas no banco de dados

const { syncDatabase, testModels } = require('../models');

async function migrate() {
  console.log('🚀 INICIANDO MIGRAÇÃO DO BANCO SANTOO...\n');
  
  try {
    // Pergunta se quer recriar tudo ou só sincronizar
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');
    
    if (force) {
      console.log('⚠️  MODO FORCE: Todas as tabelas serão recriadas!');
      console.log('⚠️  ATENÇÃO: Todos os dados existentes serão perdidos!');
      console.log('⏳ Aguardando 3 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 1. Sincroniza banco (cria tabelas)
    const syncSuccess = await syncDatabase(force);
    if (!syncSuccess) {
      console.error('💥 MIGRAÇÃO FALHOU na sincronização!');
      process.exit(1);
    }
    
    // 2. Testa modelos
    const testSuccess = await testModels();
    if (!testSuccess) {
      console.error('💥 MIGRAÇÃO FALHOU nos testes!');
      process.exit(1);
    }
    
    console.log('🎊 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Execute: npm run dev');
    console.log('   2. Teste: http://localhost:3001/health');
    console.log('   3. Comece a desenvolver as rotas da API\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na migração:', error);
    process.exit(1);
  }
}

// Executa migração
migrate();