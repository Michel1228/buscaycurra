"use client";

/**
 * Las entrevistas que te han mandado las empresas (lib/entrevistas/empresa.ts).
 *
 * Arriba de /app/entrevistas, todas; en Inicio, solo las que faltan por
 * contestar (soloPendientes), para que no se pierdan (23 nov 2026, Michel:
 * «conectarlo todo bien y ponerlo atractivo»). Si no hay ninguna, no se ve nada.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Mic } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import LogoEmpresa from "@/components/neon/LogoEmpresa";
import { Etiqueta } from "@/components/neon/Neon";

interface Inv { id: string; empresa: string; puesto: string; preguntas: unknown[]; enviadaEn: string | null; leida: boolean }

export default function InvitacionesEmpresa({ token, soloPendientes = false }: { token?: string; soloPendientes?: boolean }) {
  const [lista, setLista] = useState<Inv[]>([]);

  useEffect(() => {
    (async () => {
      const t = token || (await getSupabaseBrowser().auth.getSession()).data.session?.access_token;
      if (!t) return;
      const r = await fetch("/api/entrevistas/empresa", { headers: { Authorization: `Bearer ${t}` } }).catch(() => null);
      const j = r?.ok ? await r.json().catch(() => null) : null;
      setLista(j?.invitaciones || []);
    })();
  }, [token]);

  const visibles = soloPendientes ? lista.filter((i) => !i.enviadaEn) : lista;
  if (!visibles.length) return null;
  const pendientes = visibles.filter((i) => !i.enviadaEn).length;

  return (
    <section aria-labelledby="titulo-entrevistas-empresa" className="space-y-2.5">
      <h2 id="titulo-entrevistas-empresa" className="flex items-center gap-2 text-[17px] font-bold" style={{ color: "#f8fafc" }}>
        <Mic size={19} style={{ color: "#99f6e4" }} aria-hidden="true" />
        {pendientes ? `Te ${pendientes === 1 ? "espera una entrevista" : `esperan ${pendientes} entrevistas`}` : "Entrevistas de empresas"}
      </h2>
      {visibles.map((i) => (
        <Link key={i.id} href={`/app/entrevistas/empresa/${i.id}`}
          className={`cristal cristal-enlace ${i.enviadaEn ? "tono-neutro" : "tono-cian"} flex items-center gap-3 p-3.5`}
          style={i.enviadaEn ? undefined : { borderColor: "rgba(45,212,191,0.6)", boxShadow: "0 0 0 1px rgba(45,212,191,0.2) inset, 0 14px 34px -18px rgba(45,212,191,0.8)" }}>
          <LogoEmpresa empresa={i.empresa} tono="cian" size={46} />
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold truncate" style={{ color: "#f8fafc" }}>{i.empresa}</span>
            <span className="block text-[12.5px] truncate" style={{ color: "#a7b3c6" }}>{i.puesto} · {i.preguntas.length} {i.preguntas.length === 1 ? "pregunta" : "preguntas"}</span>
          </span>
          {i.enviadaEn
            ? <Etiqueta tono="verde"><CheckCircle2 size={12} aria-hidden="true" />{i.leida ? "Leída" : "Mandada"}</Etiqueta>
            : <Etiqueta tono="cian">Hacerla</Etiqueta>}
          <ChevronRight size={18} className="shrink-0 opacity-60" aria-hidden="true" />
        </Link>
      ))}
    </section>
  );
}
