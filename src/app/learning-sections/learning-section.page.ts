import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { LearningContentService, VerificationTask } from '../services/learning-content.service';

type Section = 'aprendizaje' | 'tutoriales' | 'verificacion';

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
  readonly section = this.route.snapshot.data['section'] as Section;

  get title(): string {
    const titles: Record<Section, string> = {
      aprendizaje: 'Rutas de aprendizaje',
      tutoriales: 'Tutoriales paso a paso',
      verificacion: 'Comprueba lo aprendido'
    };
    return titles[this.section];
  }

  get description(): string {
    const descriptions: Record<Section, string> = {
      aprendizaje: 'Elige un tema y aprende habilidades útiles para tu día a día.',
      tutoriales: 'Sigue cada instrucción con calma. Puedes volver a leerla cuando quieras.',
      verificacion: 'Responde unas preguntas cortas para practicar con confianza.'
    };
    return descriptions[this.section];
  }

  async openTutorial(tutorialId: number): Promise<void> {
    const tutorial = this.learningContent.tutorials.find(item => item.id === tutorialId);
    if (!tutorial) {
      return;
    }

    const alert = await this.alertController.create({
      header: tutorial.title,
      message: tutorial.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'),
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        {
          text: tutorial.completed ? 'Ya lo aprendí' : 'Marcar como aprendido',
          handler: () => {
            this.learningContent.markTutorialComplete(tutorial.id);
            void this.showToast('¡Bien hecho! Guardamos tu avance.', 'success');
          }
        }
      ]
    });
    await alert.present();
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