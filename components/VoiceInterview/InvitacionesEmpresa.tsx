"use client";

/**
 * Las empresas que te han invitado a preparar su entrevista (lib/entrevistas/empresa.ts),
 * arriba del simulador. Si no hay ninguna, no se ve nada.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

interface Inv { id: string; empresa: string; puesto: string; enviadaEn: string | null }

export default function InvitacionesEmpresa({ token }: { token: string }) {
  const [lista, setLista] = useState<Inv[]>([]);

  useEffect(() => {
    fetch("/api/entrevistas/empresa", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null)).then((j) => setLista(j?.invitaciones || [])).catch(() => {});
  }, [token]);

  if (!lista.length) return null;
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
      <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#22c55e" }}>Empresas que te han invitado</p>
      {lista.map((i) => (
        <Link key={i.id} href={`/app/entrevistas/empresa/${i.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <Building2 size={18} strokeWidth={1.6} style={{ color: "#22c55e" }} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>{i.empresa}</span>
            <span className="block text-xs truncate" style={{ color: "#94a3b8" }}>{i.puesto}{i.enviadaEn ? " · respuestas mandadas" : " · prepara su entrevista"}</span>
          </span>
          <span className="text-xs" style={{ color: "#22c55e" }}>→</span>
        </Link>
      ))}
    </div>
  );
}
