# 🚀 Setup Completo: Coletar Leads do Google Maps + Importar no Firebase

Este guia irá ajudar você a configurar um sistema completo para:
1. Coletar leads de estabelecimentos físicos em São Paulo usando Google Maps
2. Processar e validar os dados
3. Importar automaticamente para o Firebase Firestore

## 📋 Pré-requisitos

- Docker instalado e funcionando
- Node.js 18+ instalado
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Uma conta Firebase com o projeto já criado (`studio-1346217805-b3b8e`)
- Download da chave de Conta de Serviço do Firebase (já tem no tab 2)

## 🎯 Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Firebase
FIREBASE_PROJECT_ID=studio-1346217805-b3b8e
FIREBASE_DATABASE_ID=southamerica-east1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Google Maps Scraper
GMAPS_DEPTH=10
GMAPS_CONCURRENCY=4
GMAPS_LANGUAGE=pt-BR
GMAPS_ZOOM=15
GMAPS_RADIUS=5000

# São Paulo Coordinates (City Center)
GMAPS_GEO="-23.5505,-46.6333"

# Configurações de Import
BATCH_SIZE=500
FIREBASE_COLLECTION=empresas
```

## 📥 Passo 2: Baixar Service Account Key

1. Abra o Firebase Console: https://console.firebase.google.com/project/studio-1346217805-b3b8e/settings/serviceaccounts/adminsdk
2. Clique em "Gerar nova chave privada"
3. Salve o arquivo JSON como `service-account-key.json` na raiz do projeto
4. **⚠️ NÃO commitar este arquivo para o GitHub!** (já está no `.gitignore`)

## 🔍 Passo 3: Executar o Google Maps Scraper

### Opção A: Com Docker (Recomendado)

```bash
# Crie uma pasta para dados
mkdir -p ./data/leads

# Crie um arquivo com as queries (tipos de estabelecimentos)
cat > ./data/queries.txt << 'EOF'
restaurante em São Paulo
farmácia em São Paulo
supermercado em São Paulo
padaria em São Paulo
posto de gasolina em São Paulo
banco em São Paulo
hospital em São Paulo
clínica em São Paulo
barbearia em São Paulo
salão de beleza em São Paulo
loja de roupas em São Paulo
loja de eletrônicos em São Paulo
academia em São Paulo
lanchonete em São Paulo
pizzaria em São Paulo
churrascaria em São Paulo
sushi em São Paulo
café em São Paulo
bar em São Paulo
boate em São Paulo
EOF

# Execute o scraper
docker run --rm \
  -v $PWD/data/leads:/gmapsdata \
    -p 8080:8080 \
      gosom/google-maps-scraper \
        -depth 10 \
          -c 4 \
            -input /gmapsdata/queries.txt \
              -results /gmapsdata/results.csv \
                -exit-on-inactivity 30m

                # Ou acesse a interface web em: http://localhost:8080
                ```

                ### Opção B: Versão Rápida (Fast Mode) - Menos Dados, Mais Rápido

                ```bash
                docker run --rm \
                  -v $PWD/data/leads:/gmapsdata \
                    gosom/google-maps-scraper \
                      -fast-mode \
                        -depth 3 \
                          -input /gmapsdata/queries.txt \
                            -results /gmapsdata/results.csv \
                              -geo "-23.5505,-46.6333" \
                                -radius 10000 \
                                  -zoom 15 \
                                    -exit-on-inactivity 10m
                                    ```

                                    **Tempo estimado:**
                                    - Fast Mode (rápido): 5-10 minutos para 20 queries
                                    - Normal Mode: 30-60 minutos para 20 queries

                                    **Resultado:** Um arquivo CSV com colunas como:
                                    - `title` (Nome do estabelecimento)
                                    - `address` (Endereço)
                                    - `phone` (Telefone)
                                    - `website` (Site)
                                    - `review_rating` (Avaliação)
                                    - `latitude`, `longitude` (Coordenadas)
                                    - etc.

                                    ## 📦 Passo 4: Processar e Validar Dados

                                    Crie um arquivo `scripts/process-leads.js`:

                                    ```javascript
                                    const fs = require('fs');
                                    const csv = require('csv-parse/sync');

                                    // Ler arquivo CSV
                                    const fileContent = fs.readFileSync('./data/leads/results.csv', 'utf-8');
                                    const records = csv.parse(fileContent, {
                                      columns: true,
                                        skip_empty_lines: true,
                                        });

                                        // Processar e validar
                                        const processedLeads = records.map((record, index) => ({
                                          id: `lead_${Date.now()}_${index}`,
                                            name: record.title?.trim() || '',
                                              address: record.address?.trim() || '',
                                                phone: record.phone?.trim() || '',
                                                  website: record.website?.trim() || '',
                                                    category: determineCategory(record.title),
                                                      rating: parseFloat(record.review_rating) || null,
                                                        reviewCount: parseInt(record.review_count) || 0,
                                                          latitude: parseFloat(record.latitude),
                                                            longitude: parseFloat(record.longitude),
                                                              googleMapsLink: record.link || '',
                                                                createdAt: new Date(),
                                                                  status: 'active',
                                                                    notes: '',
                                                                    })).filter(lead => lead.name && lead.latitude && lead.longitude);

                                                                    // Validar dados
                                                                    const validLeads = processedLeads.filter(lead => {
                                                                      return lead.latitude >= -24 && lead.latitude <= -23 &&
                                                                               lead.longitude >= -47 && lead.longitude <= -46;
                                                                               });

                                                                               console.log(`✓ Total de leads coletados: ${records.length}`);
                                                                               console.log(`✓ Leads válidos em SP: ${validLeads.length}`);
                                                                               console.log(`✓ Taxa de validade: ${((validLeads.length / records.length) * 100).toFixed(2)}%`);

                                                                               // Salvar como JSON
                                                                               fs.writeFileSync(
                                                                                 './data/leads/processed-leads.json',
                                                                                   JSON.stringify(validLeads, null, 2)
                                                                                   );

                                                                                   function determineCategory(title) {
                                                                                     const categories = {
                                                                                         'restaurante': ['restaurante', 'comida', 'almoço'],
                                                                                             'farmácia': ['farmácia', 'droga', 'medicamento'],
                                                                                                 'supermercado': ['supermercado', 'mercado'],
                                                                                                     'barbearia': ['barbear', 'corte'],
                                                                                                         'bank': ['banco', 'agência'],
                                                                                                           };
                                                                                                             
                                                                                                               title = title.toLowerCase();
                                                                                                                 for (const [cat, keywords] of Object.entries(categories)) {
                                                                                                                     if (keywords.some(kw => title.includes(kw))) return cat;
                                                                                                                       }
                                                                                                                         return 'outro';
                                                                                                                         }
                                                                                                                         ```
                                                                                                                         
                                                                                                                         Execute:
                                                                                                                         
                                                                                                                         ```bash
                                                                                                                         npm install csv-parse
                                                                                                                         node scripts/process-leads.js
                                                                                                                         ```
                                                                                                                         
                                                                                                                         ## 🔥 Passo 5: Importar para Firebase Firestore
                                                                                                                         
                                                                                                                         Crie um arquivo `scripts/import-to-firebase.js`:
                                                                                                                         
                                                                                                                         ```javascript
                                                                                                                         const admin = require('firebase-admin');
                                                                                                                         const fs = require('fs');
                                                                                                                         
                                                                                                                         // Inicializar Firebase
                                                                                                                         const serviceAccount = require('./service-account-key.json');
                                                                                                                         admin.initializeApp({
                                                                                                                           credential: admin.credential.cert(serviceAccount),
                                                                                                                             projectId: 'studio-1346217805-b3b8e',
                                                                                                                             });
                                                                                                                             
                                                                                                                             const db = admin.firestore();
                                                                                                                             
                                                                                                                             async function importLeads() {
                                                                                                                               try {
                                                                                                                                   // Ler leads processados
                                                                                                                                       const leadsData = JSON.parse(
                                                                                                                                             fs.readFileSync('./data/leads/processed-leads.json', 'utf-8')
                                                                                                                                                 );
                                                                                                                                                 
                                                                                                                                                     console.log(`\n📥 Iniciando importação de ${leadsData.length} leads...\n`);
                                                                                                                                                     
                                                                                                                                                         const batchSize = 500;
                                                                                                                                                             let successCount = 0;
                                                                                                                                                                 let errorCount = 0;
                                                                                                                                                                 
                                                                                                                                                                     // Processar em lotes
                                                                                                                                                                         for (let i = 0; i < leadsData.length; i += batchSize) {
                                                                                                                                                                               const batch = db.batch();
                                                                                                                                                                                     const leads = leadsData.slice(i, i + batchSize);
                                                                                                                                                                                     
                                                                                                                                                                                           for (const lead of leads) {
                                                                                                                                                                                                   const docRef = db.collection('empresas').doc(lead.id);
                                                                                                                                                                                                           batch.set(docRef, {
                                                                                                                                                                                                                     ...lead,
                                                                                                                                                                                                                               lastUpdated: admin.firestore.Timestamp.now(),
                                                                                                                                                                                                                                       });
                                                                                                                                                                                                                                             }
                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                   try {
                                                                                                                                                                                                                                                           await batch.commit();
                                                                                                                                                                                                                                                                   successCount += leads.length;
                                                                                                                                                                                                                                                                           const progress = Math.min(successCount, leadsData.length);
                                                                                                                                                                                                                                                                                   const percentage = ((progress / leadsData.length) * 100).toFixed(2);
                                                                                                                                                                                                                                                                                           console.log(`✓ ${progress}/${leadsData.length} (${percentage}%)`);
                                                                                                                                                                                                                                                                                                 } catch (error) {
                                                                                                                                                                                                                                                                                                         console.error(`✗ Erro ao importar lote ${i}: ${error.message}`);
                                                                                                                                                                                                                                                                                                                 errorCount += leads.length;
                                                                                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                                                                                           }
                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                               console.log(`\n✅ Importação concluída!`);
                                                                                                                                                                                                                                                                                                                                   console.log(`✓ Leads importados: ${successCount}`);
                                                                                                                                                                                                                                                                                                                                       console.log(`✗ Erros: ${errorCount}`);
                                                                                                                                                                                                                                                                                                                                           console.log(`📊 Taxa de sucesso: ${((successCount / leadsData.length) * 100).toFixed(2)}%`);
                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                               // Verificar dados no Firestore
                                                                                                                                                                                                                                                                                                                                                   const snapshot = await db.collection('empresas').count().get();
                                                                                                                                                                                                                                                                                                                                                       console.log(`\n📈 Total de documentos na coleção 'empresas': ${snapshot.data().count}`);
                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                           process.exit(0);
                                                                                                                                                                                                                                                                                                                                                             } catch (error) {
                                                                                                                                                                                                                                                                                                                                                                 console.error('❌ Erro:', error);
                                                                                                                                                                                                                                                                                                                                                                     process.exit(1);
                                                                                                                                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       importLeads();
                                                                                                                                                                                                                                                                                                                                                                       ```
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       Execute:
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       ```bash
                                                                                                                                                                                                                                                                                                                                                                       npm install firebase-admin
                                                                                                                                                                                                                                                                                                                                                                       node scripts/import-to-firebase.js
                                                                                                                                                                                                                                                                                                                                                                       ```
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       ## ✅ Passo 6: Verificar Dados no Firebase
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       1. Abra o Firebase Console
                                                                                                                                                                                                                                                                                                                                                                       2. Vá para Firestore → Coleção `empresas`
                                                                                                                                                                                                                                                                                                                                                                       3. Verifique se os documentos foram importados
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       Ou use a CLI do Firebase:
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       ```bash
                                                                                                                                                                                                                                                                                                                                                                       firebase firestore:inspect 'empresas' --project=studio-1346217805-b3b8e
                                                                                                                                                                                                                                                                                                                                                                       ```
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       ## 🔄 Passo 7: Script Automatizado (Opcional)
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       Crie um arquivo `scripts/run-all.sh` para automatizar tudo:
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       ```bash
                                                                                                                                                                                                                                                                                                                                                                       #!/bin/bash
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       echo "🚀 Iniciando coleta de leads..."
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       # 1. Preparar dados
                                                                                                                                                                                                                                                                                                                                                                       mkdir -p ./data/leads
                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                       # 2. Executar scraper
                                                                                                                                                                                                                                                                                                                                                                       echo "1️⃣ Coletando dados do Google Maps..."
                                                                                                                                                                                                                                                                                                                                                                       docker run --rm \
                                                                                                                                                                                                                                                                                                                                                                         -v $PWD/data/leads:/gmapsdata \
                                                                                                                                                                                                                                                                                                                                                                           gosom/google-maps-scraper \
                                                                                                                                                                                                                                                                                                                                                                             -depth 5 \
                                                                                                                                                                                                                                                                                                                                                                               -input /gmapsdata/queries.txt \
                                                                                                                                                                                                                                                                                                                                                                                 -results /gmapsdata/results.csv \
                                                                                                                                                                                                                                                                                                                                                                                   -exit-on-inactivity 15m
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   # 3. Processar dados
                                                                                                                                                                                                                                                                                                                                                                                   echo "2️⃣ Processando dados..."
                                                                                                                                                                                                                                                                                                                                                                                   node scripts/process-leads.js
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   # 4. Importar para Firebase
                                                                                                                                                                                                                                                                                                                                                                                   echo "3️⃣ Importando para Firebase..."
                                                                                                                                                                                                                                                                                                                                                                                   node scripts/import-to-firebase.js
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   echo "✅ Concluído!"
                                                                                                                                                                                                                                                                                                                                                                                   ```
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   Execute:
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ```bash
                                                                                                                                                                                                                                                                                                                                                                                   chmod +x scripts/run-all.sh
                                                                                                                                                                                                                                                                                                                                                                                   ./scripts/run-all.sh
                                                                                                                                                                                                                                                                                                                                                                                   ```
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ## 📊 Estimativas de Volume
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   | Queries | Depth | Tempo | Leads | Taxa Sucesso |
                                                                                                                                                                                                                                                                                                                                                                                   |---------|-------|-------|-------|--------------|
                                                                                                                                                                                                                                                                                                                                                                                   | 20 | 5 | 15-30 min | 500-800 | 95% |
                                                                                                                                                                                                                                                                                                                                                                                   | 50 | 8 | 45-90 min | 1.5k-2k | 92% |
                                                                                                                                                                                                                                                                                                                                                                                   | 100 | 10 | 120-180 min | 3k-5k | 90% |
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   Para atingir **50k leads**, você precisaria:
                                                                                                                                                                                                                                                                                                                                                                                   - ~500 queries diferentes (bairros, tipos de negócios, etc.)
                                                                                                                                                                                                                                                                                                                                                                                   - ~20-30 horas de scraping contínuo
                                                                                                                                                                                                                                                                                                                                                                                   - OU usar a interface web com modo paralelo
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ## 🚨 Limitações e Considerações
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ⚠️ **Taxa de Bloqueio:** Google Maps pode bloquear após ~20-30 minutes de scraping intenso
                                                                                                                                                                                                                                                                                                                                                                                   ✅ **Solução:** Use proxies (Webshare, Evomi, Decodo)
                                                                                                                                                                                                                                                                                                                                                                                   ✅ **Alternativa:** Distribua o scraping em múltiplas máquinas com PostgreSQL
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ## 🎁 Próximos Passos
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   1. **Criar API REST** para servir os leads ao frontend
                                                                                                                                                                                                                                                                                                                                                                                   2. **Implementar filtros** (categoria, rating, proximidade)
                                                                                                                                                                                                                                                                                                                                                                                   3. **Adicionar busca geográfica** com coordenadas
                                                                                                                                                                                                                                                                                                                                                                                   4. **Integrar WhatsApp** para enviar mensagens
                                                                                                                                                                                                                                                                                                                                                                                   5. **Dashboard** para visualizar os leads coletados
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ## 📞 Suporte
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   Se tiver problemas:
                                                                                                                                                                                                                                                                                                                                                                                   1. Verifique se Docker está rodando
                                                                                                                                                                                                                                                                                                                                                                                   2. Verifique as credenciais do Firebase
                                                                                                                                                                                                                                                                                                                                                                                   3. Veja os logs do Firebase Console
                                                                                                                                                                                                                                                                                                                                                                                   4. Abra uma issue no repositório
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   ---
                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                   **Criado em:** 2026-04-03
                                                                                                                                                                                                                                                                                                                                                                                   **Última atualização:** 2026-04-03
                                                                                                                                                                                                                                                                                                                                                                                   
