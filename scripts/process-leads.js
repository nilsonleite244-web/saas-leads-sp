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

// Validar coordenadas de São Paulo
// São Paulo bounding box: -24 a -23 (lat), -47 a -46 (lon)
const validLeads = processedLeads.filter(lead => {
    return lead.latitude >= -24 && lead.latitude <= -23 &&
               lead.longitude >= -47 && lead.longitude <= -46 &&
               lead.name && lead.address;
});

console.log(`\n✅ Processamento concluído!\n`);
console.log(`📊 Estatísticas:`);
console.log(`  • Total de leads coletados: ${records.length}`);
console.log(`  • Leads com coordenadas válidas: ${processedLeads.length}`);
console.log(`  • Leads em São Paulo: ${validLeads.length}`);
console.log(`  • Taxa de validade: ${((validLeads.length / records.length) * 100).toFixed(2)}%\n`);

// Salvar como JSON
fs.writeFileSync(
    './data/leads/processed-leads.json',
    JSON.stringify(validLeads, null, 2)
  );

console.log(`✓ Arquivo salvo: ./data/leads/processed-leads.json\n`);

function determineCategory(title) {
    if (!title) return 'outro';

  const categories = {
        'restaurante': ['restaurante', 'comida', 'almoço', 'lanchonete', 'pizzaria', 'churrascaria', 'sushi', 'bar', 'café'],
        'farmácia': ['farmácia', 'droga', 'medicamento', 'farmacêutico'],
        'supermercado': ['supermercado', 'mercado', 'mercadinho'],
        'padaria': ['padaria', 'pão', 'bolo'],
        'barbearia': ['barbear', 'corte', 'barbearia', 'barbeiro'],
        'banco': ['banco', 'agência', 'financeiro'],
        'hospital': ['hospital', 'pronto-socorro', 'clínica', 'médico'],
        'academia': ['academia', 'ginásio', 'musculação'],
        'loja': ['loja', 'shop', 'boutique', 'loja de roupas', 'loja de eletrônicos'],
        'salão': ['salão', 'beleza', 'cabelo', 'cabeleireiro'],
        'postogas': ['posto', 'gasolina', 'combustível'],
        'boate': ['boate', 'disco', 'balada', 'nightclub'],
  };

  title = title.toLowerCase();
    for (const [cat, keywords] of Object.entries(categories)) {
          if (keywords.some(kw => title.includes(kw))) return cat;
    }
    return 'outro';
}
