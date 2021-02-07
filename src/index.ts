/**
 * @license
 * Copyright Nico Schett. All Rights Reserved.
 *
 * Use of this source code is governed by an EUPL-1.2 license that can be found
 * in the LICENSE file at https://snek.at/license
 */

import GraphqlClient from "./graphql/client";
import BifrostSession from "./sessions/bifrost";

/**
 * @class The bifrost bridge establishes a connection to an bifrost.
 *
 *        @see GraphqlClient
 *        Sending custom queries/mutation is provided by the following API:
 *          - Send query: `this.client.sendQuery`.
 *          - Send mutation: `this.client.sendMutation`.
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
  client: GraphqlClient;
  session: BifrostSession;

  /**
   *
   * @param {string} url URL of bifrost API. E.g: `https://api.snek.at/graphql`
   * @param {string} sid Session identifier used for identifying cookies and to
   *                     avoid name collisions. E.g: `bifrost`
   */
  constructor(url: string, sid: string = "generic") {
    this.client = new GraphqlClient(new URL(url));
    this.session = new BifrostSession(sid + "-bifrost", this.client);
  }
}