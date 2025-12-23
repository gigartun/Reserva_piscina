// Variables globales
let reservaActual = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    document.getElementById('fecha').min = hoy;
    
    // Listeners para cálculo automático
    document.getElementById('propietarios').addEventListener('input', calcularTotal);
    document.getElementById('invitados').addEventListener('input', calcularTotal);
    
    calcularTotal();
});

// Calcular total a pagar
function calcularTotal() {
    const propietarios = parseInt(document.getElementById('propietarios').value) || 0;
    const invitados = parseInt(document.getElementById('invitados').value) || 0;
    const total = (propietarios * PRECIO_PROPIETARIO) + (invitados * PRECIO_INVITADO);
    document.getElementById('totalPago').textContent = `S/ ${total.toFixed(2)}`;
}

// Toggle normas
function toggleNormas() {
    const lista = document.getElementById('normasList');
    const icon = document.getElementById('normasIcon');
    if (lista.style.display === 'none') {
        lista.style.display = 'block';
        icon.textContent = '▲';
    } else {
        lista.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Mostrar mensaje
function mostrarMensaje(texto, tipo = 'info') {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = texto;
    mensaje.className = 'mensaje show ' + tipo;
    setTimeout(() => {
        mensaje.classList.remove('show');
    }, 5000);
}

// Validar propietario
async function validarPropietario(dpto) {
    try {
        const doc = await db.collection('propietarios').doc(dpto).get();
        
        if (!doc.exists) {
            return { valido: false, mensaje: 'Departamento no registrado' };
        }
        
        const data = doc.data();
        
        if (data.moroso) {
            return { valido: false, mensaje: 'Departamento con deuda pendiente. Contacte administración' };
        }
        
        if (data.blacklist) {
            return { valido: false, mensaje: 'Departamento suspendido. Contacte administración' };
        }
        
        return { valido: true, data };
    } catch (error) {
        console.error('Error validando propietario:', error);
        return { valido: false, mensaje: 'Error al validar departamento' };
    }
}

// Verificar reservas existentes
async function verificarReservaExistente(dpto, fecha) {
    try {
        const snapshot = await db.collection('reservas')
            .where('dpto', '==', dpto)
            .where('fecha', '==', fecha)
.get();
    return !snapshot.empty;
} catch (error) {
    console.error('Error verificando reserva:', error);
    return false;
}
}
// Verificar aforo del turno
async function verificarAforo(fecha, horario, nuevasPersonas) {
try {
const snapshot = await db.collection('reservas')
.where('fecha', '==', fecha)
.where('horario', '==', horario)
.where('usado', '==', false)
.get();
    let totalPersonas = nuevasPersonas;
    snapshot.forEach(doc => {
        totalPersonas += doc.data().totalPersonas;
    });
    
    return totalPersonas <= MAX_PERSONAS_TURNO;
} catch (error) {
    console.error('Error verificando aforo:', error);
    return true;
}
}
// Generar reserva
async function generarReserva() {
const dpto = document.getElementById('dpto').value.trim().toUpperCase();
const fecha = document.getElementById('fecha').value;
const horario = document.getElementById('horario').value;
const propietarios = parseInt(document.getElementById('propietarios').value);
const invitados = parseInt(document.getElementById('invitados').value);
const aceptoNormas = document.getElementById('aceptoNormas').checked;
// Validaciones básicas
if (!dpto || !fecha || !horario) {
    mostrarMensaje('❌ Complete todos los campos obligatorios', 'error');
    return;
}

if (!aceptoNormas) {
    mostrarMensaje('❌ Debe aceptar las normas de uso', 'error');
    return;
}

if (invitados > MAX_INVITADOS) {
    mostrarMensaje(`❌ Máximo ${MAX_INVITADOS} invitados por departamento`, 'error');
    return;
}

const totalPersonas = propietarios + invitados;
if (totalPersonas < 1) {
    mostrarMensaje('❌ Debe haber al menos 1 persona', 'error');
    return;
}

// Validar propietario
const validacion = await validarPropietario(dpto);
if (!validacion.valido) {
    mostrarMensaje(`❌ ${validacion.mensaje}`, 'error');
    return;
}

// Verificar reserva existente
const yaReservo = await verificarReservaExistente(dpto, fecha);
if (yaReservo) {
    mostrarMensaje('❌ Ya tiene una reserva para esta fecha', 'error');
    return;
}

// Verificar aforo
const aforoOk = await verificarAforo(fecha, horario, totalPersonas);
if (!aforoOk) {
    mostrarMensaje(`❌ Aforo máximo alcanzado para este horario (${MAX_PERSONAS_TURNO} personas)`, 'error');
    return;
}

// Advertencia horario adultos
if (horario === HORARIO_SOLO_ADULTOS) {
    mostrarMensaje(`⚠️ Horario ${HORARIO_SOLO_ADULTOS} exclusivo para adultos`, 'warning');
}

// Calcular pago
const pagoTotal = (propietarios * PRECIO_PROPIETARIO) + (invitados * PRECIO_INVITADO);

// Generar código QR
const qrData = `${dpto}|${fecha}|${horario}|${totalPersonas}`;

// Guardar en Firestore
try {
    const reserva = {
        dpto,
        fecha,
        horario,
        propietarios,
        invitados,
        totalPersonas,
        pagoTotal,
        pagado: false,
        qr: qrData,
        usado: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('reservas').add(reserva);
    
    // Mostrar resultado
    reservaActual = reserva;
    mostrarResultado(reserva);
    
} catch (error) {
    console.error('Error guardando reserva:', error);
    mostrarMensaje('❌ Error al guardar la reserva. Intente nuevamente', 'error');
}
}
// Mostrar resultado con QR
function mostrarResultado(reserva) {
document.getElementById('formReserva').style.display = 'none';
document.getElementById('qrResult').style.display = 'block';
// Llenar información
document.getElementById('resumenDpto').textContent = reserva.dpto;
document.getElementById('resumenFecha').textContent = reserva.fecha;
document.getElementById('resumenHorario').textContent = reserva.horario;
document.getElementById('resumenPersonas').textContent = reserva.totalPersonas;
document.getElementById('resumenTotal').textContent = `S/ ${reserva.pagoTotal.toFixed(2)}`;

// Generar QR
document.getElementById('qrcode').innerHTML = '';
new QRCode(document.getElementById('qrcode'), {
    text: reserva.qr,
    width: 200,
    height: 200
});

document.getElementById('qrText').textContent = reserva.qr;
}
// Nueva reserva
function nuevaReserva() {
document.getElementById('qrResult').style.display = 'none';
document.getElementById('formReserva').style.display = 'block';
// Limpiar formulario
document.getElementById('dpto').value = '';
document.getElementById('horario').value = '';
document.getElementById('propietarios').value = '1';
document.getElementById('invitados').value = '0';
document.getElementById('aceptoNormas').checked = false;

calcularTotal();
reservaActual = null;
}
