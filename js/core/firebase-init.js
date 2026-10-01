// ═══════════════════════════════════════════════════════════════════════
// FIREBASE — base partagée pour les prix installateur (lecture publique,
// écriture réservée aux visiteurs authentifiés anonymement, elle-même
// protégée en amont par un code d'accès côté interface — cf. installers.js)
// ═══════════════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDd9um4KI4jeAmRjBm2AFXRnFJiAKeRkJ8",
  authDomain: "ebs-simulateur-cee.firebaseapp.com",
  projectId: "ebs-simulateur-cee",
  storageBucket: "ebs-simulateur-cee.firebasestorage.app",
  messagingSenderId: "291148250870",
  appId: "1:291148250870:web:5a640da53476ac3464f6d7",
};

firebase.initializeApp(firebaseConfig);
const ebsDb = firebase.firestore();
const ebsAuth = firebase.auth();

let __ebsFirebaseReady = ebsAuth.signInAnonymously()
  .then(() => true)
  .catch(err => { console.error('Firebase — connexion anonyme impossible :', err); return false; });
