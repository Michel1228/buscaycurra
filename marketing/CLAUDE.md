# Contexto del proyecto — Marketing de BuscayCurra

> **Si acabas de abrir esta sesión: lee este archivo entero antes de responder nada.**
> Aquí está todo lo que necesitas saber para trabajar sin preguntar lo básico.

---

## Quién es Michel y cómo trabajar con él

**Michel Batista** es el fundador y único desarrollador de BuscayCurra. Trabaja de noche
(a partir de las 23:00) porque compagina esto con otro empleo. Lleva **más de seis meses**
con el proyecto, en solitario.

**Cómo espera que trabajes:**

1. **En español, siempre.** Conversación y comentarios de código.
2. **La verdad por encima de todo.** No inventes datos, cifras ni resultados. Si no lo
   sabes, dilo. Si te equivocas, corrígelo claro y sigue. Prefiere una mala noticia cierta
   a una buena inventada.
3. **Haz tú lo que puedas hacer tú.** Su frase: *"Todo lo que puedas hacer tú, no me lo
   mandes a mí"*. Agota tus vías antes de pedirle nada.
4. **Un paso a la vez en paneles externos.** Cuando tenga que tocar Meta, Google Cloud,
   App Store… dale UN paso, espera confirmación o captura, y luego el siguiente. No
   vuelques diez pasos de golpe.
5. **URLs directas siempre.** Nada de "ve a ajustes y busca…". El enlace exacto.
6. **Verifica antes de afirmar.** Ha tenido problemas con agentes que dieron por buenos
   diagnósticos falsos. Comprueba cada dato contra la realidad.

**El asistente de la app se llama GUZZI** (nunca "Gusi"). Es un gusano verde 🐛.

---

## Qué es BuscayCurra

Plataforma de búsqueda de empleo con IA. **No es española: es global.** Michel lo dejó
claro: *"Un francés, un italiano, un canadiense o cualquier otra persona pueda utilizarla.
Limitarla solo a España sería un error."*

- **Web:** https://buscaycurra.es
- **iOS:** publicada en App Store desde el 27 jul 2026, en 175 países
- **Android:** en pruebas cerradas de Google Play (bloqueada por el requisito de
  12 testers × 14 días de uso real)
- **26 países** de ofertas · **~1,6 millones de ofertas vivas**

---

## Estado real del negocio (13 ago 2026)

**Estos números son reales y verificados. No los infles.**

| Métrica | Valor |
|---|---|
| Usuarios registrados | **22** |
| Suscriptores de pago | **0** |
| Ingresos de terceros | **0 €** |
| Visitas a la ficha de App Store | 43 (12 jul – 10 ago) |
| CVs enviados por usuarios | 112 |
| Usuarios con alertas activas | 8 de 22 |

**Contexto importante:** los 5,98 € que aparecen en Stripe son **pruebas del propio
Michel**, no clientes. Pero sirvieron para verificar que el cobro y **la renovación
automática funcionan**.

**Lo bueno de estos números:** 43 visitas → 22 registros es un **50% de conversión**
en App Store, muy por encima del 25-30% habitual. Y 8 de 22 usuarios configuraron
alertas. El producto engancha a quien entra; **el problema es que entra poca gente**.

**Panel de métricas en vivo:** https://buscaycurra.es/admin/metricas
(entra con la cuenta michelkm11batista@gmail.com, sin claves)

---

## Por qué el marketing es AHORA y no antes

Hasta la semana del 6-13 de agosto de 2026, la app tenía fallos graves que hacían
inútil promocionarla:

- La búsqueda tardaba **11,5 segundos**
- Guzzi devolvía **cero ofertas** en todas las búsquedas por país
- El **100% de las ofertas** salía como "sin email" al intentar enviar el CV
- Pedir trabajo en Irlanda devolvía ofertas de Logroño

**Todo eso está arreglado y verificado en producción.** La búsqueda va en menos de
1 segundo con ciudad, el 90% de las ofertas llegan con email y Guzzi responde bien
por país. Por eso ahora sí tiene sentido traer gente.

---

## Estructura de este proyecto

```
01-PRODUCTO/    Qué vendemos y por qué es bueno
02-MARKETING/   El plan, la investigación y el calendario
03-RECURSOS/    Textos listos para usar y análisis de competencia
```

**Empieza por `02-MARKETING/plan-de-marketing.md`.**

---

## Reglas para el contenido de marketing

1. **No prometer lo que la app no hace.** Todo lo que aparece en
   `01-PRODUCTO/puntos-fuertes.md` está verificado contra el código.
2. **El público no es técnico.** Son camareros, cuidadores, limpiadores, au pairs,
   gente de construcción. Habla como ellos, no como una startup.
3. **El dolor real es emocional, no funcional.** Michel lo dijo mejor que ningún
   manual: *"sin familia, sin amigos y sin tener un lugar adecuado, uno se siente
   vacío"*. Quien emigra no busca solo un trabajo.
4. **Presupuesto ≈ 0.** Todo lo que se proponga tiene que poder hacerse gratis o
   por muy poco. Michel no tiene dinero para campañas de pago.
