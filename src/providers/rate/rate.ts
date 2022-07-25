import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { CoinsMap, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private alternatives;
  private rates = {} as CoinsMap<{}>;
  private ratesAvailable = {} as CoinsMap<boolean>;
  private rateServiceUrl = {} as CoinsMap<string>;
  private headers;

  private vclBasiAPIUrl = 'http://47.105.77.95:8081';
  private fiatRateAPIUrl = '/fundValue/latest';
  private masternodesAPIUrl = '/nodes/getPhoneNode';

  constructor(
    private currencyProvider: CurrencyProvider,
    private http: HttpClient,
    private logger: Logger
  ) {
    this.logger.debug('RateProvider initialized');
    this.headers = {"Auth": '9c7f69dcb2c24532da39bca5a290ff47', "Access-Control-Allow-Origin": '*'}
    this.logger.debug('RateProvider:' , this.headers);
    this.alternatives = {};
    for (const coin of this.currencyProvider.getAvailableCoins()) {
      this.rateServiceUrl[coin] = env.ratesAPI[coin];
      this.rates[coin] = { USD: 1 };
      this.ratesAvailable[coin] = false;
      this.updateRates(coin);
    }
  }

  public updateRates(chain: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCoin(chain)
        .then(dataCoin => {
          this.logger.info("dataCoin:" ,dataCoin)
          if( dataCoin.data && dataCoin.data.fundValue){
            this.rates[chain]['CNY'] = dataCoin.data.fundValue;
            this.alternatives['CNY'] = { name: 'CNY' };
          };
          this.ratesAvailable[chain] = true;
          resolve();
        })
        .catch(errorCoin => {
          this.logger.error(errorCoin);
          reject(errorCoin);
        });
    });
  }

  public getCoin(chain: string): Promise<any> {
    return new Promise(resolve => {
      this.logger.debug('getCoin:' , this.rateServiceUrl[chain]);
      this.http.get(this.rateServiceUrl[chain], {headers: this.headers} ).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string, opts?: { rates? }): number {
    const customRate =
      opts && opts.rates && opts.rates[chain] && opts.rates[chain][code];
    if (customRate) return customRate;
    if (this.rates[chain][code]) return this.rates[chain][code];
    if (
      !this.rates[chain][code] &&
      this.rates[chain]['USD'] &&
      this.rates['btc'][code] &&
      this.rates['btc']['USD'] &&
      this.rates['btc']['USD'] > 0
    ) {
      const newRate = +(
        (this.rates[chain]['USD'] * this.rates['btc'][code]) /
        this.rates['btc']['USD']
      ).toFixed(2);
      return newRate;
    }
    this.logger.warn(
      'There are no rates for chain: ' + chain + ' - code: ' + code
    );
    return undefined;
  }

  private getAlternatives(): any[] {
    const alternatives: any[] = [];
    for (let key in this.alternatives) {
      alternatives.push({ isoCode: key, name: this.alternatives[key].name });
    }
    return alternatives;
  }

  public isCoinAvailable(chain: string) {
    return this.ratesAvailable[chain];
  }

  public toFiat(
    satoshis: number,
    code: string,
    chain,
    opts?: { customRate?: number; rates? }
  ): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    const customRate = opts && opts.customRate;
    const rate = customRate || this.getRate(code, chain, opts);
    return (
      satoshis *
      (1 / this.currencyProvider.getPrecision(chain).unitToSatoshi) *
      rate
    );
  }

  public fromFiat(
    amount: number,
    code: string,
    chain,
    opts?: { rates? }
  ): number {
    if (!this.isCoinAvailable(chain)) {
      return null;
    }
    return (
      (amount / this.getRate(code, chain, opts)) *
      this.currencyProvider.getPrecision(chain).unitToSatoshi
    );
  }

  public listAlternatives(sort: boolean) {
    const alternatives = this.getAlternatives();
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(chain: string): Promise<any> {
    return new Promise(resolve => {
      if (this.ratesAvailable[chain]) resolve();
      else {
        if (chain) {
          this.updateRates(chain).then(() => {
            resolve();
          });
        }
      }
    });
  }

  public getHistoricFiatRate(
    currency: string,
    coin: string,
    ts: string
  ): Promise<any> {
    return new Promise(resolve => {
      const url =
        this.vclBasiAPIUrl + this.fiatRateAPIUrl;
      this.logger.debug('getHistoricFiatRate:' , url);
      this.http.get(url, {headers: this.headers}).subscribe(data => {
        resolve(data);
      });
    });
  }

  // john
  public getMachines(
      coin: string,
      phone: string,
  ): Promise<any> {
    return new Promise(resolve => {
      const url =
          this.vclBasiAPIUrl + this.masternodesAPIUrl + '?phone=' + phone;
      this.logger.debug('getMachines:', url, this.headers);
      this.http.get(url, {headers: this.headers}).subscribe(data => {
        resolve(data);
      });
    });
  }

}
