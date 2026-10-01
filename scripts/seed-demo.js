require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!credentials && !credentialsPath) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON is missing');
const serviceAccount = credentialsPath ? JSON.parse(fs.readFileSync(path.resolve(credentialsPath), 'utf8')) : JSON.parse(credentials);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const statuses = ['New', 'Contacted', 'Follow-up Required', 'Interested', 'Quotation Required', 'Site Visit Required', 'Converted', 'Not Interested', 'Lost'];
const requirements = ['Fire Alarm System', 'AMC', 'Fire Fighting Work', 'Fire Hydrant System', 'Fire Safety Audit'];
const companies = ['Apex Industrial Systems', 'BlueStone Hospitals', 'Crescent Residency', 'Delta Manufacturing', 'Evergreen Schools', 'Fortune Foodworks', 'Ganga Logistics', 'Horizon Malls', 'Indus Textiles', 'Jupiter Tech Park'];
const employees = ['Himani', 'Chandra Mam', 'Vansh'];
const timestamp = () => admin.firestore.Timestamp.now();
async function run() {
  const users = await db.collection('users').where('role', '==', 'EMPLOYEE').get();
  const employeeIds = Object.fromEntries(users.docs.map((doc) => [doc.data().name, doc.id]));
  const write = db.batch();
  for (let batchIndex = 0; batchIndex < 5; batchIndex += 1) {
    const batchRef = db.collection('batches').doc(`demo_batch_${String(batchIndex + 1).padStart(3, '0')}`);
    const owner = employeeIds[employees[batchIndex % employees.length]];
    write.set(batchRef, { name: `Demo Batch ${String(batchIndex + 1).padStart(2, '0')}`, assignedTo: owner || '', archived: false, demo: true, createdAt: timestamp(), totalLeads: 5 });
    for (let leadIndex = 0; leadIndex < 5; leadIndex += 1) {
      const status = statuses[(batchIndex * 2 + leadIndex) % statuses.length];
      const leadRef = db.collection('leads').doc(`demo_lead_${batchIndex + 1}_${leadIndex + 1}`);
      write.set(leadRef, { batchId: batchRef.id, assignedTo: owner || '', companyName: `${companies[(batchIndex * 5 + leadIndex) % companies.length]} Demo`, clientName: ['Rohan Mehta', 'Neha Sharma', 'Arjun Kapoor', 'Priya Nair'][leadIndex % 4], contactPerson: ['Amit Shah', 'Kavita Rao', 'Sanjay Jain', 'Meera Thomas'][leadIndex % 4], phone: `98${String(10000000 + batchIndex * 100 + leadIndex).slice(-8)}`, email: `demo${batchIndex + 1}${leadIndex + 1}@example.in`, city: ['New Delhi', 'Gurugram', 'Noida', 'Jaipur'][leadIndex % 4], state: 'Delhi NCR', requirement: requirements[leadIndex % requirements.length], leadSource: 'Demo data', status, priority: leadIndex === 0 ? 'High' : 'Normal', nextFollowUp: leadIndex === 2 ? new Date(Date.now() + 86400000).toISOString().slice(0, 10) : '', notes: 'Demo data; safe to delete after testing.', employeeNotes: '', adminNotes: '', convertedRequirement: status === 'Converted' ? requirements[leadIndex % requirements.length] : '', actualDealValue: status === 'Converted' ? 125000 : '', conversionDate: status === 'Converted' ? new Date().toISOString().slice(0, 10) : '', createdAt: timestamp(), lastUpdated: timestamp() });
      write.set(leadRef.collection('activity').doc(), { actorName: 'System', actorId: 'demo-seed', text: 'Demo lead created', createdAt: timestamp() });
    }
  }
  await write.commit(); console.log('Seeded 5 demo batches and 25 demo leads.');
}
run().catch((error) => { console.error(error); process.exit(1); });
