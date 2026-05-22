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


import { SieveAbstractAccountUI } from "./SieveAbstractAccountUI.mjs";

import { SieveServerSettingsUI } from "./../settings/ui/SieveServerSettingsUI.mjs";
import { SieveCredentialSettingsUI } from "./../settings/ui/SieveCredentialSettingsUI.mjs";

/**
 * A UI renderer for a sieve account
 */
class SieveWebAccountUI extends SieveAbstractAccountUI {

  /**
   * @inheritdoc
   */
  async renderSettings() {

    await super.renderSettings();

    const elm = document.querySelector(`#siv-account-${this.id} .sieve-settings-content`);

    if (elm.querySelector(".sieve-account-edit-server")) {
      elm.querySelector(".sieve-account-edit-server")
        .addEventListener("click", () => { this.showServerSettings(); });
    }

    if (elm.querySelector(".sieve-account-edit-credentials")) {
      const btn = elm.querySelector(".sieve-account-edit-credentials");
      const settings = await this.send("account-get-settings");
      if (!settings.canAuthenticate)
        btn.classList.add("d-none");
      btn.addEventListener("click", () => { this.showCredentialSettings(); });
    }
  }

  /**
   * Shows the server settings dialog.
   */
  async showServerSettings() {

    await (new SieveServerSettingsUI(this)).show();

    await this.renderSettings();

    document
      .querySelector(`#siv-account-${this.id} .siv-account-name`)
      .textContent = await this.send("account-get-displayname");
  }

  /**
   * Shows the credential settings dialog.
   */
  async showCredentialSettings() {

    await (new SieveCredentialSettingsUI(this)).show();
    await this.renderSettings();
  }

}

export { SieveWebAccountUI as SieveAccountUI };
