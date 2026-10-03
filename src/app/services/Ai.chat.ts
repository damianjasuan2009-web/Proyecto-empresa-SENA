import { Injectable } from '@angular/core';
import { httpClient } from '@anfular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { chatMessage } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'Root'
})
export class AiChatService {
     private readonly  GEMINI_URL = 'https:generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generatecontent'

private conversationHistory: chatMessage [] = [];

private readonly systemprompt = `eres "Teira", el asistente de la app  una aplicacion de ayuda hacia personas inexpertas con la tecnología
Tu personalidad:
-Vas a ser amigable
-No utilizaras lenguaje muy complejo
-No daras demasiada informacion a menos que se te pida
-No daras opiniones politicas

Tu conocimiento especializado sera:
-funciones simples de diferentes sistemas operativos

Funciones conocidas de la app:
-Utilizar otras aplicaciones para poder iniciar algunos procesos simples

Reglas importantes:
-No haras comentarios ofensivos hacia etnias u otras cosas`;

constructor (private http: httpClient) {}

/**
 * Envia un mensaje al asistente de la IA y retorna la respuesta
 */

sendMessage (userMessage: string) : Observable<chatMessage>
{

const apiKey = environment.geminiapikey;

if (!apiKey || apiKey === 'src/environments/environment.ts'){
    return this.getOfflineResponse(userMessage);
}
//agregar el mensaje del usuario al historial

const userMsg: chatMessage= {
    id: 'msg_' + Date.now(),
    role: 'user', 
    content: userMessage
    timestap: new Date ()
};
this.conversationHistory.push(userMsg);

// Construir el cuerpo de la peticion para Gemini
const body = this .buildGeminiRequest(userMessage);

return this.http.post.<any>(`${this.GEMINI_URL}?key=${apiKey}`, body).pipe(
    map (response => {
        const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Lo siento, no pude generar una respuesta. Intentalo de nuevo (pero bien)';

        const assistantMsg : chatMessage = {
            id:'msg_' + Date.now(),
            role:'assistant',
            content: text,
            timestap: new Date()
        };
        this.conversationHistory.push(assistantMsg);
        return assistantMsg;
    }),
    catchError(error =>{
        console.error('error al contactar Gemini API:', error);
    })
);
}

/**
 * construye el request body para la API de Gemini
 */
private buildGeminiRequest(userMessage: string): any{
    //construir historial de conversacion para contexto
    const  contents: any[] = [];
    // agregar system instruction
    const systemInstruction = {
        parts:[{text: this.systemprompt}]
    };

    // si no hay historial agregar al menos el mensaje actual
    if (contents.length === 0) {
        contents.push({
            role: 'user',
            parts:[{text: userMessage}]
        });
    }

    return{
        systemInstruction: systemInstruction,
        contents,
        generationConfig:{
            temperature: 0,7,
            topP: 0.95,
            topK:40,
            maxOutputTokens:1024
        }
    };
}

/**
 * Respuestas offline cuando no hay API o no hay conexion
 */
private getOfflineResponse(userMessage: stirng): Observable<chatMessage> {
    const query = userMessage.toLowerCase();
    let response: string;

   if (query.includes('hola') || query.includes('buen') || query.includes('inicio') || query.includes('ayuda')) {
    response = '👋 ¡Hola! Soy TechBot, tu asistente personal. Te ayudaré a aprender a usar tu teléfono, WhatsApp y redes sociales de forma fácil y segura. ¿Qué te gustaría aprender hoy?';
  } else if (query.includes('whatsapp') || query.includes('mensaje') || query.includes('foto') || query.includes('facebook')) {
    response = '📱 Para enviar un mensaje en WhatsApp:\n1• Abre la aplicación.\n2• Toca el nombre de la persona a quien deseas escribir.\n3• Presiona en el cuadro de texto abajo, escribe tu mensaje y toca el botón verde con la flecha.';
  } else if (query.includes('segur') || query.includes('estafa') || query.includes('clave') || query.includes('contraseña') || query.includes('banco')) {
    response = '🛡️ Consejos importantes de seguridad:\n• Nunca compartas tus contraseñas ni claves de banco.\n• Si recibes un mensaje pidiendo dinero urgente, llama primero a tu familiar para verificar.\n• No abras enlaces ni links desconocidos.';
  } else if (query.includes('letra') || query.includes('grande') || query.includes('volumen') || query.includes('pantalla') || query.includes('brillo')) {
    response = '🔍 Para agrandar la letra en tu teléfono:\n1• Ve a la aplicación "Ajustes" o "Configuración" (ícono de engranaje).\n2• Selecciona la opción "Pantalla".\n3• Busca "Tamaño de fuente" y deslízalo hacia la derecha.';
  } else if (query.includes('llamar') || query.includes('contacto') || query.includes('guardar') || query.includes('numero') || query.includes('agendar')) {
    response = '📞 Para guardar un nuevo contacto:\n1• Abre la app "Teléfono".\n2• Marca el número de la persona.\n3• Toca en "Añadir a contactos" o el botón "+", escribe su nombre y guarda.';
  } else {
    response = '💡 ¡Gracias por tu mensaje! Soy TechBot y puedo ayudarte con:\n• 📱 Cómo usar WhatsApp o Facebook\n• 🛡️ Consejos de seguridad digital\n• 🔍 Cambiar el tamaño de la letra o el volumen';
  }

  // Agregar al historial
  const userMsg: ChatMessage = {
    id: 'msg_' + Date.now(),
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  };
  this.conversationHistory.push(userMsg);

  const assistantMsg: chatMessage = {
  id: 'msg_' + (Date.now() + 1),
 role:'assistant'
 content: response + '\n\n_ tip: configura tu API key de gemini en la app para respuestas mas inteligentes y personalizadas._',
  timestamp: new Date()
};
this.conversationHistory.push(assistantMsg);

return of (assistantMsg);
}
/**
 * Obtiene el historial de conversacion actual
 */
get conversationHistory(): chatMessage[] {
    return [...this.conversationHistory];
}

/**
 * Limpia el historial de conversacion
 */
ClearConversation(): void {
    this.conversationHistory = [];
}
}