require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!credentialsPath && !credentials) throw new Error('Firebase service account is not configured');
admin.initializeApp({ credential: admin.credential.cert(credentialsPath ? JSON.parse(fs.readFileSync(path.resolve(credentialsPath), 'utf8')) : JSON.parse(credentials)) });
const db = admin.firestore();

async function removeCollectionDocuments(query) {
  const result = await query.get();
  const batch = db.batch();
  result.docs.forEach((doc) => batch.delete(doc.ref));
  if (result.size) await batch.commit();
  return result.size;
}

async function run() {
  const demoLeads = await db.collection('leads').where('batchId', '>=', 'demo_batch_').where('batchId', '<=', 'demo_batch_\uf8ff').get();
  for (const lead of demoLeads.docs) {
    const activity = await lead.ref.collection('activity').get();
    const batch = db.batch();
    activity.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(lead.ref);
    await batch.commit();
  }
  const batches = await removeCollectionDocuments(db.collection('batches').where('demo', '==', true));
  console.log(`Removed ${demoLeads.size} demo leads and ${batches} demo batches.`);
}
run().catch((error) => { console.error(error); process.exit(1); });
