## **9️⃣ README.md**
````markdown
# 🏊‍♂️ Sistema de Reserva de Piscina - Condominio

Sistema web completo para gestionar reservas de turnos en la piscina del condominio.

## 📋 Características

- ✅ Reserva de turnos sin necesidad de login
- 💰 Cálculo automático de pagos
- 📱 Generación de QR por reserva
- 🔍 Validación de QR con cámara
- 🔐 Panel administrativo con PIN
- 📊 Exportación de datos a CSV
- 🚫 Control de morosos y blacklist
- 📈 Estadísticas en tiempo real

## 🚀 Instalación

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Firestore Database
4. En configuración del proyecto, copia las credenciales

### 2. Configurar credenciales

Edita `js/config.js` y reemplaza con tus credenciales:
```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    // ...
};
```

### 3. Configurar reglas de Firestore

En Firebase Console > Firestore > Reglas:
````
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /propietarios/{document=**} {
      allow read, write: if true;
    }
    match /reservas/{document=**} {
      allow read, write: if true;
    }
  }
}