import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MasternodeDetailsPage } from './masternode-details';

@NgModule({
  declarations: [
    MasternodeDetailsPage,
  ],
  imports: [
    IonicPageModule.forChild(MasternodeDetailsPage),
  ],
})
export class MasternodeDetailsPageModule {}
