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

/* global bootstrap */

import { SieveTemplate } from "./../../utils/SieveTemplate.mjs";

const SECURITY_NONE = 0;
const SECURITY_EXPLICIT = 1;
const SECURITY_IMPLICIT = 2;

/**
 * Credential settings dialog for the web client.
 */
class SieveCredentialSettingsUI {

  /**
   * Initializes the settings
   * @param {SieveAccount} account
   *   the account for which the settings edited.
   */
  constructor(account) {
    this.account = account;
  }

  /**
   * Sets the authentication type
   *
   * @param {string} type
   *   the authentication type which should be used
   * @returns {SieveCredentialSettingsUI}
   *   a self reference
   */
  setSaslMechanism(type) {

    const parent = this.getDialog();

    const text = parent
      .querySelector(".sieve-settings-authentication")
      .querySelector(`.dropdown-item[data-sieve-authentication="${type}"]`)
      .textContent;

    parent
      .querySelector(".sieve-settings-authentication button")
      .dataset.sieveAuthentication = type;

    parent
      .querySelector(".sieve-settings-authentication button")
      .textContent = text;

    return this;
  }

  /**
   * The authentication type which was selected
   *
   * @returns {string}
   *  authentication type
   */
  getSaslMechanism() {
    return this.getDialog()
      .querySelector(".sieve-settings-authentication button")
      .dataset.sieveAuthentication;
  }

  /**
   * Sets the username in the ui
   *
   * @param {string} username
   *   the username which should be set
   * @returns {SieveCredentialSettingsUI}
   *   a self reference
   */
  setAuthentication(username) {
    this.getDialog()
      .querySelector(".sieve-settings-username").value = username;

    return this;
  }

  /**
   * Gets the username from the ui.
   *
   * @returns {string}
   *   the username as string.
   */
  getAuthentication() {
    return this.getDialog()
      .querySelector(".sieve-settings-username").value;
  }

  /**
   * Selects the given authorization type in the dropdown control.
   *
   * @param {int|string} type
   *   the authorization type to be activated.
   * @returns {SieveCredentialSettingsUI}
   *   a self reference.
   */
  setAuthorizationType(type) {
    const dialog = this.getDialog();

    const text = dialog
      .querySelector(".sieve-settings-authorization")
      .querySelector(`.dropdown-item[data-sieve-authorization="${type}"]`)
      .textContent;

    dialog
      .querySelector(".sieve-settings-authorization button")
      .dataset.sieveAuthorization = type;

    dialog
      .querySelector(".sieve-settings-authorization button")
      .textContent = text;

    if (`${type}` === "3")
      dialog.querySelector(".sieve-settings-authorization-username").classList.remove("d-none");
    else
      dialog.querySelector(".sieve-settings-authorization-username").classList.add("d-none");

    return this;
  }

  /**
   * Gets the current authorization type set in the dropdown menu.
   *
   * @returns {string}
   *   the authorization type as string.
   */
  getAuthorizationType() {
    return this.getDialog()
      .querySelector(".sieve-settings-authorization button")
      .dataset.sieveAuthorization;
  }

  /**
   * Sets the authorization name.
   *
   * @param {string} username
   *   the username as which the current user should authorized
   * @returns {SieveCredentialSettingsUI}
   *   a self reference
   */
  setAuthorization(username) {
    this.getDialog()
      .querySelector(".sieve-settings-text-authorization-username").value = username;

    return this;
  }

  /**
   * Gets the authorization name from the ui.
   *
   * @returns {string}
   *   the authorized username.
   */
  getAuthorization() {
    return this.getDialog()
      .querySelector(".sieve-settings-text-authorization-username").value;
  }

  /**
   * Gets the current dialogs connection security settings.
   *
   * @returns {int}
   *   the connection security strategy to be used.
   */
  getConnectionSecurity() {

    if (this.getDialog().querySelector("#sieve-settings-encryption-off").checked)
      return SECURITY_NONE;

    if (this.getDialog().querySelector("#sieve-settings-handshake-implicit").checked)
      return SECURITY_IMPLICIT;

    return SECURITY_EXPLICIT;
  }

  /**
   * Sets the encryption settings in the current dialog.
   *
   * @param {int} security
   *   the connection security.
   *   Can be 0 for none, 1 for explicit tls and 2 for implicit tls
   * @returns {SieveCredentialSettingsUI}
   *   a self reference
   */
  setConnectionSecurity(security) {

    const parent = this.getDialog();

    if (security === SECURITY_NONE) {
      parent.querySelector("#sieve-settings-encryption-off").checked = true;
      parent.querySelector("#sieve-settings-handshake-explicit").checked = true;
      return this;
    }

    if (security === SECURITY_IMPLICIT) {
      parent.querySelector("#sieve-settings-encryption-on").checked = true;
      parent.querySelector("#sieve-settings-handshake-implicit").checked = true;
      return this;
    }

    parent.querySelector("#sieve-settings-encryption-on").checked = true;
    parent.querySelector("#sieve-settings-handshake-explicit").checked = true;
    return this;
  }

  /**
   * Shows the advanced setting
   */
  showAdvanced() {
    const parent = this.getDialog();

    parent.querySelector(".siv-settings-advanced").classList.remove("d-none");
    parent.querySelector(".siv-settings-show-advanced").classList.add("d-none");
    parent.querySelector(".siv-settings-hide-advanced").classList.remove("d-none");
  }

  /**
   * Hides the advanced settings
   */
  hideAdvanced() {
    const parent = this.getDialog();

    parent.querySelector(".siv-settings-advanced").classList.add("d-none");
    parent.querySelector(".siv-settings-show-advanced").classList.remove("d-none");
    parent.querySelector(".siv-settings-hide-advanced").classList.add("d-none");
  }

  /**
   * Shows the settings dialog
   *
   * @returns {Promise<void>}
   */
  async show() {

    document.querySelector("#ctx").append(
      await (new SieveTemplate()).load("./settings/ui/settings.credentials.html"));

    await this.render();

    const dialog = this.getDialog();
    const modal = new bootstrap.Modal(dialog);

    modal.show();

    dialog
      .querySelector(".sieve-settings-apply")
      .addEventListener("click", async () => {
        await this.save();
        modal.hide();
      });

    return await new Promise((resolve) => {

      dialog.addEventListener('hidden.bs.modal', () => {
        modal.dispose();
        dialog.remove();

        resolve();
      });

    });
  }

  /**
   * Validates and saves the setting before closing the dialog.
   */
  async save() {

    const settings = {
      general: {
        security: this.getConnectionSecurity(),
        sasl: this.getSaslMechanism()
      },
      authentication: {
        username: this.getAuthentication()
      },
      authorization: {
        username: this.getAuthorization(),
        mechanism: this.getAuthorizationType()
      }
    };

    await this.account.send("account-settings-set-credentials", settings);
  }

  /**
   * Returns the currents dialogs UI Element.
   *
   * @returns {HTMLElement}
   *   the dialogs UI elements.
   */
  getDialog() {
    return document.querySelector("#dialog-settings-credentials");
  }

  /**
   * Renders the UI element into the dom.
   */
  async render() {
    const parent = this.getDialog();

    const credentials = await this.account.send("account-setting-get-credentials");

    this.setConnectionSecurity(credentials.general.security);
    this.setSaslMechanism(credentials.general.sasl);

    this.setAuthentication(credentials.authentication.username);

    parent
      .querySelectorAll(".sieve-settings-authentication .dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", (event) => {
          this.setSaslMechanism(event.target.dataset.sieveAuthentication);
        });
      });

    this.setAuthorizationType(credentials.authorization.type);
    this.setAuthorization(credentials.authorization.username);

    parent
      .querySelectorAll(".sieve-settings-authorization .dropdown-item")
      .forEach((item) => {
        item.addEventListener("click", (event) => {
          this.setAuthorizationType(event.target.dataset.sieveAuthorization);
        });
      });

    parent
      .querySelector(".siv-settings-show-advanced")
      .addEventListener("click", () => { this.showAdvanced(); });

    parent
      .querySelector(".siv-settings-hide-advanced")
      .addEventListener("click", () => { this.hideAdvanced(); });

    this.hideAdvanced();
  }
}

export { SieveCredentialSettingsUI };
