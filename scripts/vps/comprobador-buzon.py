#!/usr/bin/env python3
"""comprobador-buzon.py — Pregunta a un servidor de correo si un buzón existe, sin mandar nada.

POR QUÉ ESTÁ EN EL SERVIDOR Y NO EN LA APP (26 nov 2026)

Los CV rebotaban casi un 30 % y llevaban la cuenta de Resend al 3,2 % (al 4 %
puede parar todos los correos, también las confirmaciones de registro). Michel
decidió comprobar el buzón antes de mandar (lib/cv-sender/buzon-existe.ts).

Para preguntar hay que hablar SMTP por el puerto 25, y el proveedor del VPS lo
corta por IPv4: medido ese día, pasan dos o tres conexiones y luego ninguna
durante minutos. Por IPv6 no hay corte, pero el contenedor de la app no tiene
IPv6. Por eso este servicio corre en el propio servidor, escucha solo en la
puerta de la red de Docker de la app (no se ve desde internet) y pide el
ADMIN_SECRET de .env.local.

QUÉ HACE: GET /rcpt?email=…&mx=a,b (el contenedor ya ha resuelto los MX).
Abre la conversación con el primer servidor que conteste (primero por IPv6),
llega hasta RCPT TO y NUNCA manda DATA. Devuelve {"respuesta": "550 5.1.1 …"}
o {"respuesta": null} si no se pudo preguntar. Quién decide qué significa la
respuesta es la app (respuestaDeBuzonInexistente), no esto.

Se instala con comprobador-buzon.service (systemd). Ver README.md.
"""
import hmac
import json
import os
import re
import socket
import subprocess
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ENV = "/root/.openclaw/workspace/buscaycurra-unified/.env.local"
PUERTO = 8919
TIEMPO = 6  # segundos por conexión
EMAIL_OK = re.compile(r"^[^\s<>@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
MX_OK = re.compile(r"^[A-Za-z0-9.-]+$")


def leer_secreto():
    with open(ENV, encoding="utf-8") as f:
        for linea in f:
            if linea.startswith("ADMIN_SECRET="):
                return linea.split("=", 1)[1].strip().strip("'\"")
    return ""


def puerta_de_docker():
    """La IP de la puerta de la red de la app: solo ahí se escucha."""
    salida = subprocess.run(
        ["docker", "network", "inspect", "busca-y-curra_default", "-f", "{{(index .IPAM.Config 0).Gateway}}"],
        capture_output=True, text=True, timeout=20,
    )
    ip = salida.stdout.strip()
    if not re.match(r"^\d+\.\d+\.\d+\.\d+$", ip):
        raise SystemExit(f"no encuentro la red de Docker de la app: {salida.stderr.strip()}")
    return ip


def leer_respuesta(s):
    """Lee una respuesta SMTP entera (las de varias líneas acaban en «NNN texto»)."""
    datos = b""
    while True:
        trozo = s.recv(4096)
        if not trozo:
            return None
        datos += trozo
        lineas = [l for l in datos.decode("utf-8", "replace").splitlines() if l.strip()]
        if lineas and re.match(r"^\d{3}( |$)", lineas[-1]) and datos.endswith(b"\n"):
            return " ".join(lineas)


def conversar(destino, familia, email):
    with socket.socket(familia, socket.SOCK_STREAM) as s:
        s.settimeout(TIEMPO)
        s.connect(destino)
        saludo = leer_respuesta(s)
        if not saludo or not saludo.startswith("220"):
            return None
        for orden, esperado in ((b"EHLO buscaycurra.es\r\n", "250"), (b"MAIL FROM:<>\r\n", "250")):
            s.sendall(orden)
            r = leer_respuesta(s)
            if not r or not r.startswith(esperado):
                return None
        s.sendall(f"RCPT TO:<{email}>\r\n".encode())
        r = leer_respuesta(s)
        try:
            s.sendall(b"QUIT\r\n")
        except OSError:
            pass
        return r


def preguntar(email, servidores):
    for mx in servidores[:2]:
        try:
            direcciones = socket.getaddrinfo(mx, 25, type=socket.SOCK_STREAM)
        except OSError:
            continue
        # Primero IPv6 (por IPv4 el puerto 25 está cortado), luego IPv4 por si acaso.
        direcciones.sort(key=lambda d: 0 if d[0] == socket.AF_INET6 else 1)
        for familia, _, _, _, destino in direcciones[:3]:
            try:
                r = conversar(destino, familia, email)
                if r:
                    return r[:300]
            except OSError:
                continue
    return None


SECRETO = leer_secreto()
ULTIMAS = []  # tiempos de las últimas preguntas, para no pasar de 30 por minuto


class Manejador(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # sin direcciones en el registro

    def responder(self, codigo, cuerpo):
        datos = json.dumps(cuerpo).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path != "/rcpt":
            return self.responder(404, {"error": "no"})
        if not SECRETO or not hmac.compare_digest(self.headers.get("x-admin-secret", ""), SECRETO):
            return self.responder(401, {"error": "no"})
        q = parse_qs(url.query)
        email = (q.get("email") or [""])[0].strip().lower()
        servidores = [m for m in (q.get("mx") or [""])[0].split(",") if m and MX_OK.match(m)]
        if not EMAIL_OK.match(email) or not servidores:
            return self.responder(400, {"error": "falta el correo o el servidor"})
        ahora = time.time()
        ULTIMAS[:] = [t for t in ULTIMAS if ahora - t < 60]
        if len(ULTIMAS) >= 30:
            return self.responder(200, {"respuesta": None, "motivo": "demasiadas"})
        ULTIMAS.append(ahora)
        self.responder(200, {"respuesta": preguntar(email, servidores)})


if __name__ == "__main__":
    ThreadingHTTPServer((puerta_de_docker(), PUERTO), Manejador).serve_forever()
