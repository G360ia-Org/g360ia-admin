================================================================================
G360iA — GESTIÓN 360 iA
ESPECIFICACIÓN TÉCNICA — MÓDULO ÓRDENES DE TRABAJO (OT)
Versión 1.0  ·  Rubro: Servicio Técnico  ·  Abril 2026
================================================================================
Documento de arquitectura para desarrollo. Incluye flujo de negocio, modelo
de datos, vistas de frontend, mensajería WA y lógica de monetización.
================================================================================


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. DESCRIPCIÓN GENERAL DEL MÓDULO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El módulo de Órdenes de Trabajo (OT) es el núcleo operativo de G360iA para el
rubro Servicio Técnico. Gestiona el ciclo de vida completo de una reparación:
desde el ingreso del equipo hasta la entrega, post-venta y garantía.

Está diseñado como un módulo independiente dentro de la plataforma SaaS
multi-tenant. Se integra mediante FK y eventos internos con otros módulos
(Stock/Inventario, Agenda, Facturación, Clientes) sin depender de ellos para
funcionar.

PRINCIPIOS DE DISEÑO
--------------------
- Multi-tenant: cada OT pertenece a un tenant. Ningún dato es compartido.
- Estado como motor: todo el flujo se rige por el campo `estado` de la OT.
- WhatsApp como canal principal: el cliente interactúa por WA. El panel es
  para el tenant.
- QR persistente: el QR generado al ingreso no expira. Muta su contenido
  según el estado (seguimiento → garantía digital).
- Plan gate visible: las limitaciones del plan Free son visibles en la UI,
  no silenciosas. La limitación tiene que doler.
- Módulos externos son consumidores o proveedores, no dependencias duras.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
II. CICLO DE VIDA DE UNA OT — FLUJO COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ejemplo real: Marcos trae una notebook que no enciende.

CANALES DE INGRESO
------------------
- WhatsApp: el cliente envía foto + descripción al número del local. El sistema
  (n8n + Evolution API) captura el mensaje, crea la OT y responde
  automáticamente con el QR y link de seguimiento.
- Manual: el técnico o encargado carga la OT desde el panel completando el
  formulario de check-in.

Nota sobre QR en celular: el QR no es el canal principal para el cliente
móvil. El mensaje de WA incluye un link directo (/seguimiento/:token) que el
cliente toca para ver el estado. El QR físico se imprime en el ticket de
ingreso para escanear desde otro dispositivo o en el local.

TABLA DE ESTADOS
----------------

#  | Estado                  | Ícono | Actor             | Acción automática WA
---|-------------------------|-------|-------------------|------------------------------------------
1  | Ingresado               | 🟢    | Sistema / Tenant  | Envío de QR + link de seguimiento
2  | Pendiente de asignación | ⚪    | Tenant            | —
3  | En diagnóstico          | 🟠    | Técnico           | "Tu equipo está siendo diagnosticado"
4  | Presupuestado           | 🔵    | Sistema           | Link PDF + botón Aprobar/Rechazar
5  | En reparación           | 🔴    | Técnico           | "Tu equipo está en reparación"
6  | Listo para retirar      | 🔵    | Técnico           | "Tu equipo está listo ✅"
7  | Entregado / Facturado   | ✅    | Tenant            | Certificado de garantía digital vía QR

REGLAS DE TRANSICIÓN
--------------------
- Solo se puede avanzar al siguiente estado en orden. No se puede saltar.
- El estado Presupuestado solo se alcanza desde Diagnóstico al generar y
  enviar el presupuesto.
- Si el cliente rechaza el presupuesto, la OT va a "Cerrado sin reparación"
  (variante de Entregado).
- Un técnico asignado (id_usuario_tecnico) es requerido para avanzar de
  Pendiente a Diagnóstico.
- Cada transición queda registrada en ot_estados_historial con actor,
  timestamp y comentario.
- Plan Free: solo están activos los estados 1 y 7. Los intermedios se
  muestran en el pipeline visual con candado.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
III. MODELO DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Todas las tablas del módulo usan el prefijo ot_. Prefijo de módulos externos
referenciados: cli_ (Clientes), stk_ (Stock), vta_ (Facturación), agn_ (Agenda).

────────────────────────────────────────────────────────────────────────────────
III.1  TABLA MAESTRA — ot_ordenes
────────────────────────────────────────────────────────────────────────────────

Campo                   | Tipo              | Descripción
------------------------|-------------------|------------------------------------------
id                      | INT PK AI         | Identificador único de la OT
id_tenant               | INT FK            | Tenant propietario
id_cliente              | INT FK (cli_)     | Cliente dueño del equipo
id_usuario_tecnico      | INT FK (users)    | Técnico asignado. NULL si sin asignar.
id_dispositivo          | INT FK            | Equipo del cliente. Permite historial
                        |                   | multi-OT por equipo.
numero_orden            | VARCHAR(20)       | Formato OT-YYYY-NNN. Auto-generado.
estado                  | ENUM              | 7 valores: ingresado / pendiente /
                        |                   | diagnostico / presupuestado /
                        |                   | reparacion / listo / entregado
falla_reportada         | TEXT              | Descripción del problema (WA o manual)
observaciones_tecnicas  | TEXT              | Notas internas. No visibles al cliente.
qr_token                | VARCHAR(255)      | Token único para URL pública. No expira.
                        |                   | Se reutiliza como QR de garantía.
fecha_ingreso           | DATETIME          | Timestamp de creación de la OT
fecha_entrega_estimada  | DATETIME          | Prometida al cliente. Alimenta semáforo.
prioridad               | ENUM              | baja / media / alta / urgente
garantia_dias           | INT               | Días de garantía al cierre. Default
                        |                   | configurable por tenant.
id_ot_garantia_origen   | INT FK (self)     | Si es re-ingreso por garantía, apunta
                        |                   | a la OT original.
rating_satisfaccion     | TINYINT (1-5)     | Resultado de la encuesta post-entrega.
fecha_encuesta          | DATETIME          | Timestamp de respuesta de encuesta.
canal_ingreso           | ENUM              | whatsapp / manual

────────────────────────────────────────────────────────────────────────────────
III.2  TABLAS DEL MÓDULO
────────────────────────────────────────────────────────────────────────────────

ot_estados_historial
  Propósito: trazabilidad completa de cada cambio de estado.
  Campos: id, id_ot, estado_anterior, estado_nuevo, id_usuario_cambio,
          fecha_hora, comentario_interno

ot_presupuestos
  Propósito: gestión de presupuestos por OT. Puede haber más de uno
             (revisiones).
  Campos: id, id_ot, monto_total, estado ENUM(borrador/enviado/aprobado/
          rechazado), pdf_path, fecha_creacion, fecha_aprobacion

ot_detalles_presupuesto
  Propósito: ítems de cada presupuesto (mano de obra y repuestos).
  Campos: id, id_presupuesto, id_insumo (FK→stk_), descripcion, cantidad,
          precio_unitario, subtotal, es_repuesto BOOL

ot_adjuntos
  Propósito: archivos multimedia asociados a la OT.
  Campos: id, id_ot, url_archivo, tipo ENUM(foto_ingreso/evidencia_tecnica/
          audio_cliente), fecha_subida

ot_mensajes_wa
  Propósito: log de todos los mensajes WA enviados por la OT.
  Campos: id, id_ot, tipo_evento, plantilla_usada, numero_destino,
          estado_envio ENUM(enviado/entregado/leido/error), fecha_envio

ot_garantias
  Propósito: registro de garantía por OT cerrada.
  Campos: id, id_ot, fecha_entrega, garantia_dias, fecha_vencimiento,
          extension_dias, id_ot_reclamo (FK→ot_ordenes),
          notificacion_enviada BOOL

────────────────────────────────────────────────────────────────────────────────
III.3  RELACIONES CON MÓDULOS EXTERNOS
────────────────────────────────────────────────────────────────────────────────

Módulo       | Prefijo | Relación con OT                              | Tipo
-------------|---------|----------------------------------------------|----------------
Clientes     | cli_    | id_cliente en ot_ordenes. Historial de OTs   | FK directa
             |         | por cliente y garantías vigentes.            |
Stock        | stk_    | id_insumo en ot_detalles_presupuesto.        | FK directa
             |         | La OT consume stock, no lo administra.       |
Facturación  | vta_    | Al cerrar OT se emite evento. vta_ lo        | Evento interno
             |         | consume para emitir el comprobante.          |
Agenda       | agn_    | fecha_entrega_estimada en ot_ordenes.        | Campo referencia
             |         | La OT no gestiona agenda.                    |
Usuarios     | users   | id_usuario_tecnico en ot_ordenes.            | FK directa


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IV. SISTEMA DE GARANTÍA DIGITAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La garantía es una funcionalidad de alto valor percibido y diferencial
competitivo. Ningún local de servicio técnico hace seguimiento proactivo
post-entrega. Es también un lever de monetización por plan.

QR COMO CERTIFICADO (MUTA SEGÚN ESTADO)
----------------------------------------
El mismo QR generado al ingreso cambia su contenido según el estado de la OT:

- Durante la reparación: muestra seguimiento de estado en tiempo real.
- Al cierre (Entregado): se convierte en certificado de garantía digital.
  Muestra: fecha de vencimiento, técnico responsable, descripción del
  trabajo realizado, branding del local (Pro+).
- Si garantía vigente y cliente escanea: "Garantía activa. Contactá al
  local." con botón de WhatsApp directo.
- Si garantía vencida: "Garantía vencida el {fecha}."

RE-INGRESO POR GARANTÍA
------------------------
Al crear una nueva OT, si el sistema detecta que el equipo (por IMEI o
número de serie) tiene una OT anterior en garantía vigente, muestra un
alert en el formulario con el detalle de la OT origen. Al confirmar, se
vincula mediante id_ot_garantia_origen.

EXTENSIÓN DE GARANTÍA (Plan IA)
---------------------------------
- El tenant puede extender la garantía de una OT cerrada desde el detalle.
- El campo extension_dias en ot_garantias suma días al vencimiento original.
- Se envía un WA automático al cliente notificando la extensión.

RECORDATORIO PRE-VENCIMIENTO (Plan IA)
---------------------------------------
Configurable en Settings: X días antes del vencimiento (default: 7 días),
el sistema envía automáticamente un WA al cliente recordando que la garantía
está por vencer y ofreciendo contacto.

MONETIZACIÓN DE LA GARANTÍA
-----------------------------
Free    → QR post-entrega muestra solo fecha de vencimiento en texto plano.
Pro     → Certificado completo: detalle del trabajo, técnico, logo del local,
          botón de contacto directo.
Plan IA → Todo lo anterior + extensión configurable + recordatorio WA
          automático + el cliente puede solicitar revisión desde el QR.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
V. MENSAJERÍA WHATSAPP — TRIGGERS Y AUTOMATIZACIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cada cambio de estado relevante dispara un evento interno. Los listeners de WA
(Evolution API + n8n) consumen estos eventos y ejecutan el envío. Todos los
mensajes quedan registrados en ot_mensajes_wa con estado de entrega.

TABLA DE TRIGGERS
-----------------

Evento                          | Auto | Plan    | Plantilla
--------------------------------|------|---------|------------------------------------------
OT creada (ingreso)             | Sí   | Free    | "Recibimos tu equipo 📦. Tu nro. de OT
                                |      |         |  es {num}. Seguí el estado acá: {link}"
Envío de presupuesto            | Sí   | Pro     | "Tu presupuesto está listo 📋. Total:
                                |      |         |  ${monto}. Aprobá o rechazá: {link}"
Presupuesto aprobado            | Sí   | Pro     | "Presupuesto confirmado ✅. Iniciamos
                                |      |         |  la reparación a la brevedad."
Presupuesto rechazado           | Sí   | Pro     | "Entendemos. Tu equipo quedará
                                |      |         |  disponible para retirar. {link}"
OT lista para retirar           | Sí   | Pro     | "¡Listo! Tu equipo ya puede
                                |      |         |  retirarse 🎉. {dirección} · {horario}"
OT entregada (cierre)           | Sí   | Pro     | "Gracias por elegirnos. Tu garantía
                                |      |         |  vence el {fecha}. QR: {link}"
Encuesta 48 hs post-entrega     | Sí   | Pro     | "¿Cómo fue tu experiencia? Contanos
                                |      |         |  en 1 minuto: {link_encuesta}"
Recordatorio garantía (X días)  | Sí   | Plan IA | "Tu garantía vence el {fecha}.
                                |      |         |  ¿Necesitás algo? Respondé este msg."
Notificación manual (ad-hoc)    | No   | Free    | Texto libre escrito por el tenant.

ARQUITECTURA DE EVENTOS
------------------------
- Al cambiar el estado de una OT, el backend emite un evento interno
  (ej: ot.estado.changed).
- Un listener evalúa si corresponde enviar mensaje según: tipo de evento,
  plan del tenant, configuración de triggers en Settings del módulo.
- El mensaje se construye desde la plantilla configurada, reemplazando
  variables: {num}, {link}, {monto}, {fecha}, {dirección}, {horario}.
- El resultado (enviado/error) se registra en ot_mensajes_wa y aparece en
  el timeline del detalle de la OT.
- El tenant puede desactivar triggers individuales desde Settings.
- El botón "Notificar WA" en el panel envía mensaje ad-hoc libre (Free+).

VISTA PÚBLICA DE SEGUIMIENTO  →  /seguimiento/:qr_token
---------------------------------------------------------
- Página sin login. Accesible desde el link de WA y desde el QR del ticket.
- Mobile-first. Diseño responsivo y liviano.
- Muestra: estado actual (ícono + color), nombre del cliente y equipo,
  pipeline visual simplificado, timeline de eventos públicos (sin
  observaciones internas del técnico).
- Si hay presupuesto pendiente: botones Aprobar / Rechazar con confirmación.
- Post-cierre: se convierte en vista de garantía digital (ver sección IV).


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VI. ESPECIFICACIÓN DE FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El módulo sigue el sistema de diseño G360iA (panel.css):
- border-radius: 0 en todos los elementos
- Colores mediante gradientes CSS (variables CSS centralizadas)
- Sin bordes perimetrales en cards (solo border-bottom como divisor)
- Bootstrap Icons 1.11.3
- Fuente: 'Segoe UI', system-ui, sans-serif
- Fuente mono: 'Consolas', 'SF Mono', monospace (para números de OT y códigos)

────────────────────────────────────────────────────────────────────────────────
VI.1  MAPA DE VISTAS
────────────────────────────────────────────────────────────────────────────────

VISTA 1 — Listado de OTs (Dashboard principal)
  Ruta: /ot
  Componentes:
    - KPI Row: 6 cards (total mes, abiertas, en diagnóstico/presupuesto
      pendiente, listas para retirar, urgentes activas, entregadas mes)
    - Barra de búsqueda en tiempo real (por nro. OT, cliente, equipo, falla)
    - Selectores de filtro combinables: estado, prioridad, técnico
    - Tabs de filtro rápido: Todas / Activas / Listas / Urgentes
    - Tabla paginada con columnas detalladas (ver VI.3)
    - Badge de garantía en columna nro. OT (si es re-ingreso en garantía)
    - Semáforo de tiempo elapsed por OT
    - Paginación con indicador "X–Y de Z"
  Acciones: Nueva OT, abrir detalle, filtrar, buscar, exportar

VISTA 2 — Detalle OT (Panel lateral derecho)
  Ruta: /ot/:id  (slide-in, no navegación nueva)
  Componentes:
    - Topbar: nro. OT (monospace) + fecha ingreso + ícono QR + botón cerrar
    - Pipeline visual de estados (fila horizontal con línea conectora)
    - Sección Cliente/Equipo (dp-hero): nombre bold, dispositivo + IMEI,
      descripción completa de falla
    - Sección Información general: estado (badge), prioridad (dot + label),
      técnico (avatar iniciales + nombre), fecha estimada (alerta si vencida),
      canal de ingreso (badge WA o ícono manual)
    - Sección Presupuesto: tabla de ítems inline, total calculado, badge
      estado presupuesto, botones Ver PDF y Agregar ítem
    - Sección Timeline: lista vertical de eventos coloreados por tipo
    - Sección Adjuntos: grilla 4 columnas de thumbnails + slot agregar
    - Sección Garantía (visible en estado Entregado): fecha vencimiento,
      días restantes, badge estado garantía, botón Extender (Plan IA),
      botón Ver QR garantía
    - Sección Encuesta: rating (estrellas) si respondió, o badge "Pendiente"
      con fecha programada
    - Barra de acciones fija al fondo del panel
  Acciones: Avanzar estado, Notificar WA, Ver/descargar PDF, Agregar ítem
            presupuesto, Subir adjunto, Ver QR, Extender garantía

VISTA 3 — Nueva OT (Modal)
  Ruta: modal sobre /ot
  Componentes:
    - Selector de canal: botones "Desde WhatsApp" / "Cargar manual"
    - Búsqueda/creación de cliente con historial de OTs previas y garantías
      vigentes detectadas automáticamente
    - Campos: dispositivo (marca/modelo), IMEI/serie, prioridad (con color
      preview), falla reportada, técnico asignado, fecha estimada,
      días de garantía (pre-llenado con default del tenant), observaciones
    - Aviso informativo de QR automático al pie del formulario
    - Plan gate: bloqueo con modal de upgrade si supera límite Free
  Acciones: Crear OT y enviar QR, Cancelar

VISTA 4 — Presupuesto (Panel dentro del detalle)
  Ruta: sección dentro de /ot/:id
  Componentes:
    - Tabla editable de ítems: descripción / cantidad / precio unitario /
      subtotal / checkbox es_repuesto
    - Campo de búsqueda de insumo del stock (solo FK, sin gestión de stock)
    - Total calculado automáticamente
    - Badge estado presupuesto (borrador/enviado/aprobado/rechazado)
    - Preview del PDF generado
    - Log de aprobación con timestamp y actor
  Acciones: Agregar ítem, Eliminar ítem, Generar PDF, Enviar link WA,
            Marcar aprobado/rechazado manualmente

VISTA 5 — Seguimiento público (Vista QR del cliente)
  Ruta: /seguimiento/:qr_token  (sin login, mobile-first)
  Componentes:
    - Estado actual con ícono y color
    - Nombre del cliente y equipo
    - Pipeline visual simplificado (pasos completados/pendientes)
    - Timeline de eventos visibles para el cliente (sin notas internas)
    - Botones Aprobar/Rechazar presupuesto (si hay presupuesto pendiente)
    - Sección garantía post-cierre: fecha vencimiento + QR de verificación
  Acciones: Aprobar presupuesto, Rechazar presupuesto

VISTA 6 — Encuesta de satisfacción (Link único post-entrega)
  Ruta: /encuesta/:token  (sin login)
  Componentes:
    - Logo/nombre del local (tenant)
    - Datos del equipo reparado
    - Rating de 1 a 5 estrellas (interactivo)
    - Textarea de comentario libre
    - Confirmación de envío (solo una vez por token)
  Acciones: Enviar encuesta

VISTA 7 — Configuración del módulo OT
  Ruta: /configuracion/ot
  Componentes:
    - Días de garantía por defecto (configurable por tenant)
    - Días de anticipación para recordatorio WA de garantía
    - Plantillas WA editables por tipo de evento, con preview
    - Toggle activar/desactivar cada trigger automático
    - Estados configurables (Plan IA): renombrar o agregar estados
    - Barra de uso de OTs del mes con límite Free visible
  Acciones: Guardar configuración, Previsualizar plantilla WA

────────────────────────────────────────────────────────────────────────────────
VI.2  COMPONENTES UI DEL MÓDULO
────────────────────────────────────────────────────────────────────────────────

Badge de estado
  Pastilla con gradiente + ícono Bootstrap Icon.
  Variantes por color:
    ingresado       → slate (--grad-slate)
    pendiente       → gris muted
    diagnóstico     → amber (--grad-champ)
    presupuestado   → teal (--grad-teal)
    reparación      → alert red (--grad-alert)
    listo           → teal (--grad-teal)
    entregado       → green (--grad-green)

Dot de prioridad
  Círculo de color + label de texto. En tabla de listado y detalle.
    baja     → gris
    media    → amber
    alta     → naranja-rojo
    urgente  → rojo con animación pulsante (CSS keyframes)

Semáforo de tiempo
  Badge compacto de días desde el último cambio de estado.
    < 2 días  → verde
    2–5 días  → amber/amarillo
    > 5 días  → rojo

Pipeline de estados
  Fila horizontal de dots conectados por línea.
    done    → dot con check, color verde
    active  → dot con ícono del estado actual, color del estado
    pending → dot gris vacío
    bloqueado (plan Free) → dot gris con candado encima

Timeline de historial
  Lista vertical de eventos. Cada ítem tiene:
    - Ícono coloreado según tipo de evento
    - Texto descriptivo de la acción
    - Actor (nombre del técnico o "Sistema")
    - Timestamp (fecha + hora)
  Tipos de evento con su color:
    cambio de estado        → color del estado nuevo
    mensaje WA enviado      → teal/verde WA
    acción manual del tenant→ slate
    aprobación presupuesto  → green
    ingreso del cliente     → slate
    rechazo presupuesto     → alert red

Badge de garantía (en listado)
  Visible en columna nro. OT si la OT es re-ingreso en período de garantía.
    vigente           → verde
    por vencer <7d    → amber
    vencida           → gris

Badge de plan gate
  Lock icon con tooltip en features bloqueados. CTA de upgrade.
  Visible en columnas/botones bloqueados en plan Free.

Contador de OTs del mes
  Barra de progreso en header o sidebar del módulo.
  Texto: "18 / 20 OTs usadas este mes"
    normal (< 80%)    → slate
    advertencia (>80%)→ amber
    crítico (>95%)    → rojo

Modal Nueva OT
  Overlay con backdrop. Grid de 2 columnas para los campos.
  Selector de canal como primer paso antes del formulario.
  Footer fijo: Cancelar / Crear OT y enviar QR.

QR Modal
  Modal con QR grande + link copiable + botón "Enviar por WA".
  Disponible desde: header del detalle, listado (columna acciones),
  vista de garantía post-cierre.

Presupuesto inline
  Tabla de ítems editable dentro del panel detalle.
  Modo vista → badge de estado, total, botones PDF y WA.
  Modo edición → filas con inputs de cantidad y precio, botón agregar,
                 botón eliminar por fila.

Vista pública QR
  Página responsive sin login. Mobile-first.
  Estados posibles: seguimiento activo, aprobación pendiente, equipo listo,
  garantía digital.

────────────────────────────────────────────────────────────────────────────────
VI.3  VISTA LISTADO — COLUMNAS DE LA TABLA
────────────────────────────────────────────────────────────────────────────────

Columna         | Contenido
----------------|-------------------------------------------------------------
# Orden         | Número OT en monospace (ej: OT-2026-047). Subtext: fecha
                | de ingreso. Badge "Garantía" si aplica.
Cliente         | Nombre completo en bold. Subtext: canal de ingreso
                | (badge WA verde o ícono manual).
Equipo / Falla  | Modelo del dispositivo. Subtext: descripción de falla
                | truncada con ellipsis.
Estado          | Badge coloreado con ícono (ver componentes).
Prioridad       | Dot de color + label. Urgente tiene animación pulsante.
Tiempo          | Semáforo de días sin cambio de estado.
Técnico         | Avatar circular con iniciales coloreadas por técnico.
Acciones        | Ícono QR para abrir modal de QR rápido.

────────────────────────────────────────────────────────────────────────────────
VI.4  BOTÓN "AVANZAR ESTADO" — COMPORTAMIENTO
────────────────────────────────────────────────────────────────────────────────

El botón siempre muestra el nombre del próximo estado específico, no genérico:
  - "Pasar a En diagnóstico"
  - "Enviar presupuesto al cliente"
  - "Iniciar reparación"
  - "Marcar como listo para retirar"
  - "Confirmar entrega y cerrar OT"

Al hacer click abre mini-modal de confirmación con:
  - Resumen de la acción
  - Preview del mensaje WA que se enviará automáticamente (si aplica)
  - Botón Confirmar


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VII. MONETIZACIÓN — PLAN GATE DEL MÓDULO OT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El plan gate es visible. Las funciones bloqueadas no se ocultan: se muestran
con candado y tooltip con CTA de upgrade. El objetivo es que la limitación
se sienta, no que sea invisible.

TABLA DE FUNCIONALIDADES POR PLAN
----------------------------------

Funcionalidad                              | Free    | Pro     | Plan IA
-------------------------------------------|---------|---------|------------------
OTs por mes                                | 20      | 100     | Ilimitadas
Estados del ciclo                          | 1 y 7   | Todos   | Todos + config.
Notificaciones WA automáticas              | ✗       | ✓       | ✓
Generación de PDF presupuesto              | ✗       | ✓       | ✓
Timeline / historial de estados            | ✗       | ✓       | ✓
Semáforo de tiempo (SLA visual)            | ✗       | ✓       | ✓
Garantía digital (QR)                      | Básica  | Completa| Completa+extensión
Recordatorio WA pre-vencimiento garantía   | ✗       | ✗       | ✓
Encuesta satisfacción 48 hs               | ✗       | ✓       | ✓
Bot FAQ por WA                             | ✗       | ✓       | ✓
Bot Agente IA                              | ✗       | ✗       | ✓
Estados configurables por tenant           | ✗       | ✗       | ✓
Log de mensajes WA enviados               | ✗       | ✓       | ✓
Pack OTs adicionales (prepago)             | ✓       | ✓       | —
Branding en link de seguimiento            | ✗       | ✗       | ✓ dominio propio

IMPLEMENTACIÓN DEL PLAN GATE EN UI
------------------------------------
- Columnas bloqueadas en tabla: ícono candado en header. Hover muestra
  "Disponible en plan Pro".
- Botones de acción bloqueados: gris con candado. No clickeables.
- Pipeline en plan Free: estados 2 al 6 se muestran con dot gris y candado.
  No bloquean la visualización pero sí las acciones.
- Contador de OTs: al superar el 80% del límite, cambia a amber. Al intentar
  crear la OT #21 en Free aparece modal de bloqueo con dos opciones:
    1. Upgrade a Pro
    2. Comprar pack de 20 OTs adicionales por $X (sin cambiar de plan)

LEVERS DE MONETIZACIÓN
------------------------
- Límite mensual de OTs: gate sencillo de implementar y efectivo. Cuando
  el negocio crece, el upgrade se vuelve natural.
- Pack de OTs prepago: baja la fricción del upgrade inicial. Genera ingreso
  puntual sin comprometer al tenant.
- Garantía Pro: el certificado digital con branding es un feature que el
  dueño del local quiere mostrarle a sus clientes. Alto valor percibido.
- Garantía Plan IA con recordatorio WA: genera contacto post-venta sin
  esfuerzo del tenant. Diferencial que ningún competidor ofrece hoy.
- Encuesta de satisfacción: disponible en Pro+. Valor percibido alto para
  diferenciarse como negocio.
- Branding en link de seguimiento: en Plan IA, el link puede ser
  seguimiento.tulocal.com.ar en lugar del dominio G360iA. White-label parcial.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIII. INTEGRACIÓN CON MÓDULOS EXTERNOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El módulo OT es consumidor de datos de otros módulos. No gestiona stock,
agenda, clientes ni facturación. Solo los referencia mediante FK o eventos.

Módulo       | Prefijo | Relación                                  | Tipo
-------------|---------|-------------------------------------------|----------------
Clientes     | cli_    | id_cliente en ot_ordenes. Al crear OT,    | FK + query
             |         | muestra historial y garantías vigentes.   |
Stock        | stk_    | id_insumo en ot_detalles_presupuesto.     | FK directa
             |         | La OT consume, no administra.             |
Facturación  | vta_    | Al cerrar OT emite evento. vta_ factura.  | Evento interno
Agenda       | agn_    | fecha_entrega_estimada es referencia.     | Campo ref.
             |         | La OT no gestiona agenda.                 |
Usuarios     | users   | id_usuario_tecnico en ot_ordenes.         | FK directa


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IX. PENDIENTES Y DECISIONES ABIERTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Definir límite exacto de OTs por plan.
  Propuesta: Free=20 / Pro=100 / Plan IA=ilimitado.

- Definir precio del pack de OTs adicionales para plan Free.

- Confirmar días de anticipación para recordatorio WA de garantía.
  Propuesta: 7 días.

- Definir días de garantía por defecto configurable por tenant.
  Propuesta: 90 días.

- Diseño de la vista pública /seguimiento/:token
  (mobile-first, fuera del sistema de diseño del panel).

- Diseño de la vista /encuesta/:token.

- Plantillas WA: confirmar textos finales y variables disponibles.

- Estados configurables (Plan IA): definir si el tenant puede agregar estados
  nuevos o solo renombrar los existentes.

- Definir si la exportación de OTs (Excel/PDF) es Free o Pro.


================================================================================
G360iA — Gestión 360 iA  ·  Documento confidencial  ·  Abril 2026
================================================================================
