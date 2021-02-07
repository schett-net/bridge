/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import { ApolloQueryResult, FetchResult } from "@apollo/client";

/**
 * Graphql Client Types:
 *
 * This sections includes types used by @see GraphqlClient.
 */

/**
 *  @type  Defines the types of a mutation and query response.
 */
export type RequestHeaders = {
  Authorization?: string;
  [key: string]: any;
};

export type Variables = {
  [key: string]: any;
};

export type GraphqlResult<T> =
  | FetchResult<T, Record<string, any>, Record<string, any>>
  | ApolloQueryResult<T>;

export type GraphqlOptions = {
  headers: RequestHeaders;
};

/**
 * Graphql API Types:
 *
 * This sections includes types used by @see workflow.
 */

// ====================================================
// GraphQL mutation operation: tokenAuth
// ====================================================

export interface tokenAuth_tokenAuth_user {
  username: string;
}

export interface tokenAuth_tokenAuth {
  payload: any;
  refreshExpiresIn: number;
  user: tokenAuth_tokenAuth_user;
  token: string;
  refreshToken: string;
}

export interface tokenAuth {
  tokenAuth: tokenAuth_tokenAuth | null;
}

export interface tokenAuthVariables {
  username: string;
  password: string;
}

// ====================================================
// GraphQL mutation operation: refreshToken
// ====================================================

export interface refreshToken_refreshToken {
  payload: {
    username: string;
    exp: number;
    origIat: number;
  };
  token: string;
  refreshToken: string;
}

export interface refreshToken {
  refreshToken: refreshToken_refreshToken | null;
}

export interface refreshTokenVariables {
  refreshToken?: string | null;
}

// ====================================================
// GraphQL mutation operation: revokeToken
// ====================================================

export interface revokeToken_revokeToken {
  revoked: number;
}

export interface revokeToken {
  revokeToken: revokeToken_revokeToken | null;
}

export interface revokeTokenVariables {
  refreshToken?: string | null;
}

// ====================================================
// GraphQL query operation: me
// ====================================================

export interface me_me_user {
  username: string;
}

export interface me_me {
  id: string | null;
  user: me_me_user | null;
}

export interface me {
  me: me_me | null;
}

export interface meVariables {
  token: string;
}
