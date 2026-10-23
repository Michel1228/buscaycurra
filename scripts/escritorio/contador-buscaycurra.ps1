# contador-buscaycurra.ps1 — El contador de BuscayCurra en el escritorio de Michel.
#
# Al encender el ordenador aparece un recuadro en la esquina de abajo a la
# derecha con las personas, las altas de hoy y de ayer, las ciudades y de dónde
# vienen. Se actualiza solo cada 15 minutos. Los números salen de
# https://buscaycurra.es/api/admin/contador (lib/metricas/personas.ts).
#
# La clave NO está en este fichero (el repositorio es público): se guarda en
# %APPDATA%\BuscayCurra\contador.clave y solo sirve para leer estos números.
#
# Instalar (crea el acceso directo del escritorio y el de inicio de Windows):
#   powershell -ExecutionPolicy Bypass -File contador-buscaycurra.ps1 -Instalar

param([switch]$Instalar)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Carpeta = Join-Path $env:APPDATA "BuscayCurra"
$FicheroClave = Join-Path $Carpeta "contador.clave"
$Icono = Join-Path $Carpeta "contador.ico"
$UrlNumeros = "https://buscaycurra.es/api/admin/contador"
$UrlPanel = "https://buscaycurra.es/admin/metricas"
$Esto = $MyInvocation.MyCommand.Path

if ($Instalar) {
    New-Item -ItemType Directory -Force -Path $Carpeta | Out-Null
    # El icono de la app, de public/icon-128.png.
    $png = Join-Path (Split-Path (Split-Path $Esto)) "..\public\icon-128.png"
    if (Test-Path $png) {
        $bmp = New-Object System.Drawing.Bitmap((Resolve-Path $png).Path)
        $ico = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
        $fs = [IO.File]::Create($Icono); $ico.Save($fs); $fs.Close()
    }
    $shell = New-Object -ComObject WScript.Shell
    foreach ($sitio in @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("Startup"))) {
        $acceso = $shell.CreateShortcut((Join-Path $sitio "Contador BuscayCurra.lnk"))
        $acceso.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
        $acceso.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Esto`""
        $acceso.WorkingDirectory = Split-Path $Esto
        $acceso.Description = "Contador de BuscayCurra"
        if (Test-Path $Icono) { $acceso.IconLocation = $Icono }
        $acceso.Save()
    }
    Write-Output "Instalado: acceso directo en el escritorio y en el inicio de Windows."
    exit
}

# Una sola ventana aunque se abra dos veces.
$nueva = $false
$candado = New-Object System.Threading.Mutex($true, "BuscayCurraContador", [ref]$nueva)
if (-not $nueva) { exit }

function Color([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
$Fondo = Color "#111827"; $Borde = Color "#2d3142"; $Verde = Color "#22c55e"
$Texto = Color "#f1f5f9"; $Secundario = Color "#94a3b8"; $Apagado = Color "#64748b"; $Rojo = Color "#ef4444"

$form = New-Object System.Windows.Forms.Form
$form.FormBorderStyle = "None"
$form.ShowInTaskbar = $false
$form.StartPosition = "Manual"
$form.BackColor = $Fondo
$form.Size = New-Object System.Drawing.Size(340, 250)
$zona = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$form.Location = New-Object System.Drawing.Point(($zona.Right - $form.Width - 16), ($zona.Bottom - $form.Height - 16))
if (Test-Path $Icono) { $form.Icon = New-Object System.Drawing.Icon($Icono) }
$form.Add_Paint({ param($s, $e)
    $lapiz = New-Object System.Drawing.Pen($Borde, 1)
    $e.Graphics.DrawRectangle($lapiz, 0, 0, $s.Width - 1, $s.Height - 1)
})

function Etiqueta($x, $y, $ancho, $alto, $tamano, $color, [string]$estilo = "Regular", [string]$fuente = "Segoe UI") {
    $l = New-Object System.Windows.Forms.Label
    $l.Location = New-Object System.Drawing.Point($x, $y)
    $l.Size = New-Object System.Drawing.Size($ancho, $alto)
    $l.Font = New-Object System.Drawing.Font($fuente, $tamano, [System.Drawing.FontStyle]$estilo)
    $l.ForeColor = $color
    $l.BackColor = [System.Drawing.Color]::Transparent
    $l.AutoEllipsis = $true
    $form.Controls.Add($l)
    return $l
}

$titulo = Etiqueta 16 12 160 20 10.5 $Verde "Bold"
$titulo.Text = "BuscayCurra"
$hora = Etiqueta 170 14 130 18 8 $Apagado
$hora.TextAlign = "TopRight"
$cerrar = Etiqueta 306 8 24 24 12 $Apagado
$cerrar.Text = [char]0x00D7
$cerrar.TextAlign = "MiddleCenter"
$cerrar.Cursor = [System.Windows.Forms.Cursors]::Hand
$cerrar.Add_Click({ $form.Close() })

$personas = Etiqueta 14 36 130 46 26 $Texto "Regular" "Segoe UI Semibold"
$personas.AutoSize = $true
$personasTexto = Etiqueta 140 56 180 22 10 $Secundario
$personasTexto.Text = "personas"
$altas = Etiqueta 16 86 310 20 10 $Texto
$estado = Etiqueta 16 108 310 18 9 $Secundario

$rotuloCanal = Etiqueta 16 134 310 15 7.5 $Apagado "Bold"
$rotuloCanal.Text = "CÓMO LLEGAN (ALTAS DE 30 DÍAS)"
$canales = Etiqueta 16 150 310 18 9 $Secundario
$rotuloCiudad = Etiqueta 16 174 310 15 7.5 $Apagado "Bold"
$rotuloCiudad.Text = "CIUDADES"
$ciudades = Etiqueta 16 190 310 18 9 $Secundario

$enlace = New-Object System.Windows.Forms.LinkLabel
$enlace.Location = New-Object System.Drawing.Point(16, 222)
$enlace.Size = New-Object System.Drawing.Size(200, 18)
$enlace.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$enlace.LinkColor = $Verde; $enlace.ActiveLinkColor = $Verde
$enlace.BackColor = [System.Drawing.Color]::Transparent
$enlace.Text = "Abrir el panel completo"
$enlace.Add_LinkClicked({ Start-Process $UrlPanel })
$form.Controls.Add($enlace)

function Lista($xs, [int]$cuantos) {
    $buenas = @($xs | Where-Object { $_.nombre -ne "Sin dato" } | Select-Object -First $cuantos)
    if ($buenas.Count -eq 0) { return $null }
    return ($buenas | ForEach-Object { "$($_.nombre) $($_.n)" }) -join "  ·  "
}

function Actualizar {
    try {
        if (-not (Test-Path $FicheroClave)) { throw "Falta la clave en $FicheroClave" }
        $clave = (Get-Content -Raw -LiteralPath $FicheroClave).Trim()
        $r = Invoke-WebRequest -Uri $UrlNumeros -Headers @{ "x-contador" = $clave } -UseBasicParsing -TimeoutSec 45
        # Windows PowerShell 5.1 lee mal los acentos si no se le dice que es UTF-8.
        $n = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray()) | ConvertFrom-Json
        $p = $n.personas
        $personas.Text = "$($p.reales)"
        $personasTexto.Left = $personas.Right
        $altas.Text = "Hoy $($p.hoy)   ·   Ayer $($p.ayer)   ·   7 días $($p.ultimos7)   ·   30 días $($p.ultimos30)"
        $dePago = if ($null -eq $n.dePago) { "?" } else { $n.dePago }
        $estado.Text = "Sin confirmar $($p.sinConfirmar)   ·   Activas 7 días $($p.activas7)   ·   De pago $dePago"
        $sinDato = @($p.canales30 | Where-Object { $_.nombre -eq "Sin dato" } | ForEach-Object { $_.n })[0]
        $c = Lista $p.canales30 4
        $canales.Text = if ($c) { $c } else { "Aún sin datos: se apunta desde el 23 oct" }
        if ($sinDato) { $canales.Text += "   (+$sinDato sin dato)" }
        $ci = Lista $p.ciudades 4
        $ciudades.Text = if ($ci) { $ci } else { "-" }
        $hora.ForeColor = $Apagado
        $hora.Text = "actualizado " + (Get-Date -Format "HH:mm")
        $reloj.Interval = 15 * 60 * 1000
    } catch {
        $hora.ForeColor = $Rojo
        $hora.Text = if ("$_" -match "401") { "clave no válida" } else { "sin conexión" }
        $reloj.Interval = 60 * 1000   # reintenta en un minuto
    }
}

$reloj = New-Object System.Windows.Forms.Timer
$reloj.Interval = 15 * 60 * 1000
$reloj.Add_Tick({ Actualizar })
$form.Add_Shown({ $personas.Text = "..."; $form.Refresh(); Actualizar; $reloj.Start() })

[System.Windows.Forms.Application]::Run($form)
$candado.ReleaseMutex()
