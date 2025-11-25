# 🌐 Guía: COTURN en DigitalOcean para Pruebas Públicas

## 🚀 Opción 1: DigitalOcean Droplet (Recomendado)

### Paso 1: Crear Droplet
1. **Ir a DigitalOcean**: https://cloud.digitalocean.com
2. **Create → Droplets**
3. **Configuración**:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic $6/mes (1GB RAM, 25GB SSD)
   - **Datacenter**: Cerca de tus usuarios (ej: NYC, Frankfurt)
   - **SSH Keys**: Agregar tu clave SSH

### Paso 2: Ejecutar Script de Instalación
```bash
# Conectar por SSH
ssh root@TU_IP_PUBLICA

# Descargar y ejecutar script
wget https://raw.githubusercontent.com/iquinde/ghox_server/main/setup-digitalocean-coturn.sh
chmod +x setup-digitalocean-coturn.sh
./setup-digitalocean-coturn.sh
```

### Paso 3: Configurar tu Backend
```javascript
// Actualizar .env con tu IP pública
COTURN_URL=TU_IP_DIGITALOCEAN
COTURN_USERNAME=ghoxuser  
COTURN_PASSWORD=GhoxSecurePass2024
COTURN_SECRET=GhoxTurnSecret2024SecureKey
```

---

## 🌩️ Opción 2: DigitalOcean App Platform + COTURN Externo

### Usar servicio COTURN administrado
```bash
# Opciones comerciales con mejor SLA:
1. Metered.ca - 50GB gratis/mes
2. Twilio TURN - Ya lo tienes configurado
3. Xirsys - Plan gratuito disponible
```

---

## ⚡ Opción 3: Docker en DigitalOcean (Más flexible)

### Docker Droplet con COTURN
```bash
# 1. Crear Docker Droplet (Marketplace)
# 2. Clonar tu repositorio
git clone https://github.com/iquinde/ghox_server.git
cd ghox_server

# 3. Actualizar docker-compose.yml para producción
# 4. Ejecutar
docker-compose up -d coturn
```

---

## 🧪 Probar Conectividad

### Test 1: Verificar STUN/TURN
```bash
# Usar herramienta online
https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

# Configurar:
STUN: stun:TU_IP:3478
TURN: turn:TU_IP:3478 (usuario: ghoxuser, pass: GhoxSecurePass2024)
```

### Test 2: Desde Diferentes Redes
```javascript
// En tu app cliente, probar desde:
// 1. WiFi casa
// 2. Datos móviles 4G/5G  
// 3. WiFi corporativo/universidad
// 4. Diferentes países/ciudades
```

---

## 📱 Configuración en tu App

### Actualizar ICE Configuration
```javascript
// src/routes/ice.js - Agregar servidor público
const productionCOTURN = {
  urls: [
    'turn:TU_IP_DIGITALOCEAN:3478',
    'turn:TU_IP_DIGITALOCEAN:3478?transport=tcp',
    'turns:TU_IP_DIGITALOCEAN:5349'
  ],
  username: 'ghoxuser',
  credential: 'GhoxSecurePass2024'
};
```

---

## 💰 Costos Estimados

### DigitalOcean Droplet
- **Basic**: $6/mes (suficiente para pruebas)
- **Standard**: $12/mes (mejor performance)
- **Bandwidth**: 1TB incluido

### Servicios Administrados
- **Metered.ca**: Gratis hasta 50GB/mes
- **Xirsys**: Plan gratuito limitado
- **Twilio**: $0.0015 por minuto de relay

---

## 🎯 Recomendación para Pruebas

### Setup Rápido (30 minutos):
1. **Crear Droplet DigitalOcean** ($6/mes)
2. **Ejecutar script de instalación**
3. **Actualizar tu .env con IP pública**
4. **Probar desde múltiples dispositivos/redes**

### ¿Cuál prefieres?
- **🚀 DigitalOcean Droplet**: Control total, $6/mes
- **⚡ Servicio administrado**: Metered.ca gratis
- **🐳 Docker setup**: Más flexible para desarrollo

¿Qué opción te interesa más? ¿Creamos el Droplet ahora?