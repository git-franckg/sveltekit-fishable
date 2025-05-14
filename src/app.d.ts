// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Fishable, Fisher } from '$lib/index.ts';

export interface Fish {
  username?: string;
}

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      fisher: Fisher<Fish>;
      fish: Fishable<Fish>;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
