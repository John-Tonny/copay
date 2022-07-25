import { Component } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {Events, IonicPage, ModalController, NavController, NavParams} from 'ionic-angular';
import * as _ from 'lodash';
import {
  ActionSheetProvider,
  AddressProvider, AppProvider, BwcErrorProvider, BwcProvider,
  CurrencyProvider, ErrorsProvider,
  IncomingDataProvider,
  Logger, OnGoingProcessProvider,
  PayproProvider,
  ProfileProvider, RateProvider, WalletProvider
} from "../../providers";
import {MasternodeDetailsPage} from "../masternode-details/masternode-details";

/**
 * Generated class for the MasternodePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-masternode',
  templateUrl: 'masternode.html',
})
export class MasternodePage {
  public wallet: any;
  public masternodes = [];
  public machines = [];
  public bTest: boolean;

  public defalut_port = "9900";

  constructor(
      private currencyProvider: CurrencyProvider,
      private navCtrl: NavController,
      private navParams: NavParams,
      private payproProvider: PayproProvider,
      private profileProvider: ProfileProvider,
      private logger: Logger,
      private incomingDataProvider: IncomingDataProvider,
      private addressProvider: AddressProvider,
      private events: Events,
      private actionSheetProvider: ActionSheetProvider,
      private appProvider: AppProvider,
      private rateProvider: RateProvider,
      private translate: TranslateService,
      private errorsProvider: ErrorsProvider,
      private onGoingProcessProvider: OnGoingProcessProvider,
      private bwcErrorProvider: BwcErrorProvider,
      private bwcProvider: BwcProvider,
      private walletProvider: WalletProvider,
      private modalCtrl: ModalController,
  ) {
    this.wallet = this.navParams.data.wallet;
    this.bTest = true;

    this.events.subscribe('updateMasternode', (remove, txid, address, masternodeKey) => {
      this.updateMasternode(remove, txid, address, masternodeKey);
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: MasternodePage');
    this.getMasternodes();
  }

  public goToMasternodeDetails(masternode) {
    this.navCtrl.push(MasternodeDetailsPage, {
      txId: masternode.txid,
      masternodeKey: masternode.masternodeKey,
      address: masternode.address,
      payee: masternode.payee,
      status: masternode.status,
      protocol: masternode.protocol,
      daemonversion: masternode.daemonversion,
      sentinelversion: masternode.sentinelversion,
      sentinelstate: masternode.sentinelstate,
      lastseen: masternode.lastseen,
      activeseconds: masternode.activeseconds,
      lastpaidtime: masternode.lastpaidtime,
      lastpaidblock: masternode.lastpaidblock,
      pingretries: masternode.pingretries,
      coin: masternode.coin,
      network: masternode.network,
      wallet: this.wallet,
      machines: this.getUnusedMachines()
    });
  }

  public showMoreOptions(): void {
    const showRefresh = true;
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
        'masternode-options',
        {showRefresh}
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'masternode-refresh') this.masternodeRefresh();
    });
  }

  public masternodeRefresh() {
    this.logger.info('masternode refresh');
    this.onGoingProcessProvider.set('refresh Masternode');
    this.walletProvider
        .getMasternodeCollateral(this.wallet)
        .then(vmasternodes => {
          _.each(vmasternodes, vmasternode => {
            let old_masternode = _.find(this.masternodes, {
              txid: vmasternode.txid + '-' + vmasternode.vout
            });
            if (!old_masternode) {
              let masternode = {
                txid: vmasternode.txid + '-' + vmasternode.vout,
                masternodeKey: undefined,
                address: undefined,
                payee: vmasternode.address,
                status: undefined,
                protocol: undefined,
                daemonversion: undefined,
                sentinelversion: undefined,
                sentinelstate: undefined,
                lastseen: undefined,
                activeseconds: undefined,
                lastpaidtime: undefined,
                lastpaidblock: undefined,
                pingretries: undefined,
                coin: this.wallet.coin,
                network: this.wallet.network
              }
              this.masternodes.unshift(masternode);
            }
          });
          this.onGoingProcessProvider.clear();
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          this.logger.warn('get masternode collateral: ', err);
        });
  }

  public getMasternodes() {
    this.onGoingProcessProvider.set('refresh Masternode');
    this.walletProvider
        .getMasternodes(this.wallet)
        .then(masternodes => {
          this.masternodes = masternodes;
          this.getMachines();
          this.onGoingProcessProvider.clear();
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          this.logger.warn('get masternodes: ', err);
        });
  }

  public updateMasternode(remove: boolean, txid: string, address: string, masternodeKey: string) {
    if (txid != '') {
      for (let i = 0; i < this.masternodes.length; i++) {
        if (this.masternodes[i].txid === txid) {
          if (remove) {
            this.masternodes.splice(i, 1);
            return;
          } else {
            this.masternodes[i].status = 'PRE_ENABLED';
            this.masternodes[i].masternodeKey = masternodeKey;
            this.masternodes[i].address = address;
          }
        }
      }
    }
  }

  public getMachines() {
    this.machines = [];
    if (this.bTest) {
      this.machines.push({key: '5JisMpk7vvvRbAhvGb7KcFuuifzuqCZX4XvExnrbQpkuKBk713o', ip: '52.82.14.25'});
      this.machines.push({key: '5KUPXvGKvh9oBHZttH8rnhVEv7RtttVbduoXWphcQi9uBdd7BJ4', ip: '52.82.67.41'});
      this.machines.push({key: '5Js8tYzLdfqCKcT6bZYzMAnfLhvsKs48PzrKX2Pv8fK2D6i4dXu', ip: '47.104.25.28'});
      this.machines.push({key: '5KGv1unWpomtQDBM8nSdsRctd3A38z9eDRp1mdHo7i3fLbjS3xS', ip: '161.189.98.179'});
      this.machines.push({key: '5KH1dzQ36tqKn8iKYKSmiPgXrCAYF6aW8gHWoEtbRsN6YY7wcQY', ip: '161.189.99.57'});
      return;
    }
    this.rateProvider
      .getMachines(
          this.wallet.coin,
          '18588881017'
      )
      .then(res => {
        this.onGoingProcessProvider.clear();
        if (res.code == 200) {
          if (res.data) {
            let machine: {key?: string, ip?: string} = {};
            if (_.isObject(res.data)) {
              machine.key = res.data.genkey;
              machine.ip = res.data.ip + ':' + this.defalut_port;
              this.machines.push(machine);
            }else if(_.isArray(res.data)) {
              _.each(res.data, data => {
                machine.key = data.genkey;
                machine.ip = data.ip + ':' + this.defalut_port;
                this.machines.push(machine);
              })
            }
          }
        }else{
          this.onGoingProcessProvider.set('refresh Masternode');
          let title = this.translate.instant('Could not get masternode');
          this.showErrorInfoSheet(res.pagePrompt, title);
        }
      });
  }

  private showErrorInfoSheet(
      err: Error | string,
      infoSheetTitle: string
  ): void {
    if (!err) return;
    this.logger.error('Could not get keys:', err);
    this.errorsProvider.showDefaultError(err, infoSheetTitle);
  }

  private getUnusedMachines() {
    let machines = this.machines;
    for(let i=0; i<this.masternodes.length; i++){
      if(this.isActivate(this.masternodes[i])){
        _.remove(machines, (machine) => {
          let address = machine.ip + ':' + this.defalut_port;
          return address == this.masternodes[i].address;
        });
      }
    }
    return machines;
  }

  private isActivate(machine) {
    if (machine.masternodeKey && machine.address && machine.status && (machine.status === 'ENABLED' || machine.status === 'PRE_ENABLED')) {
      return true;
    }
    return false;
  }

}
