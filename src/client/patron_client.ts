import axios, { AxiosResponse } from "axios";
import { PassworderClient } from "./passworder";

export class PatronClient {
  constructor(private endPoint: string, private uuid: string, private passworder: PassworderClient) {
  }
  private async request(path: string, data?: {[key: string]: any}) {
    let headers = {
      uuid: this.uuid
    }
    let cipherText = undefined
    if(data) {
      let plainText = JSON.stringify(data)
      cipherText = await this.passworder.encrypt(plainText)
    }

    let resp = await axios.post(`${this.endPoint}${path}`, cipherText, {
      headers: {
        ...headers,
        'Content-Type': 'text/plain'
      },
    })
    if(resp.status != 200) {
      throw new Error(resp.statusText)
    }
    if(resp.data.code) {
      throw new Error(resp.data.message)
    }
    let plainText = await this.passworder.decrypt(resp.data.data)
    try {
      let data = JSON.parse(plainText)
      return data
    } catch(e) {
      return plainText
    }
  }

  async getAccounts() {
    return await this.request('/getAccounts')
  }

  async signTransaction(address: string, transaction: string, opts: {[key: string]: any}): Promise<string> {
    return await this.request('/signTransaction', {
      address,
      transaction,
      opts
    })
  }

  async signMessage(address: string, data: string, opts: {[key: string]: any}): Promise<string> {
    return await this.request('/signMessage', {
      address,
      data,
      opts
    })
  }

  async signPersonalMessage(address: string, msgHex: string, opts: {[key: string]: any}): Promise<string> {
    return await this.request('/signPersonalMessage', {
      address,
      msgHex,
      opts
    })
  }

  async decryptMessage(address: string, version: string, nonce: string, ephemPublicKey: string, ciphertext: string): Promise<string> {
    return await this.request('/decryptMessage', {
      address,
      version,
      nonce,
      ephemPublicKey,
      ciphertext
    })
  }

  async getEncryptionPublicKey(address: string, opts: {[key: string]: any}): Promise<string> {
    return await this.request('/getEncryptionPublicKey', {
      address,
      opts
    })
  }

  async getAppKeyAddress(address: string, origin: string): Promise<string> {
    return await this.request('/getAppKeyAddress', {
      address,
      origin
    })
  }
}