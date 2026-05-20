/* ========================================
   CONFIGURACIÓN FIREBASE - NanyBeauty
   ======================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set, 
    onValue, 
    query, 
    orderByChild, 
    equalTo, 
    remove 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCLk5Bl3OW9g1F2se8sKlVaFQbF8djf1is",
  authDomain: "nanybeauty-cb8c5.firebaseapp.com",
  databaseURL: "https://nanybeauty-cb8c5-default-rtdb.firebaseio.com",
  projectId: "nanybeauty-cb8c5",
  storageBucket: "nanybeauty-cb8c5.appspot.com",
  messagingSenderId: "668686913430",
  appId: "1:668686913430:web:4719e0ee341cd7838d57b7",
  measurementId: "G-0N95VVF8ZS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Función para verificar si es admin
async function verificarSiEsAdmin(email) {
    return new Promise((resolve) => {
        const adminRef = ref(database, `admins/${email.replace(/\./g, '_')}`);
        onValue(adminRef, (snapshot) => {
            resolve(snapshot.exists());
        }, { once: true });
    });
}

// Función para hacer admin
async function hacerAdmin(email) {
    try {
        const adminRef = ref(database, `admins/${email.replace(/\./g, '_')}`);
        await set(adminRef, {
            email: email,
            fechaCreacion: new Date().toISOString(),
            activo: true
        });
        console.log('✅ Usuario hecho admin:', email);
    } catch (error) {
        console.error('Error al hacer admin:', error);
    }
}

// Exportar todo
export { 
    auth, 
    database, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    ref, 
    push, 
    set, 
    onValue, 
    query, 
    orderByChild, 
    equalTo, 
    remove,
    verificarSiEsAdmin,
    hacerAdmin
};

console.log('✅ Firebase configurado correctamente con NanyBeauty');
