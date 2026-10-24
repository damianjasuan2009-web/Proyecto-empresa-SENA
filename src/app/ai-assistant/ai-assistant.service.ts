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

const GEMINI_MODEL = 'gemini-2.5-flash';

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
            generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
          })
        }
      );
    } catch {
      return this.buildOfflineReply(message, 'No pude contactar a Gemini, pero aquí tienes una guía práctica desde el app.');
    }

    let result: GeminiResponse;
    try {
      result = await response.json() as GeminiResponse;
    } catch {
      if (!response.ok) {
        return this.buildOfflineReply(message, `Gemini respondió con un problema temporal (HTTP ${response.status}). Te dejo una respuesta práctica mientras se reanuda el servicio.`);
      }
      throw new AssistantRequestError(
        'response',
        'Gemini respondió en un formato inesperado. Inténtalo de nuevo.'
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
        return this.buildOfflineReply(message, 'La clave de Gemini no está disponible o no es válida en este momento. Usaré una respuesta local para seguir ayudándote.');
      }
      if (response.status === 429) {
        return this.buildOfflineReply(message, 'El asistente está ocupado por ahora. Mientras tanto, te dejo una respuesta rápida basada en la app.');
      }
      if (response.status === 404) {
        return this.buildOfflineReply(message, 'Gemini no encontró el modelo solicitado. Te doy una respuesta práctica con la guía de TeAcompaño.');
      }
      if (response.status >= 500) {
        return this.buildOfflineReply(message, 'Gemini tiene un problema temporal. Aquí va una respuesta útil mientras se reanuda.');
      }

      const detail = this.safeProviderMessage(providerMessage, apiKey);
      if (detail) {
        return this.buildOfflineReply(message, `Gemini rechazó la solicitud: ${detail}. Te dejo una respuesta local para seguir.`);
      }

      return this.buildOfflineReply(message, 'La respuesta del asistente no pudo completarse. Te dejo una guía de apoyo local.');
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim();
    if (!answer) {
      const blockReason = result.promptFeedback?.blockReason;
      const finishReason = result.candidates?.[0]?.finishReason;
      if (blockReason) {
        return this.buildOfflineReply(message, `Gemini bloqueó esta solicitud (${blockReason}). Te muestro una opción segura para seguir.`);
      }
      if (finishReason === 'MAX_TOKENS') {
        return this.buildOfflineReply(message, 'La respuesta fue demasiado larga. Te doy una versión breve y clara para continuar.');
      }
      if (finishReason === 'SAFETY') {
        return this.buildOfflineReply(message, 'Gemini no pudo responder esa pregunta por seguridad. Te ofrezco una respuesta segura y simple.');
      }
      return this.buildOfflineReply(message, 'Gemini respondió sin contenido útil. Aquí va una guía práctica para ayudarte.');
    }

    return answer;
  }

  private buildOfflineReply(message: string, intro = 'Puedo ayudarte con esto desde la guía de TeAcompaño:'): string {
    const normalized = message.toLowerCase();

    if (normalized.includes('contraseña') || normalized.includes('clave') || normalized.includes('login')) {
      return `${intro} Lo más seguro es revisar el correo o la contraseña con calma, no compartirla por mensaje y usar la opción de ayuda si no recuerdas los datos. Si te equivocas, puedes pedir ayuda desde la pantalla de inicio.`;
    }

    if (normalized.includes('llamar') || normalized.includes('mensaje') || normalized.includes('contacto') || normalized.includes('familia')) {
      return `${intro} En TeAcompaño puedes ir a Inicio y elegir “Llamar a un familiar” o “Enviar un mensaje”, o entrar a la sección de Contactos para guardar a personas de confianza y contactar con ellas con calma.`;
    }

    if (normalized.includes('foto') || normalized.includes('cámara') || normalized.includes('imagen')) {
      return `${intro} Desde la pantalla de inicio hay una opción para tomar una foto o elegir una imagen. Luego puedes revisarla y compartirla si lo necesitas.`;
    }

    if (normalized.includes('tutorial') || normalized.includes('aprender') || normalized.includes('guía') || normalized.includes('como')) {
      return `${intro} Puedes entrar a Aprendizaje o Tutoriales para seguir guías paso a paso. Cada paso se explica con claridad y puedes escuchar la instrucción en voz alta.`;
    }

    if (normalized.includes('ayuda') || normalized.includes('emergencia') || normalized.includes('urgente')) {
      return `${intro} Si necesitas ayuda urgente, entra a la sección de Ayuda, revisa tus contactos de confianza y usa la opción de pedir apoyo. También puedes buscar ayuda en la pantalla de inicio.`;
    }

    return `${intro} En TeAcompaño puedes navegar desde Inicio, Aprendizaje, Tutoriales, Verificación, Ayuda y Perfil. Si quieres, te puedo orientar paso a paso para algo concreto como llamar, enviar mensajes, usar la cámara o seguir una guía.`;
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
      .map(tutorial => `- ${tutorial.title}: ${tutorial.description}`)
      .join('\n');

    return `Eres el asistente de TeAcompaño, una aplicación para aprender a usar el teléfono y recibir ayuda digital.

Responde en español claro, amable y breve. Prioriza las preguntas sobre cómo usar TeAcompaño y explica los pasos de forma sencilla, numerada y de uno en uno. Basa las instrucciones de la aplicación en esta guía; no inventes botones ni funciones. Si no sabes algo o la función no existe, dilo con claridad.

Guía real de TeAcompaño:
- Inicio: muestra el avance de tutoriales, accesos rápidos para llamar o enviar un SMS a un contacto, elegir/tomar una foto, compartirla y abrir tutoriales o el asistente.
- Navegación: Inicio, Ayuda, Asistente y Perfil están en la barra inferior. El menú también ofrece Aprendizaje, Tutoriales, Verificación, Ayuda, Asistente IA y Configuración.
- Aprendizaje: presenta rutas por tema y un botón “Ver guías”. Las rutas disponibles son:
${learningPaths}
- Tutoriales: abre “Comenzar” para seguir una guía paso a paso; “Siguiente paso” avanza, “Anterior” vuelve, “Escuchar este paso” lee en voz alta y “Terminar guía” guarda el avance. Se puede volver a iniciar una guía completada para repasarla.
Guías disponibles:
${tutorials}
- Verificación: permite practicar con preguntas cortas. La aplicación marca como completada una respuesta correcta.
- Contactos y Ayuda: en Contactos se pueden agregar o quitar personas de confianza. Los datos se guardan solo en este dispositivo. Desde Inicio o Ayuda se puede abrir la lista para llamar, enviar SMS, abrir WhatsApp o preparar un mensaje de ayuda. La aplicación abre la función correspondiente; no realiza la llamada ni envía el mensaje por sí misma.
- Configuración/Perfil: permite activar modo oscuro, alto contraste y vista compacta; elegir tamaño de fuente; y cambiar las preferencias de correo y reportes semanales. Los cambios se guardan automáticamente.
- Asistente IA: responde preguntas, pero no puede navegar la app, cambiar ajustes, ver contactos ni ejecutar acciones por el usuario. Para cambiar algo, guía al usuario a la sección correspondiente.

Privacidad y seguridad: nunca solicites contraseñas, códigos de verificación, datos bancarios ni información privada. No afirmes que ves datos del usuario. Para emergencias, recomienda contactar a una persona de confianza o a los servicios de emergencia locales.`;
  }
}
