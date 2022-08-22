/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import 'isomorphic-fetch'

import ws from 'ws'
import {createUploadLink} from 'apollo-upload-client'
import {DocumentNode} from 'graphql'

import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
  split
} from '@apollo/client/core'
import {WebSocketLink} from '@apollo/client/link/ws'
import {getMainDefinition} from '@apollo/client/utilities'

import {
  GraphqlOptions,
  GraphqlResult,
  RequestHeaders,
  Variables
} from '../types'
import {specifier} from './specifier'

/**
 * @class Graphql client which provides query and mutation functionality.
 *        Through multiple link type uploading files is supported.
 *
 *        Through `errorPolicy: "all",` error awareness is guaranteed.
 *
 *        The `httpUrl` and `wsUrl` must follow the default format.
 *        @see `https://tools.ietf.org/html/rfc1630`
 *
 */
export default class GraphqlClient {
  //> Fields
  public headers: RequestHeaders
  private link: ApolloLink
  private cache: InMemoryCache
  private client: ApolloClient<NormalizedCacheObject>

  /**
   * @param httpUrl A http(s) url of a graphql endpoint
   * @param wsUrl A ws(s) url of a graphql endpoint
   * @param options Configuration options
   */
  constructor(
    httpUrl: URL,
    wsUrl: URL | undefined = undefined,
    options: GraphqlOptions = {headers: {}}
  ) {
    this.headers = options.headers

    try {
      this.cache = new InMemoryCache()
    } catch {
      //#ERROR
      throw new Error('An error occurred while initializing the cache!')
    }

    try {
      let apolloLink = createUploadLink({
        uri: httpUrl.toString(),
        headers: options.headers
      })

      if (wsUrl) {
        const wsLink = new WebSocketLink({
          uri: wsUrl.toString(),
          options: {
            reconnect: true
          },
          webSocketImpl: ws
        })

        apolloLink = split(
          ({query}) => {
            const definition = getMainDefinition(query)
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            )
          },
          wsLink,
          apolloLink
        )
      }

      this.link = ApolloLink.from([apolloLink])
    } catch (err) {
      throw new Error(
        `An error occurred while initializing the API link! ${err}`
      )
    }

    try {
      this.client = new ApolloClient({
        cache: this.cache,
        link: this.link
      })
    } catch {
      //#ERROR
      throw new Error('An error occurred while initializing the headers!')
    }
  }

  /**
   * Provides requests for graphql queries.
   *
   * @param {DocumentNode} data The query structure
   * @param {Variables} variables A object which contains variables for
   *                              the query structure.
   * @returns {Promise<GraphqlResult<T>>} Resolved apollo data object
   */
  async query<T>(
    data: DocumentNode,
    variables?: Variables
  ): Promise<GraphqlResult<T>> {
    return this.client.query<T>({
      query: specifier(data),
      errorPolicy: 'all',
      fetchPolicy: 'no-cache',
      variables,
      context: {
        context: {
          headers: this.headers
        }
      }
    })
  }

  /**
   * Provides requests for graphql mutations.
   *
   * @param {DocumentNode} data The query structure
   * @param {object} variables A object which contains variables for
   *                           the query structure.
   * @returns {Promise<GraphqlResult<T>>} Resolved apollo data object
   */
  async mutate<T>(
    data: DocumentNode,
    variables?: Variables
  ): Promise<GraphqlResult<T>> {
    return this.client.mutate<T>({
      mutation: data,
      errorPolicy: 'all',
      variables,
      context: {
        headers: this.headers
      }
    }) as Promise<GraphqlResult<T>>
  }

  /**
   * Provides requests for graphql subscriptions.
   *
   * @param {DocumentNode} data The query structure
   * @param {Variables} variables A object which contains variables for
   *                              the query structure.
   * @returns {Observable<GraphqlResult<T>>} Apollo data observable
   */
  subscribe<T>(data: DocumentNode, variables?: Variables) {
    return this.client.subscribe<T>({
      query: data,
      variables,
      context: {
        context: {
          headers: this.headers
        }
      }
    })
  }
}
