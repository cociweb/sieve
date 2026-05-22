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

import { SieveAccount } from "./SieveAccount.mjs";
import { SieveAbstractAccounts } from "./SieveAbstractAccounts.mjs";

/**
 * Manages the configuration for sieve accounts loaded from the server config.
 */
class SieveAccounts extends SieveAbstractAccounts {

  /**
   * @inheritdoc
   */
  async load() {

    const items = await (await fetch("./config.json")).json();

    const accounts = {};

    for (const key of Object.keys(items)) {
      const account = new SieveAccount(key, items[key]);
      await account.getHost().ensureDefaults();
      accounts[key] = account;
    }

    this.accounts = accounts;
    return this;
  }

}

export { SieveAccounts };
