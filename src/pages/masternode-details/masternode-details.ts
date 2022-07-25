import { Component } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {Events, IonicPage, ModalController, NavController, NavParams, Platform, ViewController} from 'ionic-angular';
import * as _ from 'lodash';
import {
  BwcErrorProvider,
  ErrorsProvider,
  KeyProvider,
  Logger, OnGoingProcessProvider, PlatformProvider, RateProvider, WalletProvider
} from "../../providers";
import {FinishModalPage} from "../finish/finish";
import {CoinbaseAccountPage} from "../integrations/coinbase/coinbase-account/coinbase-account";
import {MasternodePage} from "../masternode/masternode";
import {WalletDetailsPage} from "../wallet-details/wallet-details";
import {MasternodeDeletePage} from "./masternode-delete/masternode-delete";

/**
 * Generated class for the MasternodeDetailsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-masternode-details',
  templateUrl: 'masternode-details.html',
})
export class MasternodeDetailsPage {
  private createdOn: number;
  private txId: string;
  private masternodeKey: string;
  private address: string;
  private payee: string;
  private status: string;
  private protocol: number;
  private daemonversion: string;
  private sentinelversion: string;
  private sentinelstate: string;
  private lastseen: number;
  private activeseconds: number;
  private lastpaidtime: number;
  private lastpaidblock: number;
  private pingretries: number;
  private coin: string;
  private network: string;

  private bActivate: boolean;
  private bTest: boolean;

  public title: string;
  public buttonText: string;
  public successText: string;

  public machines = [];
  public wallet: any;

  // Platform info
  public isCordova: boolean;

  public defalut_port = "9900";

  constructor(
      private logger: Logger,
      private navCtrl: NavController,
      private navParams: NavParams,
      private translate: TranslateService,
      protected platformProvider: PlatformProvider,
      private events: Events,
      protected modalCtrl: ModalController,
      private rateProvider: RateProvider,
      private walletProvider: WalletProvider,
      private keyProvider: KeyProvider,
      private bwcErrorProvider: BwcErrorProvider,
      private errorsProvider: ErrorsProvider,
      private onGoingProcessProvider: OnGoingProcessProvider,
      private viewCtrl: ViewController
  ) {
    this.wallet = this.navParams.data.wallet;
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.txId = this.navParams.data.txId;
    this.masternodeKey = this.navParams.data.masternodeKey;
    this.address = this.navParams.data.address;
    this.payee = this.navParams.data.payee;
    this.status = this.navParams.data.status;
    this.protocol = this.navParams.data.protocol;
    this.daemonversion = this.navParams.data.daemonversion;
    this.sentinelversion = this.navParams.data.sentinelversion;
    this.sentinelstate = this.navParams.data.sentinelstate;
    this.lastseen = this.navParams.data.lastseen;
    this.activeseconds = this.navParams.data.activeseconds;
    this.lastpaidtime = this.navParams.data.lastpaidtime;
    this.lastpaidblock = this.navParams.data.lastpaidblock;
    this.pingretries = this.navParams.data.pingretries;
    this.coin = this.navParams.data.coin;
    this.network = this.navParams.data.coin;
    this.machines = this.navParams.data.machines;

    this.title = this.translate.instant('Masternode');
    this.buttonText = this.isCordova
        ? this.translate.instant('Slide to Activate')
        : this.translate.instant('Click to Activate');
    this.successText = this.translate.instant('Masternode Activated');

    this.bActivate = false;
    if (this.masternodeKey && this.address && this.status) {
      this.bActivate = true;
    }
  }

  public canActivate() {
    if (this.masternodeKey && this.address && this.status && (this.status != 'ENABLED' && this.status != 'PRE_ENABLED')) {
      return true;
    }
    return false;
  }

  public activate() {
    const outpoint = this.txId.split('-');
    if (outpoint.length != 2) {
      return
    }
    this.onGoingProcessProvider.set('activatingMasternode');
    let cpath;
    this.walletProvider
      .getMasternodeCollateral(this.wallet)
      .then(vmasternodes => {
        _.each(vmasternodes, vmasternode => {
          if (vmasternode.txid == outpoint[0] && vmasternode.vout == outpoint[1]){
            cpath = vmasternode.path;
            return;
          }
        });

        this.keyProvider
          .handleEncryptedWallet(this.wallet.credentials.keyId)
          .then((password: string) => {
            const rootPath = this.wallet.getRootPath();
            const signPrivKey = this.keyProvider.getPrivateKey(this.wallet.credentials.keyId, rootPath, cpath);
            this.walletProvider
              .getMasternodePing(this.wallet, outpoint[0], outpoint[1])
              .then(pingRet => {
                pingRet.privKey = this.masternodeKey;
                pingRet.ip = this.address;
                pingRet.signPrivKey = signPrivKey;
                this.walletProvider
                  .signMasternode(this.wallet, pingRet)
                  .then( signRet=>{
                    this.walletProvider
                      .broadcastMasternode(this.wallet, signRet, pingRet.privKey)
                      .then( broadcastRet=>{
                        this.onGoingProcessProvider.clear();

                        this.logger.info(broadcastRet);
                        this.status = 'PRE_ENABLED';
                        let finishText = this.translate.instant('Masternode Activated');
                        return this.openFinishModal(finishText, false);
                      })
                      .catch(err => {
                        if (err) {
                          let title = this.translate.instant('Could not broadcast masternode');
                          this.showErrorInfoSheet(err, title);
                        }
                      });
                  })
                  .catch(err => {
                    this.onGoingProcessProvider.clear();
                    if (err) {
                      let title = this.translate.instant('Could not sign masternode');
                      this.showErrorInfoSheet(err, title);
                    }
                  });
              })
              .catch(err => {
                this.onGoingProcessProvider.clear();
                if (err) {
                  let title = this.translate.instant('Could not get masternode ping');
                  this.showErrorInfoSheet(err, title);
                }
              });
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            if (err && err.message != 'PASSWORD_CANCELLED') {
              if (err.message == 'WRONG_PASSWORD') {
                this.errorsProvider.showWrongEncryptPasswordError();
              } else {
                let title = this.translate.instant('Could not decrypt wallet');
                this.showErrorInfoSheet(this.bwcErrorProvider.msg(err), title);
              }
            }
          });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('get masternodes collateral: ', err);
      });
  }

  public getMachines(machine) {
    this.address = machine.ip + ':' + this.defalut_port;
    this.masternodeKey = machine.key;
    this.status = 'wait to activate';
  }

  protected async openFinishModal(
      finishText: string,
      remove: boolean
  ) {
    let params: {
      finishText: string;
      finishComment?: string;
      autoDismiss?: boolean;
    } = {
      finishText: finishText || this.successText,
      autoDismiss: false
    };
    const modal = this.modalCtrl.create(FinishModalPage, params, {
      showBackdrop: true,
      enableBackdropDismiss: false,
      cssClass: 'finish-modal'
    });
    await modal.present();

    modal.onDidDismiss(data => {
      this.close();
      this.events.publish('updateMasternode', remove, this.txId, this.address, this.masternodeKey)
    });

  }

  private goHome(rm_txid: string) {
    let rm_txid1 = rm_txid;
    setTimeout(() => {
        this.navCtrl.popToRoot();
    }, 1000);
  }

  private showErrorInfoSheet(
      err: Error | string,
      infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.error('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }

  public removeMasternode(): void {
    this.navCtrl.push(MasternodeDeletePage, {
      wallet: this.wallet,
      txId: this.txId,
      address: this.address,
      masternodeKey: this.masternodeKey
    });
  }

  close() {
    this.viewCtrl.dismiss();
  }
}
