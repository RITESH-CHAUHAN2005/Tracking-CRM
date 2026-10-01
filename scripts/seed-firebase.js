require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credentialsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!credentials && !credentialsPath) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON is missing');
const serviceAccount = credentialsPath ? JSON.parse(fs.readFileSync(path.resolve(credentialsPath), 'utf8')) : JSON.parse(credentials);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const firestore = admin.firestore();

const accounts = [
  { name: 'Axis Fire Admin', username: process.env.ADMIN_USERNAME || 'axisfireindia', password: process.env.ADMIN_PASSWORD, role: 'ADMIN' },
  { name: 'Himani', username: 'himani', password: process.env.HIMANI_PASSWORD, role: 'EMPLOYEE' },
  { name: 'Chandra Mam', username: 'chandra', password: process.env.CHANDRA_PASSWORD, role: 'EMPLOYEE' },
  { name: 'Vansh', username: 'vansh', password: process.env.VANSH_PASSWORD, role: 'EMPLOYEE' }
];

async function upsert(account) {
  if (!account.password) throw new Error(`Missing password for ${account.username}`);
  const email = `${account.username}@axisfire.local`;
  let user;
  try { user = await admin.auth().getUserByEmail(email); } catch (error) { if (error.code !== 'auth/user-not-found') throw error; user = await admin.auth().createUser({ email, password: account.password, displayName: account.name }); }
  await admin.auth().updateUser(user.uid, { displayName: account.name, password: account.password, disabled: false });
  await firestore.collection('users').doc(user.uid).set({ name: account.name, username: account.username, role: account.role, active: true, employeeId: account.role === 'EMPLOYEE' ? user.uid : null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log(`Seeded ${account.role.toLowerCase()}: ${account.username}`);
}

Promise.all(accounts.map(upsert)).then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
