/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import Cookies from 'js-cookie'

const dynamicReactNative = 'react-native'
const dynamicReactNativeAsyncStorage =
  '@react-native-async-storage/async-storage'

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
    const platform = await this.checkPlatform()

    if (platform === 'WEB') {
      return Cookies.get(this.tokenName)
    } else if (platform === 'ANDROID' || platform === 'IOS') {
      const {default: AsyncStorage} = await import(
        `${dynamicReactNativeAsyncStorage}`
      )

      return await AsyncStorage.getItem(this.tokenName)
    } else {
      return this._token
    }
  }

  /**
   * Get refresh token from cookies.
   *
   * @returns {Promise<string | null | undefined>} A users JWT if set
   */
  async getRefreshToken(): Promise<string | null | undefined> {
    const platform = await this.checkPlatform()

    if (platform === 'WEB') {
      return Cookies.get(this.refreshTokenName)
    } else if (platform === 'ANDROID' || platform === 'IOS') {
      const {default: AsyncStorage} = await import(
        `${dynamicReactNativeAsyncStorage}`
      )

      return await AsyncStorage.getItem(this.refreshTokenName)
    } else {
      return this._refreshToken
    }
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
    const platform = await this.checkPlatform()

    if (platform === 'WEB') {
      if (value) {
        Cookies.set(this.tokenName, value ? value : '', {
          sameSite: 'Lax',
          /* Expire time is set to 4 minutes */
          expires: 4 / 1440
        })
      } else {
        Cookies.remove(this.tokenName)
      }
    } else if (platform === 'ANDROID' || platform === 'IOS') {
      const {default: AsyncStorage} = await import(
        `${dynamicReactNativeAsyncStorage}`
      )

      if (value) {
        await AsyncStorage.setItem(this.tokenName, value ? value : '')
      } else {
        await AsyncStorage.removeItem(this.tokenName)
      }
    } else {
      this._token = value
    }
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
    const platform = await this.checkPlatform()

    if (platform === 'WEB') {
      if (value) {
        Cookies.set(this.refreshTokenName, value ? value : '', {
          sameSite: 'Lax',
          /* Expire time is set to 6 days */
          expires: 6
        })
      } else {
        Cookies.remove(this.refreshTokenName)
      }
    } else if (platform === 'ANDROID' || platform === 'IOS') {
      const {default: AsyncStorage} = await import(
        `${dynamicReactNativeAsyncStorage}`
      )

      if (value) {
        await AsyncStorage.setItem(this.refreshTokenName, value ? value : '')
      } else {
        await AsyncStorage.removeItem(this.refreshTokenName)
      }
    } else {
      this._refreshToken = value
    }
  }

  //> Methods
  /**
   * Check if bridge is used by node or web.
   */
  async checkPlatform(): Promise<'WEB' | 'IOS' | 'ANDROID' | 'NODE'> {
    try {
      const {Platform} = await import(`${dynamicReactNative}`)

      if (Platform.OS === 'ios') {
        return 'IOS'
      } else if (Platform.OS === 'android') {
        return 'ANDROID'
      } else if (Platform.OS === 'web') {
        return 'WEB'
      } else {
        return 'NODE'
      }
    } catch {
      const isWeb = typeof window !== 'undefined'
      if (isWeb) {
        return 'WEB'
      }

      return 'NODE'
    }
  }
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
