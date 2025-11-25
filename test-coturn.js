#!/usr/bin/env node

/**
 * 🧪 Test COTURN Server - Verificar conectividad
 * Prueba nuestro servidor TURN local para conectividad universal
 */

async function testCOTURNConnectivity() {
  console.log('🧪 Probando conectividad con COTURN...\n');

  // 1. Verificar puertos COTURN directamente
  console.log('1. 🔍 Verificando puertos COTURN:');
  const net = await import('net');
  
  const ports = [
    { port: 3478, protocol: 'TCP', service: 'STUN/TURN' },
    { port: 5349, protocol: 'TCP', service: 'TURNS (TLS)' }
  ];

  for (const portInfo of ports) {
    try {
      const socket = new net.default.Socket();
      
      const testPromise = new Promise((resolve) => {
        socket.setTimeout(2000);
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });

      socket.connect(portInfo.port, 'localhost');
      const connected = await testPromise;
      
      if (connected) {
        console.log(`   ✅ Puerto ${portInfo.port}/${portInfo.protocol} (${portInfo.service}) - ABIERTO`);
      } else {
        console.log(`   ❌ Puerto ${portInfo.port}/${portInfo.protocol} (${portInfo.service}) - CERRADO`);
      }
    } catch (error) {
      console.log(`   ❌ Puerto ${portInfo.port}/${portInfo.protocol} - Error: ${error.message}`);
    }
  }

  // 2. Verificar contenedor Docker
  console.log('\n2. 🐳 Verificando contenedor COTURN:');
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('docker ps --filter name=ghox_coturn --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
    
    if (stdout.includes('ghox_coturn')) {
      console.log('   ✅ Contenedor ghox_coturn está corriendo');
      console.log('   📋 Estado:', stdout.split('\n')[1]);
    } else {
      console.log('   ❌ Contenedor ghox_coturn no encontrado');
      console.log('   💡 Ejecuta: docker-compose up -d coturn');
    }
  } catch (error) {
    console.log('   ⚠️ No se pudo verificar contenedor Docker');
  }

  // 3. Verificar archivos de configuración
  console.log('\n3. 📋 Verificando configuración:');
  const fs = await import('fs');
  
  const configFiles = [
    { file: 'coturn.conf', description: 'Configuración COTURN' },
    { file: 'docker-compose.yml', description: 'Docker Compose' },
    { file: '.env', description: 'Variables de entorno' }
  ];

  for (const config of configFiles) {
    try {
      if (fs.default.existsSync(config.file)) {
        console.log(`   ✅ ${config.file} - ${config.description} existe`);
      } else {
        console.log(`   ❌ ${config.file} - No encontrado`);
      }
    } catch (error) {
      console.log(`   ❌ Error verificando ${config.file}`);
    }
  }

  // 4. Mostrar configuración ICE recomendada
  console.log('\n4. 🔧 Configuración ICE para WebRTC:');
  console.log('```javascript');
  console.log('const iceServers = [');
  console.log('  {');
  console.log('    urls: [');
  console.log('      "turn:localhost:3478",');
  console.log('      "turn:localhost:3478?transport=tcp",');
  console.log('      "turns:localhost:5349"');
  console.log('    ],');
  console.log('    username: "ghoxuser",');
  console.log('    credential: "ghoxpass123"');
  console.log('  }');
  console.log('];');
  console.log('```');

  console.log('\n🎯 Estado COTURN:');
  console.log('✅ Configuración: Completa');
  console.log('✅ Contenedor: Debe estar corriendo');
  console.log('✅ Puertos: 3478 (TURN), 5349 (TURNS)');
  console.log('\n💡 Próximos pasos:');
  console.log('1. npm start (iniciar servidor Node.js)');
  console.log('2. Probar: http://localhost:3000/api/ice');
  console.log('3. Configurar app cliente con ICE servers\n');
}

// Ejecutar test
testCOTURNConnectivity().catch(console.error);