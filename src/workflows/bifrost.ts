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

  const { data, errors } = await session.client.sendMutation<tokenAuth>(
    document,
    { username, password }
  );

  if (errors && errors.length > 0) return null;

  return data?.tokenAuth;
};

export const refreshTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!session.refreshToken) return false;

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

  const { data, errors } = await session.client.sendMutation<refreshToken>(
    document,
    { refreshToken: session.refreshToken }
  );

  if (errors && errors.length > 0) return false;

  if (data?.refreshToken) {
    const { exp, origIat } = data.refreshToken.payload;

    session.setRefreshTimer((exp - origIat - 30) * 1000);

    session.token = data.refreshToken.token;
    session.refreshToken = data.refreshToken.refreshToken;

    return true;
  }

  return false;
};

export const revokeTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!session.refreshToken) return false;

  // Document of the revoke mutation
  const document = gql`
    mutation revokeTokens($refreshToken: String!) {
      revokeToken(refreshToken: $refreshToken) {
        revoked
      }
    }
  `;

  const { data, errors } = await session.client.sendMutation<revokeToken>(
    document,
    { refreshToken: session.refreshToken }
  );

  if (errors && errors.length > 0) return false;

  if (data?.revokeToken?.revoked) {
    session.token = undefined;
    session.refreshToken = undefined;

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

  const { data, errors } = await session.sendQuery<me>(document, {
    token: session.token,
  });

  if (errors && errors.length > 0) throw new Error(errors[0].message);
  if (data?.me) return data.me;
};
