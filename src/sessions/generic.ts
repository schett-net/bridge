/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import Cookies from 'js-cookie'

const isWindow = typeof window !== 'undefined'

/**
 * @class A general Session with token functionality.
 *
 * Depending on whether in the browser or as a node server, cookies are used to
 * store tokens.
 */
export default class Session {
  sessions: {[id: string]: Session} = {}
  tokenName: string = 'token'
  refreshTokenName: string = 'refresh'
  _token: string | undefined = undefined
  _refreshToken: string | undefined = undefined

  static tokenStorageAdapter = {
    getToken: async (self: Session) => {
      if (isWindow) {
        return Cookies.get(self.tokenName)
      } else {
        return self._token
      }
    },
    setToken: async (self: Session, value: string | undefined) => {
      if (isWindow) {
        if (value) {
          Cookies.set(self.tokenName, value ? value : '', {
            sameSite: 'Lax',
            /* Expire time is set to 4 minutes */
            expires: 4 / 1440
          })
        } else {
          Cookies.remove(self.tokenName)
        }
      } else {
        self._token = value
      }
    },
    getRefreshToken: async (self: Session) => {
      if (isWindow) {
        return Cookies.get(self.refreshTokenName)
      } else {
        return self._refreshToken
      }
    },
    setRefreshToken: async (self: Session, value: string | undefined) => {
      if (isWindow) {
        if (value) {
          Cookies.set(self.refreshTokenName, value ? value : '', {
            sameSite: 'Lax',
            /* Expire time is set to 6 days */
            expires: 6
          })
        } else {
          Cookies.remove(self.refreshTokenName)
        }
      } else {
        self._refreshToken = value
      }
    }
  }

  /**
   * Initializes a base Session.
   *
   * @constructor
   * @author Nico Schett <contact@schett.net>
   * @param {string} sId Session identifier
   */
  constructor(private sId: string) {}

  //> Getter
  /**
   * Get token from cookies.
   *
   * @returns {Promise<string | null | undefined>} A users JWT if set
   */
  async getToken(): Promise<string | null | undefined> {
    return Session.tokenStorageAdapter.getToken(this)
  }

  /**
   * Get refresh token from cookies.
   *
   * @returns {Promise<string | null | undefined>} A users JWT if set
   */
  async getRefreshToken(): Promise<string | null | undefined> {
    return Session.tokenStorageAdapter.getRefreshToken(this)
  }

  //> Setter
  /**
   * Write token to cookies.
   *
   * @param {string | undefined} value A users JWT
   * @description Saves the current token to cookies. If the value is undefined,
   *              the cookie will be removed.
   */
  async setToken(value: string | undefined) {
    return Session.tokenStorageAdapter.setToken(this, value)
  }

  /**
   * Write refresh token to cookies.
   *
   * @param {string | undefined} value A users JWT refresh token
   * @description Saves the current refresh token to cookies. If the value
   *              is undefined, the cookie will be removed. The expire time is
   *              set to six days.
   */
  async setRefreshToken(value: string | undefined) {
    return Session.tokenStorageAdapter.setRefreshToken(this, value)
  }

  //> Methods

  /**
   * Add a subSession to a session.
   *
   * @param childSId The session name of the child
   * @param {any} type Specify the session (Session | string)
   * @param permanent True if not set
   */
  addSubSession<S, E, T>(childSId: string, Cls: any, endpoint: E, template: T) {
    let session: S = new Cls(this.sId + '_' + childSId, endpoint, template)

    return session
  }
}
