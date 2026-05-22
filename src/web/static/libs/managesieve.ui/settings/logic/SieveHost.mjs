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

import { SieveCustomHost } from "./SieveAbstractHost.mjs";

const CONFIG_KEEP_ALIVE_INTERVAL = "keepalive";
// eslint-disable-next-line no-magic-numbers
const ONE_MINUTE = 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * ONE_MINUTE;

const HTTP_PROTOCOL = "http:";
const HTTP_PORT = 80;

const HTTPS_PROTOCOL = "https:";
const HTTPS_PORT = 443;

const CONFIG_HOSTNAME = "hostname";
const CONFIG_DISPLAY_NAME = "host.displayName";
const CONFIG_FINGERPRINT = "host.fingerprint";

/**
 * Web host settings: browser WebSocket to the proxy, ManageSieve backend configurable.
 */
class SieveWebSocketHost extends SieveCustomHost {

  /**
   * Seeds local settings from the server-provided defaults when unset.
   */
  async ensureDefaults() {
    const config = this.account.getConfig();
    const server = this.account.getServerConfig();

    if (!await config.getString(CONFIG_HOSTNAME, null) && server.sieveHost)
      await this.setHostname(server.sieveHost);

    const storedPort = await config.getValue("port");
    if ((storedPort === null || storedPort === "") && server.sievePort)
      await this.setPort(String(server.sievePort));

    if (!await config.getString(CONFIG_DISPLAY_NAME, null) && server.displayname)
      await this.setDisplayName(server.displayname);
  }

  /**
   * @inheritdoc
   */
  async getDisplayName() {
    await this.ensureDefaults();
    return await this.account.getConfig().getString(
      CONFIG_DISPLAY_NAME, this.account.getServerConfig().displayname);
  }

  /**
   * @inheritdoc
   */
  async setDisplayName(value) {
    await this.account.getConfig().setString(CONFIG_DISPLAY_NAME, value);
    return this;
  }

  /**
   * ManageSieve server hostname (passed to the proxy).
   *
   * @inheritdoc
   */
  async getHostname() {
    await this.ensureDefaults();
    return await this.account.getConfig().getString(
      CONFIG_HOSTNAME, this.account.getServerConfig().sieveHost || "");
  }

  /**
   * @param {string} hostname
   * @returns {SieveWebSocketHost}
   */
  async setHostname(hostname) {
    await this.account.getConfig().setString(CONFIG_HOSTNAME, hostname);
    return this;
  }

  /**
   * Browser WebSocket hostname (same origin as the page).
   *
   * @returns {string}
   */
  async getProxyHostname() {
    return window.location.hostname;
  }

  /**
   * Browser WebSocket port.
   *
   * @returns {string}
   */
  async getProxyPort() {
    const port = window.location.port;
    if (port !== "")
      return port;

    if (window.location.protocol === HTTP_PROTOCOL)
      return String(HTTP_PORT);

    if (window.location.protocol === HTTPS_PROTOCOL)
      return String(HTTPS_PORT);

    throw new Error("Failed to retrieve server port");
  }

  /**
   * @inheritdoc
   */
  async getKeepAlive() {
    return await this.account.getConfig().getInteger(
      CONFIG_KEEP_ALIVE_INTERVAL, FIVE_MINUTES);
  }

  /**
   * @param {int} value
   * @returns {SieveWebSocketHost}
   */
  async setKeepAlive(value) {
    await this.account.getConfig().setInteger(CONFIG_KEEP_ALIVE_INTERVAL, value);
    return this;
  }

  /**
   * @inheritdoc
   */
  async getFingerprint() {
    return await this.account.getConfig().getString(CONFIG_FINGERPRINT, "");
  }

  /**
   * @param {string} value
   * @returns {SieveWebSocketHost}
   */
  async setFingerprint(value) {
    await this.account.getConfig().setString(CONFIG_FINGERPRINT, value);
    return this;
  }

  /**
   * WebSocket path including ManageSieve backend query parameters.
   *
   * @returns {string}
   */
  async getEndpoint() {
    const backendHost = encodeURIComponent(await this.getHostname());
    const backendPort = await this.getPort();
    const path = `/${this.account.getServerConfig().endpoint}`;

    return `${path}?sieveHost=${backendHost}&sievePort=${backendPort}`;
  }

  /**
   * @inheritdoc
   */
  async getUrl() {
    return `sieve://${await this.getProxyHostname()}:${await this.getProxyPort()}${await this.getEndpoint()}`;
  }
}

export { SieveWebSocketHost as SieveHost };
