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
    const apiKey = environment.geminiApiKey;
    if (!apiKey) {
      throw new AssistantRequestError('configuration', 'El asistente no está configurado. Revisa la clave de Gemini.');
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
      throw new AssistantRequestError(
        'connection',
        'No pudimos obtener una respuesta. Revisa tu conexión e inténtalo de nuevo.'
      );
    }

    let result: GeminiResponse;
    try {
      result = await response.json() as GeminiResponse;
    } catch {
      if (!response.ok) {
        throw new AssistantRequestError(
          'service',
          `Gemini devolvió el error HTTP ${response.status}, pero no se pudo leer su detalle.`
        );
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
        throw new AssistantRequestError('configuration', 'La clave de Gemini no es válida o no tiene permiso para usar el asistente.');
      }
      if (response.status === 429) {
        throw new AssistantRequestError('limit', 'El asistente está recibiendo muchas solicitudes. Espera un momento e inténtalo de nuevo.');
      }
      if (response.status === 404) {
        const detail = this.safeProviderMessage(providerMessage, apiKey);
        throw new AssistantRequestError(
          'configuration',
          detail
            ? `Gemini no encontró el modelo o recurso solicitado (HTTP 404): ${detail}`
            : `Gemini no encontró el modelo o recurso solicitado (HTTP 404). El modelo configurado es ${GEMINI_MODEL}; revisa también que la clave pertenezca a un proyecto con Gemini API habilitada.`
        );
      }
      if (response.status >= 500) {
        throw new AssistantRequestError('service', `Gemini tiene un problema temporal (HTTP ${response.status}). Inténtalo de nuevo más tarde.`);
      }

      const detail = this.safeProviderMessage(providerMessage, apiKey);
      throw new AssistantRequestError(
        'service',
        detail
          ? `Gemini rechazó la solicitud (HTTP ${response.status}): ${detail}`
          : `Gemini rechazó la solicitud (HTTP ${response.status}). Revisa la configuración de la API.`
      );
    }

    const answer = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim();
    if (!answer) {
      const blockReason = result.promptFeedback?.blockReason;
      const finishReason = result.candidates?.[0]?.finishReason;
      if (blockReason) {
        throw new AssistantRequestError('response', `Gemini bloqueó esta solicitud (${blockReason}). Prueba con otra pregunta.`);
      }
      if (finishReason === 'MAX_TOKENS') {
        throw new AssistantRequestError('response', 'La respuesta fue demasiado larga y quedó incompleta. Prueba con una pregunta más concreta.');
      }
      if (finishReason === 'SAFETY') {
        throw new AssistantRequestError('response', 'Gemini no pudo responder esta pregunta por sus reglas de seguridad. Prueba con otra formulación.');
      }
      throw new AssistantRequestError(
        'response',
        `Gemini respondió sin texto${finishReason ? ` (motivo: ${finishReason})` : ''}. Inténtalo con otra pregunta.`
      );
    }

    return answer;
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
