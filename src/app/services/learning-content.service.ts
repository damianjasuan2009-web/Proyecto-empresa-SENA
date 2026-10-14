import { Injectable } from '@angular/core';

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  level: string;
  icon: string;
  topics: string[];
}

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: string;
  steps: string[];
  completed: boolean;
}

export interface VerificationOption {
  label: string;
  value: string;
}

export interface VerificationTask {
  id: number;
  title: string;
  description: string;
  points: number;
  question: string;
  options: VerificationOption[];
  answer: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class LearningContentService {
  private readonly storageKey = 'teacompano-learning-progress';

  readonly learningPaths: LearningPath[] = [
    { id: 1, title: 'WhatsApp y mensajes', description: 'Comunícate y comparte momentos con tu familia.', level: 'Inicial', icon: 'chatbubbles-outline', topics: ['Enviar mensajes y audios', 'Compartir fotos', 'Hacer videollamadas'] },
    { id: 2, title: 'Seguridad en internet', description: 'Navega con tranquilidad y aprende a reconocer engaños.', level: 'Inicial', icon: 'shield-checkmark-outline', topics: ['Crear contraseñas seguras', 'Reconocer mensajes falsos', 'Proteger tus datos'] },
    { id: 3, title: 'Banca digital', description: 'Conoce las operaciones básicas de forma segura.', level: 'Paso a paso', icon: 'wallet-outline', topics: ['Consultar movimientos', 'Pagar servicios', 'Identificar solicitudes sospechosas'] },
    { id: 4, title: 'Correo y redes sociales', description: 'Aprende a usar el correo y compartir contenido.', level: 'Inicial', icon: 'mail-outline', topics: ['Enviar un correo', 'Adjuntar una foto', 'Usar redes con privacidad'] },
    { id: 5, title: 'Un teléfono más cómodo', description: 'Adapta la pantalla y los controles a tus preferencias.', level: 'A tu medida', icon: 'phone-portrait-outline', topics: ['Aumentar el tamaño de letra', 'Ajustar brillo y volumen', 'Usar opciones de accesibilidad'] }
  ];

  readonly tutorials: Tutorial[] = [
    { id: 1, title: 'Enviar un mensaje por WhatsApp', description: 'Escribe a un familiar y envía tu mensaje.', duration: '6 minutos', level: 'Fácil', steps: ['Abre WhatsApp desde el ícono verde.', 'Toca el nombre de la persona a quien quieres escribir.', 'Toca el espacio de mensaje y escribe con calma.', 'Presiona el botón verde con forma de flecha para enviar.'], completed: false },
    { id: 2, title: 'Hacer una videollamada', description: 'Habla cara a cara con alguien de tu familia.', duration: '8 minutos', level: 'Fácil', steps: ['Abre la conversación de la persona.', 'Toca el ícono de cámara en la parte superior.', 'Espera a que la otra persona conteste.', 'Para terminar, toca el botón rojo.'], completed: false },
    { id: 3, title: 'Reconocer mensajes sospechosos', description: 'Aprende a detenerte antes de abrir un enlace.', duration: '7 minutos', level: 'Fácil', steps: ['Desconfía de mensajes que te apuran o asustan.', 'No abras enlaces de personas que no conoces.', 'Nunca compartas claves ni códigos recibidos por mensaje.', 'Llama a tu familiar o banco usando un número conocido.'], completed: false },
    { id: 4, title: 'Enviar una foto por correo', description: 'Adjunta una imagen a un mensaje de correo.', duration: '9 minutos', level: 'Paso a paso', steps: ['Abre tu correo y toca “Redactar”.', 'Escribe el correo de la persona y un asunto.', 'Toca el ícono del clip para adjuntar.', 'Elige la foto y toca “Enviar”.'], completed: false },
    { id: 5, title: 'Ajustar el teléfono para ver mejor', description: 'Prueba opciones de pantalla y accesibilidad.', duration: '5 minutos', level: 'A tu medida', steps: ['Abre Ajustes o Configuración en tu teléfono.', 'Busca Pantalla o Accesibilidad; el nombre puede variar.', 'Aumenta el tamaño del texto y ajusta el brillo a tu gusto.', 'Si está disponible, prueba el lector de pantalla o los comandos de voz.'], completed: false },
    { id: 6, title: 'Crear un recordatorio', description: 'Organiza una cita o una tarea importante.', duration: '6 minutos', level: 'Fácil', steps: ['Abre la aplicación Calendario o Recordatorios.', 'Toca el botón para crear una actividad nueva.', 'Escribe un título fácil de reconocer.', 'Elige el día y la hora, y guarda el recordatorio.'], completed: false },
    { id: 7, title: 'Buscar información confiable', description: 'Revisa quién publica la información y cuándo.', duration: '7 minutos', level: 'Paso a paso', steps: ['Escribe una pregunta concreta en el buscador.', 'Revisa quién publica la página y la fecha del contenido.', 'Compara la información con otra fuente conocida u oficial.', 'Si se trata de salud o dinero, confirma con un profesional o entidad oficial.'], completed: false }
  ];

  readonly verificationTasks: VerificationTask[] = [
    { id: 1, title: 'Cuida tus contraseñas', description: 'Elige la acción más segura ante una solicitud de clave.', points: 20, question: 'Un mensaje te pide la clave de tu banco. ¿Qué haces?', options: [{ label: 'La envío para resolverlo rápido', value: 'share' }, { label: 'No la comparto y contacto al banco por un canal conocido', value: 'protect' }, { label: 'La envío a un familiar por el mismo mensaje', value: 'forward' }], answer: 'protect', completed: false },
    { id: 2, title: 'Detecta enlaces extraños', description: 'Decide qué hacer con un premio que no esperabas.', points: 20, question: 'Recibes un enlace para reclamar un premio inesperado. ¿Qué haces?', options: [{ label: 'Lo abro y escribo mis datos', value: 'open' }, { label: 'Lo reenvío a mis contactos', value: 'forward' }, { label: 'No lo abro y consulto con alguien de confianza', value: 'ignore' }], answer: 'ignore', completed: false },
    { id: 3, title: 'Confirma antes de transferir', description: 'Aprende a verificar una solicitud urgente de dinero.', points: 25, question: 'Un familiar te pide dinero desde un número nuevo. ¿Qué haces?', options: [{ label: 'Transfiero enseguida', value: 'transfer' }, { label: 'Llamo a su número habitual para confirmar', value: 'confirm' }, { label: 'Comparto mis datos bancarios', value: 'share' }], answer: 'confirm', completed: false },
    { id: 4, title: 'Comprueba una información', description: 'Practica cómo elegir una fuente confiable.', points: 20, question: 'Encuentras un consejo importante en una página desconocida. ¿Qué haces?', options: [{ label: 'Lo comparto sin revisar', value: 'share' }, { label: 'Reviso autor y fecha, y comparo con una fuente oficial', value: 'check' }, { label: 'Creo el primer resultado que aparece', value: 'trust' }], answer: 'check', completed: false }
  ];

  constructor() {
    this.restoreProgress();
  }

  get totalCompletedTutorials(): number {
    return this.tutorials.filter(tutorial => tutorial.completed).length;
  }

  get learningProgress(): number {
    return Math.round((this.totalCompletedTutorials / this.tutorials.length) * 100);
  }

  get completedVerifications(): number {
    return this.verificationTasks.filter(task => task.completed).length;
  }

  markTutorialComplete(tutorialId: number): void {
    const tutorial = this.tutorials.find(item => item.id === tutorialId);
    if (tutorial) {
      tutorial.completed = true;
      this.saveProgress();
    }
  }

  checkVerification(taskId: number, selectedAnswer: string): boolean {
    const task = this.verificationTasks.find(item => item.id === taskId);
    if (!task || task.answer !== selectedAnswer) {
      return false;
    }

    task.completed = true;
    this.saveProgress();
    return true;
  }

  private restoreProgress(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }

      const progress = JSON.parse(saved) as { tutorials?: number[]; verifications?: number[] };
      this.tutorials.forEach(tutorial => tutorial.completed = progress.tutorials?.includes(tutorial.id) ?? false);
      this.verificationTasks.forEach(task => task.completed = progress.verifications?.includes(task.id) ?? false);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private saveProgress(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify({
      tutorials: this.tutorials.filter(item => item.completed).map(item => item.id),
      verifications: this.verificationTasks.filter(item => item.completed).map(item => item.id)
    }));
  }
}