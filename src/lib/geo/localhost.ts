import type { Fishable } from '../index.js';
import type { GeoProvider } from './index.js';

export const Localhost: GeoProvider = {
  available(building, event) {
    if (building) {
      return true;
    } else {
      const ip = event.getClientAddress();
      return ip == '::1' || ip == '127.0.0.1';
    }
  },

  async provide() {
    return {
      ip: '::1',
      countryIso3: 'FRA',
      postalCode: '75018',
      city: 'Paris'
    } satisfies Fishable<unknown>['geo'];
  }
};
