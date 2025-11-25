import { Router } from "express";
export const iceRouter = Router();

// 🔒 Configuración WebRTC con COTURN - Local y DigitalOcean
iceRouter.get("/", async (req, res) => {
  try {
    const webrtcConfig = {
      iceServers: await getOptimalICEServers(),
      // 🛡️ Configuración agresiva para NAT restrictivo
      security: {
        enforceEncryption: true,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
        iceCandidatePoolSize: 10,        // Pool más grande para redes difíciles
        iceTransportPolicy: "all",      // Usar TURN si P2P falla
        mandatoryDtls: true
      },
      // 🚀 Configuración para redes corporativas
      networking: {
        tcpFallback: true,               // TCP si UDP bloqueado
        httpsRelay: true,                // TURN sobre puerto 443
        aggressiveNomination: true       // Conexión rápida
      }
    };

    console.log("🔒 WebRTC ICE Config: Conectividad universal + SRTP");
    return res.json(webrtcConfig);
  } catch (error) {
    console.error("❌ ICE configuration error:", error);
    return res.status(500).json({ 
      error: "Failed to get ICE configuration",
      fallback: await getFallbackICEServers()
    });
  }
});

// 🌐 Obtener servidores ICE optimales - 3 niveles de fallback
async function getOptimalICEServers() {
  const iceServers = [];

  // 1. 🌐 Metered.ca TURN (máxima prioridad) - Gratis y confiable
  if (process.env.COTURN_URL) {
    const isMetered = process.env.COTURN_URL.includes('metered.ca');
    const isLocal = process.env.COTURN_URL === 'localhost';
    
    iceServers.push({
      urls: [
        `turn:${process.env.COTURN_URL}:80`,
        `turn:${process.env.COTURN_URL}:80?transport=tcp`,
        `turn:${process.env.COTURN_URL}:443`,
        `turns:${process.env.COTURN_URL}:443?transport=tcp`,
        ...(isLocal ? [
          `turn:${process.env.COTURN_URL}:3478`,
          `turns:${process.env.COTURN_URL}:5349`
        ] : [])
      ],
      username: process.env.COTURN_USERNAME || "openrelayproject",
      credential: process.env.COTURN_PASSWORD || "openrelayproject"
    });
    console.log(`🌐 TURN Server: ${isMetered ? 'Metered.ca (público)' : isLocal ? 'local' : 'público'} - ${process.env.COTURN_URL}`);
  }

  // 2. 💙 Twilio como backup (si configurado)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const Twilio = (await import("twilio")).default;
      const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const token = await client.tokens.create({ ttl: 3600 }); // 1 hora
      
      if (token.iceServers?.length > 0) {
        iceServers.push(...token.iceServers);
        console.log("✅ Twilio TURN servers como backup");
      }
    } catch (twilioError) {
      console.warn("⚠️ Twilio TURN error:", twilioError.message);
    }
  }

  // 3. 🔧 Servidores TURN públicos robustos (último recurso)
  iceServers.push(
    // Metered TURN (múltiples protocolos)
    {
      urls: [
        "turn:a.relay.metered.ca:80",
        "turn:a.relay.metered.ca:80?transport=tcp",
        "turn:a.relay.metered.ca:443",
        "turns:a.relay.metered.ca:443?transport=tcp"
      ],
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: [
        "turn:b.relay.metered.ca:80",
        "turn:b.relay.metered.ca:80?transport=tcp",
        "turn:b.relay.metered.ca:443",
        "turns:b.relay.metered.ca:443?transport=tcp"
      ],
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  );

  // 4. 🌟 STUN servers públicos (siempre incluir)
  iceServers.push(
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.stunprotocol.org:3478" }
  );

  console.log(`🔗 ICE servers configurados: ${iceServers.length} servidores`);
  return iceServers;
}

// 🆘 Servidores ICE de emergencia
async function getFallbackICEServers() {
  return [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:a.relay.metered.ca:80",
      username: "openrelayproject", 
      credential: "openrelayproject"
    }
  ];
}

// 🧪 Endpoint para probar conectividad específica
iceRouter.get("/test/:server", async (req, res) => {
  const { server } = req.params;
  
  try {
    let testResult = { server, status: "unknown", message: "" };
    
    switch(server) {
      case "coturn":
        if (process.env.COTURN_URL) {
          testResult = {
            server: "coturn",
            status: "configured",
            url: `${process.env.COTURN_URL}:3478`,
            message: "COTURN servidor configurado"
          };
        } else {
          testResult = {
            server: "coturn", 
            status: "not_configured",
            message: "COTURN_URL no configurado"
          };
        }
        break;
        
      case "twilio":
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          testResult = {
            server: "twilio",
            status: "configured", 
            message: "Twilio credenciales configuradas"
          };
        } else {
          testResult = {
            server: "twilio",
            status: "not_configured",
            message: "Twilio credenciales faltantes"
          };
        }
        break;
        
      default:
        testResult = {
          server,
          status: "unknown",
          message: "Servidor no reconocido. Usa: coturn, twilio"
        };
    }
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      server,
      status: "error",
      message: error.message
    });
  }
});

// 📊 Endpoint para obtener estadísticas de ICE servers
iceRouter.get("/stats", async (req, res) => {
  try {
    const iceServers = await getOptimalICEServers();
    
    const stats = {
      total: iceServers.length,
      coturn: iceServers.filter(s => 
        s.urls?.some(url => url.includes(process.env.COTURN_URL || "localhost"))
      ).length,
      twilio: iceServers.filter(s => 
        s.urls?.some(url => url.includes("twilio"))
      ).length,
      public: iceServers.filter(s => 
        s.urls?.some(url => url.includes("metered") || url.includes("google"))
      ).length,
      environment: process.env.NODE_ENV || "development",
      coturn_configured: !!process.env.COTURN_URL,
      twilio_configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get ICE stats",
      message: error.message
    });
  }
});