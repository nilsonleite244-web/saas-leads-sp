const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

// Inicializar Firebase
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'studio-1346217805-b3b8e',
});

const db = admin.firestore();

async function importLeads() {
    try {
          console.log('\n🚀 Iniciando importação para Firebase Firestore...\n');

      // Ler leads processados
      const leadsPath = './data/leads/processed-leads.json';
          if (!fs.existsSync(leadsPath)) {
                  throw new Error(`Arquivo não encontrado: ${leadsPath}`);
          }

      const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));

      if (!Array.isArray(leadsData) || leadsData.length === 0) {
              throw new Error('Nenhum lead encontrado no arquivo processado');
      }

      console.log(`📥 Total de leads a importar: ${leadsData.length}\n`);

      const batchSize = 500; // Limite do Firestore
      let successCount = 0;
          let errorCount = 0;
          const errors = [];

      // Processar em lotes
      for (let i = 0; i < leadsData.length; i += batchSize) {
              const batch = db.batch();
              const leads = leadsData.slice(i, i + batchSize);
              const companyCollection = db.collection('empresas');

            for (const lead of leads) {
                      try {
                                  const docRef = companyCollection.doc(lead.id);
                                  batch.set(docRef, {
                                                ...lead,
                                                lastUpdated: admin.firestore.Timestamp.now(),
                                                importedAt: admin.firestore.Timestamp.now(),
                                  });
                      } catch (err) {
                                  errors.push(`Erro ao preparar lead ${lead.id}: ${err.message}`);
                                  errorCount++;
                      }
            }

            try {
                      await batch.commit();
                      successCount += leads.filter(l => !errors.some(e => e.includes(l.id))).length;
                      const progress = Math.min(successCount, leadsData.length);
                      const percentage = ((progress / leadsData.length) * 100).toFixed(2);

                // Barra de progresso
                const barLength = 30;
                      const filledLength = Math.floor((progress / leadsData.length) * barLength);
                      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
                      console.log(`[${bar}] ${progress}/${leadsData.length} (${percentage}%)`);
            } catch (error) {
                      console.error(`\n❌ Erro ao importar lote ${i}: ${error.message}`);
                      errorCount += leads.length;
            }
      }

      console.log(`\n✅ Importação concluída!\n`);
          console.log(`📊 Estatísticas:`);
          console.log(`  ✓ Leads importados: ${successCount}`);
          console.log(`  ✗ Erros: ${errorCount}`);
          console.log(`  📈 Taxa de sucesso: ${((successCount / leadsData.length) * 100).toFixed(2)}%`);

      if (errors.length > 0 && errors.length <= 10) {
              console.log(`\n⚠️  Erros encontrados:`);
              errors.slice(0, 10).forEach(err => console.log(`  • ${err}`));
      }

      // Verificar dados no Firestore
      const snapshot = await db.collection('empresas').count().get();
          const totalDocs = snapshot.data().count;
          console.log(`\n📈 Total de documentos na coleção 'empresas': ${totalDocs}`);

      // Estatísticas por categoria
      console.log(`\n📂 Distribuição por categoria:`);
          const categorySnapshot = await db.collection('empresas')
            .select('category')
            .get();

      const categories = {};
          categorySnapshot.forEach(doc => {
                  const cat = doc.data().category || 'outro';
                  categories[cat] = (categories[cat] || 0) + 1;
          });

      Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                      const pct = ((count / totalDocs) * 100).toFixed(1);
                      console.log(`  • ${cat}: ${count} (${pct}%)`);
            });

      console.log('\n✨ Importação finalizada com sucesso!\n');
          process.exit(0);
    } catch (error) {
          console.error('\n❌ Erro fatal:', error.message);
          console.error('\nDetalhes:', error);
          process.exit(1);
    }
}

importLeads();
