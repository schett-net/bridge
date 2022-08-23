/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import {DocumentNode} from 'graphql'

import GraphqlClient from '../graphql/client'
import {
  tokenAuth_tokenAuth,
  tokenAuth_tokenAuth_user,
  Variables
} from '../types'
import * as workflows from '../workflows/bifrost'
import Session from './generic'

type SessionBeginType = tokenAuth_tokenAuth_user & {anonymous: boolean}

/**
 * @class The bifrost session guarantees session awareness to a bifrost API.
 * @see https://github.com/snek-shipyard/bifrost
 */
export default class BifrostSession extends Session {
  client: GraphqlClient
  refreshInterval: NodeJS.Timeout | undefined
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
      resolveAnonymous?: BifrostSession['options']['resolveAnonymous']
      workflows?: Partial<BifrostSession['options']['workflows']>
    }>
  ) {
    super(sId)

    this.client = client
    this.tokenName = sId + '-' + this.tokenName
    this.refreshTokenName = sId + '-' + this.refreshTokenName

    if (options) {
      this.options = {
        ...this.options,
        ...options,
        workflows: {
          ...this.options.workflows,
          ...options.workflows
        }
      }
    }
  }

  //> Setter
  /**
   * Write
   *
   * @param {string | undefined} value A users JWT
   * @description Save the token to the client authorization header and call
   *              super.
   */
  set token(value: string | undefined) {
    if (value) {
      this.client.headers.Authorization = `JWT ${value}`
    } else {
      delete this.client.headers.Authorization
    }
    super.token = value
  }
  set refreshToken(value: string | undefined) {
    super.refreshToken = value
  }
  //> Getter
  get token() {
    const token = super.token

    // Hand over token to client. This is needed when the token is only available
    // by getter but not in current session context.
    if (token) {
      this.client.headers.Authorization = `JWT ${token}`
    }

    return token
  }
  get refreshToken() {
    return super.refreshToken
  }

  //> Methods
  /**
   * Begin session.
   *
   * @param {string} user A User defined by username and password
   * @returns {Promise<??>} A SNEKAuth object
   */
  async begin<T extends {}>(user?: {
    username: string
    password: string
  }): Promise<(SessionBeginType & T) | undefined> {
    const {refreshTokens, resolveMe, makeTokens} = this.options.workflows

    let username: string
    let password: string
    let anonymous: boolean

    if (user) {
      username = user.username
      password = user.password
      anonymous = false
    } else {
      // trigger workflow
      const refreshSuccess = await refreshTokens(this)

      if (!refreshSuccess) {
        username = 'cisco'
        password = 'ciscocisco'
        anonymous = true

        if (this.options.resolveAnonymous === false) {
          return <any>{
            anonymous,
            username
          }
        }
      } else {
        // resolve current token
        const me = await resolveMe(this)

        if (me?.username === 'cisco') {
          anonymous = true
        } else {
          anonymous = false
        }

        return <any>{anonymous, ...me}
      }
    }

    const auth = await makeTokens(this, username, password)

    if (auth) {
      this.token = auth?.token
      this.refreshToken = auth?.refreshToken

      return <any>{anonymous, ...auth?.user}
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
    const {revokeTokens} = this.options.workflows

    const revokeSuccess = await revokeTokens(this)

    if (revokeSuccess) {
      this.token = undefined
      this.refreshToken = undefined

      if (this.refreshInterval) clearInterval(this.refreshInterval)
    }

    return revokeSuccess
  }

  setRefreshTimer = (ms: number = 210000) => {
    const {refreshTokens} = this.options.workflows

    if (this.refreshInterval) clearInterval(this.refreshInterval)

    this.refreshInterval = setInterval(async () => {
      await refreshTokens(this)
    }, ms)
  }

  query = async <T>(data: DocumentNode, variables?: Variables) => {
    const {refreshTokens} = this.options.workflows

    if (!this.token && !(await refreshTokens(this))) {
      await this.begin()
    }

    return await this.client.query<T>(data, variables)
  }

  mutate = async <T>(data: DocumentNode, variables?: Variables) => {
    const {refreshTokens} = this.options.workflows

    if (!this.token && !(await refreshTokens(this))) {
      await this.begin()
    }

    return await this.client.mutate<T>(data, variables)
  }

  subscribe = async <T>(data: DocumentNode, variables?: Variables) => {
    const {refreshTokens} = this.options.workflows

    if (!this.token && !(await refreshTokens(this))) {
      await this.begin()
    }

    return this.client.subscribe<T>(data, variables)
  }
}
