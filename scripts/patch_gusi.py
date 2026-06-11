import sys

with open("components/GusiChat.tsx", "r") as f:
    text = f.read()

# 1. Add import for ChatSendPanel
text = text.replace(
    'import GuzziAvatar from "@/components/GuzziAvatar";',
    'import GuzziAvatar from "@/components/GuzziAvatar";\nimport ChatSendPanel from "@/components/ChatSendPanel";'
)

# 2. Add sendTarget state after enviandoATodas
text = text.replace(
    'const [enviandoATodas, setEnviandoATodas] = useState(false);\n  const scrollRef = useRef<HTMLDivElement>(null);',
    'const [enviandoATodas, setEnviandoATodas] = useState(false);\n  const [sendTarget, setSendTarget] = useState<{ empresa: string; titulo: string; url: string; email?: string } | null>(null);\n  const [sessionToken, setSessionToken] = useState("");\n  const scrollRef = useRef<HTMLDivElement>(null);'
)

# 3. Modify job card "Enviar CV" button
old_job_btn = '                                onClick={() => router.push(`/app/envios?empresa=${encodeURIComponent(job.empresa)}&puesto=${encodeURIComponent(job.titulo)}&web=${encodeURIComponent(job.url)}`)}\n                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-90 shrink-0"\n                                style={{ background: "#22c55e", color: "#0a1208" }}>\n                                Enviar CV'
new_job_btn = '                                onClick={async () => {\n                                  const { data: { session } } = await getSupabaseBrowser().auth.getSession();\n                                  setSessionToken(session?.access_token || "");\n                                  setSendTarget({ empresa: job.empresa, titulo: job.titulo, url: job.url });\n                                }}\n                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-90 shrink-0"\n                                style={{ background: "#22c55e", color: "#0a1208" }}>\n                                Enviar CV'
text = text.replace(old_job_btn, new_job_btn)

# 4. Modify company card "Enviar CV" button
old_co_btn = '                            onClick={() => router.push(`/app/envios?empresa=${encodeURIComponent(m.company!.nombre || "")}&web=${encodeURIComponent(m.company!.urlWeb || "")}`)}\n                            disabled={enviandoATodas}\n                            className="px-4 py-2 rounded-lg text-[12px] font-semibold transition hover:opacity-90 disabled:opacity-50 shrink-0"\n                            style={{ background: "#22c55e", color: "#0a1208" }}>\n                            \ud83d\udce7 Enviar mi CV'
new_co_btn = '                            onClick={async () => {\n                              const { data: { session } } = await getSupabaseBrowser().auth.getSession();\n                              setSessionToken(session?.access_token || "");\n                              setSendTarget({ empresa: m.company!.nombre || "", titulo: "", url: m.company!.urlWeb || "", email: m.company!.emailRrhh || "" });\n                            }}\n                            disabled={enviandoATodas}\n                            className="px-4 py-2 rounded-lg text-[12px] font-semibold transition hover:opacity-90 disabled:opacity-50 shrink-0"\n                            style={{ background: "#22c55e", color: "#0a1208" }}>\n                            \ud83d\udce7 Enviar mi CV'
text = text.replace(old_co_btn, new_co_btn)

# 5. Modify "Enviar CV a todas" button  
old_all_btn = '                      <button\n                        onClick={() => {\n                          const first = m.jobs![0];\n                          router.push(`/app/envios?empresa=${encodeURIComponent(first.empresa)}&puesto=${encodeURIComponent(first.titulo)}&web=${encodeURIComponent(first.url)}`);\n                        }}\n                        className="w-full py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"\n                        style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#22c55e" }}>\n                        \u270d\ufe0f Enviar CVs uno a uno (con preview) \u2192'
new_all_btn = '                      <button\n                        onClick={async () => {\n                          const first = m.jobs![0];\n                          const { data: { session } } = await getSupabaseBrowser().auth.getSession();\n                          setSessionToken(session?.access_token || "");\n                          setSendTarget({ empresa: first.empresa, titulo: first.titulo, url: first.url });\n                        }}\n                        className="w-full py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"\n                        style={{ background: "#1e212b", border: "1px solid #2d3142", color: "#22c55e" }}>\n                        \u270d\ufe0f Enviar CV con preview \u2192'
text = text.replace(old_all_btn, new_all_btn)

# 6. Add ChatSendPanel rendering before closing
old_end = '          </div>\n        </div>\n      )}\n    </>\n  );\n}'
new_end = '          </div>\n        </div>\n      )}\n\n      {/* \u2500\u2500 Panel de env\u00edo inline \u2500\u2500 */}\n      {sendTarget && sessionToken && (\n        <ChatSendPanel\n          target={sendTarget}\n          userId={userId}\n          sessionToken={sessionToken}\n          onClose={() => setSendTarget(null)}\n          onSent={(msg) => {\n            addMsg("gusi", msg);\n            setSendTarget(null);\n          }}\n        />\n      )}\n    </>\n  );\n}'
text = text.replace(old_end, new_end)

with open("components/GusiChat.tsx", "w") as f:
    f.write(text)

print("Done:", all(x in text for x in ["ChatSendPanel", "sendTarget", "setSendTarget"]))
