import { getSelectedAccount, getSelectedNetwork, numToHexStr } from '@/utils/platform';
import { AbstractSigner, AddressLike, assertArgument, copyRequest, ethers, hashMessage, Provider, resolveAddress, resolveProperties, TransactionLike, TransactionRequest, TypedDataEncoder, VoidSigner } from "ethers"
import { mainNets } from '@/utils/networks';
import { PatronClient } from '@/client/patron_client';
import { LegacyTransaction, FeeMarketEIP1559Transaction, TypedTransaction } from '@ethereumjs/tx';
import { PrefixedHexString } from '@ethereumjs/util'
import { Common } from '@ethereumjs/common'
let provider: ethers.JsonRpcProvider | null = null

const bigIntMax = (...args: bigint[]) => args.reduce((m, e) => e > m ? e : m, BigInt(0))

export const getCurrentProvider = async () => {
    const network = await getSelectedNetwork()
    if (provider) {
        // check if the network has changed
        if (provider._getConnection().url !== network.rpc) {
            provider = new ethers.JsonRpcProvider(network.rpc, ethers.Network.from(network.chainId), { staticNetwork: true, batchMaxCount: 6, polling: false })
        }
        return { provider, network }
    }
    provider = new ethers.JsonRpcProvider(network.rpc, ethers.Network.from(network.chainId), { staticNetwork: true, batchMaxCount: 6, polling: false })
    return { provider, network }
}

export const getOptimismProvider = async () => {
    const network = mainNets[10]
    return new ethers.JsonRpcProvider(network.rpc, ethers.Network.from(network.chainId), { staticNetwork: true, batchMaxCount: 6, polling: false })
}

const convertReceipt = (receipt: ethers.TransactionReceipt | null) => {
    if (!receipt) return null
    const newReceipt = { ...receipt } as any
    newReceipt.transactionHash = newReceipt.hash
    newReceipt.blockNumber = numToHexStr(newReceipt.blockNumber)
    newReceipt.index = numToHexStr(newReceipt.index)
    newReceipt.transactionIndex = newReceipt.index
    newReceipt.cumulativeGasUsed = numToHexStr(newReceipt.cumulativeGasUsed)
    newReceipt.gasUsed = numToHexStr(newReceipt.gasUsed)
    newReceipt.gasPrice = numToHexStr(newReceipt.gasPrice)
    newReceipt.type = "0x2"
    newReceipt.status = numToHexStr(newReceipt.status)
    newReceipt.logs = receipt?.logs?.map((log: any) => {
        return {
            ...log,
            blockNumber: numToHexStr(log.blockNumber),
            logIndex: numToHexStr(log.index),
            transactionIndex: numToHexStr(log.transactionIndex),
            removed: false
        }
    })
    return newReceipt
}


export const signMsg = async (patronClient: PatronClient, msg: string) => {
    const account = await getSelectedAccount()
    return await patronClient.signMessage(account.address, hashMessage(msg.startsWith('0x') ? ethers.getBytes(msg) : msg), {})
}

export const signTypedData = async (patronClient: PatronClient, msg: string) => {
    const account = await getSelectedAccount()
    const parsedMsg = JSON.parse(msg)
    const types = {} as Record<string, any>
    for (const key in parsedMsg.types) {
        if (key !== 'EIP712Domain') {
            types[key] = parsedMsg.types[key]
        }
    }
    parsedMsg.types = types
    parsedMsg.domain, parsedMsg.types, parsedMsg.message
    const { provider } = await getCurrentProvider()
    const populated = await TypedDataEncoder.resolveNames(parsedMsg.domain, parsedMsg.types, parsedMsg.message, async (name: string) => {
        const address = await provider.resolveName(name);
        return address;
    });
    let messageHash = TypedDataEncoder.hash(populated.domain, types, populated.value)
    return await patronClient.signMessage(account.address, messageHash, {})
}

export const getBalance = async () => {
    const account = await getSelectedAccount()
    const { provider } = await getCurrentProvider()
    return await provider.getBalance(account.address)
}

export const getGasPrice = async () => {
    const { provider } = await getCurrentProvider()
    const feed = await provider.getFeeData()
    const gasPrices = [feed.gasPrice, feed.maxFeePerGas, feed.maxPriorityFeePerGas].filter(Boolean).map((p: any) => BigInt(p))
    const gasPriceFeed = bigIntMax(...gasPrices)
    const gasPrice = gasPriceFeed + (gasPriceFeed / BigInt(25))
    return {
        price: Number(gasPrice) / 1e9,
        feed
    }
}

export const getBlockNumber = async () => {
    const { provider } = await getCurrentProvider()
    return await provider.getBlockNumber()
}

export const getBlockByNumber = async (blockNum: number) => {
    const { provider } = await getCurrentProvider()
    return await provider.getBlock(blockNum)
}

export const estimateGas = async ({ to = '', from = '', data = '', value = '0x0' }: { to: string, from: string, data: string, value: string }) => {
    const { provider } = await getCurrentProvider()
    return await provider.estimateGas({ to, from, data, value })
}

export const evmCall = async (params: any[]) => {
    const tx = {} as { to: string, from: string, data: string, value: string, blockTag: string }
    const param1 = params[0] as any
    if (param1.to) tx.to = param1.to
    if (param1.from) tx.from = param1.from
    if (param1.data) tx.data = param1.data
    if (param1.value) tx.value = param1.value
    const param2 = params[1] as string
    if (param2.startsWith('0x')) {
        tx.blockTag = param2
    } else {
        tx.blockTag = 'latest'
    }

    const { provider } = await getCurrentProvider()
    const result = await provider.call(tx)
    return result
}

export const getTxByHash = async (hash: string) => {
    const { provider } = await getCurrentProvider()
    return await provider.getTransaction(hash)
}

export const getTxReceipt = async (hash: string) => {
    try {
        if (!hash) return null
        const { provider } = await getCurrentProvider()
        const receipt = await provider.getTransactionReceipt(hash)

        return convertReceipt(receipt)
    } catch (e) {
        console.error(e)
        return null
    }
}

export const getCode = async (addr: string) => {
    const { provider } = await getCurrentProvider()
    return await provider.getCode(addr)
}

export const getFromMnemonic = (mnemonic: string, index: number) => {
    const path = `m/44'/60'/0'/0/${index}`
    const mnemonicInst = ethers.Mnemonic.fromPhrase(mnemonic)
    const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonicInst, path)
    return wallet.privateKey
}

export const getTxCount = async (addr: string, block: null | string = null) => {
    const { provider } = await getCurrentProvider()
    if (block) {
        return await provider.getTransactionCount(addr, block)
    } else {
        return await provider.getTransactionCount(addr)
    }
}

export const getRandomPk = () => {
    return ethers.Wallet.createRandom().privateKey
}

export const sendTransaction = async (patronClient: PatronClient, { data = '', gas = '0x0', to = '', from = '', value = '', gasPrice = '0x0', supportsEIP1559 = true }:
    { to: string, from: string, data: string, value: string, gas: string, gasPrice: string, supportsEIP1559: boolean }) => {
    const account = await getSelectedAccount()
    const { provider } = await getCurrentProvider()
    
    const gasPriceInt = BigInt(gasPrice)
    const gasInt = BigInt(gas)

    if (gas === '0x0' || gasPrice === '0x0') {
        throw new Error('No gas estimate available')
    }
    let tx = supportsEIP1559 ? {
        to,
        from,
        data: data ? data : null,
        value: value ? value : null,
        gasLimit: gasInt,
        gasPrice: null,
        maxFeePerGas: gasPriceInt,
    } : {
            to,
            from,
            data: data ? data : null,
            value: value ? value : null,
            gasLimit: gasInt,
            gasPrice: gasPriceInt
        }
    let voidSigner = new VoidSigner(account.address, provider)
    const pop = await voidSigner.populateTransaction(tx)
    delete pop.from;
    let txObj: TypedTransaction
    if(pop.type == 2) {
        txObj = FeeMarketEIP1559Transaction.fromTxData({
            chainId: pop.chainId ? BigInt(pop.chainId) : null,            maxPriorityFeePerGas: pop.maxPriorityFeePerGas ? BigInt(pop.maxPriorityFeePerGas) : null,
            maxFeePerGas: pop.maxFeePerGas ? BigInt(pop.maxFeePerGas) : null,
            nonce: pop.nonce ? BigInt(pop.nonce) : null,
            gasLimit: pop.gasLimit ? BigInt(pop.gasLimit) : null,
            to: pop.to as PrefixedHexString,
            value: pop.value ? BigInt(pop.value) : null,
            data: pop.data ? pop.data as PrefixedHexString : null
        })
    } else {
        const v = pop.chainId ? (BigInt(35) +  BigInt(pop.chainId) * BigInt(2)) : null;
        txObj = LegacyTransaction.fromTxData({
            nonce: pop.nonce ? BigInt(pop.nonce) : null,
            gasLimit: pop.gasLimit ? BigInt(pop.gasLimit) : null,
            gasPrice: pop.gasPrice ? BigInt(pop.gasPrice) : null,
            to: pop.to as PrefixedHexString,
            value: pop.value ? BigInt(pop.value) : null,
            data: pop.data ? pop.data as PrefixedHexString : null,
            v
        })
    }
    
    let signedTransaction = await patronClient.signTransaction(account.address, ethers.hexlify(txObj.serialize()).slice(2), {})
    return await provider.broadcastTransaction('0x' + signedTransaction)
}

export const formatNumber = (num: number, digits = 0) => {
    return Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: digits
    }).format(num)
}


export const getSelectedAddress = async () => {
    // give only the selected address for better privacy
    const account = await getSelectedAccount()
    const address = account?.address ? [account?.address] : []
    return address
}