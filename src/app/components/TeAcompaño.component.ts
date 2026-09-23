// @ts-ignore Angular types may be unavailable in the current TypeScript configuration.
import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
// @ts-ignore The service module may be unavailable in the current TypeScript configuration.
import {AiChatService} from '../services/ai-chat.service';
// @ts-ignore The model module may be unavailable in the current TypeScript configuration.
import {ChatMessage} from '../models/chat-message.model';

// @ts-ignore tslib is unavailable in the current TypeScript configuration.
@Component({
    selector: 'app-te-acompano',
    templateUrl: './TeAcompaño.component.html',
    styleUrls: ['./TeAcompaño.component.css'],
    standalone: true,
}) 
export class TeAcompañoComponent implements OnInit {
    @ViewChild('chatContainer') chatContainer!: ElementRef;
    

    isChatOpen: boolean = false;
    chatMessages: ChatMessage[] = [];
    chatInput: string = '';
    isChatLoading: boolean = false;

    chatSuggestions: string[] = [
        'Hola, ¿cómo estás?',
        '¿Qué tal tu día?',
        '¿Puedes contarme un chiste?',
        '¿Cuál es tu película favorita?',
        '¿Tienes algún consejo para mí?'
    ];

    constructor(private aiChatService: AiChatService) {}

    ngOnInit(): void {
        this.chatMessages = this.aiChatService.getconversationHistory();
    }


    toggleChat(): void {
        this.isChatOpen = !this.isChatOpen;
        if (this.isChatOpen) {
            this.chatMessages = this.aiChatService.getconversationHistory();
            setTimeout(() => this.scrollChatToBottom(), 0);
        }
    }

    private scrollChatToBottom(): void {
        const container = this.chatContainer?.nativeElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    
    sendChatMessage(): void {
        const text = this.chatInput?.trim();
        if (!text || this.isChatLoading) return;


        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        this.chatMessages.push(userMessage);
        this.chatInput = '';
        this.scrollChatToBottom();
        this.isChatLoading = true;



        this.aiChatService.sendMessage(text).subscribe({
            next: () => {
                this.chatMessages = this.aiChatService.getconversationHistory();
                this.isChatLoading = false;
                this.scrollChatToBottom();
            },
            error: () => {
                this.isChatLoading = false;
                const errorMessage: ChatMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta nuevamente.',
                    timestamp: new Date()
                };
                this.chatMessages.push(errorMessage);
                this.scrollChatToBottom();
            }
        });
    }


    sendChatFromSuggestion(suggestion: string): void {
        this.chatInput = suggestion;
        this.sendChatMessage();
    }



    clearChatHistory(): void {
        this.aiChatService.clearConversationHistory();
        this.chatMessages = [];
    }



    private scrollToBottom(): void {
        setTimeout(() => {
            const el= this.chatContainer?.nativeElement;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }   
        }, 50);
    }
}
    


        
        
