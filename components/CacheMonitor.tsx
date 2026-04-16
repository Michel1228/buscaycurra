"use client";

/**
 * Panel de monitoreo del caché — Solo para administradores
 *
 * Muestra en tiempo real:
 * - Hit rate del caché (% de peticiones servidas sin llamar a la IA)
 * - Contadores de llamadas a Groq y Gemini vs sus límites
 * - Dinero ahorrado este mes
 * - Cuántos usuarios más puede aguantar el sistema
 *
 * Colores de marca:
 * - Azul: #2563EB (principal)
 * - Naranja: #F97316 (acento)
 */

import { useState, useEffect, useCallback } from "react";

// ==========================================
// TIPOS DE DATOS
// ==========================================

interface DatosCache {
  redis: {
    conectado: boolean;
    memoriaUsada?: string;
    totalClaves?: number;
  };
  cache: {
    hitRate: number;
    porcentajeEficiencia: string;
    hitsHoy: number;
    missesHoy: number;
    totalPeticionesHoy: number;
  };
  ia: {
    groq: {
      llamadasHoy: number;
      limiteMaximo: number;
      porcentajeUsado: string;
      disponible: boolean;
    };
    gemini: {
      llamadasHoy: number;
      limiteMaximo: number;
      porcentajeUsado: string;
      disponible: boolean;
    };
  };
  ahorro: {
    dineroAhorradoHoy: string;
    dineroAhorradoMes: string;
  };
  capacidad: {
    usuariosEstimados: number;
    descripcion: string;
  };
  actualizadoEn: string;
}

interface PropsCacheMonitor {
  adminSecret: string; // El secreto de admin para autenticarse
  actualizarCadaSegundos?: number; // Por defecto cada 30 segundos
}

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

/** Barra de progreso con color dinámico */
function BarraProgreso({
  porcentaje,
  color = "#2563EB",
  altura = 8,
}: {
  porcentaje: number;
  color?: string;
  altura?: number;
}) {
  // Color rojo si está al 90% o más (límite cercano)
  const colorFinal = porcentaje >= 90 ? "#EF4444" : porcentaje >= 70 ? "#F97316" : color;

  return (
    <div
      style={{
        width: "100%",
        height: altura,
        backgroundColor: "#E5E7EB",
        borderRadius: altura / 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(porcentaje, 100)}%`,
          height: "100%",
          backgroundColor: colorFinal,
          borderRadius: altura / 2,
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
  );
}

/** Tarjeta de estadística individual */
function TarjetaStat({
  titulo,
  valor,
  subtitulo,
  icono,
  colorIcono = "#2563EB",
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icono: string;
  colorIcono?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icono}</span>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{titulo}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: colorIcono, lineHeight: 1 }}>
        {valor}
      </div>
      {subtitulo && (
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{subtitulo}</div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function CacheMonitor({
  adminSecret,
  actualizarCadaSegundos = 30,
}: PropsCacheMonitor) {
  const [datos, setDatos] = useState<DatosCache | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  /**
   * Obtiene las estadísticas del servidor
   */
  const cargarEstadisticas = useCallback(async () => {
    try {
      const respuesta = await fetch("/api/cache/stats", {
        headers: {
          "x-admin-secret": adminSecret,
        },
      });

      if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
      }

      const json = await respuesta.json();
      setDatos(json);
      setError(null);
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError((err as Error).message);
      console.error("❌ Error cargando estadísticas del caché:", err);
    } finally {
      setCargando(false);
    }
  }, [adminSecret]);

  // Cargar al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Actualizar automáticamente cada N segundos
  useEffect(() => {
    const intervalo = setInterval(cargarEstadisticas, actualizarCadaSegundos * 1000);
    return () => clearInterval(intervalo);
  }, [cargarEstadisticas, actualizarCadaSegundos]);

  // ==========================================
  // ESTADOS DE CARGA Y ERROR
  // ==========================================

  if (cargando) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          color: "#6B7280",
        }}
      >
        <span style={{ fontSize: 20, marginRight: 8 }}>⏳</span>
        Cargando estadísticas del caché...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 12,
          padding: 20,
          color: "#991B1B",
        }}
      >
        <strong>❌ Error al cargar estadísticas</strong>
        <p style={{ margin: "8px 0 0", fontSize: 14 }}>{error}</p>
        <button
          onClick={cargarEstadisticas}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            backgroundColor: "#2563EB",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!datos) return null;

  // Calcular porcentajes para las barras de Groq y Gemini
  const porcentajeGroq = Math.round(
    (datos.ia.groq.llamadasHoy / datos.ia.groq.limiteMaximo) * 100
  );
  const porcentajeGemini = Math.round(
    (datos.ia.gemini.llamadasHoy / datos.ia.gemini.limiteMaximo) * 100
  );

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            📊 Monitor del Sistema de Caché
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
            BuscayCurra · Panel de Administración
          </p>
        </div>

        {/* Indicador de estado Redis */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: datos.redis.conectado ? "#ECFDF5" : "#FEF2F2",
            padding: "6px 12px",
            borderRadius: 20,
            border: `1px solid ${datos.redis.conectado ? "#6EE7B7" : "#FECACA"}`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: datos.redis.conectado ? "#10B981" : "#EF4444",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: datos.redis.conectado ? "#065F46" : "#991B1B",
            }}
          >
            Redis {datos.redis.conectado ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <TarjetaStat
          titulo="Hit Rate del Caché"
          valor={`${datos.cache.hitRate}%`}
          subtitulo="Peticiones sin llamar a la IA"
          icono="⚡"
          colorIcono={datos.cache.hitRate >= 70 ? "#10B981" : "#F97316"}
        />
        <TarjetaStat
          titulo="Peticiones Hoy"
          valor={datos.cache.totalPeticionesHoy.toLocaleString("es-ES")}
          subtitulo={`${datos.cache.hitsHoy} desde caché`}
          icono="📈"
          colorIcono="#2563EB"
        />
        <TarjetaStat
          titulo="Ahorro Hoy"
          valor={datos.ahorro.dineroAhorradoHoy}
          subtitulo={`${datos.ahorro.dineroAhorradoMes} este mes`}
          icono="💰"
          colorIcono="#F97316"
        />
        <TarjetaStat
          titulo="Usuarios Posibles"
          valor={datos.capacidad.usuariosEstimados.toLocaleString("es-ES")}
          subtitulo="Con la capacidad actual"
          icono="👥"
          colorIcono="#2563EB"
        />
      </div>

      {/* Sección del Hit Rate con barra grande */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          padding: 24,
          border: "1px solid #E5E7EB",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ fontWeight: 600, color: "#374151" }}>
            ⚡ Eficiencia del Caché
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: datos.cache.hitRate >= 70 ? "#10B981" : "#F97316",
            }}
          >
            {datos.cache.hitRate}%
          </span>
        </div>
        <BarraProgreso
          porcentaje={datos.cache.hitRate}
          color="#10B981"
          altura={12}
        />
        <p style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          {datos.cache.hitRate >= 70
            ? "✅ Excelente — El caché está funcionando muy bien"
            : datos.cache.hitRate >= 50
            ? "👍 Bueno — El caché está ayudando"
            : "⚠️  Mejorable — Pocas peticiones se están sirviendo desde caché"}
        </p>
      </div>

      {/* Sección de IAs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Groq */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${datos.ia.groq.disponible ? "#E5E7EB" : "#FECACA"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>
                🚀 Groq (Llama 3.3)
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Ultrarrápido</div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 12,
                backgroundColor: datos.ia.groq.disponible ? "#ECFDF5" : "#FEF2F2",
                color: datos.ia.groq.disponible ? "#065F46" : "#991B1B",
              }}
            >
              {datos.ia.groq.disponible ? "✅ Disponible" : "❌ Límite"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#6B7280",
              marginBottom: 8,
            }}
          >
            <span>
              {datos.ia.groq.llamadasHoy.toLocaleString("es-ES")} llamadas hoy
            </span>
            <span>
              Límite: {datos.ia.groq.limiteMaximo.toLocaleString("es-ES")}
            </span>
          </div>
          <BarraProgreso porcentaje={porcentajeGroq} color="#2563EB" />
          <div
            style={{ fontSize: 12, color: "#6B7280", marginTop: 6, textAlign: "right" }}
          >
            {datos.ia.groq.porcentajeUsado} usado
          </div>
        </div>

        {/* Gemini */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${datos.ia.gemini.disponible ? "#E5E7EB" : "#FECACA"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>
                🧠 Gemini 1.5 Flash
              </div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>Para CVs largos</div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 12,
                backgroundColor: datos.ia.gemini.disponible ? "#ECFDF5" : "#FEF2F2",
                color: datos.ia.gemini.disponible ? "#065F46" : "#991B1B",
              }}
            >
              {datos.ia.gemini.disponible ? "✅ Disponible" : "❌ Límite"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#6B7280",
              marginBottom: 8,
            }}
          >
            <span>
              {datos.ia.gemini.llamadasHoy.toLocaleString("es-ES")} llamadas hoy
            </span>
            <span>
              Límite: {datos.ia.gemini.limiteMaximo.toLocaleString("es-ES")}
            </span>
          </div>
          <BarraProgreso porcentaje={porcentajeGemini} color="#F97316" />
          <div
            style={{ fontSize: 12, color: "#6B7280", marginTop: 6, textAlign: "right" }}
          >
            {datos.ia.gemini.porcentajeUsado} usado
          </div>
        </div>
      </div>

      {/* Información de Redis */}
      {datos.redis.conectado && (
        <div
          style={{
            backgroundColor: "#F8FAFC",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #E2E8F0",
            marginBottom: 16,
            display: "flex",
            gap: 24,
            fontSize: 13,
            color: "#475569",
          }}
        >
          <span>🗄️ <strong>Redis</strong></span>
          {datos.redis.memoriaUsada && (
            <span>Memoria: <strong>{datos.redis.memoriaUsada}</strong></span>
          )}
          {datos.redis.totalClaves !== undefined && (
            <span>Claves: <strong>{datos.redis.totalClaves.toLocaleString("es-ES")}</strong></span>
          )}
        </div>
      )}

      {/* Pie de página con última actualización */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        <span>
          Actualizado:{" "}
          {ultimaActualizacion?.toLocaleTimeString("es-ES") || "—"}
        </span>
        <button
          onClick={cargarEstadisticas}
          style={{
            padding: "4px 12px",
            backgroundColor: "transparent",
            border: "1px solid #D1D5DB",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          🔄 Actualizar ahora
        </button>
      </div>
    </div>
  );
}
