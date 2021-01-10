/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import Cookies from "js-cookie";

/**
 * @class A general Session with token functionality.
 *
 * Depending on whether in the browser or as a node server, cookies are used to
 * store tokens.
 */
export default class Session {
  sessions: { [id: string]: Session } = {};
  tokenName: string = "token";
  refreshTokenName: string = "refresh";
  _token: string | undefined = undefined;
  _refreshToken: string | undefined = undefined;

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
   * @returns {string | undefined} A users JWT if set
   */
  get token(): string | undefined {
    if (this.checkPlatform() === "WEB") {
      return Cookies.get(this.tokenName);
    } else {
      return this._token;
    }
  }

  /**
   * Get refresh token from cookies.
   *
   * @returns {string | undefined} A users JWT if set
   */
  get refreshToken(): string | undefined {
    if (this.checkPlatform() === "WEB") {
      return Cookies.get(this.refreshTokenName);
    } else {
      return this._token;
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
  set token(value: string | undefined) {
    if (this.checkPlatform() === "WEB") {
      if (value) {
        Cookies.set(this.tokenName, value ? value : "", {
          /* Expire time is set to 4 minutes */
          expires: 4 / 1440,
        });
      } else {
        Cookies.remove(this.tokenName);
      }
    } else {
      this._token = value;
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
  set refreshToken(value: string | undefined) {
    if (this.checkPlatform() === "WEB") {
      if (value) {
        Cookies.set(this.refreshTokenName, value ? value : "", {
          /* Expire time is set to 6 days */
          expires: 6,
        });
      } else {
        Cookies.remove(this.refreshTokenName);
      }
    } else {
      this._refreshToken = value;
    }
  }

  //> Methods
  /**
   * Check if bridge is used by node or web.
   */
  checkPlatform() {
    if (typeof window === "undefined") {
      return "NODE";
    } else {
      return "WEB";
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
    let session: S = new Cls(this.sId + "_" + childSId, endpoint, template);

    return session;
  }
}
