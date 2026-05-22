/*
 * The content of this file is licensed. You may obtain a copy of
 * the license at https://github.com/thsmi/sieve/ or request it via
 * email from the author.
 *
 * Do not remove or change this comment.
 *
 * The initial author of the code is:
 *   Thomas Schmid <schmid-thomas@gmx.net>
 */

import { SieveAbstractAuthentication } from "./SieveAbstractAuthentication.mjs";

import { SieveIpcClient } from "./../../utils/SieveIpcClient.mjs";

const CONFIG_USERNAME = "auth.username";

/**
 * Client-side authentication for the web proxy.
 */
class SieveWebSocketAuthentication extends SieveAbstractAuthentication {

  /**
   * @inheritdoc
   */
  async getPassword() {

    const request = {
      "username": await this.getUsername(),
      "displayname": await (await this.account.getHost()).getDisplayName(),
      "remember": false
    };

    const credentials = await SieveIpcClient.sendMessage(
      "accounts", "account-show-authentication", request);

    return credentials.password;
  }

  /**
   * @inheritdoc
   */
  hasPassword() {
    return this.account.getServerConfig().authenticate;
  }

  /**
   * @inheritdoc
   */
  async getUsername() {
    const stored = await this.account.getConfig().getString(CONFIG_USERNAME, null);
    if (stored !== null && stored !== "")
      return stored;

    return this.account.getServerConfig().username;
  }

  /**
   * @param {string} username
   * @returns {SieveWebSocketAuthentication}
   */
  async setUsername(username) {
    await this.account.getConfig().setString(CONFIG_USERNAME, username);
    return this;
  }
}

export { SieveWebSocketAuthentication as SieveAuthentication };
