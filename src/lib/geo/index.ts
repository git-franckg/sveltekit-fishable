import type { Fishable } from '../index.js';
import { Cloudflare } from './cloudflare.js';
import { Localhost } from './localhost.js';
import type { RequestEvent } from '@sveltejs/kit';

export interface GeoProvider {
  available(building: boolean, event: RequestEvent): boolean;
  provide(event: RequestEvent): Promise<Fishable<unknown>['geo']>;
}

export const GeoProviders: GeoProvider[] = [Cloudflare, Localhost];
