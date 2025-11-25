# 🛠️ Script de instalación COTURN - Ubuntu/Debian

echo "🏠 Instalando COTURN para conectividad WebRTC universal..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar COTURN
sudo apt install coturn -y

# Habilitar servicio
sudo systemctl enable coturn

# Crear directorio para certificados
sudo mkdir -p /etc/coturn/certs

# Copiar configuración
sudo cp coturn.conf /etc/coturn/turnserver.conf

# Copiar certificados SSL (usar los mismos que HTTPS)
sudo cp ssl/cert.pem /etc/coturn/certs/
sudo cp ssl/key.pem /etc/coturn/certs/

# Generar parámetros Diffie-Hellman
sudo openssl dhparam -out /etc/coturn/certs/dhparam.pem 2048

# Configurar permisos
sudo chown -R turnserver:turnserver /etc/coturn/certs
sudo chmod 600 /etc/coturn/certs/*.pem

# Configurar firewall
echo "🔥 Configurando firewall para COTURN..."
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp  # Rango de media relay

# Habilitar en /etc/default/coturn
echo 'TURNSERVER_ENABLED=1' | sudo tee /etc/default/coturn

# Iniciar servicio
sudo systemctl start coturn
sudo systemctl status coturn

echo "✅ COTURN instalado correctamente!"
echo "🌐 Servidor TURN disponible en:"
echo "   STUN/TURN: tu-servidor:3478"
echo "   TURNS:     tu-servidor:5349"
echo ""
echo "📋 Configurar en .env:"
echo "   COTURN_URL=tu-servidor.com"
echo "   COTURN_USERNAME=ghox_user"
echo "   COTURN_PASSWORD=ghox_secure_password_2024"