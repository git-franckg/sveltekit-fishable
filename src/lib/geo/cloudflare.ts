import type { Fishable } from '../index.js';
import type { GeoProvider } from './index.js';
import { getByIso2 } from '@git-franckg/countries';
import type { CountryIso2 } from '@git-franckg/countries';

export const Cloudflare: GeoProvider = {
  available(_building, event) {
    return event.request.headers.has('cf-connecting-ip');
  },

  async provide(event) {
    const { headers } = event.request;

    const ip = headers.get('cf-connecting-ip'),
      countryIso2 = headers.get('cf-ipcountry'),
      postalCode = headers.get('cf-postal-code'),
      city = headers.get('cf-ipcity');

    if (!ip) throw new Error('Missing CF-Connecting-IP');
    else if (!countryIso2) throw new Error('Cloudflare "IP geolocation" is required.');
    else if (!postalCode || !city) throw new Error('Cloudflare "Add visitor location headers" is required.');

    if (countryIso2 == 'T1') throw new Error('Client IP is Tor.');
    else if (countryIso2 == 'XX') throw new Error('Client IP country is unknown.');

    return {
      ip,
      countryIso3: getByIso2(countryIso2 as CountryIso2).iso3,
      postalCode,
      city
    } satisfies Fishable<unknown>['geo'];
  }
};
