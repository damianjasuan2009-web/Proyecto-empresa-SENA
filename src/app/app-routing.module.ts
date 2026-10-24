import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authenticatedGuard, signedOutGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [signedOutGuard],
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    canActivate: [signedOutGuard],
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'home',
    canActivate: [authenticatedGuard],
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'apartados',
    canActivate: [authenticatedGuard],
    loadChildren: () => import('./learning-sections/learning-sections.module').then(m => m.LearningSectionsModule)
  },
  {
    path: 'settings',
    canActivate: [authenticatedGuard],
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'asistente',
    canActivate: [authenticatedGuard],
    loadChildren: () => import('./ai-assistant/ai-assistant.module').then(m => m.AiAssistantPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
