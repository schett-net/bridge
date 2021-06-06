/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import { DocumentNode } from "graphql";

import GraphqlClient from "../graphql/client";
import {
  tokenAuth_tokenAuth,
  tokenAuth_tokenAuth_user,
  Variables,
} from "../types";
import * as workflows from "../workflows/bifrost";
import Session from "./generic";

type SessionBeginType = tokenAuth_tokenAuth_user & { anonymous: boolean };
type WorkflowMakeTokensType = tokenAuth_tokenAuth | null | undefined;
type WorkflowResolveMeType = tokenAuth_tokenAuth_user;

/**
 * @class The bifrost session guarantees session awareness to a bifrost API.
 * @see https://github.com/snek-shipyard/bifrost
 */
export default class BifrostSession extends Session {
  client: GraphqlClient;
  refreshInterval: NodeJS.Timeout | undefined;
  /**
   * Initializes a Bifrost session.
   *
   * @constructor
   * @param {string} sId A session name
   * @param {GraphqlClient} client A graphql client
   */
  constructor(sId: string, client: GraphqlClient) {
    super(sId);

    this.client = client;
    this.tokenName = sId + "-" + this.tokenName;
    this.refreshTokenName = sId + "-" + this.refreshTokenName;
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
      this.client.headers.Authorization = `JWT ${value}`;
    } else {
      delete this.client.headers.Authorization;
    }
    super.token = value;
  }
  set refreshToken(value: string | undefined) {
    super.refreshToken = value;
  }
  //> Getter
  get token() {
    const token = super.token;

    // Hand over token to client. This is needed when the token is only available
    // by getter but not in current session context.
    this.client.headers.Authorization = `JWT ${token}`;

    return token;
  }
  get refreshToken() {
    return super.refreshToken;
  }

  //> Methods
  /**
   * Begin session.
   *
   * @param {string} user A User defined by username and password
   * @returns {Promise<??>} A SNEKAuth object
   */
  async begin<T extends SessionBeginType>(
    user?: {
      username: string;
      password: string;
    },
    workflow?: {
      makeTokens?: (
        session: BifrostSession,
        username: string,
        password: string
      ) => Promise<WorkflowMakeTokensType>;
      resolveMe?: (session: BifrostSession) => Promise<WorkflowResolveMeType>;
    }
  ): Promise<T | undefined> {
    let username: string;
    let password: string;
    let anonymous: boolean;

    if (user) {
      username = user.username;
      password = user.password;
      anonymous = false;
    } else {
      // trigger workflow
      const refreshSuccess = await workflows.refreshTokens(this);

      if (!refreshSuccess) {
        username = "cisco";
        password = "ciscocisco";
        anonymous = true;
      } else {
        // resolve current token
        const me = await workflows.resolveMe(this);

        return <T>{ anonymous: false, ...me };
      }
    }

    const auth = await (workflow?.makeTokens || workflows.makeTokens)(
      this,
      username,
      password
    );

    if (auth) {
      this.token = auth?.token;
      this.refreshToken = auth?.refreshToken;

      return <T>{ anonymous, ...auth?.user };
    } else {
      throw Error("Authentication failed");
    }
  }

  /**
   * End session.
   *
   * @returns {Promise<boolean>} Revoke status.
   */
  async end(): Promise<boolean> {
    const revokeSuccess = await workflows.revokeTokens(this);

    if (revokeSuccess) {
      this.token = undefined;
      this.refreshToken = undefined;

      if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    return revokeSuccess;
  }

  setRefreshTimer = (ms: number = 210000) => {
    if (this.refreshInterval) clearInterval(this.refreshInterval);

    this.refreshInterval = setInterval(async () => {
      await workflows.refreshTokens(this);
    }, ms);
  };

  query = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin();
    }

    return await this.client.query<T>(data, variables);
  };

  mutate = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin();
    }

    return await this.client.mutate<T>(data, variables);
  };

  subscribe = async <T>(data: DocumentNode, variables?: Variables) => {
    if (!this.token && !(await workflows.refreshTokens(this))) {
      await this.begin();
    }

    return this.client.subscribe<T>(data, variables);
  };
}
