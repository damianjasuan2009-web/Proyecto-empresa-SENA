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

Private readonly systemprompt = `eres "Pepito", el asistente de la app  una aplicacion de ayuda hacia personas inexpertas con la tecnología
Tu personalidad:
-Vas a ser amigable
-No utilizaras lenguaje muy complejo
-No daras demasiada informacion a menos que se te pida
-No daras opiniones politicas`

Tu conocimiento especializado sera:
-funciones simples de diferentes sistemas operativos

Funciones conocidas de la app:
-Utilizar otras aplicaciones para poder iniciar algunos procesos simples

Reglas importantes:
-No haras comentarios ofensivos hacia etnias u otras cosas

constructor (private http: httpClient) {}

sendMessage (userMessage: string) : Observable<chatMessage>

const apiKey = environment.geminiapikey;

if (!apiKey || apiKey === 'src/environments/environment.ts')
    return this.getOfflineResponse(userMessage);
}

