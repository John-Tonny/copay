import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {Events, NavController, NavParams} from 'ionic-angular';
import {OnGoingProcessProvider, WalletProvider} from "../../../providers";

// providers
import { Logger } from '../../../providers/logger/logger';
import { PopupProvider } from '../../../providers/popup/popup';

@Component({
  selector: 'page-masternode-delete',
  templateUrl: 'masternode-delete.html',
})
export class MasternodeDeletePage {
  public wallet: any;
  public txId: string;
  public address: string;
  public masternodeKey: string;

  constructor(
      private navCtrl: NavController,
      private navParams: NavParams,
      private logger: Logger,
      private events: Events,
      private translate: TranslateService,
      private popupProvider: PopupProvider,
      private onGoingProcessProvider: OnGoingProcessProvider,
      private walletProvider: WalletProvider,
  ) {
    this.wallet = this.navParams.data.wallet;
    this.txId = this.navParams.data.txId;
    this.address = this.navParams.data.address;
    this.masternodeKey = this.navParams.data.masternodeKey;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: MasternodeDeletePage');
  }

  public showDeletePopup(): void {
    const title = this.translate.instant('Warning!');
    const message = this.translate.instant(
        'Are you sure you want to delete this masternode?'
    );
    this.popupProvider.ionicConfirm(title, message, null, null).then(res => {
      if (res) this.deleteMasternode();
    });
  }

  public deleteMasternode(): void {
    this.onGoingProcessProvider.set('deletingMasternode');
    let opts = {
      txid: this.txId,
    }
    this.walletProvider
      .removeMasternode(this.wallet, opts)
      .then( res => {
        this.onGoingProcessProvider.clear();
        this.goHome();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Could not remove this masternode: ', err);
        this.popupProvider.ionicAlert(
            this.translate.instant('Error'),
            err.message || err
        );
      });
  }

  private goHome() {
    this.events.publish('updateMasternode', true, this.txId, this.address, this.masternodeKey)
    setTimeout(() => {
      this.toPage('MasternodePage');
      // this.navCtrl.popTo('MasternodePage');
    }, 1000);
  }

  public toPage(page) {
    let views = this.navCtrl.getViews();
    for (let i = 0; i < views.length; i++) {
      if (views[i].component.name == page) {
        this.navCtrl.popTo(this.navCtrl.getByIndex(i));
        return;
      }
    }

    /*
    this.navCtrl.popToRoot().then(
        ()=> {
          this.navCtrl.push(page);
        }
    );*/
  }
}
