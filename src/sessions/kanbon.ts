/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import GraphqlClient from '../graphql/client'

import * as workflows from '../workflows/kanbon'
import BifrostSession from './bifrost'

/**
 * @class The bifrost session guarantees session awareness to the Kanbon API.
 * @see https://github.com/snek-shipyard/bifrost
 */
export default class KanbonSession extends BifrostSession {
  options: {
    resolveAnonymous?: boolean
    workflows: typeof workflows
  } = {
    resolveAnonymous: true,
    workflows: {
      makeTokens: workflows.makeTokens,
      resolveMe: workflows.resolveMe,
      refreshTokens: workflows.refreshTokens,
      revokeTokens: workflows.revokeTokens
    }
  }

  /**
   * Initializes a Bifrost session.
   *
   * @constructor
   * @param {string} sId A session name
   * @param {GraphqlClient} client A graphql client
   */
  constructor(
    sId: string,
    client: GraphqlClient,
    options?: Partial<{
      resolveAnonymous?: KanbonSession['options']['resolveAnonymous']
      workflows?: Partial<KanbonSession['options']['workflows']>
    }>
  ) {
    super(sId, client, options)
  }
}
