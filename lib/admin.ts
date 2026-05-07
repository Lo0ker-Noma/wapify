/**
 * Admin / store-owner identity for the LaCrypta demo store.
 * The pubkey is the hex form of the npub configured in env / hardcoded.
 */
export const ADMIN_NPUB =
  "npub128f3me2ngauqhv42x6y8zs45dje7nrhd9ef49tdttynpdrps06gqd05ce3";

export const ADMIN_PUBKEY_HEX =
  "51d31de55347780bb2aa36887142b46cb3e98eed2e5352adab5926168c307e90";

export const DEFAULT_LIGHTNING_ADDRESS = "savvyutensil489@walletofsatoshi.com";

export function isAdminPubkey(pk: string | null | undefined): boolean {
  if (!pk) return false;
  return pk.toLowerCase() === ADMIN_PUBKEY_HEX;
}
