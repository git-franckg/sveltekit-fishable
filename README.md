# sveltekit-fishable

<span class="badge-npmversion"><a href="https://npmjs.org/package/@git-franckg/sveltekit-fishable" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@git-franckg/sveltekit-fishable.svg" alt="NPM version" /></a></span>

<span class="badge-npmdownloads"><a href="https://npmjs.org/package/@git-franckg/sveltekit-fishable" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@git-franckg/sveltekit-fishable.svg" alt="NPM downloads" /></a></span>


Fournit aux visiteurs un JWE (JWT encrypté) qui contient les informations des formulaires, le résultat de l'anti-bot ou encore la configuration de la boite rez (pour ne pas créer de sous-ndd mais plutôt ajouter du texte à la fin de l'URL).

## Installation

`npm install -D @git-franckg/sveltekit-fishable`

## Instructions d'utilisation

### Préparation

Il s'agit d'une librairie utilisable seulement côté serveur.
La solution la plus simple est de tout ré-exporté dans `src/lib/server`

`src/lib/server/fishable.ts`

```typescript
export * from '@git-franckg/sveltekit-fishable';
```

### Définir les informations stocker

En TypeScript, pour rendre le code plus fiable il faut "typé" la session.

`src/lib/server/fish.ts`

```typescript
// Les données à stocké dans la session.
export interface Fish {
  login?: {
    email: string;
    motDePasse: string;
  };
  billing?: {
    name: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  cc?: {
    num: string;
    exp: string;
    cvv: string;
  };
}

// La session qu'aura les nouveaux utilisateurs
export const initialFish: Fish = {};
```

`src/app.d.ts`

```typescript
import type { Fishable, Fisher  } from '$lib/server/fishable';
import type { Fish } from '$lib/server/fish';

declare global {
  namespace App {
    interface Locals {
      fisher: Fisher<Fish>;
      fish: Fishable<Fish>;
    }
  }
}

export {};
```

### Création de la session

`src/hooks.server.ts`

```typescript
import { building } from '$app/environment';
import { type Fish, Config } from '$lib/server/fish';
import { Fisher } from '$lib/server/fishable';

export const handle: Handle = async ({ event, resolve }) => {
  const fisher = (event.locals.fisher = new Fisher<Fish>(Config, { 
    // building est lorsque svelte prerender pour le rendre plus rapide.
    building,
    // event est la request
    event,
    // le nom du cookie, ne doit pas changé.
    cookieName: 'sess_1c3b3r9',
    // $(head -c 16 </dev/urandom | base64)
    secretKeyBase64: 'WBCA7qlG8gJo8DzvCR/frA==',
    setLocals: (newFish) => event.locals.fish = newFish
  }));
  const fish = (event.locals.fish = await fisher.handle());

  // fish.guard: 'deny' | 'challenge' | 'allow'
  if (fish.guard == 'deny') {
    // C'est un bot
    return fail(400);
  } else if (fish.guard == 'challenge') {
    // TODO: Captcha
    // return redirect(303, '/guard/challenge')
    fish.guard = 'allow';
  } else if (fish.guard == 'allow') {
    // Il est autorisé
  }

  return await resolve(event);
};
```

### Lecture & écriture de la session

`src/routes/+page.server.ts` (n'importe quel +page.server.ts ou +layout.server.ts)

```typescript
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = (event) => {
  const email = event.locals.fish.email
  return { email }
};

export const actions: Actions = {
  default: async (event) => {
    const form = await event.request.formData()
    const email = form.get('email')

    if (email && typeof email === 'string') {
      await event.locals.fisher.store({
        ...event.locals.fish,
        email: newEmail
      });
    }
  }
}
```

## Dépendencies

* [@git-franckg/countries](https://github.com/git-franckg/countries) - liste de tout les pays
* [ipaddr.js](https://github.com/whitequark/ipaddr.js) - savoir si une IP appartient à Cloudflare
* [jose](https://github.com/panva/jose) - Encryption/décryption JWE
* [ua-parser-js](https://github.com/faisalman/ua-parser-js) - lecture des User-Agent
* [uuid](https://github.com/uuidjs/uuid) - génère un UUIDv7 qui est l'id
