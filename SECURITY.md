# 🔒 Ghox P2P Voice Server - WebRTC con SRTP

Backend optimizado para llamadas de voz P2P con **cifrado de extremo a extremo por defecto**.

## ✨ Características de Seguridad

### 🔐 Doble Cifrado
- **Media Stream**: SRTP/DTLS automático (WebRTC)
- **Señalización**: TLS/WSS opcional (HTTPS)

### 🛡️ Configuración Segura
- Bundle Policy: `max-bundle` (menor superficie de ataque)
- RTCP Mux obligatorio
- DTLS-SRTP forzado
- Validación de fingerprints SDP

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor (HTTP)
```bash
npm start
# 🌐 Servidor en http://localhost:8080
```

### 3. Con HTTPS/WSS (Recomendado)
```bash
# Generar certificados SSL
./generate-ssl.sh    # Linux/Mac
generate-ssl.bat     # Windows

# Iniciar con SSL
npm run ssl:start
# 🔒 Servidor en https://localhost:8080
```

## 🧪 Probar Cifrado

1. Abrir **https://localhost:8080** (o http si no usas SSL)
2. Conectar con token JWT válido
3. Verificar estados de cifrado:
   - **Señalización**: 🔒 WSS o ⚠️ WS sin cifrar
   - **WebRTC**: 🔗 Conectado
   - **SRTP**: 🔒 Activo

## 📡 API Endpoints

### ICE Configuration
```bash
GET /api/ice
# Respuesta con iceServers optimizados para SRTP
```

### Estadísticas de Seguridad
```bash
GET /api/stats
# Información de llamadas activas y cifrado
```

### Estado del Servidor
```bash
GET /health
# Status con información de cifrado
```

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)
```bash
# Seguridad JWT
JWT_SECRET=tu_secret_muy_seguro

# SSL/TLS
USE_SSL=true
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem

# CORS
ALLOWED_ORIGINS=https://tu-frontend.com

# Base de datos
MONGO_URI=mongodb://localhost:27017/ghox
```

### Cliente WebRTC (Ejemplo)
```javascript
// Configuración con SRTP obligatorio
const pc = new RTCPeerConnection({
  iceServers: await fetch('/api/ice').then(r => r.json()).iceServers,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
});

// Verificar cifrado después de conectar
pc.onconnectionstatechange = async () => {
  if (pc.connectionState === 'connected') {
    const stats = await pc.getStats();
    stats.forEach(report => {
      if (report.type === 'transport') {
        console.log('🔒 SRTP:', report.srtpCipher);
        console.log('🔗 DTLS:', report.dtlsState);
      }
    });
  }
};
```

## 🔍 Verificar Seguridad

### 1. Logs del Servidor
```bash
npm start
# Buscar:
# ✅ OFFER de user1: ✅ SRTP/DTLS
# 🔒 DTLS conectado: AES_128_CM_HMAC_SHA1_80
```

### 2. DevTools del Cliente
```javascript
// En consola del navegador
await navigator.mediaDevices.getUserMedia({audio: true})
  .then(() => console.log('🎤 Audio access granted'))

// Verificar protocolo seguro
console.log('Protocolo:', location.protocol); // https: o http:
```

### 3. Wireshark/Network Analysis
- **Puerto 443/8080**: Tráfico TLS cifrado
- **Puertos RTP**: Solo paquetes SRTP (cifrados)

## 🚨 Troubleshooting

### Error: "Certificate not trusted"
```bash
# En desarrollo, aceptar certificado autofirmado
# O usar mkcert para certificados confiables:
npm install -g mkcert
mkcert localhost 127.0.0.1
```

### Error: "ICE connection failed"
- Verificar TURN servers en `/api/ice`
- Checkear firewall/NAT configuration
- Probar con diferentes redes

### Warning: "No DTLS fingerprint"
- Verificar que WebRTC use configuración estándar
- Actualizar navegador (Chrome 90+, Firefox 88+)

## 🌐 Deployment Production

### Docker
```dockerfile
FROM node:18
COPY . /app
WORKDIR /app
RUN npm install --production
ENV USE_SSL=true
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
```

### Let's Encrypt SSL
```bash
certbot certonly --standalone -d your-domain.com
export SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
export SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

---

**🔒 Resultado**: WebRTC con SRTP + Señalización TLS = Seguridad completa de extremo a extremo