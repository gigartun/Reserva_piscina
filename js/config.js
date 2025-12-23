// Configuración de Firebase
// INSTRUCCIONES: Reemplaza con tus credenciales de Firebase Console
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// PIN del administrador (puedes cambiarlo aquí)
const ADMIN_PIN = '1234';

// Constantes
const HORARIOS = [
    "07:00-08:50",
    "09:00-10:50",
    "11:00-12:50",
    "15:00-16:50",
    "17:00-18:50",
    "19:00-20:50"
];

const HORARIO_SOLO_ADULTOS = "19:00-20:50";
const MAX_PERSONAS_TURNO = 30;
const MAX_INVITADOS = 2;
const PRECIO_PROPIETARIO = 4;
const PRECIO_INVITADO = 5;