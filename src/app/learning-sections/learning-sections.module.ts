import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LearningSectionsRoutingModule } from './learning-sections-routing.module';
import { LearningSectionPage } from './learning-section.page';

@NgModule({
  declarations: [LearningSectionPage],
  imports: [CommonModule, IonicModule, LearningSectionsRoutingModule]
})
export class LearningSectionsModule {}