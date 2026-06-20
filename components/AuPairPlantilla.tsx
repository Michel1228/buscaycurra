"use client";

import { Car, CigaretteOff, ShieldCheck, Waves, GraduationCap, Cake, Globe, CalendarDays, Camera, type LucideIcon } from "lucide-react";
import { type AuPairReference } from "@/lib/au-pair";
import { PAISES } from "@/lib/paises";
import AuPairInfoFamilia from "@/components/AuPairInfoFamilia";

interface Props {
  nombre: string;
  age: string;
  nationality: string;
  ciudad: string;
  languages: string[];
  childcareExperience: string;
  hobbies: string;
  letterText: string;
  photos: string[];
  paisDestino: string;
  nivelEducativo: string;
  duracionPreferida: string;
  availableFrom: string;
  hasDrivingLicense: boolean;
  fumador: boolean;
  primerosAuxilios: boolean;
  sabeNadar: boolean;
  dietaryInfo: string;
  references: AuPairReference[];
  tipoPerfil: "joven_estudiante" | "con_experiencia" | "profesional_cambio";
}

export default function AuPairPlantilla({
  nombre, age, nationality, ciudad, languages,
  childcareExperience, hobbies, letterText,
  photos, paisDestino, nivelEducativo, duracionPreferida,
  availableFrom, hasDrivingLicense, fumador,
  primerosAuxilios, sabeNadar, dietaryInfo,
  references, tipoPerfil,
}: Props) {
  const pais = PAISES[paisDestino];
  const paisOrigen = PAISES[nationality];

  const aptitudes: { Icon: LucideIcon; label: string }[] = [];
  if (hasDrivingLicense) aptitudes.push({ Icon: Car, label: "Driving License" });
  if (!fumador) aptitudes.push({ Icon: CigaretteOff, label: "Non-smoker" });
  if (primerosAuxilios) aptitudes.push({ Icon: ShieldCheck, label: "First Aid" });
  if (sabeNadar) aptitudes.push({ Icon: Waves, label: "Swimmer" });

  const tipoLabel =
    tipoPerfil === "joven_estudiante" ? "Young & Enthusiastic" :
    tipoPerfil === "con_experiencia" ? "Experienced Caregiver" :
    "Career Changer";

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-gray-800 rounded-lg overflow-hidden shadow-2xl" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── Header ── */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #1a3d34 0%, #2d5a4e 100%)" }}>
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {nombre || (age ? `Au Pair, ${age} años` : "Au Pair Profile")}
          </h1>
          <p className="text-xs text-white/60 uppercase tracking-[2px] mt-1">{tipoLabel}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/80">
            {paisOrigen && (
              <span className="flex items-center gap-1">
                <span>{paisOrigen.bandera}</span> {paisOrigen.nombre}{ciudad ? ` · ${ciudad}` : ""}
              </span>
            )}
            {age && <span className="flex items-center gap-1"><Cake size={11} strokeWidth={1.6} />{age} años</span>}
            {languages.length > 0 && <span className="flex items-center gap-1"><Globe size={11} strokeWidth={1.6} />{languages.join(" · ")}</span>}
            {availableFrom && <span className="flex items-center gap-1"><CalendarDays size={11} strokeWidth={1.6} />Available {availableFrom}</span>}
          </div>
          {nivelEducativo && (
            <p className="text-xs text-white/60 mt-2 flex items-center gap-1"><GraduationCap size={11} strokeWidth={1.6} />{nivelEducativo}</p>
          )}
          {pais && (
            <span className="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              {pais.bandera} {pais.nombre}
            </span>
          )}
        </div>
      </div>

      {/* ── Photo Gallery ── */}
      {photos.length > 0 && (
        <div className="p-8 sm:p-10" style={{ background: "#f8f6f0" }}>
          <h3 className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-3 flex items-center gap-1"><Camera size={11} strokeWidth={1.6} />Photo Gallery</h3>
          <div className={`grid gap-3 ${
            photos.length === 1 ? "grid-cols-1" :
            photos.length === 2 ? "grid-cols-2" :
            photos.length === 3 ? "grid-cols-3" :
            photos.length >= 4 ? "grid-cols-2 sm:grid-cols-3" : ""
          }`}>
            {photos.map((url, i) => (
              <div key={url} className={`relative rounded-lg overflow-hidden bg-gray-200 shadow-sm ${
                i === 0 && photos.length >= 3 ? "sm:col-span-2 sm:row-span-2" : ""
              } ${photos.length === 2 ? "aspect-[3/4]" : photos.length >= 5 ? "aspect-square" : "aspect-[4/3]"}`}>
                <img src={url} alt={`Au Pair photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "#22c55e", color: "#000" }}>
                    MAIN
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="p-8 sm:p-10 space-y-6">
        {/* Aptitudes */}
        {aptitudes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aptitudes.map((a) => (
              <span key={a.label} className="text-[11px] px-3 py-1 rounded-full flex items-center gap-1" style={{ background: "#e8f5e9", color: "#1a3d34" }}>
                <a.Icon size={11} strokeWidth={1.8} />{a.label}
              </span>
            ))}
          </div>
        )}

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {childcareExperience && (
            <div className="rounded-lg p-3" style={{ background: "#f8faf9", borderLeft: "3px solid #2d5a4e" }}>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Experience</p>
              <p className="text-xs mt-1 text-gray-700 line-clamp-3">{childcareExperience}</p>
            </div>
          )}
          {hobbies && (
            <div className="rounded-lg p-3" style={{ background: "#f8faf9", borderLeft: "3px solid #4a9d84" }}>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">About Me</p>
              <p className="text-xs mt-1 text-gray-700 line-clamp-3">{hobbies}</p>
            </div>
          )}
          {dietaryInfo && (
            <div className="rounded-lg p-3" style={{ background: "#f8faf9", borderLeft: "3px solid #8cb8a8" }}>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Diet</p>
              <p className="text-xs mt-1 text-gray-700">{dietaryInfo}</p>
            </div>
          )}
          {duracionPreferida && (
            <div className="rounded-lg p-3" style={{ background: "#f8faf9", borderLeft: "3px solid #2d5a4e" }}>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Duration</p>
              <p className="text-xs mt-1 text-gray-700">{duracionPreferida}</p>
            </div>
          )}
        </div>

        {/* Dear Family Letter */}
        {letterText && (
          <div>
            <div className="w-12 h-1 rounded mb-6" style={{ background: "linear-gradient(90deg, #2d5a4e, #4a9d84)" }} />
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {letterText}
            </div>
          </div>
        )}

        {/* References */}
        {references.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-3">References</h3>
            <div className="space-y-2">
              {references.map((ref, i) => (
                <div key={i} className="rounded p-3" style={{ background: "#f8faf9", borderLeft: "3px solid #2d5a4e" }}>
                  <p className="font-bold text-sm" style={{ color: "#1a3d34" }}>{ref.nombre}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {[ref.relacion, ref.email, ref.telefono].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Info para la familia anfitriona ── */}
      <div className="px-8 sm:px-10 pb-6">
        <AuPairInfoFamilia paisCodigo={paisDestino} />
      </div>

      {/* ── Footer ── */}
      <div className="px-8 sm:px-10 py-4 flex justify-between items-center text-[10px] text-gray-400" style={{ background: "#f8f6f0", borderTop: "1px solid #e8e4d9" }}>
        <span className="uppercase tracking-wider">Au Pair Profile · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        {pais && (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: "#2d5a4e" }}>
            {pais.bandera} {pais.nombre}
          </span>
        )}
      </div>
    </div>
  );
}
