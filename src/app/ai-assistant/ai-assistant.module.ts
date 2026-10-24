import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AiAssistantPage } from './ai-assistant.page';
import { AiAssistantPageRoutingModule } from './ai-assistant-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AiAssistantPageRoutingModule],
  declarations: [AiAssistantPage]
})
export class AiAssistantPageModule {}
