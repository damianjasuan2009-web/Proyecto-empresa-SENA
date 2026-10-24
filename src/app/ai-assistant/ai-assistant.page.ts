import { Component, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AiAssistantService, AssistantMessage, AssistantRequestError } from './ai-assistant.service';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss'],
  standalone: false
})
export class AiAssistantPage {
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

    this.messages = [...this.messages, { role: 'user', text }];
    this.messageDraft = '';
    this.isSending = true;

    try {
      const answer = await this.assistant.sendMessage(this.messages.slice(1, -1), text);
      this.messages = [...this.messages, { role: 'model', text: answer }];
    } catch (error) {
      this.messages = this.messages.slice(0, -1);
      this.messageDraft = text;
      const message = error instanceof AssistantRequestError
        ? error.message
        : 'No pudimos procesar tu solicitud. Inténtalo de nuevo.';
      await this.showToast(message, 'warning');
    } finally {
      this.isSending = false;
    }
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
