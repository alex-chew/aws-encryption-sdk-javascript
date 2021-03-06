// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-env mocha */

import { expect } from 'chai'
import { KmsKeyringClass, KeyRingConstructible } from '../src/kms_keyring'
import { NodeAlgorithmSuite, Keyring } from '@aws-crypto/material-management'

describe('KmsKeyring: constructor', () => {
  it('set properties', () => {
    const clientProvider: any = () => {}
    const generatorKeyId =
      'arn:aws:kms:us-east-1:123456789012:alias/example-alias'
    const keyIds = ['arn:aws:kms:us-east-1:123456789012:alias/example-alias']
    const grantTokens = ['grant']

    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}

    const test = new TestKmsKeyring({
      clientProvider,
      generatorKeyId,
      keyIds,
      grantTokens,
    })
    expect(test.clientProvider).to.equal(clientProvider)
    expect(test.generatorKeyId).to.equal(generatorKeyId)
    expect(test.keyIds).to.deep.equal(keyIds)
    expect(test.grantTokens).to.equal(grantTokens)
    expect(test.isDiscovery).to.equal(false)
  })

  it('set properties for discovery keyring', () => {
    const clientProvider: any = () => {}
    const discovery = true

    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}

    const test = new TestKmsKeyring({ clientProvider, discovery })
    expect(test.clientProvider).to.equal(clientProvider)
    expect(test.generatorKeyId).to.equal(undefined)
    expect(test.keyIds).to.deep.equal([])
    expect(test.grantTokens).to.equal(undefined)
    expect(test.isDiscovery).to.equal(true)
  })

  it('Precondition: This is an abstract class. (But TypeScript does not have a clean way to model this)', () => {
    const clientProvider: any = () => {}
    const KmsKeyring = KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    )
    expect(() => new KmsKeyring({ clientProvider })).to.throw(
      'new KmsKeyring is not allowed'
    )
  })

  it('Precondition: A noop KmsKeyring is not allowed.', () => {
    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}
    const clientProvider: any = () => {}
    expect(() => new TestKmsKeyring({ clientProvider })).to.throw()
  })

  it('Precondition: A keyring can be either a Discovery or have keyIds configured.', () => {
    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}
    const clientProvider: any = () => {}
    const generatorKeyId =
      'arn:aws:kms:us-east-1:123456789012:alias/example-alias'
    const keyIds = ['arn:aws:kms:us-east-1:123456789012:alias/example-alias']
    const discovery = true
    expect(
      () =>
        new TestKmsKeyring({
          clientProvider,
          generatorKeyId,
          keyIds,
          discovery,
        })
    ).to.throw()
  })

  it('Precondition: All KMS key identifiers must be valid.', () => {
    const clientProvider: any = () => {}
    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}

    expect(
      () =>
        new TestKmsKeyring({
          clientProvider,
          generatorKeyId: 'Not arn',
        })
    ).to.throw()

    expect(
      () =>
        new TestKmsKeyring({
          clientProvider,
          keyIds: ['Not arn'],
        })
    ).to.throw()

    expect(
      () =>
        new TestKmsKeyring({
          clientProvider,
          keyIds: [
            'arn:aws:kms:us-east-1:123456789012:alias/example-alias',
            'Not arn',
          ],
        })
    ).to.throw()
  })

  it('An KMS CMK alias is a valid CMK identifier', () => {
    const clientProvider: any = () => {}
    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}

    const test = new TestKmsKeyring({
      clientProvider,
      generatorKeyId: 'alias/example-alias',
      keyIds: ['alias:example-alias'],
    })
    expect(test).to.be.instanceOf(TestKmsKeyring)
  })

  it('Precondition: clientProvider needs to be a callable function.', () => {
    class TestKmsKeyring extends KmsKeyringClass(
      Keyring as KeyRingConstructible<NodeAlgorithmSuite>
    ) {}
    const clientProvider: any = 'not function'
    const discovery = true
    expect(() => new TestKmsKeyring({ clientProvider, discovery })).to.throw()
  })
})
