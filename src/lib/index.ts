import { base64ToBytes } from './base64.js';
import { decrypt, encrypt } from './encryption.js';
import { GeoProviders } from './geo/index.js';
import type { CountryIso3 } from '@git-franckg/countries';
import type { RequestEvent } from '@sveltejs/kit';
import { UAParser, type IResult as UserAgent } from 'ua-parser-js';
import { v7 as uuidv7 } from 'uuid';

export type Fishable<T> = T & {
  _id: string;
  guard: 'deny' | 'challenge' | 'allow';
  geo: {
    ip: string;
    countryIso3: CountryIso3;
    postalCode?: string;
    city?: string;
  };
  ua: UserAgent;
};

export interface FisherOptions<T> {
  event: RequestEvent;
  building: boolean;
  cookieName: string;
  secretKeyBase64: string;
  getLocal: () => Fishable<T>;
}

const COOKIE_OPTS = { path: '/', expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 400) };

const FISHABLE_BUILDING: Fishable<{}> = {
  _id: 'building',
  guard: 'allow',
  ua: UAParser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.10 Safari/605.1.1'),
  geo: {
    ip: '90.1.2.4',
    countryIso3: 'FRA',
    postalCode: '75018',
    city: 'Paris'
  }
};

export class Fisher<T> {
  constructor(
    private initialValue: T,
    private opts: FisherOptions<T>
  ) {}

  private async createFishable(): Promise<Fishable<T>> {
    const { event, building } = this.opts;

    // On créer un nouveau cookie.

    const geo = await GeoProviders.find((provider) => provider.available(building, event))?.provide(event);
    if (!geo) throw new Error('No geo provider available.');

    const uaStr = event.request.headers.get('User-Agent');
    if (!uaStr) throw new Error('Client has no User-Agent.');
    const ua = UAParser(uaStr);

    return { ...this.initialValue, _id: uuidv7(), guard: 'challenge', geo, ua } satisfies Fishable<T>;
  }

  async handle(): Promise<Fishable<T>> {
    const { event, cookieName, building, secretKeyBase64 } = this.opts;

    if (building) {
      // Svelte fait du pre-rendering, c'est pas un vrai utilisateur et ça rendra le site plus rapide.
      return { ...this.initialValue, ...FISHABLE_BUILDING } satisfies Fishable<T>;
    }

    const jwe = event.cookies.get(cookieName);

    if (jwe) {
      const serialized = await decrypt(jwe, base64ToBytes(secretKeyBase64));
      if (serialized) return JSON.parse(serialized);
    }

    const value = await this.createFishable();
    await this.store();
    return value;
  }

  async store(): Promise<void> {
    const { cookieName, event, secretKeyBase64, getLocal } = this.opts;

    const jwe = await encrypt(JSON.stringify(getLocal()), base64ToBytes(secretKeyBase64));
    event.cookies.set(cookieName, jwe, COOKIE_OPTS);
  }
}
