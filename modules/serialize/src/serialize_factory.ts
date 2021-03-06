// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
 * This public interface for serializing the AWS Encryption SDK Message Header Format
 * is provided for the use of the Encryption SDK for JavaScript only.  It can be used
 * as a reference but is not intended to be use by any packages other than the
 * Encryption SDK for JavaScript.
 *
 * See: https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/message-format.html#header-structure
 */

import { concatBuffers } from './concat_buffers'
import {
  IvLength,
  EncryptionContext,
  needs,
  EncryptedDataKey,
} from '@aws-crypto/material-management'
import { SequenceIdentifier } from './identifiers'
import { uInt16BE, uInt8, uInt32BE } from './uint_util'
import { MessageHeader } from './types'

export function serializeFactory(fromUtf8: (input: any) => Uint8Array) {
  return {
    frameIv,
    nonFramedBodyIv,
    headerAuthIv,
    frameHeader,
    finalFrameHeader,
    encodeEncryptionContext,
    serializeEncryptionContext,
    serializeEncryptedDataKeys,
    serializeEncryptedDataKey,
    serializeMessageHeader,
  }

  function frameIv(ivLength: IvLength, sequenceNumber: number) {
    /* Precondition: sequenceNumber must conform to the specification. i.e. 1 - (2^32 - 1)
     * The sequence number starts at 1
     * https://github.com/awslabs/aws-encryption-sdk-specification/blob/master/data-format/message-body.md#sequence-number
     */
    needs(
      sequenceNumber > 0 &&
        SequenceIdentifier.SEQUENCE_NUMBER_END >= sequenceNumber,
      'sequenceNumber out of bounds'
    )

    const buff = new Uint8Array(ivLength)
    const view = new DataView(buff.buffer, buff.byteOffset, buff.byteLength)
    view.setUint32(ivLength - 4, sequenceNumber, false) // big-endian
    return buff
  }

  function nonFramedBodyIv(ivLength: IvLength) {
    return frameIv(ivLength, 1)
  }

  function headerAuthIv(ivLength: IvLength) {
    return new Uint8Array(ivLength) // new Uint8Array is 0 filled by default
  }

  function frameHeader(sequenceNumber: number, iv: Uint8Array) {
    return concatBuffers(uInt32BE(sequenceNumber), iv)
  }

  function finalFrameHeader(
    sequenceNumber: number,
    iv: Uint8Array,
    contentLength: number
  ) {
    return concatBuffers(
      uInt32BE(SequenceIdentifier.SEQUENCE_NUMBER_END), // Final Frame identifier
      uInt32BE(sequenceNumber),
      iv,
      uInt32BE(contentLength)
    )
  }

  function encodeEncryptionContext(
    encryptionContext: EncryptionContext
  ): Uint8Array[] {
    return (
      Object.entries(encryptionContext)
        /* Precondition: The serialized encryption context entries must be sorted by UTF-8 key value. */
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
        .map((entries) => entries.map(fromUtf8))
        .map(([key, value]) =>
          concatBuffers(
            uInt16BE(key.byteLength),
            key,
            uInt16BE(value.byteLength),
            value
          )
        )
    )
  }

  function serializeEncryptionContext(encryptionContext: EncryptionContext) {
    const encryptionContextElements = encodeEncryptionContext(encryptionContext)

    /* Check for early return (Postcondition): If there is no context then the length of the _whole_ serialized portion is 0.
     * This is part of the specification of the AWS Encryption SDK Message Format.
     * It is not 0 for length and 0 for count.  The count element is omitted.
     */
    if (!encryptionContextElements.length) return uInt16BE(0)

    const aadData = concatBuffers(
      uInt16BE(encryptionContextElements.length),
      ...encryptionContextElements
    )
    const aadLength = uInt16BE(aadData.byteLength)
    return concatBuffers(aadLength, aadData)
  }

  function serializeEncryptedDataKeys(
    encryptedDataKeys: ReadonlyArray<EncryptedDataKey>
  ) {
    const encryptedKeyInfo = encryptedDataKeys.map(serializeEncryptedDataKey)

    return concatBuffers(
      uInt16BE(encryptedDataKeys.length),
      ...encryptedKeyInfo
    )
  }

  function serializeEncryptedDataKey(edk: EncryptedDataKey) {
    const { providerId, providerInfo, encryptedDataKey, rawInfo } = edk
    const providerIdBytes = fromUtf8(providerId)
    // The providerInfo is technically a binary field, so I prefer rawInfo
    const providerInfoBytes = rawInfo || fromUtf8(providerInfo)
    return concatBuffers(
      uInt16BE(providerIdBytes.byteLength),
      providerIdBytes,
      uInt16BE(providerInfoBytes.byteLength),
      providerInfoBytes,
      uInt16BE(encryptedDataKey.byteLength),
      encryptedDataKey
    )
  }

  function serializeMessageHeader(messageHeader: MessageHeader) {
    return concatBuffers(
      uInt8(messageHeader.version),
      uInt8(messageHeader.type),
      uInt16BE(messageHeader.suiteId),
      messageHeader.messageId,
      serializeEncryptionContext(messageHeader.encryptionContext),
      serializeEncryptedDataKeys(messageHeader.encryptedDataKeys),
      new Uint8Array([messageHeader.contentType]),
      new Uint8Array([0, 0, 0, 0]),
      uInt8(messageHeader.headerIvLength),
      uInt32BE(messageHeader.frameLength)
    )
  }
}
