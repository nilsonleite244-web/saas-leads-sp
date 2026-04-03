const admin = require('firebase-admin');
const fs = require('fs');
const key = JSON.parse(fs.readFileSync('service-account-key.json'));
admin.initializeApp({credential: admin.credential.cert(key), databaseURL: 'https://studio-1346217805-b3b8e.firebaseio.com'});
const db = admin.firestore();
const csv = fs.readFileSync('output/leads.csv','utf8').split('\n').slice(1).filter(x => x.trim());
let n = 0;
async function run(){
    for(const l of csv){
          const p = l.split(',').map(x => x.replace(/"/g,'').trim());
          if(p[0]){
                  await db.collection('empresas').add({nome:p[0],endereco:p[1],phone:p[2],website:p[3],lat:parseFloat(p[4]),lng:parseFloat(p[5]),categoria:'Restaurante',city:'Sao Paulo',createdAt:new Date()});
                  n++;
                  console.log('OK: '+n+' - '+p[0])
          }
    }
    console.log('Total: '+n);
    process.exit(0)
}
run().catch(e=>{console.error(e);process.exit(1)})
