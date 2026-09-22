/**
 * components/novedades/VideoNovedad.tsx — El vídeo de una campaña.
 *
 * YouTube se ve aquí dentro (con youtube-nocookie, que no pone cookies de
 * seguimiento hasta que le das al play). TikTok, Instagram y Facebook NO se
 * pueden incrustar: la política de seguridad del sitio solo deja cargar marcos
 * de nosotros mismos, de Stripe y de YouTube, y abrirla a esas redes significa
 * dejar entrar sus scripts en toda la web. Para esas se enseña una tarjeta que
 * lleva al vídeo, que es honesto y no rompe nada: un marco bloqueado se vería
 * como un hueco en blanco, sin ningún aviso.
 */
import { idDeYouTube } from "@/lib/novedades/contenido";

export default function VideoNovedad({ url, titulo }: { url: string; titulo: string }) {
  const id = idDeYouTube(url);

  if (id) {
    return (
      <div
        className="mt-6 rounded-xl overflow-hidden"
        style={{ border: "1px solid #2d3142", aspectRatio: "16 / 9" }}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={titulo}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 flex items-center gap-3 rounded-xl p-4 transition hover:opacity-90"
      style={{ background: "#1e212b", border: "1px solid #2d3142" }}
    >
      <span
        className="shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: 40, height: 40, background: "rgba(34,197,94,0.10)", color: "#22c55e" }}
        aria-hidden="true"
      >
        ▶
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold" style={{ color: "#f1f5f9" }}>
          {titulo}
        </span>
        <span className="block text-xs truncate" style={{ color: "#64748b" }}>
          Ver el vídeo →
        </span>
      </span>
    </a>
  );
}
