// 🔒 Configuración WebRTC optimizada para SRTP/DTLS
export const webrtcConfig = {
  // Configuración base para máxima seguridad
  security: {
    bundlePolicy: "max-bundle",           // Una sola conexión = menos superficie de ataque
    rtcpMuxPolicy: "require",            // RTCP multiplexado sobre RTP
    iceCandidatePoolSize: 2,             // Pool pequeño pero eficiente
    enableDtlsSrtp: true                 // DTLS-SRTP obligatorio
  },

  // Constraints de audio optimizados para llamadas de voz
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,                   // Alta calidad para voz
    channelCount: 1                      // Mono para llamadas
  },

  // Códecs preferidos (ordenados por seguridad y calidad)
  preferredCodecs: [
    'OPUS',                              // Mejor codec para voz sobre WebRTC
    'G722',                              // Backup de alta calidad
    'PCMU',                              // Compatibilidad universal
    'PCMA'
  ]
};

// 🔍 Función para validar estado de cifrado
export function validateEncryption(peerConnection) {
  return new Promise((resolve) => {
    peerConnection.getStats().then(stats => {
      let encryptionInfo = {
        dtlsState: 'unknown',
        srtpCipher: 'unknown',
        isSecure: false
      };

      stats.forEach(report => {
        if (report.type === 'transport') {
          encryptionInfo.dtlsState = report.dtlsState || 'unknown';
          encryptionInfo.srtpCipher = report.srtpCipher || 'unknown';
          encryptionInfo.isSecure = report.dtlsState === 'connected';
        }
      });

      resolve(encryptionInfo);
    });
  });
}

// 🛡️ Validar fingerprints en SDP para prevenir ataques
export function validateSdpFingerprint(sdp) {
  if (!sdp) return false;
  
  const fingerprintRegex = /a=fingerprint:(\w+)\s+([A-F0-9:]+)/g;
  const matches = Array.from(sdp.matchAll(fingerprintRegex));
  
  if (matches.length === 0) {
    console.warn("⚠️  No DTLS fingerprint found in SDP");
    return false;
  }

  // Verificar que use algoritmos seguros
  const secureAlgorithms = ['sha-256', 'sha-384', 'sha-512'];
  const hasSecureAlgorithm = matches.some(match => 
    secureAlgorithms.includes(match[1].toLowerCase())
  );

  if (!hasSecureAlgorithm) {
    console.warn("⚠️  Insecure fingerprint algorithm in SDP");
    return false;
  }

  console.log("✅ SDP fingerprint validation passed");
  return true;
}

// 📊 Obtener estadísticas detalladas de seguridad
export function getSecurityStats(peerConnection) {
  return new Promise((resolve) => {
    peerConnection.getStats().then(stats => {
      const securityInfo = {
        connection: { encrypted: false, protocol: 'unknown' },
        audio: { encrypted: false, codec: 'unknown' },
        network: { type: 'unknown', local: null, remote: null }
      };

      stats.forEach(report => {
        switch (report.type) {
          case 'transport':
            securityInfo.connection = {
              encrypted: report.dtlsState === 'connected',
              protocol: 'DTLS-SRTP',
              dtlsState: report.dtlsState,
              srtpCipher: report.srtpCipher
            };
            break;

          case 'inbound-rtp':
            if (report.kind === 'audio') {
              securityInfo.audio = {
                encrypted: true, // Siempre cifrado en WebRTC
                codec: report.codecId,
                packetsReceived: report.packetsReceived,
                bytesReceived: report.bytesReceived
              };
            }
            break;

          case 'candidate-pair':
            if (report.state === 'succeeded') {
              securityInfo.network = {
                type: report.currentRoundTripTime ? 'active' : 'backup',
                local: report.localCandidateId,
                remote: report.remoteCandidateId,
                roundTripTime: report.currentRoundTripTime
              };
            }
            break;
        }
      });

      resolve(securityInfo);
    });
  });
}

// 🔧 Crear PeerConnection con configuración segura
export function createSecurePeerConnection(iceServers) {
  const config = {
    iceServers,
    bundlePolicy: webrtcConfig.security.bundlePolicy,
    rtcpMuxPolicy: webrtcConfig.security.rtcpMuxPolicy,
    iceCandidatePoolSize: webrtcConfig.security.iceCandidatePoolSize
  };

  const pc = new RTCPeerConnection(config);

  // Log de eventos de seguridad
  pc.onconnectionstatechange = () => {
    console.log(`🔗 Connection state: ${pc.connectionState}`);
    if (pc.connectionState === 'connected') {
      validateEncryption(pc).then(info => {
        console.log(`🔒 Encryption status: ${info.isSecure ? '✅' : '❌'} ${info.srtpCipher}`);
      });
    }
  };

  pc.onicegatheringstatechange = () => {
    console.log(`🧊 ICE gathering: ${pc.iceGatheringState}`);
  };

  return pc;
}

export default webrtcConfig;