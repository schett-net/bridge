/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import {DocumentNode} from 'graphql'

import {
  tokenAuth_tokenAuth,
  tokenAuth_tokenAuth_user,
  Variables
} from '../types'
import * as workflows from '../workflows/kanbon'
import BifrostSession from './bifrost'

type SessionBeginType = tokenAuth_tokenAuth_user & {anonymous: boolean}
type WorkflowMakeTokensType = tokenAuth_tokenAuth | null | undefined
type WorkflowResolveMeType = tokenAuth_tokenAuth_user

/**
 * @class The bifrost session guarantees session awareness to the Kanbon API.
 * @see https://github.com/snek-shipyard/bifrost
 */
export default class KanbonSession extends BifrostSession {
  //> Methods
  /**
   * Begin session.
   *
   * @param {string} user A User defined by username and password
   * @returns {Promise<??>} A SNEKAuth object
   */
  async begin<T extends SessionBeginType>(
    user?: {
      username: string
      password: string
    },
    workflow?: {
      resolveAnonymous?: boolean
      makeTokens?: (
        session: BifrostSession,
        username: string,
        password: string
      ) => Promise<WorkflowMakeTokensType>
      resolveMe?: (session: BifrostSession) => Promise<WorkflowResolveMeType>
    }
  ): Promise<T | undefined> {
    let username: string
    let password: string
    let anonymous: boolean

    if (user) {
      username = user.username
      password = user.password
      anonymous = false
    } else {
      // trigger workflow
      const refreshSuccess = await workflows.refreshTokens(this)

      if (!refreshSuccess) {
        username = 'cisco'
        password = 'ciscocisco'
        anonymous = true

        if (workflow?.resolveAnonymous === false) {
          return <T>{
            anonymous,
            username
          }
        }
      } else {
        // resolve current token
        const me = await workflows.resolveMe(this)

        if (me?.username === 'cisco') {
          anonymous = true
        } else {
          anonymous = false
        }

        return <T>{anonymous, ...me}
      }
    }

    const auth = await (workflow?.makeTokens || workflows.makeTokens)(
      this,
      username,
      password
    )

    if (auth) {
      this.token = auth?.token
      this.refreshToken = auth?.refreshToken

      return <T>{anonymous, ...auth?.user}
    } else {
      throw Error('Authentication failed')
    }
  }

  /**
   * End session.
   *
   * @returns {Promise<boolean>} Revoke status.
   */
  async end(): Promise<boolean> {
    const revokeSuccess = await workflows.revokeTokens(this)

    if (revokeSuccess) {
      this.token = undefined
      this.refreshToken = undefined

      if (this.refreshInterval) clearInterval(this.refreshInterval)
    }

    return revokeSuccess
  }

  setRefreshTimer = (ms: number = 210000) => {
    if (this.refreshInterval) clearInterval(this.refreshInterval)

    this.refreshInterval = setInterval(async () => {
      await workflows.refreshTokens(this)
    }, ms)
  }

  query = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin()
    }

    return await this.client.query<T>(data, variables)
  }

  mutate = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin()
    }

    return await this.client.mutate<T>(data, variables)
  }

  subscribe = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin()
    }

    return this.client.subscribe<T>(data, variables)
  }
}
