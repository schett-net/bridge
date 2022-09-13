/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import gql from "graphql-tag";

import BifrostSession from "../sessions/bifrost";
import {
  me,
  me_me,
  refreshToken,
  revokeToken,
  tokenAuth,
  tokenAuth_tokenAuth,
} from "../types";

// ====================================================
// Workflow tasks: Authentication System
// ====================================================

export const makeTokens = async (
  session: BifrostSession,
  username: string,
  password: string
): Promise<tokenAuth_tokenAuth | null | undefined> => {
  // Document of the refresh mutation
  const document = gql`
    mutation tokenAuth($username: String!, $password: String!) {
      tokenAuth(username: $username, password: $password) {
        token
        refreshToken
        user {
          username
        }
      }
    }
  `;

  const { data, errors } = await session.client.mutate<tokenAuth>(document, {
    username,
    password,
  });

  if (errors && errors.length > 0) return null;

  return data?.tokenAuth;
};

export const refreshTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!(await session.getRefreshToken())) return false;

  // Document of the refresh mutation
  const document = gql`
    mutation refreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        payload
        token
        refreshToken
      }
    }
  `;

  const { data, errors } = await session.client.mutate<refreshToken>(document, {
    refreshToken: await session.getRefreshToken(),
  });

  if (errors && errors.length > 0) return false;

  if (data?.refreshToken) {
    const { exp, origIat } = data.refreshToken.payload;

    session.setRefreshTimer((exp - origIat - 30) * 1000);

    await session.setToken(data.refreshToken.token);
    await session.setRefreshToken(data.refreshToken.refreshToken);

    return true;
  }

  return false;
};

export const revokeTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!(await session.getRefreshToken())) return false;

  // Document of the revoke mutation
  const document = gql`
    mutation revokeTokens($refreshToken: String!) {
      revokeToken(refreshToken: $refreshToken) {
        revoked
      }
    }
  `;

  const { data, errors } = await session.client.mutate<revokeToken>(document, {
    refreshToken: await session.getRefreshToken(),
  });

  if (errors && errors.length > 0) return false;

  if (data?.revokeToken?.revoked) {
    await session.setToken(undefined);
    await session.setRefreshToken(undefined);

    return true;
  }

  return false;
};

// ====================================================
// Workflow tasks: User
// ====================================================

export const resolveMe = async (
  session: BifrostSession
): Promise<me_me | undefined> => {
  // Document of the revoke mutation
  const document = gql`
    query me($token: String!) {
      me(token: $token) {
        username
      }
    }
  `;

  const { data, errors } = await session.query<me>(document, {
    token: await session.getToken,
  });

  if (errors && errors.length > 0) throw new Error(errors[0].message);
  if (data?.me) return data.me;
};
