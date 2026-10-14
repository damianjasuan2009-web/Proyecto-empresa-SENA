import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LearningSectionPage } from './learning-section.page';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aprendizaje' },
  { path: 'aprendizaje', component: LearningSectionPage, data: { section: 'aprendizaje' } },
  { path: 'tutoriales', component: LearningSectionPage, data: { section: 'tutoriales' } },
  { path: 'verificacion', component: LearningSectionPage, data: { section: 'verificacion' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LearningSectionsRoutingModule {}