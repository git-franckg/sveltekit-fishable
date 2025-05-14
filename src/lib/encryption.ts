import { compactDecrypt, CompactEncrypt, type CompactJWEHeaderParameters } from 'jose';
import { JWEInvalid } from 'jose/errors';

// Secret key de 16-byte pour AES-128-GCM
type SecretKey = Uint8Array;

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

const HEADER: CompactJWEHeaderParameters = {
  alg: 'dir',
  enc: 'A128GCM'
};

export async function encrypt(plaintext: string, secretKey: SecretKey): Promise<string> {
  return await new CompactEncrypt(TEXT_ENCODER.encode(plaintext)).setProtectedHeader(HEADER).encrypt(secretKey);
}

export async function decrypt(ciphertext: string, secretKey: SecretKey): Promise<string | undefined> {
  try {
    const { plaintext } = await compactDecrypt(ciphertext, secretKey);
    return TEXT_DECODER.decode(plaintext);
  } catch (err: unknown) {
    if (err instanceof JWEInvalid) {
      // La secret key a dù changé
      return undefined;
    }
    throw err;
  }
}
