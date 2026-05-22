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

/**
 * Web credential settings (username override for client-side authentication).
 */
class SieveWebCredentialSettingsUI {

  /**
   * @param {SieveAccountUI} account
   *   the account for which the settings are edited.
   */
  constructor(account) {
    this.account = account;
  }

  /**
   * @param {string} username
   * @returns {SieveWebCredentialSettingsUI}
   */
  setUsername(username) {
    this.getDialog()
      .querySelector(".sieve-settings-username").value = username;
    return this;
  }

  /**
   * @returns {string}
   */
  getUsername() {
    return this.getDialog()
      .querySelector(".sieve-settings-username").value;
  }

  /**
   * @returns {HTMLElement}
   */
  getDialog() {
    return document.querySelector("#dialog-settings-credentials");
  }

  /**
   * Loads current credentials into the dialog.
   */
  async render() {
    const credentials = await this.account.send("account-setting-get-credentials");
    this.setUsername(credentials.authentication.username);
  }

  /**
   * Persists credential changes.
   */
  async save() {
    await this.account.send("account-settings-set-credentials", {
      authentication: {
        username: this.getUsername()
      }
    });
  }

  /**
   * Opens the credentials dialog.
   *
   * @returns {Promise<void>}
   */
  async show() {
    document.querySelector("#ctx").append(
      await (new SieveTemplate()).load("./settings/ui/settings.credentials.web.html"));

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
}

export { SieveWebCredentialSettingsUI };
