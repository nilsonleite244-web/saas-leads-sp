# ⚡ Quick Start - Coleta e Importação de Leads em 5 Passos

## 🎯 Objetivo

Coletar **leads de estabelecimentos físicos em São Paulo** usando Google Maps e importar para **Firebase Firestore** em menos de 1 hora.

---

## ✅ Checklist de Pré-requisitos

- [x] Firebase Firestore já criado (`studio-1346217805-b3b8e`)
- [ ] Docker instalado (`docker --version`)
- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Service Account Key do Firebase baixado como `service-account-key.json` (⚠️ SEGREDO!)
- [ ] `.env` configurado (vide SETUP_LEADS_GOOGLE_MAPS.md)

---

## 🚀 Começa Aqui!

### Passo 1: Preparar Pasta e Dependências (2 minutos)

```bash
# Criar pastas
mkdir -p data/leads scripts/queries

# Instalar pacotes
npm install firebase-admin csv-parse dotenv
```

### Passo 2: Baixar Service Account Key (2 minutos)

1. Abra: https://console.firebase.google.com/project/studio-1346217805-b3b8e/settings/serviceaccounts/adminsdk
2. Clique: "Gerar nova chave privada"
3. Salve como: `service-account-key.json` (na raiz do projeto)

**⚠️ IMPORTANTE:** Adicione ao `.gitignore`:
```
service-account-key.json
data/leads/results.csv
data/leads/processed-leads.json
.env
```

### Passo 3: Criar Arquivo de Queries (3 minutos)

```bash
cat > data/leads/queries.txt << 'EOF'
restaurante em São Paulo
farmácia em São Paulo
supermercado em São Paulo
padaria em São Paulo
hospital em São Paulo
banco em São Paulo
academia em São Paulo
loja de roupas em São Paulo
barbearia em São Paulo
salão de beleza em São Paulo
EOF
```

### Passo 4: Executar Google Maps Scraper (15-30 minutos)

**Opção A: Rápida (Recomendada para primeira vez)**

```bash
docker run --rm \
  -v $PWD/data/leads:/gmapsdata \
    gosom/google-maps-scraper \
      -fast-mode \
        -depth 3 \
          -c 2 \
            -input /gmapsdata/queries.txt \
              -results /gmapsdata/results.csv \
                -geo "-23.5505,-46.6333" \
                  -radius 10000 \
                    -zoom 15 \
                      -exit-on-inactivity 15m
                      ```

                      **Opção B: Completa (Mais dados, mais tempo)**

                      ```bash
                      docker run --rm \
                        -v $PWD/data/leads:/gmapsdata \
                          gosom/google-maps-scraper \
                            -depth 10 \
                              -c 4 \
                                -input /gmapsdata/queries.txt \
                                  -results /gmapsdata/results.csv \
                                    -exit-on-inactivity 30m
                                    ```

                                    **Ou use a Interface Web** (melhor para primeira vez):

                                    ```bash
                                    docker run --rm \
                                      -v $PWD/data/leads:/gmapsdata \
                                        -p 8080:8080 \
                                          gosom/google-maps-scraper \
                                            -data-folder /gmapsdata
                                            ```

                                            Depois abra: http://localhost:8080

                                            ### Passo 5: Processar + Importar (5-10 minutos)

                                            ```bash
                                            # 1. Processar CSV → JSON
                                            npm install csv-parse
                                            node scripts/process-leads.js

                                            # Você verá:
                                            # ✓ Total de leads coletados: 250
                                            # ✓ Leads em São Paulo: 220
                                            # ✓ Taxa de validade: 88%

                                            # 2. Importar para Firebase
                                            node scripts/import-to-firebase.js

                                            # Você verá:
                                            # [████████████████░░░░░░░░░░░░] 1000/2000 (50%)
                                            # ...
                                            # ✅ Importação concluída!
                                            # ✓ Leads importados: 1980
                                            # 📈 Total de documentos na coleção 'empresas': 1980
                                            ```

                                            ---

                                            ## 📊 Esperado

                                            Após os 5 passos, você terá:

                                            ✅ **~500-1000 leads** em sua coleção `empresas` no Firebase
                                            ✅ Dados estruturados com: nome, endereço, telefone, website, rating, coordenadas
                                            ✅ Categorização automática (restaurante, farmácia, hospital, etc.)
                                            ✅ Filtro geográfico validado (apenas São Paulo)

                                            ---

                                            ## 🔧 Troubleshooting

                                            | Problema | Solução |
                                            |----------|---------|
                                            | `Cannot find module 'firebase-admin'` | Rodar: `npm install firebase-admin` |
                                            | `ENOENT: no such file or directory, open 'service-account-key.json'` | Baixar a chave do Firebase Console |
                                            | `results.csv` não foi criado | Docker pode estar parado. Rodar: `docker ps` |
                                            | Script trava no processamento | Aumentar memória disponível ou reduzir tamanho do CSV |
                                            | Import falha com erro de autenticação | Verificar se `service-account-key.json` está correto |

                                            ---

                                            ## ⏱️ Tempos Esperados

                                            | Etapa | Tempo | Resultado |
                                            |-------|-------|-----------|
                                            | Setup (passos 1-3) | 7 min | Pastas e chaves prontas |
                                            | Scraping (passo 4) | 15-30 min | 500-1000 leads em CSV |
                                            | Processamento (passo 5a) | 1 min | JSON validado |
                                            | Importação (passo 5b) | 3 min | Leads no Firebase ✅ |
                                            | **TOTAL** | **30-45 min** | **Sistema pronto!** |

                                            ---

                                            ## 🎯 Próximos Passos

                                            Após importar os leads:

                                            1. **Verificar no Firebase Console:**
                                               - Abra: https://console.firebase.google.com/project/studio-1346217805-b3b8e/firestore/databases/-default-/data
                                                  - Vá para coleção: `empresas`
                                                     - Veja os documents com seus dados

                                                     2. **Criar API REST** para servir os leads (Node.js/Express)

                                                     3. **Adicionar Frontend** para buscar e filtrar leads

                                                     4. **Integrar WhatsApp** para enviar mensagens aos leads

                                                     5. **Dashboard** com visualização dos leads em mapa

                                                     ---

                                                     ## 📚 Documentação Completa

                                                     Veja: [SETUP_LEADS_GOOGLE_MAPS.md](./SETUP_LEADS_GOOGLE_MAPS.md)

                                                     ---

                                                     ## 💬 Precisa de Ajuda?

                                                     1. Verifique se Docker está rodando: `docker ps`
                                                     2. Verifique se Node.js está instalado: `node -v`
                                                     3. Verifique se as chaves do Firebase estão corretas
                                                     4. Consulte o [SETUP_LEADS_GOOGLE_MAPS.md](./SETUP_LEADS_GOOGLE_MAPS.md) para mais detalhes

                                                     ---

                                                     **Boa sorte! 🚀**

                                                     Criado em: 2026-04-03
