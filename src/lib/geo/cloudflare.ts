import type { Fishable } from '../index.js';
import type { GeoProvider } from './index.js';
import { getByIso2 } from '@git-franckg/countries';
import type { CountryIso2 } from '@git-franckg/countries';
import ipaddr from 'ipaddr.js';

// https://www.cloudflare.com/ips-v6/#
const CF_CIDRS_IPV6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32'
].map((cidr) => ipaddr.parseCIDR(cidr));

// https://www.cloudflare.com/ips-v4/#
const CF_CIDRS_IPV4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22'
].map((cidr) => ipaddr.parseCIDR(cidr));

export const Cloudflare: GeoProvider = {
  available(building, event) {
    if (building) return false;
    const ip = ipaddr.parse(event.getClientAddress());
    const cidrs = ip instanceof ipaddr.IPv4 ? CF_CIDRS_IPV4 : CF_CIDRS_IPV6;
    return cidrs.some((cidr) => ip.match(cidr));
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
