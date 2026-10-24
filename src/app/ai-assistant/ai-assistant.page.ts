import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { IonContent, ToastController } from '@ionic/angular';
import { AiAssistantService, AssistantMessage, AssistantRequestError } from './ai-assistant.service';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss'],
  standalone: false
})
export class AiAssistantPage {
  @ViewChild(IonContent, { static: false }) private ionContent!: IonContent;

  private readonly assistant = inject(AiAssistantService);
  private readonly toastController = inject(ToastController);
  messages: AssistantMessage[] = [{
    role: 'model',
    text: '¡Hola! Soy tu asistente de TeAcompaño. ¿Qué te gustaría aprender o resolver hoy?'
  }];
  messageDraft = '';
  isSending = false;

  async sendMessage(): Promise<void> {
    const text = this.messageDraft.trim();
    if (!text || this.isSending) {
      return;
    }

    // Capturar el historial ANTES de agregar el nuevo mensaje del usuario
    const historySnapshot = [...this.messages];
    this.messages = [...this.messages, { role: 'user', text }];
    this.messageDraft = '';
    this.isSending = true;
    // Scroll al mensaje del usuario recién añadido
    this.scrollToBottom();

    try {
      // Se envía el historial previo al nuevo mensaje, sin duplicarlo
      const answer = await this.assistant.sendMessage(historySnapshot, text);
      this.messages = [...this.messages, { role: 'model', text: answer }];
      // Scroll automático a la respuesta del asistente
      this.scrollToBottom();
    } catch (error) {
      // Revertir: quitar el mensaje del usuario que se agregó antes del try
      this.messages = historySnapshot;
      this.messageDraft = text;
      const message = error instanceof AssistantRequestError
        ? error.message
        : 'No pudimos procesar tu solicitud. Inténtalo de nuevo.';
      await this.showToast(message, 'warning');
    } finally {
      this.isSending = false;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.ionContent?.scrollToBottom(300);
    }, 50);
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2800,
      position: 'bottom'
    });
    await toast.present();
  }
}
