/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import gql from 'graphql-tag'

import BifrostSession from '../sessions/bifrost'
import {
  me_me,
  refreshToken,
  tokenAuth_tokenAuth,
  refreshToken_refreshToken,
  revokeToken_revokeToken
} from '../types'

export interface KanbonUser extends me_me {
  city: string
  country: string
  emailAddress: string
  emailVerified: boolean
  firstName: string
  lastLogoutAll: string
  lastName: string
  phoneNumber: string
  street1: string
  street2: string
  tmpPhoneNumber: string
  tmpEmailAddress: string
  zipCode: string
}

// ====================================================
// Workflow tasks: Authentication System
// ====================================================

export const makeTokens = async (
  session: BifrostSession,
  username: string,
  password: string
): Promise<tokenAuth_tokenAuth<KanbonUser> | null | undefined> => {
  // Document of the refresh mutation
  const document = gql`
    mutation userLogin($username: String!, $password: String!) {
      userLogin(username: $username, password: $password) {
        token
        refreshToken
        user {
          username
          city
          country
          emailAddress
          emailVerified
          firstName
          lastLogoutAll
          lastName
          phoneNumber
          street1
          street2
          tmpPhoneNumber
          tmpEmailAddress
          zipCode
        }
      }
    }
  `

  const {data, errors} = await session.client.mutate<{
    userLogin: tokenAuth_tokenAuth<KanbonUser>
  }>(document, {
    username,
    password
  })

  if (errors && errors.length > 0) return null

  return data.userLogin
}

export const refreshTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!(await session.getRefreshToken())) return false

  // Document of the refresh mutation
  const document = gql`
    mutation refreshToken($refreshToken: String!) {
      userRefreshToken(refreshToken: $refreshToken) {
        payload
        token
        refreshToken
      }
    }
  `

  const {data, errors} = await session.client.mutate<{
    userRefreshToken: refreshToken_refreshToken
  }>(document, {
    refreshToken: await session.getRefreshToken()
  })

  if (errors && errors.length > 0) return false

  if (data?.userRefreshToken) {
    const {exp, origIat} = data.userRefreshToken.payload

    session.setRefreshTimer((exp - origIat - 30) * 1000)

    await session.setToken(data.userRefreshToken.token)
    await session.setRefreshToken(data.userRefreshToken.refreshToken)

    return true
  }

  return false
}

export const revokeTokens = async (
  session: BifrostSession
): Promise<boolean> => {
  if (!(await session.getRefreshToken())) return false

  // Document of the revoke mutation
  const document = gql`
    mutation userLogout($refreshToken: String!) {
      userLogout(refreshToken: $refreshToken) {
        revoked
      }
    }
  `

  const {data, errors} = await session.client.mutate<{
    userLogout: revokeToken_revokeToken
  }>(document, {
    refreshToken: await session.getRefreshToken()
  })

  if (errors && errors.length > 0) return false

  if (data?.userLogout?.revoked) {
    await session.setToken(undefined)
    await session.setRefreshToken(undefined)

    return true
  }

  return false
}

// ====================================================
// Workflow tasks: User
// ====================================================

export const resolveMe = async (
  session: BifrostSession
): Promise<KanbonUser | undefined> => {
  // Document of the revoke mutation
  const document = gql`
    query userMe {
      userMe {
        username
        city
        country
        emailAddress
        emailVerified
        firstName
        lastLogoutAll
        lastName
        phoneNumber
        street1
        street2
        tmpPhoneNumber
        tmpEmailAddress
        zipCode
      }
    }
  `

  const {data, errors} = await session.query<{userMe: KanbonUser}>(document)

  if (errors && errors.length > 0) throw new Error(errors[0].message)
  if (data?.userMe) return data.userMe
}
