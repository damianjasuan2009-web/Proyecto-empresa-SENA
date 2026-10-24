import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LearningContentService } from '../services/learning-content.service';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export interface AssistantMessage {
  role: 'user' | 'model';
  text: string;
}

export type AssistantErrorKind = 'connection' | 'configuration' | 'limit' | 'service' | 'response';

const GEMINI_MODEL = 'gemini-2.0-flash';

export class AssistantRequestError extends Error {
  constructor(readonly kind: AssistantErrorKind, message: string) {
    super(message);
    this.name = 'AssistantRequestError';
  }
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly learningContent = inject(LearningContentService);

  async sendMessage(history: AssistantMessage[], message: string): Promise<string> {
    const apiKey = environment.geminiApiKey?.trim();
    if (!apiKey) {
      return this.buildOfflineReply(message);
    }

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: this.buildSystemInstruction() }]
            },
            contents: [
              ...history.map(item => ({ role: item.role, parts: [{ text: item.text }] })),
              { role: 'user', parts: [{ text: message }] }
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
          })
        }
      );
    } catch {
      return this.buildOfflineReply(message, 'No pude conectarme ahora, pero aquí te ayudo con lo que sé:');
    }

    let result: GeminiResponse;
    try {
      result = await response.json() as GeminiResponse;
    } catch {
      if (!response.ok) {
        return this.buildOfflineReply(message, `Hubo un problema temporal (HTTP ${response.status}). Te respondo con lo que tengo:`);
      }
      throw new AssistantRequestError(
        'response',
        'La respuesta llegó en un formato que no puedo leer. Por favor inténtalo de nuevo.'
      );
    }

    if (!response.ok) {
      const providerMessage = result.error?.message ?? '';
      const providerMessageLower = providerMessage.toLowerCase();

      if (
        response.status === 401 ||
        response.status === 403 ||
        providerMessageLower.includes('api_key_invalid') ||
        providerMessageLower.includes('api key not valid') ||
        providerMessageLower.includes('api key is invalid')
      ) {
        return this.buildOfflineReply(message, 'El asistente no está configurado en este momento. Te respondo con lo que tengo guardado:');
      }
      if (response.status === 429) {
        return this.buildOfflineReply(message, 'El asistente está muy ocupado en este momento. Te dejo una respuesta de todas formas:');
      }
      if (response.status === 404) {
        return this.buildOfflineReply(message, 'No encontré el servicio de IA. Te doy una respuesta directa:');
      }
      if (response.status >= 500) {
        return this.buildOfflineReply(message, 'El servicio tiene un problema temporal. Mientras tanto, te ayudo así:');
      }

      const detail = this.safeProviderMessage(providerMessage, apiKey);
      if (detail) {
        return this.buildOfflineReply(message, `Hubo un inconveniente técnico. Te respondo con lo que tengo:`);
      }

      return this.buildOfflineReply(message, 'No pude completar la respuesta. Te dejo una guía de todas formas:');
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim();

    if (!answer) {
      const blockReason = result.promptFeedback?.blockReason;
      const finishReason = result.candidates?.[0]?.finishReason;
      if (blockReason) {
        return this.buildOfflineReply(message, 'No pude responder esa pregunta, pero te dejo algo útil:');
      }
      if (finishReason === 'MAX_TOKENS') {
        return this.buildOfflineReply(message, 'La respuesta era muy larga. Te doy una versión corta y clara:');
      }
      if (finishReason === 'SAFETY') {
        return this.buildOfflineReply(message, 'No pude responder esa pregunta. Te ofrezco una alternativa segura:');
      }
      return this.buildOfflineReply(message, 'No recibí una respuesta útil. Te ayudo con lo que tengo:');
    }

    return answer;
  }

  // Respuestas de respaldo cuando no hay conexión con Gemini.
  // Cubren los temas principales de la app con pasos numerados y lenguaje muy simple.
  private buildOfflineReply(message: string, intro = 'Aquí te explico paso a paso:'): string {
    const n = message.toLowerCase();

    // WhatsApp — enviar mensaje
    if ((n.includes('whatsapp') || n.includes('wha')) && (n.includes('mensaje') || n.includes('escrib') || n.includes('enviar') || n.includes('mandar'))) {
      return `${intro}\n\n📱 Cómo enviar un mensaje por WhatsApp:\n1. Busca el ícono verde con un teléfono en tu pantalla y tócalo.\n2. Toca el nombre de la persona a quien quieres escribir.\n3. Toca el espacio largo de abajo (dice "Mensaje").\n4. Escribe tu mensaje con calma.\n5. Cuando termines, toca la flecha verde para enviarlo.\n\n¿Pudiste hacerlo?`;
    }

    // WhatsApp — videollamada
    if (n.includes('videollamada') || n.includes('video llamada') || (n.includes('llamada') && n.includes('video')) || (n.includes('whatsapp') && n.includes('llam'))) {
      return `${intro}\n\n📹 Cómo hacer una videollamada por WhatsApp:\n1. Abre WhatsApp y toca el nombre de la persona.\n2. Mira arriba a la derecha: hay un ícono de cámara. Tócalo.\n3. Espera a que la otra persona conteste.\n4. Para terminar la llamada, toca el botón rojo.\n\n¡Es igual que una llamada normal, pero se ven las caras!`;
    }

    // Llamar por teléfono
    if (n.includes('llamar') || n.includes('llamada') || (n.includes('hablar') && n.includes('telef'))) {
      return `${intro}\n\n📞 Cómo llamar a alguien desde TeAcompaño:\n1. Ve a la pantalla de Inicio.\n2. Toca el botón "Llamar a un familiar".\n3. Verás una lista con tus personas de confianza.\n4. Toca el nombre de quien quieres llamar.\n5. Tu teléfono hará la llamada solo.\n\nSi no aparece la persona, primero agrégala en la sección "Contactos".`;
    }

    // Enviar mensaje de texto / SMS
    if (n.includes('mensaje') || n.includes('sms') || n.includes('texto') || n.includes('escribir')) {
      return `${intro}\n\n✉️ Cómo enviar un mensaje de texto desde TeAcompaño:\n1. Ve a la pantalla de Inicio.\n2. Toca "Enviar un mensaje".\n3. Elige a la persona de tu lista de confianza.\n4. Tu teléfono abrirá el mensaje listo para que escribas.\n5. Escribe lo que quieres decir y toca "Enviar".\n\n¿Necesitas ayuda con algún paso?`;
    }

    // Foto / cámara
    if (n.includes('foto') || n.includes('fotograf') || n.includes('cámara') || n.includes('camara') || n.includes('imagen') || n.includes('tomar')) {
      return `${intro}\n\n📷 Cómo tomar o compartir una foto desde TeAcompaño:\n1. En la pantalla de Inicio, toca el ícono de cámara.\n2. Tu teléfono abrirá la cámara.\n3. Apunta al lugar o persona y toca el botón grande del círculo.\n4. Si quieres compartirla, toca "Compartir" y elige a quién enviársela.\n\n¡No hay prisa, tómate todo el tiempo que necesites!`;
    }

    // Contraseña / seguridad / estafa / engaño
    if (n.includes('contraseña') || n.includes('clave') || n.includes('seguridad') || n.includes('estafa') || n.includes('fraude') || n.includes('sospechoso') || n.includes('engaño') || n.includes('robo')) {
      return `${intro}\n\n🔒 Reglas para estar seguro en internet:\n1. Nadie serio te pedirá tu contraseña o clave por mensaje.\n2. Tu banco NUNCA te pedirá datos por WhatsApp o SMS.\n3. Si recibes un mensaje extraño o que te da miedo, NO lo abras.\n4. Muéstraselo a un familiar de confianza antes de hacer algo.\n5. Si dudas, llama a tu banco por el número que tienes escrito en tu tarjeta.\n\nDesconfiar no es malo, ¡es ser listo!`;
    }

    // Tutorial / guía / aprender / cómo
    if (n.includes('tutorial') || n.includes('aprender') || n.includes('guía') || n.includes('guia') || n.includes('cómo') || n.includes('como') || n.includes('enseñar') || n.includes('paso')) {
      return `${intro}\n\n📖 Cómo seguir una guía en TeAcompaño:\n1. Toca "Tutoriales" en el menú de la app.\n2. Elige el tema que quieres aprender.\n3. Toca el botón "Comenzar".\n4. Lee cada paso sin apuro. Puedes tocar "Escuchar este paso" para escucharlo en voz alta.\n5. Toca "Siguiente paso" cuando estés listo.\n6. Al terminar, la app guarda tu progreso.\n\nPuedes repetir una guía todas las veces que quieras.`;
    }

    // Correo electrónico / email
    if (n.includes('correo') || n.includes('email') || n.includes('mail') || n.includes('adjuntar')) {
      return `${intro}\n\n📧 Cómo enviar un correo con una foto:\n1. Abre tu aplicación de correo (se llama Gmail, Outlook o similar).\n2. Toca el botón para escribir uno nuevo (tiene un lápiz o dice "Redactar").\n3. Escribe el correo de la persona a quien se lo envías.\n4. Escribe un título corto en el campo "Asunto".\n5. Toca el ícono del clip (📎) para adjuntar una foto.\n6. Elige la foto y toca "Enviar".\n\n¿Hay algún paso que no entiendas?`;
    }

    // Banco / dinero / transferencia / pago
    if (n.includes('banco') || n.includes('dinero') || n.includes('transferencia') || n.includes('pagar') || n.includes('pago') || n.includes('plata') || n.includes('cuenta')) {
      return `${intro}\n\n🏦 Cómo usar el banco digital con seguridad:\n1. Entra a la app de tu banco solo tocando el ícono que ya conoces.\n2. Para ver tus movimientos, busca "Movimientos" o "Estado de cuenta".\n3. Para pagar un servicio, busca la opción "Pagos" o "Servicios".\n4. Revisa bien el nombre y el monto antes de confirmar.\n5. Si algo te parece raro, cierra la app y llama al banco.\n\nNunca hagas transferencias si alguien te presiona por mensaje o teléfono.`;
    }

    // Ajustes / letra / pantalla / ver mejor / accesibilidad
    if (n.includes('letra') || n.includes('pantalla') || n.includes('brillo') || n.includes('volumen') || n.includes('ajuste') || n.includes('accesibilidad') || n.includes('ver mejor') || n.includes('tamaño') || n.includes('tamano') || n.includes('oscuro') || n.includes('fuente')) {
      return `${intro}\n\n⚙️ Cómo ver la pantalla más cómodo:\n\nDesde TeAcompaño:\n1. Toca "Perfil" en el menú de abajo.\n2. Busca las opciones de "Texto grande", "Alto contraste" o "Modo oscuro".\n3. Actívalas tocando el botón de cada una.\n\nDesde tu teléfono:\n1. Abre "Ajustes" o "Configuración" (ícono de engranaje ⚙️).\n2. Busca "Pantalla" o "Accesibilidad".\n3. Toca "Tamaño de texto" y mueve el control hacia la derecha para agrandar las letras.`;
    }

    // Recordatorio / cita / calendario / alarma
    if (n.includes('recordatorio') || n.includes('cita') || n.includes('calendario') || n.includes('alarma') || n.includes('agenda') || n.includes('cita medic') || n.includes('medico')) {
      return `${intro}\n\n🗓️ Cómo crear un recordatorio:\n1. Busca la app de "Calendario" o "Recordatorios" en tu teléfono.\n2. Toca el botón para agregar uno nuevo (suele ser un + o dice "Nuevo").\n3. Escribe un nombre fácil de recordar (ejemplo: "Cita médica martes 10am").\n4. Elige el día y la hora.\n5. Toca "Guardar" o "Listo".\n6. Tu teléfono te avisará cuando llegue el momento.\n\n¿Necesitas encontrar la app de Calendario?`;
    }

    // Contactos — agregar / quitar
    if (n.includes('contacto') || n.includes('agregar') || n.includes('guardar') || n.includes('familiar') || n.includes('familia')) {
      return `${intro}\n\n👥 Cómo agregar un contacto de confianza en TeAcompaño:\n1. Toca "Ayuda" en el menú de abajo.\n2. Busca la opción "Contactos de confianza" o "Mis contactos".\n3. Toca el botón para agregar uno nuevo.\n4. Escribe el nombre y el número de teléfono.\n5. Guarda los cambios.\n\nEsos contactos te aparecerán cuando quieras llamar o pedir ayuda rápido.`;
    }

    // Verificación / práctica / preguntas
    if (n.includes('verificaci') || n.includes('práctica') || n.includes('practica') || n.includes('pregunta') || n.includes('ejercicio') || n.includes('quiz')) {
      return `${intro}\n\n✅ Cómo practicar lo que aprendiste:\n1. Toca "Verificación" en el menú de la app.\n2. Verás una pregunta sencilla sobre lo que aprendiste.\n3. Elige la respuesta que te parece correcta.\n4. La app te dirá si acertaste.\n5. ¡No hay nota, es solo para practicar y ganar confianza!\n\nPuedes repetirlo cuantas veces quieras.`;
    }

    // Ayuda / emergencia / urgente / no puedo
    if (n.includes('ayuda') || n.includes('emergencia') || n.includes('urgente') || n.includes('problema') || n.includes('no puedo') || n.includes('no sé') || n.includes('no se') || n.includes('perdi') || n.includes('perdí')) {
      return `${intro}\n\n🆘 Si necesitas ayuda ahora mismo:\n1. Toca "Ayuda" en el menú de abajo de TeAcompaño.\n2. Verás tu lista de personas de confianza.\n3. Toca el nombre de quien quieres contactar.\n4. Puedes llamarle o enviarle un mensaje desde ahí.\n\nRecuerda: pedir ayuda es lo más inteligente que puedes hacer. No estás solo. ¿Qué necesitas?`;
    }

    // Respuesta general
    return `${intro}\n\nPuedo ayudarte con muchas cosas en TeAcompaño. Por ejemplo:\n\n📱 Enviar mensajes o hacer videollamadas por WhatsApp\n📞 Llamar a tus familiares con un solo toque\n🔒 Reconocer mensajes peligrosos y cuidarte de estafas\n📖 Seguir guías paso a paso para aprender sin prisa\n⚙️ Ajustar el teléfono para que sea más cómodo\n🆘 Pedir ayuda a tus personas de confianza\n\nCuéntame con más detalle qué necesitas y te explico paso a paso. ¿Qué te gustaría hacer?`;
  }

  private safeProviderMessage(message: string, apiKey: string): string {
    return message
      .split(apiKey).join('[clave oculta]')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);
  }

  private buildSystemInstruction(): string {
    const learningPaths = this.learningContent.learningPaths
      .map(path => `- ${path.title}: ${path.description} Temas: ${path.topics.join(', ')}.`)
      .join('\n');

    const tutorials = this.learningContent.tutorials
      .map(t => `- "${t.title}" (${t.duration}, nivel ${t.level}): ${t.description} Pasos: ${t.steps.map((s, i) => `${i + 1}) ${s}`).join(' ')}`)
      .join('\n');

    const verifications = this.learningContent.verificationTasks
      .map(v => `- ${v.title}: ${v.question}`)
      .join('\n');

    return `Eres el asistente de TeAcompaño, una aplicación diseñada para enseñar a personas mayores o con pocos conocimientos tecnológicos a usar el teléfono celular de forma segura y sencilla.

═══════════════════════════════════════════
CÓMO DEBES HABLAR (muy importante)
═══════════════════════════════════════════
- Usa palabras simples y cotidianas. Evita términos técnicos.
- Si debes usar una palabra técnica, explícala enseguida entre paréntesis.
  Ejemplo: "el ícono (la imagen pequeña en la pantalla)"
- Responde siempre en pasos numerados cuando expliques algo.
  Ejemplo: "1. Toca el ícono verde. 2. Busca el nombre..."
- Da UN solo paso a la vez si la persona parece confundida.
- Usa emojis como señales visuales: 📱 teléfono, 🔒 seguridad, 📷 foto, etc.
- Termina las respuestas con una pregunta amable como "¿Pudiste hacerlo?" o "¿Necesitas ayuda con algún paso?"
- Sé paciente y alentador. Frases como "¡Muy bien!", "No hay prisa" o "Es más fácil de lo que parece" ayudan mucho.
- Si la persona se equivoca o no entiende, dilo con amabilidad. Nunca la hagas sentir mal.
- Respuestas cortas: máximo 5-6 pasos por respuesta. Si el tema es largo, divide en partes.

═══════════════════════════════════════════
QUÉ PUEDES Y QUÉ NO PUEDES HACER
═══════════════════════════════════════════
- SÍ puedes: explicar cómo usar la app, guiar paso a paso, responder dudas sobre el teléfono.
- NO puedes: navegar la app por el usuario, cambiar ajustes, ver sus contactos ni ejecutar acciones.
- Si te piden hacer algo que no puedes, explícale amablemente cómo hacerlo él mismo.

═══════════════════════════════════════════
GUÍA COMPLETA DE TEACOMPAÑO
═══════════════════════════════════════════

PANTALLA DE INICIO:
- Muestra el avance en tutoriales (cuántos completó).
- Botones rápidos: "Llamar a un familiar", "Enviar un mensaje", tomar o elegir una foto, compartirla.
- Accesos directos a Tutoriales y al Asistente IA.

MENÚ DE NAVEGACIÓN (barra de abajo):
- Inicio, Ayuda, Asistente IA y Perfil están siempre visibles abajo.
- El menú completo incluye: Aprendizaje, Tutoriales, Verificación, Ayuda, Asistente IA y Configuración.

APRENDIZAJE:
- Muestra rutas de aprendizaje por tema. Cada ruta tiene un botón "Ver guías".
- Rutas disponibles:
${learningPaths}

TUTORIALES (guías paso a paso):
- El usuario toca "Comenzar" para iniciar una guía.
- Botones: "Siguiente paso" avanza, "Anterior" vuelve, "Escuchar este paso" lee en voz alta, "Terminar guía" guarda el progreso.
- Se puede repetir una guía completada para repasar.
- Guías disponibles:
${tutorials}

VERIFICACIÓN (práctica):
- Presenta preguntas de opción múltiple para repasar lo aprendido.
- La app confirma si la respuesta es correcta. No hay penalización por errores.
- Preguntas disponibles:
${verifications}

CONTACTOS Y AYUDA:
- En "Contactos" se agregan o quitan personas de confianza (nombre y teléfono).
- Los datos se guardan SOLO en el dispositivo del usuario, no en internet.
- Desde Inicio o Ayuda se puede llamar, enviar SMS, abrir WhatsApp o preparar un mensaje de ayuda.
- La app abre la función del teléfono; NO realiza la llamada ni envía el mensaje por sí misma.

PERFIL Y CONFIGURACIÓN:
- Modo oscuro: cambia el fondo a colores oscuros para descansar los ojos.
- Alto contraste: hace las letras más fáciles de leer.
- Vista compacta: muestra más información en pantalla.
- Tamaño de fuente: hace las letras más grandes o más pequeñas.
- Reportes semanales: resumen del progreso por correo (opcional).
- Todos los cambios se guardan automáticamente.

═══════════════════════════════════════════
SEGURIDAD — REGLAS QUE SIEMPRE DEBES REFORZAR
═══════════════════════════════════════════
- Nunca pidas contraseñas, claves, códigos ni datos bancarios al usuario.
- Recuerda siempre: los bancos y empresas serias NUNCA piden claves por mensaje.
- Si el usuario menciona una posible estafa, valida su preocupación y guíalo a llamar al banco o familiar por un número conocido.
- Para emergencias reales, recomienda llamar a servicios de emergencia o a un familiar de confianza.
- No afirmes que ves los datos, contactos o información personal del usuario.`;
  }
}
