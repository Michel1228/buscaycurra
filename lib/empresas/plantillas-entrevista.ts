/**
 * lib/empresas/plantillas-entrevista.ts — Preguntas de partida para la entrevista de cada sector.
 *
 * POR QUÉ (21 nov 2026, pedido de Michel). Al crear su entrevista
 * (/empresas/entrevistas), la empresa elige su sector y le salen las preguntas
 * habituales con lo que conviene oír en cada una; las cambia, quita o añade a su
 * gusto. Así prepara mejor la entrevista y valora con criterio, y el candidato
 * ensaya con lo que de verdad le van a preguntar.
 *
 * Reglas para escribirlas: solo sobre el puesto (nada de edad, origen, salud,
 * familia… lo comprueba preguntaDiscriminatoria), lo que se espera oír se puede
 * marcar como «lo ha dicho / no lo ha dicho», y lo legal que se nombra es
 * cierto (alérgenos: Reglamento UE 1169/2011; carné de carretillero: formación
 * obligatoria según el RD 1215/1997; CAP para conductores profesionales).
 */
import type { SectorEmpresa } from "@/lib/empresas/reglas";

export interface PreguntaPlantilla { texto: string; puntos: string[] }

export const PLANTILLAS: Record<SectorEmpresa, PreguntaPlantilla[]> = {
  hosteleria: [
    { texto: "Un cliente se queja de que su plato ha tardado y está frío. ¿Qué haces?", puntos: ["Pide disculpas sin discutir", "Ofrece una solución (cambiarlo, calentarlo, otra opción)", "Avisa a cocina o al encargado", "Vuelve después a ver si todo está bien"] },
    { texto: "¿Cómo te organizas cuando tienes varias mesas a la vez y la barra llena?", puntos: ["Prioriza (cobrar, servir lo que ya está, tomar nota)", "Se comunica con los compañeros", "Mantiene la calma y no deja mesas sin atender"] },
    { texto: "Un cliente pregunta si un plato lleva frutos secos porque es alérgico. ¿Qué haces?", puntos: ["No contesta de memoria si no está seguro", "Consulta la carta de alérgenos o pregunta en cocina", "Avisa en cocina de la alergia al pasar la comanda"] },
    { texto: "Cuéntame tu experiencia: ¿en sala, barra o cocina? ¿Qué tipo de local?", puntos: ["Tiempo y tipo de local concretos", "Tareas que hacía (comandas, caja, cafetera, emplatado…)", "Tiene el certificado de manipulador de alimentos o puede sacarlo"] },
    { texto: "¿Qué disponibilidad tienes para turnos, fines de semana y festivos?", puntos: ["Responde claro qué puede y qué no", "Sabe cómo son los turnos en hostelería"] },
  ],
  almacen: [
    { texto: "¿Con qué máquinas has trabajado en un almacén?", puntos: ["Nombra máquinas concretas (transpaleta, apiladora, carretilla)", "Tiene la formación de carretillero o sabe que es obligatoria", "Usa terminal o pistola de radiofrecuencia"] },
    { texto: "¿Cómo preparas pedidos rápido sin equivocarte?", puntos: ["Revisa referencia y cantidad antes de cerrar", "Sigue el orden de ruta o de ubicación", "Avisa si falta stock o algo no cuadra"] },
    { texto: "Ves a un compañero subir a una estantería por fuera para coger una caja. ¿Qué haces?", puntos: ["Le avisa del riesgo", "Usa o propone el medio adecuado (escalera, máquina)", "Lo comunica al responsable si se repite"] },
    { texto: "¿Has trabajado por objetivos de productividad? ¿Cómo te fue?", puntos: ["Da cifras o ejemplos concretos", "Mantiene la calidad, no solo la velocidad"] },
    { texto: "¿Qué turnos puedes hacer (mañana, tarde, noche, rotativos)?", puntos: ["Responde claro su disponibilidad", "Tiene cómo llegar al almacén en ese horario"] },
  ],
  limpieza: [
    { texto: "Cuéntame tu experiencia en limpieza: ¿oficinas, hoteles, hospitales, casas?", puntos: ["Tipo de sitio y tiempo concretos", "Tareas que hacía", "Si ha trabajado con un tiempo fijo por habitación o zona"] },
    { texto: "¿Qué productos no se deben mezclar nunca y por qué?", puntos: ["Lejía con amoniaco o con ácidos (antical, salfumán)", "Lee la etiqueta y la ficha del producto", "Ventila y usa guantes"] },
    { texto: "Si no te da tiempo a terminar tu zona, ¿qué haces?", puntos: ["Prioriza lo importante (baños, zonas de clientes)", "Avisa al responsable antes de irse", "No deja nada a medias sin decirlo"] },
    { texto: "Encuentras un objeto de valor olvidado en una habitación. ¿Qué haces?", puntos: ["No lo toca más de lo necesario", "Lo entrega o avisa según el procedimiento", "Lo deja registrado"] },
    { texto: "¿Qué disponibilidad tienes? ¿Puedes trabajar a primera hora o fines de semana?", puntos: ["Responde claro su disponibilidad"] },
  ],
  construccion: [
    { texto: "¿Qué oficio tienes y en qué tipo de obras has trabajado?", puntos: ["Oficio y tareas concretas", "Tipo de obra (nueva, reforma, industrial)", "Herramientas y máquinas que maneja"] },
    { texto: "¿Qué formación de prevención de riesgos tienes?", puntos: ["Tiene el curso de PRL de su oficio (20 h o más) o la tarjeta profesional (TPC)", "Sabe qué equipos de protección usa en su trabajo"] },
    { texto: "Llegas a un tajo y falta la protección de un hueco. ¿Qué haces?", puntos: ["No trabaja ahí hasta que se proteja", "Avisa al encargado o al recurso preventivo", "Señaliza si puede hacerlo sin riesgo"] },
    { texto: "Cuéntame un trabajo que te tocó repetir o corregir. ¿Qué aprendiste?", puntos: ["Reconoce el fallo concreto", "Explica qué hace ahora distinto"] },
    { texto: "¿Tienes carné de conducir y vehículo para llegar a obras fuera de la ciudad?", puntos: ["Responde claro", "Si no, dice cómo se organizaría"] },
  ],
  transporte: [
    { texto: "¿Qué carnés tienes y qué vehículos has llevado?", puntos: ["Carnés concretos (B, C, C+E, D)", "Tiene el CAP en vigor si es conductor profesional", "Tipo de vehículo y carga"] },
    { texto: "¿Cómo organizas una ruta de reparto con muchas paradas?", puntos: ["Planifica el orden antes de salir", "Usa GPS o la aplicación de la empresa", "Avisa al cliente o a la base si hay retrasos"] },
    { texto: "¿Has trabajado con tacógrafo? ¿Qué sabes de los tiempos de conducción y descanso?", puntos: ["Sabe que hay límites de conducción y descansos obligatorios", "Lleva bien la tarjeta y los registros"] },
    { texto: "Llegas a una entrega y no hay nadie. ¿Qué haces?", puntos: ["Sigue el procedimiento de la empresa", "Intenta contactar con el cliente", "Lo deja registrado"] },
    { texto: "Si tuvieras un golpe con el vehículo, ¿qué harías?", puntos: ["Se asegura de que nadie está herido", "Hace el parte amistoso o avisa a quien toque", "Lo comunica a la empresa enseguida"] },
  ],
  cuidados: [
    { texto: "Cuéntame tu experiencia cuidando a personas mayores, dependientes o niños.", puntos: ["Tiempo y tipo de cuidado concretos", "Tareas (aseo, movilizaciones, comidas, medicación pautada)", "Tiene formación sociosanitaria o la está haciendo"] },
    { texto: "La persona que cuidas no quiere ducharse ni comer. ¿Cómo lo llevas?", puntos: ["Respeta y escucha, sin forzar", "Busca otro momento o forma de proponerlo", "Avisa a la familia o al responsable si se repite"] },
    { texto: "¿Cómo mueves a una persona de la cama a la silla sin hacerle daño ni hacerte daño tú?", puntos: ["Explica la técnica (espalda recta, apoyos, grúa si hay)", "Le explica a la persona lo que va a hacer", "Pide ayuda si hace falta"] },
    { texto: "Notas un cambio raro (confusión, una caída, fiebre). ¿Qué haces?", puntos: ["Avisa a la familia o al servicio de salud enseguida", "No da medicación que no esté pautada", "Lo apunta o lo cuenta con detalle"] },
    { texto: "¿Cómo cuidas la intimidad y la información de la persona y de su familia?", puntos: ["No cuenta nada de ellos fuera", "Respeta su intimidad en el aseo y en su casa"] },
  ],
  comercio: [
    { texto: "¿Cómo atiendes a un cliente que no sabe lo que quiere?", puntos: ["Pregunta para qué lo necesita", "Recomienda opciones según lo que le cuenta", "No presiona para vender"] },
    { texto: "Un cliente quiere devolver algo sin ticket y está enfadado. ¿Qué haces?", puntos: ["Escucha y mantiene la calma", "Explica la política de la tienda", "Busca una salida o avisa al encargado"] },
    { texto: "¿Has llevado caja? ¿Qué haces si al cerrar no te cuadra?", puntos: ["Ha manejado caja o TPV", "Vuelve a contar y revisa los tickets", "Lo comunica, no lo esconde"] },
    { texto: "¿Cómo repones y colocas el género en tienda?", puntos: ["Saca primero lo que caduca antes", "Mantiene orden, precios y carteles", "Avisa de las roturas de stock"] },
    { texto: "¿Qué disponibilidad tienes para fines de semana, rebajas o campaña de Navidad?", puntos: ["Responde claro su disponibilidad"] },
  ],
  salud: [
    { texto: "Cuéntame tu formación y tu experiencia en el servicio o la planta.", puntos: ["Titulación y colegiación si la pide el puesto", "Servicios donde ha trabajado y tareas concretas"] },
    { texto: "¿Cómo te aseguras de no equivocarte al dar una medicación?", puntos: ["Comprueba paciente, fármaco, dosis, vía y hora", "Pregunta si algo no le cuadra", "Lo registra al momento"] },
    { texto: "Un familiar te pide información del paciente por teléfono. ¿Qué haces?", puntos: ["No da datos sin comprobar quién es y si está autorizado", "Lo deriva a quien corresponde"] },
    { texto: "Háblame de una situación de mucha carga de trabajo o tensión. ¿Cómo la llevaste?", puntos: ["Prioriza lo urgente", "Pide ayuda y se coordina con el equipo"] },
    { texto: "¿Qué medidas de higiene y prevención de infecciones aplicas siempre?", puntos: ["Higiene de manos en los momentos clave", "Uso correcto de guantes y equipos de protección", "Manejo de residuos y material punzante"] },
  ],
  tecnologia: [
    { texto: "Cuéntame un proyecto en el que hayas trabajado y qué parte hiciste tú.", puntos: ["Explica su parte, no solo la del equipo", "Tecnologías concretas", "Resultado o qué aprendió"] },
    { texto: "Algo falla en producción y no sabes por qué. ¿Cómo lo abordas?", puntos: ["Mira registros y reproduce el fallo", "Avisa y mantiene informado al equipo", "Busca la causa, no solo el parche"] },
    { texto: "¿Cómo trabajas con control de versiones y revisiones de código?", puntos: ["Usa Git con ramas y commits claros", "Acepta y hace revisiones de código"] },
    { texto: "¿Cómo explicas algo técnico a alguien que no lo es?", puntos: ["Usa ejemplos sencillos", "Comprueba que se ha entendido"] },
    { texto: "¿Qué estás aprendiendo ahora y cómo lo haces?", puntos: ["Tema concreto", "Forma de aprender (proyectos, cursos, documentación)"] },
  ],
  otro: [
    { texto: "Háblame de tu experiencia más relacionada con este puesto.", puntos: ["Trabajo y tareas concretas", "Tiempo que estuvo", "Qué aprendió"] },
    { texto: "¿Qué sabes de nuestra empresa y por qué te interesa el puesto?", puntos: ["Se ha informado de la empresa", "Relaciona el puesto con lo que sabe hacer"] },
    { texto: "Cuéntame un problema en el trabajo que resolviste.", puntos: ["Situación concreta", "Qué hizo él o ella", "Cómo acabó"] },
    { texto: "¿Cómo te organizas cuando tienes mucho trabajo a la vez?", puntos: ["Prioriza", "Avisa si no llega"] },
    { texto: "¿Qué disponibilidad tienes y cuándo podrías empezar?", puntos: ["Responde claro horario y fecha de incorporación"] },
  ],
};
