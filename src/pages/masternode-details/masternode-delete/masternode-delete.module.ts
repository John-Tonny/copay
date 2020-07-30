import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MasternodeDeletePage } from './masternode-delete';

@NgModule({
  declarations: [
    MasternodeDeletePage,
  ],
  imports: [
    IonicPageModule.forChild(MasternodeDeletePage),
  ],
})
export class MasternodeDeletePageModule {}
