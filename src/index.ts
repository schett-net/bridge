/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import defaultConfig, { BridgeConfig } from "./bridge.config";
import GraphqlClient from "./graphql/client";
import BifrostSession from "./sessions/bifrost";

/**
 * @class The bifrost bridge establishes a connection to an bifrost.
 *
 *        @see GraphqlClient
 *        Sending custom queries/mutation is provided by the following API:
 *          - Send query: `this.client.query`.
 *          - Send mutation: `this.client.mutate`.
 *
 *        @see BifrostSession
 *        If there is a need for independently re-authenticate request the
 *        session client must be used: `this.session.client`.
 *
 *        Initiating the first authentication (login) is provided by
 *        `this.seession.begin()`.
 *
 */
export class BifrostBridge {
  static config: BridgeConfig = defaultConfig;
  client: GraphqlClient;
  session: BifrostSession;

  /**
   *
   * @param {string} url URL of bifrost API. E.g: `https://api.snek.at/graphql`
   * @param {string} sid Session identifier used for identifying cookies and to
   *                     avoid name collisions. E.g: `bifrost`
   */
  constructor(
    endpoints: {
      httpUrl: string;
      wsUrl?: string;
    },
    sid: string = "generic"
  ) {
    const httpUrl = new URL(endpoints.httpUrl);
    const wsUrl = endpoints.wsUrl ? new URL(endpoints.wsUrl) : undefined;

    this.client = new GraphqlClient(httpUrl, wsUrl);
    this.session = new BifrostSession(sid + "-bifrost", this.client);
  }
}
