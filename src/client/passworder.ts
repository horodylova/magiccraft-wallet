import { Buffer } from 'buffer'
export class PassworderClient {
  constructor(private key: CryptoKey, private iv: Buffer) {


  }

  static async build(password: string, salt: string, iv: string, iterations: number): Promise<PassworderClient> {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw',
      Buffer.from(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    const key = await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt, 'hex'),
        iterations: iterations,
        hash: {
          name: 'SHA-512'
        }
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return new PassworderClient(key, Buffer.from(iv, 'hex'))
  }

  async encrypt(plainText: string): Promise<string> {
    const encoder = new TextEncoder();
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.iv },
      this.key,
      encoder.encode(plainText)
    );
    return Buffer.from(encrypted).toString('hex');
  }

  async decrypt(cipherText: string): Promise<string> {
    try {
      const decrypted = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: this.iv },
        this.key,
        Buffer.from(cipherText, 'hex')
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch(e) {
      console.error(e)
      throw e
    }
  }
}