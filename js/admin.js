## **7️⃣ js/admin.js**
````javascript
let sesionActiva = false;

// Autenticar administrador
function autenticarAdmin() {
    const pin = document.getElementById('pinAdmin').value;
    const mensaje = document.getElementById('mensajeAdmin');
    
    if (pin === ADMIN_PIN) {
        sesionActiva = true;
        document.getElementById('loginAdmin').style.display = 'none';
        document.getElementById('panelAdmin').style.display = 'block';
        cargarReservas();
    } else {
        mensaje.textContent = '❌ PIN incorrecto';
        mensaje.className = 'mensaje show error';
        setTimeout(() => mensaje.classList.remove('show'), 3000);
    }
}

// Cerrar sesión
function cerrarSesion() {
    sesionActiva = false;
    document.getElementById('panelAdmin').style.display = 'none';
    document.getElementById('loginAdmin').style.display = 'block';
    document.getElementById('pinAdmin').value = '';
}

// Cargar reservas
async function cargarReservas() {
    const filtroFecha = document.getElementById('filtroFechaInput').value;
    
    try {
        let query = db.collection('reservas').orderBy('timestamp', 'desc');
        
        if (filtroFecha) {
            query = query.where('fecha', '==', filtroFecha);
        }
        
        const snapshot = await query.get();
        const bodyReservas = document.getElementById('bodyReservas');
        
        if (snapshot.empty) {
            bodyReservas.innerHTML = '<tr><td colspan="7" class="no-data">No hay reservas</td></tr>';
            actualizarEstadisticas([]);
            return;
        }
        
        const reservas = [];
        bodyReservas.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            reservas.push(data);
            
            const tr = document.createElement('tr');
            
            let estadoBadge = '';
            if (data.usado) {
                estadoBadge = '<span style="color: #28a745;">✓ Usado</span>';
            } else if (data.pagado) {
                estadoBadge = '<span style="color: #007bff;">💰 Pagado</span>';
            } else {
                estadoBadge = '<span style="color: #ffc107;">⏳ Pendiente</span>';
            }
            
            tr.innerHTML = `
                <td>${data.fecha}</td>
                <td>${data.horario}</td>
                <td><strong>${data.dpto}</strong></td>
                <td>${data.totalPersonas}</td>
                <td>S/ ${data.pagoTotal.toFixed(2)}</td>
                <td>${estadoBadge}</td>
                <td>
                    ${!data.pagado ? `<button onclick="marcarPagado('${doc.id}')" class="btn-success" style="padding: 5px 10px; font-size: 12px;">✓ Pagado</button>` : ''}
                    ${!data.usado ? `<button onclick="eliminarReserva('${doc.id}')" class="btn-danger" style="padding: 5px 10px; font-size: 12px;">✗ Eliminar</button>` : ''}
                </td>
            `;
            
            bodyReservas.appendChild(tr);
        });
        
        actualizarEstadisticas(reservas);
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
    }
}

// Actualizar estadísticas
function actualizarEstadisticas(reservas) {
    const totalReservas = reservas.length;
    const totalRecaudado = reservas.reduce((sum, r) => sum + r.pagoTotal, 0);
    const totalPersonas = reservas.reduce((sum, r) => sum + r.totalPersonas, 0);
    
    document.getElementById('totalReservas').textContent = totalReservas;
    document.getElementById('totalRecaudado').textContent = `S/ ${totalRecaudado.toFixed(2)}`;
    document.getElementById('totalPersonas').textContent = totalPersonas;
}

// Marcar como pagado
async function marcarPagado(reservaId) {
    if (!confirm('¿Confirmar que se recibió el pago?')) return;
    
    try {
        await db.collection('reservas').doc(reservaId).update({
            pagado: true
        });
        cargarReservas();
    } catch (error) {
        console.error('Error marcando como pagado:', error);
        alert('Error al actualizar el pago');
    }
}

// Eliminar reserva
async function eliminarReserva(reservaId) {
    if (!confirm('¿Está seguro de eliminar esta reserva?')) return;
    
    try {
        await db.collection('reservas').doc(reservaId).delete();
        cargarReservas();
    } catch (error) {
        console.error('Error eliminando reserva:', error);
        alert('Error al eliminar la reserva');
    }
}

// Marcar moroso
async function marcarMoroso() {
    const dpto = document.getElementById('dptoGestion').value.trim().toUpperCase();
    if (!dpto) {
        alert('Ingrese un departamento');
        return;
    }
    
    try {
        await db.collection('propietarios').doc(dpto).set({
            dpto,
            moroso: true,
            blacklist: false
        }, { merge: true });
        
        alert(`Departamento ${dpto} marcado como moroso`);
        document.getElementById('dptoGestion').value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado');
    }
}

// Marcar blacklist
async function marcarBlacklist() {
    const dpto = document.getElementById('dptoGestion').value.trim().toUpperCase();
    if (!dpto) {
        alert('Ingrese un departamento');
        return;
    }
    
    if (!confirm(`¿Confirma agregar ${dpto} a la lista negra?`)) return;
    
    try {
        await db.collection('propietarios').doc(dpto).set({
            dpto,
            moroso: false,
            blacklist: true
        }, { merge: true });
        
        alert(`Departamento ${dpto} agregado a blacklist`);
        document.getElementById('dptoGestion').value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado');
    }
}

// Limpiar estado
async function limpiarEstado() {
    const dpto = document.getElementById('dptoGestion').value.trim().toUpperCase();
    if (!dpto) {
        alert('Ingrese un departamento');
        return;
    }
    
    try {
        await db.collection('propietarios').doc(dpto).set({
            dpto,
            moroso: false,
            blacklist: false
        }, { merge: true });
        
        alert(`Estado de ${dpto} limpiado correctamente`);
        document.getElementById('dptoGestion').value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado');
    }
}

// Exportar CSV
async function exportarCSV() {
    try {
        const snapshot = await db.collection('reservas').orderBy('fecha', 'desc').get();
        
        let csv = 'Fecha,Horario,Departamento,Propietarios,Invitados,Total Personas,Pago Total,Pagado,Usado\n';
        
        snapshot.forEach(doc => {
            const r = doc.data();
            csv += `${r.fecha},${r.horario},${r.dpto},${r.propietarios},${r.invitados},${r.totalPersonas},${r.pagoTotal},${r.pagado ? 'Sí' : 'No'},${r.usado ? 'Sí' : 'No'}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `reservas_piscina_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ CSV exportado correctamente');
    } catch (error) {
        console.error('Error exportando CSV:', error);
        alert('Error al exportar CSV');
    }
}

// Auto-cargar al inicio
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('filtroFechaInput').value = hoy;
});
````

---

## **8️⃣ js/scan.js**
````javascript
let stream = null;
let scanning = false;

// Actualizar hora actual
function actualizarHorarioActual() {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    document.getElementById('horarioActual').textContent = `${horas}:${minutos}`;
}

setInterval(actualizarHorarioActual, 1000);
actualizarHorarioActual();

// Calcular aforo actual
async function calcularAforoActual() {
    const hoy = new Date().toISOString().split('T')[0];
    
    try {
        const snapshot = await db.collection('reservas')
            .where('fecha', '==', hoy)
            .where('usado', '==', true)
            .get();
        
        let total = 0;
        snapshot.forEach(doc => {
            total += doc.data().totalPersonas;
        });
        
        document.getElementById('aforoActual').textContent = total;
    } catch (error) {
        console.error('Error calculando aforo:', error);
    }
}

calcularAforoActual();
setInterval(calcularAforoActual, 30000);

// Iniciar cámara
async function iniciarCamara() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.style.display = 'block';
        document.querySelector('.camera-placeholder').style.display = 'none';
        
        scanning = true;
        escanearQR();
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Use el modo manual.');
    }
}

// Escanear QR desde video
function escanearQR() {
    if (!scanning) return;
    
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            scanning = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            validarQR(code.data);
            return;
        }
    }
    
    requestAnimationFrame(escanearQR);
}

// Validar QR manual
function validarQRManual() {
    const qr = document.getElementById('qrManual').value.trim();
    if (!qr) {
        alert('Ingrese un código QR');
        return;
    }
    validarQR(qr);
}

// Validar QR
async function validarQR(qrData) {
    const resultado = document.getElementById('resultado');
    resultado.style.display = 'block';
    resultado.innerHTML = '<p>⏳ Validando...</p>';
    
    try {
        // Buscar reserva
        const snapshot = await db.collection('reservas')
            .where('qr', '==', qrData)
            .get();
        
        if (snapshot.empty) {
            resultado.className = 'result-box error';
            resultado.innerHTML = `
                <div style="font-size: 48px;">❌</div>
                <h2>QR No Válido</h2>
                <p>Este código no corresponde a ninguna reserva</p>
            `;
            return;
        }
        
        const doc = snapshot.docs[0];
        const reserva = doc.data();
        
        // Verificar si ya fue usado
        if (reserva.usado) {
            resultado.className = 'result-box error';
            resultado.innerHTML = `
                <div style="font-size: 48px;">⚠️</div>
                <h2>Reserva Ya Utilizada</h2>
                <p>Este código QR ya fue usado anteriormente</p>
            `;
            return;
        }
        
        // Verificar fecha
        const hoy = new Date().toISOString().split('T')[0];
        if (reserva.fecha !== hoy) {
            resultado.className = 'result-box error';
            resultado.innerHTML = `
                <div style="font-size: 48px;">📅</div>
                <h2>Fecha Incorrecta</h2>
                <p>Esta reserva es para el ${reserva.fecha}</p>
            `;
            return;
        }
        
        // Verificar pago
        if (!reserva.pagado) {
            resultado.className = 'result-box error';
            resultado.innerHTML = `
                <div style="font-size: 48px;">💰</div>
                <h2>Pago Pendiente</h2>
                <p>Debe realizar el pago en administración antes de ingresar</p>
                <p><strong>Monto: S/ ${reserva.pagoTotal.toFixed(2)}</strong></p>
            `;
            return;
        }
        
        // Verificar aforo
        const snapshot2 = await db.collection('reservas')
            .where('fecha', '==', hoy)
            .where('horario', '==', reserva.horario)
            .where('usado', '==', true)
            .get();
        
        let aforoActual = reserva.totalPersonas;
        snapshot2.forEach(doc => {
            aforoActual += doc.data().totalPersonas;
        });
        
        if (aforoActual > MAX_PERSONAS_TURNO) {
            resultado.className = 'result-box error';
            resultado.innerHTML = `
                <div style="font-size: 48px;">⚠️</div>
                <h2>Aforo Máximo Alcanzado</h2>
                <p>El turno ha llegado al límite de ${MAX_PERSONAS_TURNO} personas</p>
            `;
            return;
        }
        
        // TODO OK - Marcar como usado
        await doc.ref.update({
            usado: true,
            horaIngreso: new Date().toLocaleTimeString()
        });
        
        resultado.className = 'result-box success';
        resultado.innerHTML = `
            <div style="font-size: 64px;">✅</div>
            <h2>Acceso Autorizado</h2>
            <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0; text-align: left;">
                <p><strong>Departamento:</strong> ${reserva.dpto}</p>
                <p><strong>Horario:</strong> ${reserva.horario}</p>
                <p><strong>Personas:</strong> ${reserva.totalPersonas}</p>
                <p><strong>Pago:</strong> S/ ${reserva.pagoTotal.toFixed(2)}</p>
            </div>
            <p style="color: #28a745; font-weight: bold;">Puede ingresar a la piscina</p>
        `;
        
        calcularAforoActual();
        
    } catch (error) {
        console.error('Error validando QR:', error);
        resultado.className = 'result-box error';
        resultado.innerHTML = `
            <div style="font-size: 48px;">❌</div>
            <h2>Error</h2>
            <p>Error al validar el código. Intente nuevamente</p>
        `;
    }
}
````

---