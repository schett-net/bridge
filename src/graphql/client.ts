/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import { createUploadLink } from "apollo-upload-client";
import { DocumentNode } from "graphql";

import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";

import {
  GraphqlOptions,
  GraphqlResult,
  RequestHeaders,
  Variables,
} from "../types";

/**
 * @class Graphql client which provides query and mutation functionality.
 *        Through multiple link type uploading files is supported.
 *
 *        Through `errorPolicy: "all",` error awareness is guaranteed.
 *
 *        The `uri` must follow the default format.
 *        @see `https://tools.ietf.org/html/rfc1630`
 *
 */
export default class GraphqlClient {
  //> Fields
  public headers: RequestHeaders;
  private link: ApolloLink;
  private cache: InMemoryCache;
  private client: ApolloClient<NormalizedCacheObject>;

  /**
   * @param uri A uri of a graphql endpoint
   * @param options Configuration options
   */
  constructor(uri: URL, options: GraphqlOptions = { headers: {} }) {
    this.headers = options.headers;

    try {
      this.cache = new InMemoryCache();
    } catch {
      //#ERROR
      throw new Error("An error occurred while initializing the cache!");
    }

    try {
      const uploadLink = createUploadLink({
        uri: uri.toString(),
        headers: options.headers,
      });

      this.link = ApolloLink.from([uploadLink]);
    } catch {
      //#ERROR
      throw new Error("An error occurred while initializing the API link!");
    }

    try {
      this.client = new ApolloClient({
        cache: this.cache,
        link: this.link,
      });
    } catch {
      //#ERROR
      throw new Error("An error occurred while initializing the headers!");
    }
  }

  /**
   * Send: Provides requests for graphql queries.
   *
   * @param {DocumentNode} data The query structure
   * @param {Variables} variables A object which contains variables for
   *                           the query structure.
   * @param {RequestHeaders} headers Optional headers which get appended to
   *                         the endpoint headers.
   * @returns {Promise<GraphqlResult<T>>} Resolved apollo data object
   */
  async sendQuery<T>(
    data: DocumentNode,
    variables?: Variables,
    headers?: RequestHeaders
  ): Promise<GraphqlResult<T>> {
    console.log("CLIENT", this.client.query);
    return this.client.query<T>({
      query: data,
      errorPolicy: "all",
      fetchPolicy: "network-only",
      variables,
      context: {
        headers: { ...this.headers, ...headers },
      },
    });
  }

  /**
   * Send: Provides requests for graphql mutations.
   *
   * @param {DocumentNode} data The query structure
   * @param {Variables} variables A object which contains variables for
   *                           the query structure.
   * @param {RequestHeaders} headers Optional headers which get appended to
   *                         the endpoint headers.
   * @returns {Promise<GraphqlResult<T>>} Resolved apollo data object
   */
  async sendMutation<T>(
    data: DocumentNode,
    variables?: Variables,
    headers?: RequestHeaders
  ): Promise<GraphqlResult<T>> {
    return this.client.mutate<T>({
      mutation: data,
      errorPolicy: "all",
      variables,
      context: {
        headers: { ...this.headers, ...headers },
      },
    });
  }
}
