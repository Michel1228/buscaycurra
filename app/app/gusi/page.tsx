"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import GusiChat from "@/components/GusiChat";


export default function GusiPage() {
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (!user) router.push("/auth/login");
    };
    void verificar();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="text-white py-8 px-4"
        style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🐛</span>
            <h1 className="text-2xl font-bold">Habla con Gusi</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Tu asistente de IA para mejorar tu CV, preparar candidaturas y conseguir trabajo más rápido
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <GusiChat />
      </div>
    </div>
  );
}
