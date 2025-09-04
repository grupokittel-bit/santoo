// CORREÇÃO DO CAMPO DURATION - FLOAT PARA ACEITAR DECIMAIS
// Script para alterar o tipo da coluna duration de INTEGER para FLOAT

const { sequelize } = require('../config/database');

async function fixDurationField() {
  try {
    console.log('🔧 Iniciando correção do campo duration...');
    
    // Altera a coluna duration de INTEGER para FLOAT
    await sequelize.query(`
      ALTER TABLE videos 
      ALTER COLUMN duration TYPE FLOAT USING duration::float;
    `);
    
    console.log('✅ Campo duration alterado com sucesso de INTEGER para FLOAT');
    console.log('📊 Agora aceita valores decimais como 15.023311');
    
  } catch (error) {
    console.error('❌ Erro ao alterar campo duration:', error);
    throw error;
  }
}

// Executa a correção se chamado diretamente
if (require.main === module) {
  fixDurationField()
    .then(() => {
      console.log('🎯 Correção concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na correção:', error);
      process.exit(1);
    });
}

module.exports = { fixDurationField };