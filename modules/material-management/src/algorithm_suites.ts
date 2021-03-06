// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * This file contains information about particular algorithm suites used
 * within the encryption SDK.  In most cases, end-users don't need to
 * manipulate this structure, but it can occasionally be needed for more
 * advanced use cases, such as writing keyrings.
 *
 * Here we describe the overall shape of the Algorithm Suites used by the AWS Encryption
 * SDK for JavaScript.  Specific details for Node.js and WebCrypto can be found
 * in the respective files
 */

import { immutableClass } from './immutable_class'
import { needs } from './needs'

/* References to https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/algorithms-reference.html
 * These define the possible parameters for algorithm specifications that correspond
 * to the Node.js or WebCrypto environment.
 * These parameters are composed into an algorithm suite specification for each
 * environment in the respective files.
 */
export enum AlgorithmSuiteIdentifier {
  'ALG_AES128_GCM_IV12_TAG16' = 0x0014,
  'ALG_AES192_GCM_IV12_TAG16' = 0x0046,
  'ALG_AES256_GCM_IV12_TAG16' = 0x0078,
  'ALG_AES128_GCM_IV12_TAG16_HKDF_SHA256' = 0x0114,
  'ALG_AES192_GCM_IV12_TAG16_HKDF_SHA256' = 0x0146,
  'ALG_AES256_GCM_IV12_TAG16_HKDF_SHA256' = 0x0178,
  'ALG_AES128_GCM_IV12_TAG16_HKDF_SHA256_ECDSA_P256' = 0x0214,
  'ALG_AES192_GCM_IV12_TAG16_HKDF_SHA384_ECDSA_P384' = 0x0346,
  'ALG_AES256_GCM_IV12_TAG16_HKDF_SHA384_ECDSA_P384' = 0x0378,
}
Object.freeze(AlgorithmSuiteIdentifier)

export type AlgorithmSuiteName = keyof typeof AlgorithmSuiteIdentifier
export type AlgorithmSuiteTypeNode = 'node'
export type AlgorithmSuiteTypeWebCrypto = 'webCrypto'
export type NodeEncryption = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm'
export type WebCryptoEncryption = 'AES-GCM'
export type KDF = 'HKDF'
export type NodeHash = 'sha256' | 'sha384'
export type WebCryptoHash = 'SHA-256' | 'SHA-384'
export type NodeECDHCurve = 'prime256v1' | 'secp384r1'
export type WebCryptoECDHCurve = 'P-256' | 'P-384'
export type KeyLength = 128 | 192 | 256
export type IvLength = 12
export type TagLength = 128
/* eslint-disable @typescript-eslint/interface-name-prefix */
export interface IAlgorithmSuite
  extends Readonly<{
    /* eslint-enable @typescript-eslint/interface-name-prefix */
    id: AlgorithmSuiteIdentifier
    encryption: NodeEncryption | WebCryptoEncryption
    keyLength: KeyLength
    ivLength: IvLength
    tagLength: TagLength
    cacheSafe: boolean
    kdf?: KDF
    kdfHash?: NodeHash | WebCryptoHash
    signatureCurve?: NodeECDHCurve | WebCryptoECDHCurve
    signatureHash?: NodeHash | WebCryptoHash
  }> {}
/* eslint-disable @typescript-eslint/interface-name-prefix */
export interface INodeAlgorithmSuite extends IAlgorithmSuite {
  /* eslint-enable @typescript-eslint/interface-name-prefix */
  encryption: NodeEncryption
  kdfHash?: NodeHash
  signatureCurve?: NodeECDHCurve
  signatureHash?: NodeHash
}
/* eslint-disable @typescript-eslint/interface-name-prefix */
export interface IWebCryptoAlgorithmSuite extends IAlgorithmSuite {
  /* eslint-enable @typescript-eslint/interface-name-prefix */
  encryption: WebCryptoEncryption
  kdfHash?: WebCryptoHash
  signatureCurve?: WebCryptoECDHCurve
  signatureHash?: WebCryptoHash
}

export abstract class AlgorithmSuite implements IAlgorithmSuite {
  id!: AlgorithmSuiteIdentifier
  name!: AlgorithmSuiteName
  encryption!: NodeEncryption | WebCryptoEncryption
  keyLength!: KeyLength
  keyLengthBytes!: number
  ivLength!: IvLength
  tagLength!: TagLength
  cacheSafe!: boolean
  kdf?: KDF
  kdfHash?: NodeHash | WebCryptoHash
  signatureCurve?: NodeECDHCurve | WebCryptoECDHCurve
  signatureHash?: NodeHash | WebCryptoHash
  type!: AlgorithmSuiteTypeNode | AlgorithmSuiteTypeWebCrypto
  constructor(suite: INodeAlgorithmSuite | IWebCryptoAlgorithmSuite) {
    needs(
      this.constructor !== AlgorithmSuite,
      'new AlgorithmSuite is not allowed'
    )

    /* Precondition: A algorithm suite specification must be passed. */
    needs(suite, 'Algorithm specification not set.')
    /* Precondition: The Algorithm Suite Identifier must exist. */
    needs(
      AlgorithmSuiteIdentifier[suite.id],
      'No suite by that identifier exists.'
    )
    Object.defineProperty(this, 'keyLengthBytes', {
      get: () => this.keyLength / 8,
      enumerable: true,
    })
    Object.defineProperty(this, 'name', {
      get: () => AlgorithmSuiteIdentifier[this.id],
      enumerable: true,
    })
    Object.assign(this, suite)
  }
}
immutableClass(AlgorithmSuite)
