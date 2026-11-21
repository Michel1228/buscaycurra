# Empresas verificadas: quién ve a los candidatos

Decidido por Michel el 21 de noviembre de 2026. Este documento resume cómo funciona y lo que falta.

## La regla

- Ver candidatos (nombre, puntuación, CV y contacto) es **solo para empresas, ETT y agencias de colocación verificadas**.
- De momento es **gratis**. El cupo de contactos nuevos al mes (`LIMITES_EMPRESA.candidatosMes`) se queda solo como freno contra quien quiera copiar la base. Precio y límites, más adelante.
- **Pagar el Plan Empresa no da acceso a los candidatos.** Quien lo paga siendo un usuario normal se queda con sus ventajas: envíos de CV y Guzzi sin límite.
- Quien no está verificado ve fichas **sin nombre**: puesto, ciudad y aptitudes. No ve puntuación, referencias, contacto ni el CV.

## El camino de una empresa

1. **Alta**: en `/empresas/alta`, con la cuenta y el correo verificados, rellena estos datos:
   - razón social y NIF;
   - tipo: empresa, ETT o agencia de colocación;
   - número de autorización, si es ETT o agencia;
   - sectores, si es empresa;
   - correo de la empresa.

   También marca que usará los datos de los candidatos solo para sus procesos de selección. La solicitud queda `pendiente` y a `ADMIN_EMAILS` le llega un correo con enlaces para comprobarla.
2. **Visto bueno**: Michel la revisa en `/app/admin/empresas` y comprueba:
   - el NIF;
   - si es ETT, el listado de ETT autorizadas;
   - si es agencia, el listado del Sistema Nacional de Empleo.

   Al aprobar, se genera un código `XXXX-XXXX` y se manda al correo de la empresa. Si la rechaza, a quien la dio de alta le llega el motivo.
3. **Código**: la empresa mete el código en `/empresas/alta` y queda `activa`. El código:
   - solo se guarda como huella (HMAC);
   - caduca a los 30 días;
   - se bloquea tras 5 fallos.

   Meterlo prueba que quien se dio de alta controla ese correo.
4. **Equipo**: el resto de la empresa entra con su propia cuenta desde «Tu equipo» (`empresa_miembro`), mientras la empresa siga activa.

Estados de `empresa_verificacion`:
- `pendiente` → `aprobada` (código enviado) → `activa`;
- también `rechazada` (puede corregir y volver a mandar) y `suspendida` (Michel le quita el acceso).

Un NIF solo puede tener una cuenta aprobada o activa.

## Alcance: quién ve a quién

- Una **empresa** ve a los candidatos de los sectores con los que se dio de alta (hasta 3). «Otro sector» ve a los candidatos sin sector reconocible.
- Una **ETT** o una **agencia de colocación** ve todos los sectores.
- El sector de cada candidato sale de los puestos de su CV (`sectoresDelCv`, con las mismas reglas que el simulador de entrevistas).
- Se aplica en la lista (`/api/empresas/candidatos`), en el CV completo (`/talento/[id]`, antes de gastar cupo) y al invitar a una entrevista.

**Por qué**: el RGPD pide dar solo los datos necesarios (art. 5.1.c), y el candidato sabe quién puede verle.

## Puntuación del candidato (0 a 100)

Solo cuentan **hechos comprobables** (`puntuacionCandidato` en `lib/empresas/reglas.ts`):

| Apartado | Puntos |
|---|---|
| Cartas | 40 en total: carta de recomendación confirmada por quien la firmó (30 la primera, +10 la segunda) y carta de presentación (+10) |
| Experiencia con puesto y fechas | 15 |
| Formación | 8 |
| Aptitudes (3 o más) | 8 |
| Idiomas | 7 |
| Contacto (correo y teléfono) | 7 |
| CV al día (60 días: 15; 180: 8) | 15 |

Lo que más pesa es la carta de recomendación confirmada. Con una carta de recomendación y una de presentación el apartado de cartas sale igual de lleno que con dos de recomendación: así lo pidió Michel («aunque no tenga carta de presentación»).

Niveles:
- 75 o más: «Perfil destacado»;
- 50 a 74: «Perfil sólido»;
- menos de 50: «Perfil por completar».

Las empresas ven los candidatos ordenados de más puntos a menos. El candidato ve su puntuación y qué le falta en el editor del CV (`TuPuntuacion`).

**Nunca cuentan**:
- una nota de IA: la AEPD advirtió en 2026 (AI-00009-2026) y desde el 2 dic 2027 la selección de personal es «alto riesgo» en la ley europea de IA;
- la foto, la edad, el sexo o el origen;
- lo que una empresa haya dicho de un candidato: eso sería una lista negra compartida. La nota de la entrevista de una empresa la ve solo esa empresa.

## Entrevistas de empresa

- En `/empresas/entrevistas` la empresa escribe sus preguntas y, en cada una, «qué espera oír».
- Puede rellenarlas con las **preguntas habituales de su sector** (`lib/empresas/plantillas-entrevista.ts`) y cambiarlas a su gusto.
- Las preguntas o puntos sobre edad, hijos o embarazo, estado civil, origen, religión, salud, afiliación sindical, ideología u orientación sexual **no se guardan** (`preguntaDiscriminatoria`), y se avisa mientras se escriben.

## Comprobado

- **Sello** (`scripts/sello-verificacion.mjs`):
  - NIF de sociedad, DNI y NIE con su control;
  - números de autorización;
  - alcance por sector;
  - puntuación: la carta pesa más, la foto, la edad y el origen no cambian nada, y las partes suman 100;
  - preguntas prohibidas y permitidas;
  - plantillas dentro de los límites;
  - que la lista, `/talento` y las invitaciones aplican el alcance.
- **Prueba negativa**: rompiendo la regla de sector o la comprobación de `/talento`, el sello falla.

## Lo que falta (siguientes fases)

1. **Experiencia comprobada con la vida laboral.** El candidato sube su informe de vida laboral (PDF firmado por la Seguridad Social, con CSV) y se cruzan empresas y fechas con su CV. Solo se guarda el resultado. Añade un apartado nuevo a la puntuación, y al llegar se reparten de nuevo los 100 puntos.
2. **La carta de recomendación en las candidaturas.** Al mandar el CV a una oferta, decir que tiene una referencia confirmada (y enlazar la carta si el candidato lo permite).
3. **Precio y límites para empresas.** Michel habló de 4 o 5 candidatos y de que las ETT cobran más de 300 € por candidato.
4. **Encaje con lo que busca la empresa.** El campo «qué perfiles buscáis» ya se guarda (`busca`); sirve para avisar a candidatos de qué piden las empresas de su sector.
5. **App Store**: si la ficha del Plan Empresa en App Store Connect dice «ver candidatos», hay que cambiarla a mano.
