import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { PricePage } from '../../pages/home/price-page/price-page';
import {
  ConfigProvider,
  CurrencyProvider,
  ExchangeRatesProvider,
  Logger
} from '../../providers';
import { Coin } from '../../providers/currency/currency';

export interface Card {
  unitCode: string;
  historicalRates: any;
  currentPrice: number;
  averagePrice: number;
  averagePriceAmount: number;
  backgroundColor: string;
  gradientBackgroundColor: string;
  name: string;
}

@Component({
  selector: 'exchange-rates',
  templateUrl: 'exchange-rates.html'
})
export class ExchangeRates {
  public isIsoCodeSupported: boolean;
  public isoCode: string;
  public coins = [];
  public fiatCodes = [
    'CNY',
    'USD',
    'INR',
    'GBP',
    'EUR',
    'CAD',
    'COP',
    'NGN',
    'BRL',
    'ARS',
    'AUD'
  ];

  constructor(
    private navCtrl: NavController,
    private currencyProvider: CurrencyProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private events: Events
  ) {
    const availableChains = this.currencyProvider.getAvailableChains();
    for (const coin of availableChains) {
      const {
        backgroundColor,
        gradientBackgroundColor
      } = this.currencyProvider.getTheme(coin as Coin);
      const card = {
        unitCode: coin,
        historicalRates: [],
        currentPrice: 0,
        averagePrice: 0,
        averagePriceAmount: 0,
        backgroundColor,
        gradientBackgroundColor,
        name: this.currencyProvider.getCoinName(coin as Coin)
      };
      this.coins.push(card);
    }
    this.getPrices();
    this.events.subscribe('Local/PriceUpdate', () => {
      this.getPrices(true);
    });
  }

  public goToPricePage(card) {
    // this.navCtrl.push(PricePage, { card });
  }

  public getPrices(force: boolean = false) {
    this.setIsoCode();

    _.forEach(this.coins, (coin, index) => {
      this.exchangeRatesProvider
        .getHistoricalRates(coin.unitCode, this.isoCode, force)
        .subscribe(response => {
          this.coins[index].historicalRates = response;
          this.updateValues(index);
        });
      err => {
        this.logger.error('Error getting rates:', err);
      };
    });
  }

  public updateCurrentPrice() {
    const lastRequest = this.coins[0].historicalRates[0].ts;
    if (moment(lastRequest).isBefore(moment(), 'days')) {
      this.getPrices();
      return;
    }
    _.forEach(this.coins, (coin, i) => {
      this.exchangeRatesProvider
        .getCurrentRate(this.isoCode, coin.unitCode)
        .subscribe(
          response => {
            this.coins[i].historicalRates.unshift(response);
            this.updateValues(i);
          },
          err => {
            this.logger.error('Error getting current rate yyy:', err);
          }
        );
    });
  }

  private updateValues(i: number) {
    this.coins[i].currentPrice = this.coins[i].historicalRates[0].data.fundValue;
    this.coins[i].averagePriceAmount =
      this.coins[i].currentPrice -
      this.coins[i].historicalRates[this.coins[i].historicalRates.length - 1]
        .data.fundValue;
    this.coins[i].averagePrice =
      (this.coins[i].averagePriceAmount * 100) /
      this.coins[i].historicalRates[this.coins[i].historicalRates.length - 1]
        .data.fundValue;
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.isIsoCodeSupported = _.includes(this.fiatCodes, alternativeIsoCode);
    this.isoCode = this.isIsoCodeSupported ? alternativeIsoCode : 'USD';
  }

  public getDigitsInfo(coin: string) {
    switch (coin) {
      case 'xrp':
        return '1.4-4';
      default:
        return '1.4-4';
    }
  }
}
