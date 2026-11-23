"use client";

/**
 * /empresas/entrevistas — Las entrevistas de la empresa y las respuestas de los
 * candidatos invitados (lib/entrevistas/empresa.ts). Empresas verificadas.
 *
 * 23 nov 2026 (Michel): «sin que la empresa tenga que trabajar mucho para meter
 * las preguntas» y «que no sea un montón de letras». Crear una entrevista es
 * poner el puesto: las preguntas de su sector salen ya marcadas
 * (lib/empresas/plantillas-entrevista.ts) y se quitan, cambian o añaden con un
 * toque; «qué esperas oír» es opcional. El candidato la hace desde la app y la
 * nota la pone una persona de la empresa, tocando lo que ha cubierto.
 *
 * Enlaces que llegan aquí: ?nueva=1 (abre la creación), &invitar=<id>&nombre=
 * (al guardar, invita a ese candidato: viene de su ficha) y ?ver=<invitación>
 * (viene del aviso de que alguien ha contestado).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check, CheckCircle2, ChevronDown, Clock, FileText, MessagesSquare, Mic, PenLine, Plus, Send, Sparkles, Trash2, Users, X,
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { CifraGrande, Etiqueta } from "@/components/neon/Neon";
import { AvatarPersona, AvisoContratacion, MarcoContratacion } from "@/components/empresas/AreaContratacion";
import { PLANTILLAS } from "@/lib/empresas/plantillas-entrevista";
import { SECTORES_EMPRESA, deTema, preguntaDiscriminatoria, type SectorEmpresa } from "@/lib/empresas/reglas";

interface Pregunta { texto: string; puntos: string[] }
interface Entrevista { id: string; empresa: string; puesto: string; preguntas: Pregunta[] }
interface Invitacion {
  id: string; candidatoId: string; nombre: string; ciudad: string; referencias: number;
  empresa: string; puesto: string; preguntas: Pregunta[];
  respuestas: string[] | null; enviadaEn: string | null; marcas: boolean[][] | null; nota: number | null;
}
interface PreguntaBorrador { texto: string; puntos: string; abierta?: boolean }
interface Borrador { id?: string; empresa: string; puesto: string; preguntas: PreguntaBorrador[] }

const MAXIMO = 8;
const fecha = (s: string) => new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const deSugerencia = (p: { texto: string; puntos: string[] }): PreguntaBorrador => ({ texto: p.texto, puntos: p.puntos.join("\n") });

/** El número de cada paso, en su círculo. */
function Paso({ n, titulo, extra }: { n: number; titulo: string; extra?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="icono-circulo tono-cian text-[14px] font-extrabold" style={{ width: 30, height: 30 }} aria-hidden="true">{n}</span>
      <h2 className="text-[16px] font-bold" style={{ color: "#f8fafc" }}>{titulo}</h2>
      {extra && <span className="ml-auto text-[13px] font-semibold tabular-nums" style={{ color: "#99f6e4" }}>{extra}</span>}
    </div>
  );
}

export default function EntrevistasEmpresaPage() {
  const [token, setToken] = useState("");
  const [estado, setEstado] = useState<"cargando" | "entrar" | "plan" | "listo">("cargando");
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [razonSocial, setRazonSocial] = useState("");
  const [sectorPlantilla, setSectorPlantilla] = useState<SectorEmpresa>("otro");
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [cambiarNombre, setCambiarNombre] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Record<string, boolean[][]>>({});
  const [hecho, setHecho] = useState("");
  // El candidato al que invitar al guardar (viene de su ficha).
  const invitarA = useRef<{ id: string; nombre: string } | null>(null);

  /** Una entrevista nueva con las preguntas del sector ya puestas: basta con escribir el puesto. */
  const nueva = useCallback((empresa: string, sector: SectorEmpresa) => {
    setBorrador({ empresa, puesto: "", preguntas: PLANTILLAS[sector].map(deSugerencia) });
    setCambiarNombre(false); setError("");
  }, []);

  const cargar = useCallback(async (t: string) => {
    const r = await fetch("/api/empresas/entrevistas", { headers: { Authorization: `Bearer ${t}` } });
    if (r.status === 401) { setEstado("entrar"); return; }
    if (r.status === 402) { setEstado("plan"); return; }
    const j = await r.json().catch(() => ({}));
    const lista: Entrevista[] = j.entrevistas || [];
    setEntrevistas(lista);
    setInvitaciones(j.invitaciones || []);
    const nombre = j.razonSocial || lista[0]?.empresa || "";
    setRazonSocial(nombre);
    const suyo = j.alcance?.sectores?.[0];
    const sector: SectorEmpresa = suyo && suyo in PLANTILLAS ? suyo : "otro";
    setSectorPlantilla(sector);
    setEstado("listo");

    // Lo que pide el enlace por el que se ha llegado.
    const q = new URLSearchParams(window.location.search);
    if (q.get("invitar")) invitarA.current = { id: q.get("invitar")!, nombre: q.get("nombre") || "el candidato" };
    if (q.get("nueva")) nueva(nombre, sector);
    const ver = q.get("ver");
    if (ver) {
      const inv = (j.invitaciones as Invitacion[] | undefined)?.find((i) => i.id === ver);
      if (inv) {
        setAbierta(inv.id);
        setMarcas((m) => ({ ...m, [inv.id]: inv.marcas ?? inv.preguntas.map((p) => p.puntos.map(() => false)) }));
        setTimeout(() => document.getElementById(`inv-${inv.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      }
    }
  }, [nueva]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseBrowser().auth.getSession();
      if (!session) { setEstado("entrar"); return; }
      setToken(session.access_token);
      await cargar(session.access_token);
    })();
  }, [cargar]);

  // ── Crear y editar ───────────────────────────────────────────────────────
  const cambiarPregunta = (i: number, cambio: Partial<PreguntaBorrador>) =>
    borrador && setBorrador({ ...borrador, preguntas: borrador.preguntas.map((p, k) => (k === i ? { ...p, ...cambio } : p)) });

  function alternarSugerencia(s: { texto: string; puntos: string[] }) {
    if (!borrador) return;
    const esta = borrador.preguntas.some((p) => p.texto === s.texto);
    if (esta) setBorrador({ ...borrador, preguntas: borrador.preguntas.filter((p) => p.texto !== s.texto) });
    else if (borrador.preguntas.length < MAXIMO) setBorrador({ ...borrador, preguntas: [...borrador.preguntas, deSugerencia(s)] });
  }

  function escribirUna() {
    if (!borrador || borrador.preguntas.length >= MAXIMO) return;
    setBorrador({ ...borrador, preguntas: [...borrador.preguntas, { texto: "", puntos: "" }] });
    setTimeout(() => document.getElementById(`pregunta-${borrador.preguntas.length}`)?.focus(), 50);
  }

  async function guardar() {
    if (!borrador) return;
    setGuardando(true); setError("");
    try {
      const r = await fetch("/api/empresas/entrevistas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: borrador.id, empresa: borrador.empresa, puesto: borrador.puesto,
          preguntas: borrador.preguntas.filter((p) => p.texto.trim())
            .map((p) => ({ texto: p.texto, puntos: p.puntos.split("\n").map((s) => s.trim()).filter(Boolean) })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error || "No se pudo guardar."); return; }
      setEntrevistas(j.entrevistas || []);
      const puesto = borrador.puesto;
      setBorrador(null);
      window.history.replaceState(null, "", "/empresas/entrevistas");
      // Venía de la ficha de un candidato: se le invita a esta entrevista recién hecha.
      const quien = invitarA.current;
      if (quien && j.id) {
        invitarA.current = null;
        const ri = await fetch("/api/empresas/entrevistas/invitar", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ candidatoId: quien.id, entrevistaId: j.id }),
        });
        const ji = await ri.json().catch(() => ({}));
        if (ri.ok) { setHecho(`${quien.nombre} está invitado a tu entrevista de ${puesto}.`); await cargar(token); }
        else setHecho(`Entrevista guardada. No se pudo invitar a ${quien.nombre}: ${ji.error || "inténtalo desde su ficha"}.`);
      } else {
        setHecho(`Entrevista de ${puesto} guardada. Invita desde la ficha de cualquier candidato.`);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id: string) {
    if (!window.confirm("¿Quitar esta entrevista? A quien ya invitaste le queda su copia.")) return;
    const r = await fetch(`/api/empresas/entrevistas?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setEntrevistas(j.entrevistas || []);
  }

  // ── Valorar ──────────────────────────────────────────────────────────────
  function abrir(inv: Invitacion) {
    setAbierta(abierta === inv.id ? null : inv.id);
    if (!marcas[inv.id]) setMarcas({ ...marcas, [inv.id]: inv.marcas ?? inv.preguntas.map((p) => p.puntos.map(() => false)) });
  }

  const alternarMarca = (invId: string, i: number, k: number) =>
    setMarcas({ ...marcas, [invId]: marcas[invId].map((f, a) => (a === i ? f.map((x, b) => (b === k ? !x : x)) : f)) });

  async function valorar(inv: Invitacion) {
    const r = await fetch("/api/empresas/entrevistas/marcar", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invitacionId: inv.id, marcas: marcas[inv.id] }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { setInvitaciones(invitaciones.map((i) => (i.id === inv.id ? { ...i, nota: j.nota, marcas: marcas[inv.id] } : i))); setAbierta(null); }
    else setError(j.error || "No se pudo guardar la valoración.");
  }

  if (estado === "cargando") return <AvisoContratacion titulo="Cargando tus entrevistas…" />;
  if (estado === "entrar") return <AvisoContratacion titulo="Entra con tu cuenta de empresa" enlace="/auth/login?redirect=%2Fempresas%2Fentrevistas" boton="Entrar" />;
  if (estado === "plan") return <AvisoContratacion titulo="Para empresas verificadas" texto="Es gratis: comprobamos vuestro NIF y os mandamos un código." enlace="/empresas/alta" boton="Dar de alta mi empresa" />;

  const porValorar = invitaciones.filter((i) => i.respuestas && i.nota === null);
  const ordenadas = [...porValorar, ...invitaciones.filter((i) => !i.respuestas), ...invitaciones.filter((i) => i.respuestas && i.nota !== null)];

  // ── Creando o editando una entrevista: la pantalla entera es para eso ────
  if (borrador) {
    const sugeridas = PLANTILLAS[sectorPlantilla];
    const llenas = borrador.preguntas.filter((p) => p.texto.trim()).length;
    const quien = invitarA.current;
    return (
      <MarcoContratacion seccion="entrevistas" titulo={borrador.id ? "Editar entrevista" : "Nueva entrevista"} Icono={Sparkles} empresa={razonSocial} pestanas={false}>
        <section className="cristal tono-cian p-5">
          <Paso n={1} titulo="¿Para qué puesto?" />
          <label className="block">
            <span className="sr-only">Puesto</span>
            <input type="text" value={borrador.puesto} maxLength={120} placeholder="Ej.: Camarero/a de sala" autoFocus={!borrador.id}
              onChange={(e) => setBorrador({ ...borrador, puesto: e.target.value })} className="w-full" />
          </label>
          {cambiarNombre ? (
            <label className="block mt-3">
              <span className="block text-[12px] font-semibold mb-1" style={{ color: "#a7b3c6" }}>Nombre que verá el candidato</span>
              <input type="text" value={borrador.empresa} maxLength={120} onChange={(e) => setBorrador({ ...borrador, empresa: e.target.value })} className="w-full" />
            </label>
          ) : (
            <button type="button" onClick={() => setCambiarNombre(true)} className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] min-h-[36px]" style={{ color: "#a7b3c6" }}>
              <PenLine size={14} aria-hidden="true" />La verá como <strong style={{ color: "#e2e8f0" }}>{borrador.empresa || "tu empresa"}</strong>
            </button>
          )}
        </section>

        <section className="cristal tono-neutro p-5">
          <Paso n={2} titulo="Preguntas sugeridas" />
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="radiogroup" aria-label="Sector de las preguntas" style={{ scrollbarWidth: "none" }}>
            {SECTORES_EMPRESA.map((s) => {
              const si = s.id === sectorPlantilla;
              return (
                <button key={s.id} type="button" role="radio" aria-checked={si} onClick={() => setSectorPlantilla(s.id)}
                  className="shrink-0 text-[13px] font-semibold px-3.5 min-h-[36px] rounded-full"
                  style={si
                    ? { background: "rgba(45,212,191,0.18)", color: "#99f6e4", border: "1px solid rgba(45,212,191,0.55)" }
                    : { background: "rgba(255,255,255,0.03)", color: "#a7b3c6", border: "1px solid rgba(148,163,184,0.2)" }}>
                  {s.id === "otro" ? "Cualquier puesto" : s.label}
                </button>
              );
            })}
          </div>
          <ul className="grid gap-2 mt-1">
            {sugeridas.map((s) => {
              const esta = borrador.preguntas.some((p) => p.texto === s.texto);
              const lleno = !esta && borrador.preguntas.length >= MAXIMO;
              return (
                <li key={s.texto}>
                  <button type="button" onClick={() => alternarSugerencia(s)} disabled={lleno} aria-pressed={esta}
                    className="w-full text-left flex items-start gap-3 rounded-2xl p-3.5 transition-colors disabled:opacity-40"
                    style={esta
                      ? { background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.5)" }
                      : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(148,163,184,0.18)" }}>
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full inline-flex items-center justify-center"
                      style={esta ? { background: "#2dd4bf", color: "#04201c" } : { border: "1.5px solid rgba(148,163,184,0.45)", color: "#a7b3c6" }} aria-hidden="true">
                      {esta ? <Check size={15} strokeWidth={3} /> : <Plus size={14} />}
                    </span>
                    <span className="flex-1 text-[14px] leading-snug" style={{ color: esta ? "#f1f5f9" : "#cbd5e1" }}>{s.texto}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="cristal tono-neutro p-5">
          <Paso n={3} titulo="Tu entrevista" extra={`${llenas}/${MAXIMO}`} />
          {borrador.preguntas.length === 0 && (
            <p className="text-[13.5px] mb-3" style={{ color: "#a7b3c6" }}>Marca preguntas arriba o escribe las tuyas.</p>
          )}
          <ol className="space-y-2.5">
            {borrador.preguntas.map((p, i) => {
              const tema = preguntaDiscriminatoria(`${p.texto}\n${p.puntos}`);
              return (
                <li key={i} className="rounded-2xl p-3.5" style={{ background: "rgba(6,9,11,0.6)", border: `1px solid ${tema ? "rgba(239,68,68,0.5)" : "rgba(148,163,184,0.18)"}` }}>
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 mt-2 text-[13px] font-extrabold tabular-nums w-5 text-center" style={{ color: "#99f6e4" }}>{i + 1}</span>
                    <label className="flex-1 min-w-0">
                      <span className="sr-only">Pregunta {i + 1}</span>
                      <textarea id={`pregunta-${i}`} rows={2} maxLength={300} value={p.texto} placeholder="Escribe tu pregunta"
                        onChange={(e) => cambiarPregunta(i, { texto: e.target.value })} className="w-full" />
                    </label>
                    <button type="button" onClick={() => setBorrador({ ...borrador, preguntas: borrador.preguntas.filter((_, k) => k !== i) })}
                      className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-full" style={{ color: "#a7b3c6" }} aria-label={`Quitar la pregunta ${i + 1}`}>
                      <X size={18} />
                    </button>
                  </div>
                  <button type="button" onClick={() => cambiarPregunta(i, { abierta: !p.abierta })} aria-expanded={!!p.abierta}
                    className="ml-7 mt-1 inline-flex items-center gap-1 text-[12.5px] min-h-[32px]" style={{ color: "#a7b3c6" }}>
                    <ChevronDown size={14} className={p.abierta ? "rotate-180" : ""} aria-hidden="true" />
                    Qué esperas oír {p.puntos.trim() ? `(${p.puntos.split("\n").filter((x) => x.trim()).length})` : "(opcional)"}
                  </button>
                  {p.abierta && (
                    <textarea rows={3} value={p.puntos} placeholder={"Una cosa por línea. Ej.:\nPide disculpas\nOfrece una solución"}
                      onChange={(e) => cambiarPregunta(i, { puntos: e.target.value })} className="w-full mt-1.5 text-sm" aria-label={`Qué esperas oír en la pregunta ${i + 1}`} />
                  )}
                  {tema && <p className="ml-7 mt-1.5 text-[12.5px]" style={{ color: "#fca5a5" }}>Esto trata {deTema(tema)}: no se puede preguntar. Pregunta por el puesto.</p>}
                </li>
              );
            })}
          </ol>
          {borrador.preguntas.length < MAXIMO && (
            <button type="button" onClick={escribirUna} className="boton-cristal tono-cian w-full mt-3"><Plus size={17} aria-hidden="true" />Escribir una pregunta</button>
          )}
          <p className="text-[12px] mt-3 leading-relaxed" style={{ color: "#fcd34d" }}>
            Pregunta solo por el puesto. Nada de edad, origen, religión, salud, embarazo o hijos: es discriminación.
          </p>
        </section>

        {error && <p role="alert" className="text-[13.5px]" style={{ color: "#fca5a5" }}>{error}</p>}
        <div className="grid sm:grid-cols-[1fr_auto] gap-2.5">
          <button type="button" onClick={() => void guardar()} disabled={guardando || !borrador.puesto.trim() || llenas === 0} className="boton-neon disabled:opacity-50">
            {guardando ? "Guardando…" : quien ? `Guardar e invitar a ${quien.nombre}` : "Guardar entrevista"}
          </button>
          <button type="button" onClick={() => { setBorrador(null); setError(""); window.history.replaceState(null, "", "/empresas/entrevistas"); }} className="boton-cristal tono-neutro">Cancelar</button>
        </div>
      </MarcoContratacion>
    );
  }

  // ── La pantalla normal ───────────────────────────────────────────────────
  return (
    <MarcoContratacion seccion="entrevistas" titulo="Entrevistas" Icono={MessagesSquare} empresa={razonSocial} porValorar={porValorar.length}>
      {hecho && (
        <div className="cristal tono-verde p-4 flex items-center gap-3" role="status">
          <span className="icono-circulo" style={{ width: 40, height: 40 }} aria-hidden="true"><CheckCircle2 size={20} /></span>
          <p className="flex-1 text-[14px] font-semibold" style={{ color: "#dcfce7" }}>{hecho}</p>
          <button type="button" onClick={() => setHecho("")} className="w-10 h-10 inline-flex items-center justify-center" style={{ color: "#86efac" }} aria-label="Cerrar"><X size={18} /></button>
        </div>
      )}

      {entrevistas.length === 0 ? (
        // Todavía no tiene ninguna: lo primero es crearla, y que se vea lo fácil que es.
        <section className="cristal tono-cian p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="icono-circulo" style={{ width: 60, height: 60, borderRadius: 20 }} aria-hidden="true"><Mic size={28} /></span>
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-extrabold leading-tight" style={{ color: "#f8fafc" }}>Tu primera <span style={{ color: "#99f6e4" }}>entrevista</span></h2>
              <p className="text-[13.5px] mt-0.5" style={{ color: "#a7b3c6" }}>Lista en un minuto.</p>
            </div>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-3">
            {[
              { Icono: Sparkles, texto: "Preguntas de tu sector, ya escritas" },
              { Icono: Mic, texto: "El candidato contesta desde la app" },
              { Icono: CheckCircle2, texto: "Tú lees y valoras" },
            ].map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,212,191,0.2)" }}>
                <Icono size={19} style={{ color: "#99f6e4" }} aria-hidden="true" className="shrink-0" />
                <span className="text-[14px] font-semibold" style={{ color: "#e2e8f0" }}>{texto}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => nueva(razonSocial, sectorPlantilla)} className="boton-neon w-full sm:w-auto sm:self-start">
            <Plus size={18} aria-hidden="true" />Crear entrevista
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="Resumen">
          <CifraGrande tono={porValorar.length ? "ambar" : "neutro"} Icono={FileText} valor={porValorar.length} etiqueta="Por valorar" />
          <CifraGrande tono="cian" Icono={Clock} valor={invitaciones.filter((i) => !i.respuestas).length} etiqueta="Esperando" />
          <CifraGrande tono="verde" Icono={CheckCircle2} valor={invitaciones.filter((i) => i.nota !== null).length} etiqueta="Valoradas" />
        </section>
      )}

      {/* Los candidatos invitados y lo que han contestado */}
      {entrevistas.length > 0 && (
        <section aria-labelledby="titulo-invitados" className="space-y-3">
          <h2 id="titulo-invitados" className="flex items-center gap-2 text-[18px] font-bold" style={{ color: "#f8fafc" }}>
            <Users size={20} style={{ color: "#99f6e4" }} aria-hidden="true" />Candidatos
          </h2>
          {ordenadas.length === 0 ? (
            <Link href="/empresas/candidatos" className="cristal cristal-enlace tono-neutro p-4 flex items-center gap-3">
              <span className="icono-circulo tono-cian" style={{ width: 44, height: 44 }} aria-hidden="true"><Users size={20} /></span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold" style={{ color: "#f1f5f9" }}>Invita a tu primer candidato</span>
                <span className="block text-[13px]" style={{ color: "#a7b3c6" }}>Desde su ficha, «Invitar»</span>
              </span>
            </Link>
          ) : ordenadas.map((inv) => {
            const valorada = inv.nota !== null;
            const abiertaEsta = abierta === inv.id;
            const m = marcas[inv.id];
            const total = inv.preguntas.reduce((a, p) => a + p.puntos.length, 0);
            const marcados = m ? m.flat().filter(Boolean).length : 0;
            return (
              <article key={inv.id} id={`inv-${inv.id}`} className={`cristal ${inv.respuestas && !valorada ? "tono-ambar" : valorada ? "tono-verde" : "tono-neutro"} p-4 sm:p-5`}>
                <div className="flex items-center gap-3">
                  <AvatarPersona id={inv.candidatoId} nombre={inv.nombre} size={46} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15.5px] font-bold truncate" style={{ color: "#f8fafc" }}>{inv.nombre}</p>
                    <p className="text-[12.5px] truncate" style={{ color: "#a7b3c6" }}>{inv.puesto}{inv.ciudad ? ` · ${inv.ciudad}` : ""}</p>
                  </div>
                  {valorada ? (
                    <p className="text-right shrink-0"><span className="text-[26px] font-extrabold tabular-nums" style={{ color: "#86efac" }}>{inv.nota}</span><span className="text-[11px]" style={{ color: "var(--texto-tenue)" }}>/100</span></p>
                  ) : inv.respuestas ? (
                    <Etiqueta tono="ambar"><Send size={12} aria-hidden="true" />{fecha(inv.enviadaEn!)}</Etiqueta>
                  ) : (
                    <Etiqueta tono="neutro"><Clock size={12} aria-hidden="true" />Invitado</Etiqueta>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {inv.referencias > 0 && <Etiqueta tono="verde">✓ {inv.referencias > 1 ? `${inv.referencias} referencias verificadas` : "Referencia verificada"}</Etiqueta>}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {/* <a> y no <Link>: Next precarga los <Link>, y abrir un CV nuevo gasta cupo del mes. */}
                  <a href={`/talento/${inv.candidatoId}`} className="boton-cristal tono-neutro text-[13.5px] px-3">Ver CV</a>
                  {inv.respuestas ? (
                    <button type="button" onClick={() => abrir(inv)} aria-expanded={abiertaEsta}
                      className={`${valorada || abiertaEsta ? "boton-cristal tono-verde" : "boton-neon"} text-[13.5px] px-3`}>
                      {abiertaEsta ? "Cerrar" : valorada ? "Ver respuestas" : "Leer y valorar"}
                    </button>
                  ) : (
                    <span className="inline-flex items-center justify-center text-[12.5px] text-center" style={{ color: "var(--texto-tenue)" }}>Aún no ha contestado</span>
                  )}
                </div>

                {abiertaEsta && inv.respuestas && m && (
                  <div className="mt-4 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(148,163,184,0.16)" }}>
                    {inv.preguntas.map((p, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-[13.5px] font-bold" style={{ color: "#99f6e4" }}>{i + 1}. {p.texto}</p>
                        <blockquote className="rounded-xl p-3.5 text-[14.5px] leading-relaxed whitespace-pre-wrap" style={{ background: "rgba(6,9,11,0.7)", borderLeft: "3px solid rgba(45,212,191,0.6)", color: "#f1f5f9" }}>
                          {inv.respuestas![i]}
                        </blockquote>
                        <div className="flex flex-wrap gap-1.5">
                          {p.puntos.map((pt, k) => {
                            const si = !!m[i]?.[k];
                            return (
                              <button key={k} type="button" aria-pressed={si} onClick={() => alternarMarca(inv.id, i, k)}
                                className="inline-flex items-center gap-1.5 text-left text-[13px] px-3 min-h-[36px] rounded-full"
                                style={si
                                  ? { background: "rgba(34,197,94,0.16)", color: "#bbf7d0", border: "1px solid rgba(34,197,94,0.55)" }
                                  : { background: "rgba(255,255,255,0.03)", color: "#a7b3c6", border: "1px solid rgba(148,163,184,0.25)" }}>
                                {si ? <Check size={14} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}{pt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)" }}>
                      <p className="flex-1 text-[13px]" style={{ color: "#cbd5e1" }}>La nota la pones tú: lo que dice, no cómo lo dice.</p>
                      <p className="shrink-0 text-[22px] font-extrabold tabular-nums" style={{ color: "#86efac" }}>{total ? Math.round((marcados / total) * 100) : 0}<span className="text-[11px]" style={{ color: "var(--texto-tenue)" }}>/100</span></p>
                    </div>
                    {error && <p role="alert" className="text-[13px]" style={{ color: "#fca5a5" }}>{error}</p>}
                    <button type="button" onClick={() => void valorar(inv)} className="boton-neon w-full">Guardar valoración</button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Las entrevistas de la empresa */}
      {entrevistas.length > 0 && (
        <section aria-labelledby="titulo-entrevistas" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-entrevistas" className="flex items-center gap-2 text-[18px] font-bold" style={{ color: "#f8fafc" }}>
              <Mic size={20} style={{ color: "#99f6e4" }} aria-hidden="true" />Tus entrevistas
            </h2>
            <button type="button" onClick={() => nueva(razonSocial, sectorPlantilla)} className="boton-neon text-[14px]" style={{ minHeight: 42 }}>
              <Plus size={17} aria-hidden="true" />Nueva
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {entrevistas.map((e) => (
              <article key={e.id} className="cristal tono-cian p-4 flex items-center gap-3">
                <span className="icono-circulo" style={{ width: 44, height: 44 }} aria-hidden="true"><MessagesSquare size={20} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate" style={{ color: "#f8fafc" }}>{e.puesto}</p>
                  <p className="text-[12.5px]" style={{ color: "#a7b3c6" }}>{e.preguntas.length} {e.preguntas.length === 1 ? "pregunta" : "preguntas"}</p>
                </div>
                <button type="button" aria-label={`Editar la entrevista de ${e.puesto}`}
                  onClick={() => { setBorrador({ id: e.id, empresa: e.empresa, puesto: e.puesto, preguntas: e.preguntas.map((p) => ({ texto: p.texto, puntos: p.puntos.join("\n") })) }); setCambiarNombre(false); setError(""); }}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-full" style={{ color: "#99f6e4", background: "rgba(45,212,191,0.08)" }}>
                  <PenLine size={18} />
                </button>
                <button type="button" onClick={() => void quitar(e.id)} aria-label={`Quitar la entrevista de ${e.puesto}`}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-full" style={{ color: "#a7b3c6" }}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </MarcoContratacion>
  );
}
