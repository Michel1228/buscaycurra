/**
 * La empresa que se enseña de una oferta.
 *
 * "Empresa europea" no es una empresa: es el relleno que fetchCareerjetGlobal
 * (sync-worker.ts) guarda cuando Careerjet no dice quién contrata, también en
 * ofertas de Estados Unidos, Canadá, Singapur o Japón. El 6 nov 2026 había unas
 * 9.000 vivas así. En la base no se cambia porque la empresa forma parte del id
 * de cada oferta (makeId): se duplicarían en el siguiente barrido.
 */
export function empresaVisible(company: unknown): string {
  const c = String(company ?? "").trim();
  return !c || /^empresa europea$/i.test(c) ? "Ver en oferta" : c;
}
