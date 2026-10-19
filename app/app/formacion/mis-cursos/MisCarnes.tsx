"use client";

/**
 * Mis carnés — los que ya tienes y cuándo caducan, en casillas, el que caduca
 * antes primero. Para cambiar fechas se va a la ficha del carné, donde está el
 * formulario de "Ya lo tengo": un solo sitio donde se edita.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { tiposConRenovacion, tipoPorSlug } from "@/lib/cursos/tipos";
import { estadoCarne } from "@/components/cursos/MiCarne";

interface Carne { curso_slug: string; caduca_en: string }

export default function MisCarnes() {
  const router = useRouter();
  const [carnes, setCarnes] = useState<Carne[] | null>(null);
  const [enTuCv, setEnTuCv] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSupabaseBrowser().auth.getSession();
        const r = await fetch("/api/cursos/carnes", {
          headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {},
        });
        const j = await r.json();
        setCarnes(j.carnes ?? []);
        setEnTuCv(Array.isArray(j.enTuCv) ? j.enTuCv : []);
      } catch { setCarnes([]); }
    })();
  }, []);

  if (carnes === null) return null;
  const tengo = new Set(carnes.map(c => c.curso_slug));
  const faltan = tiposConRenovacion("ES").filter(t => !tengo.has(t.slug) && !enTuCv.includes(t.slug));

  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-3" style={{ color: "#f1f5f9" }}>Mis carnés</h2>
      {carnes.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          {carnes.map(c => {
            const t = tipoPorSlug(c.curso_slug, "ES");
            const e = estadoCarne(c.caduca_en);
            return (
              <Link key={c.curso_slug} href={`/app/formacion/${c.curso_slug}#renovacion`}
                    className="rounded-xl p-3 flex flex-col gap-1 hover:opacity-90"
                    style={{ background: "#1e212b", border: `1px solid ${e.color}55`, textDecoration: "none" }}>
                <span className="text-xs font-semibold leading-snug" style={{ color: "#f1f5f9" }}>
                  {t?.renovacion?.que ?? t?.nombre ?? c.curso_slug}
                </span>
                <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: e.color }}>{e.etiqueta}</span>
                <span className="text-xs" style={{ color: "#94a3b8" }}>{e.queda}</span>
              </Link>
            );
          })}
        </div>
      )}
      {/* Lo que ya pone su CV: un toque y a poner la fecha. */}
      {enTuCv.map(slug => {
        const t = tipoPorSlug(slug, "ES");
        if (!t) return null;
        return (
          <Link key={slug} href={`/app/formacion/${slug}#renovacion`}
                className="rounded-xl p-3 mb-2.5 flex items-center justify-between gap-3 hover:opacity-90"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", textDecoration: "none" }}>
            <span className="text-xs leading-snug" style={{ color: "#e2e8f0" }}>
              Tu CV dice que tienes: <strong>{t.renovacion?.que ?? t.nombre}</strong>. ¿Cuándo lo sacaste?
            </span>
            <span className="text-xs font-semibold shrink-0" style={{ color: "#22c55e" }}>Poner fecha</span>
          </Link>
        );
      })}
      {faltan.length > 0 && (
        <label className="rounded-xl px-3 py-2 block" style={{ background: "#1e212b", border: "1px solid #2d3142" }}>
          <span className="text-[10px] uppercase tracking-wide font-semibold block" style={{ color: "#64748b" }}>
            {carnes.length ? "Añadir otro carné" : "¿Tienes alguno de estos? Te avisamos antes de que caduque"}
          </span>
          <select id="anadir-carne" value="" onChange={e => e.target.value && router.push(`/app/formacion/${e.target.value}#renovacion`)}
                  className="w-full bg-transparent text-sm outline-none mt-0.5" style={{ color: "#f1f5f9" }}>
            <option value="" style={{ background: "#1e212b" }}>Elige tu carné…</option>
            {faltan.map(t => (
              <option key={t.slug} value={t.slug} style={{ background: "#1e212b" }}>{t.renovacion?.que ?? t.nombre}</option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}
