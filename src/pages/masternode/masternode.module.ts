import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MasternodePage } from './masternode';

@NgModule({
  declarations: [
    MasternodePage,
  ],
  imports: [
    IonicPageModule.forChild(MasternodePage),
  ],
})
export class MasternodePageModule {}
