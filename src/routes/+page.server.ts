import { building } from '$app/environment';
import { Fisher } from '$lib/index.js';
import type { Fish } from '../app.js';
import type { Actions, PageServerLoad } from './$types.js';
import type { RequestEvent } from '@sveltejs/kit';
import { toStore } from 'svelte/store';

const initialFish: Fish = {};

async function codeInsideHook(event: RequestEvent) {
  const fisher = (event.locals.fisher = new Fisher(initialFish, {
    building,
    cookieName: 'bb_on_sconnais_pas',
    event,
    secretKeyBase64: 'fXMJ0g5R0NOQ+7lSDK6rjA==',
    local: toStore(
      () => event.locals.fish,
      (val) => (event.locals.fish = val)
    )
  }));

  const fish = (event.locals.fish = await fisher.handle());

  if (fish.guard == 'deny') {
    throw new Error('c un bot');
  } else if (fish.guard == 'challenge') {
    // Normalement il faut le redirigé vers un captcha
    fish.guard = 'allow';
  } else if (fish.guard == 'allow') {
    // Okayyy
  }
}

export const load: PageServerLoad = async (event) => {
  await codeInsideHook(event);

  return {
    username: event.locals.fish.username
  };
};

export const actions: Actions = {
  default: async (event) => {
    await codeInsideHook(event);

    const formData = await event.request.formData(),
      username = formData.get('username');

    if (username && typeof username === 'string') {
      event.locals.fish.username = username;
      await event.locals.fisher.store();
    }
  }
};
