# Gemini en Firebase Functions

La clave de Gemini debe permanecer en Firebase Secret Manager. No la agregues a `src/`, a `environment*.ts`, al APK ni a un archivo versionado.

## Configuración y despliegue

1. Revoca la clave que se compartió en el chat y crea una nueva en Google AI Studio. Restringe la nueva clave al API de Gemini.
2. Instala o usa Firebase CLI, inicia sesión y selecciona el proyecto Firebase de la aplicación.
3. Desde la raíz del repositorio, ejecuta `firebase functions:secrets:set GEMINI_API_KEY` y pega la clave nueva en el diálogo seguro de la terminal. No la incluyas como argumento del comando.
4. Ejecuta `firebase deploy --only functions:askGemini`.

Cloud Functions requiere que el proyecto tenga habilitada la facturación de Firebase/Google Cloud. La función exige una sesión Firebase autenticada y valida el tamaño de las preguntas e historial. Si Gemini no está configurado o el servicio no responde, la aplicación conserva sus respuestas locales.
