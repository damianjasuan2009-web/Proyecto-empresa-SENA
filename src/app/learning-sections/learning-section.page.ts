import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { LearningContentService, Tutorial, VerificationTask } from '../services/learning-content.service';
import { TrustedContactsService, TrustedContact } from '../services/trusted-contacts.service';

type Section = 'aprendizaje' | 'tutoriales' | 'verificacion' | 'contactos' | 'ayuda';
type ContactAction = 'call' | 'message' | 'video' | 'help';

@Component({
  selector: 'app-learning-section',
  templateUrl: './learning-section.page.html',
  styleUrls: ['./learning-section.page.scss'],
  standalone: false
})
export class LearningSectionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  readonly learningContent = inject(LearningContentService);
  readonly contactBook = inject(TrustedContactsService);
  readonly section = this.route.snapshot.data['section'] as Section;
  activeTutorialId: number | null = null;
  currentStepIndex = 0;

  get activeTutorial(): Tutorial | undefined {
    return this.learningContent.tutorials.find(tutorial => tutorial.id === this.activeTutorialId);
  }

  get contactAction(): ContactAction {
    const action = this.route.snapshot.queryParamMap.get('action');
    return action === 'message' || action === 'video' || action === 'help' ? action : 'call';
  }

  get title(): string {
    const titles: Record<Section, string> = {
      aprendizaje: 'Rutas de aprendizaje',
      tutoriales: 'Tutoriales paso a paso',
      verificacion: 'Comprueba lo aprendido',
      contactos: 'Personas de confianza',
      ayuda: 'Estamos para ayudarte'
    };
    return titles[this.section];
  }

  get description(): string {
    const descriptions: Record<Section, string> = {
      aprendizaje: 'Elige un tema y aprende habilidades útiles para tu día a día.',
      tutoriales: 'Sigue cada instrucción con calma. Puedes volver a leerla cuando quieras.',
      verificacion: 'Responde unas preguntas cortas para practicar con confianza.',
      contactos: 'Guarda a las personas a quienes quieres llamar o escribir.',
      ayuda: 'Elige cómo quieres comunicarte con tu familia o pedir apoyo.'
    };
    return descriptions[this.section];
  }

  startTutorial(tutorialId: number): void {
    this.activeTutorialId = tutorialId;
    this.currentStepIndex = 0;
  }

  previousStep(): void {
    this.currentStepIndex = Math.max(0, this.currentStepIndex - 1);
  }

  nextStep(): void {
    const tutorial = this.activeTutorial;
    if (!tutorial) {
      return;
    }

    if (this.currentStepIndex < tutorial.steps.length - 1) {
      this.currentStepIndex += 1;
      return;
    }

    this.learningContent.markTutorialComplete(tutorial.id);
    this.activeTutorialId = null;
    this.currentStepIndex = 0;
    void this.showToast('¡Muy bien! Guardamos tu avance.', 'success');
  }

  readCurrentStep(): void {
    const tutorial = this.activeTutorial;
    if (!tutorial || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      void this.showToast('La lectura en voz alta no está disponible en este dispositivo.', 'warning');
      return;
    }

    window.speechSynthesis.cancel();
    const instruction = new SpeechSynthesisUtterance(tutorial.steps[this.currentStepIndex]);
    instruction.lang = 'es-CO';
    window.speechSynthesis.speak(instruction);
  }

  closeTutorial(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeTutorialId = null;
    this.currentStepIndex = 0;
  }

  async addContact(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Agregar persona de confianza',
      message: 'Escribe su nombre y número de teléfono.',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre' },
        { name: 'phone', type: 'tel', placeholder: 'Teléfono, por ejemplo +57 300 123 4567' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data: { name: string; phone: string }) => {
            const saved = this.contactBook.addContact(data.name, data.phone);
            void this.showToast(
              saved ? 'Contacto guardado en este dispositivo.' : 'Revisa el nombre y escribe un teléfono válido.',
              saved ? 'success' : 'warning'
            );
            return saved;
          }
        }
      ]
    });
    await alert.present();
  }

  async removeContact(contact: TrustedContact): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Quitar contacto',
      message: `¿Quieres quitar a ${contact.name} de tus personas de confianza?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Quitar', role: 'destructive', handler: () => this.contactBook.removeContact(contact.id) }
      ]
    });
    await alert.present();
  }

  whatsappUrl(contact: TrustedContact, withHelpMessage = false): string {
    const phone = contact.phone.replace(/\D/g, '');
    const message = withHelpMessage ? '?text=Hola%2C%20necesito%20ayuda%20con%20mi%20tel%C3%A9fono.' : '';
    return `https://wa.me/${phone}${message}`;
  }

  goToContacts(action: ContactAction): void {
    void this.router.navigate(['/apartados/contactos'], { queryParams: { action } });
  }

  contactActionLabel(contact: TrustedContact): string {
    if (this.contactAction === 'message') {
      return `Enviar mensaje a ${contact.name}`;
    }
    if (this.contactAction === 'video') {
      return `Abrir WhatsApp para llamar a ${contact.name}`;
    }
    if (this.contactAction === 'help') {
      return `Pedir ayuda a ${contact.name}`;
    }
    return `Llamar a ${contact.name}`;
  }

  async verify(task: VerificationTask): Promise<void> {
    const alert = await this.alertController.create({
      header: task.title,
      message: task.question,
      inputs: task.options.map(option => ({
        type: 'radio',
        label: option.label,
        value: option.value
      })),
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        {
          text: 'Comprobar',
          handler: (answer: string) => {
            if (!answer) {
              void this.showToast('Elige una respuesta para continuar.', 'warning');
              return false;
            }

            const answeredCorrectly = this.learningContent.checkVerification(task.id, answer);
            void this.showToast(
              answeredCorrectly ? `¡Correcto! Ganaste ${task.points} puntos.` : 'Esa no es la respuesta. Puedes volver a intentarlo.',
              answeredCorrectly ? 'success' : 'warning'
            );
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async openPathTutorials(): Promise<void> {
    await this.router.navigateByUrl('/apartados/tutoriales');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2200, position: 'bottom' });
    await toast.present();
  }
}