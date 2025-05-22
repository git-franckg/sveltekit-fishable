import type { Fishable } from '../index.js';
import type { GeoProvider } from './index.js';
import type { IncomingRequestCfPropertiesGeographicInformation } from '@cloudflare/workers-types';
import { getByIso2 } from '@git-franckg/countries';
import type { CountryIso2 } from '@git-franckg/countries';

type CfRequest = Request & { cf: IncomingRequestCfPropertiesGeographicInformation };

export const Cloudflare: GeoProvider = {
  available(_building, { request }) {
    const cfReq = request as CfRequest;
    return Boolean(cfReq.cf) && typeof cfReq.cf === 'object';
  },

  async provide(event) {
    const { cf } = event.request as CfRequest;

    const ip = event.getClientAddress(),
      countryIso2 = cf.country,
      postalCode = cf.postalCode,
      city = cf.city;
    // const ip = headers.get('cf-connecting-ip'),
    //   countryIso2 = headers.get('cf-ipcountry'),
    //   postalCode = headers.get('cf-postal-code'),
    //   city = headers.get('cf-ipcity');

    if (!ip) throw new Error('Missing CF-Connecting-IP');
    else if (!countryIso2) throw new Error('Cloudflare "IP geolocation" is required.');
    // Le code postal et la ville sont pas toujours disponible.
    // else if (!postalCode || !city) throw new Error('Cloudflare "Add visitor location headers" is required. Client IP: ' + ip);

    if (countryIso2 == 'T1') throw new Error('Client IP is Tor.');
    else if (!countryIso2) throw new Error('Client IP country is unknown.');

    return {
      ip,
      countryIso3: getByIso2(countryIso2 as CountryIso2).iso3,
      postalCode,
      city
    } satisfies Fishable<unknown>['geo'];
  }
};
