import { AppCache } from './app.cache';

const dotenv = require('dotenv');
dotenv.config();

import * as BAN from './banano/app.config';
import * as NANO from './nano/app.config';
import { NanoClient } from '@dev-ptera/nano-node-rpc';
import { KnownAccountDto } from '@app/types';
import { LOG_INFO, readFileContents } from '@app/services';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Used to toggle between banano and nano profiles; 'banano' | 'nano' */
export const PROFILE = process.env.PROFILE;

export const useBananoConfig = (): boolean => PROFILE === 'banano';

/** API served from this root, example: https://api.yellowspyglass.com/banano/representatives */
export const PATH_ROOT = useBananoConfig() ? BAN.PATH_ROOT : NANO.PATH_ROOT;

/** Domains allowed to use this API */
// export const URL_WHITE_LIST = useBananoConfig() ? BAN.URL_WHITE_LIST : NANO.URL_WHITE_LIST;

export const RPC_AUTH = process.env.RPC_AUTH;

export const RPC_URL = process.env.RPC_URL;

/** Used to read data from the BANANO node */
export const NANO_CLIENT = new NanoClient({
    url: RPC_URL,
    requestHeaders: {
        Authorization: RPC_AUTH || '',
    },
});

const calcMinutes = (mins: number) => 60000 * mins;
export const EXCHANGE_RATE_REFRESH_INTERVAL_MS = calcMinutes(60 * 24);
export const PRICE_DATA_REFRESH_INTERVAL_MS = calcMinutes(IS_PRODUCTION ? 30 : 120);
export const DELEGATORS_COUNT_REFRESH_INTERVAL_MS = calcMinutes(5);
export const REPRESENTATIVE_SCORES_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_ONLINE_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REFRESH_SOCIAL_MEDIA_ACCOUNTS_MS = calcMinutes(10);
export const REFRESH_KNOWN_ACCOUNTS_BALANCES = calcMinutes(10);
export const WALLETS_REFRESH_INTERVAL_MS = calcMinutes(60 * 12);

/** These sites can endlessly request resources without throttling. */
export const URL_ALLOW_LIST = useBananoConfig() ? BAN.URL_ALLOW_LIST : NANO.URL_ALLOW_LIST;

/** These nodes are currently only used for the `representatives_online` rpc call to help ensure more accurate results. */
export const BACKUP_NODES: string[] = useBananoConfig() ? BAN.BACKUP_NODES : NANO.BACKUP_NODES;

/** List of monitored representatives to counter-act low peer count. */
export const MANUAL_PEER_MONITOR_URLS: { name: string; url: string }[] = [];

/** A list of accounts with custom vanity addresses. */
export const KNOWN_VANITIES: string[] = [];

/** A list of addresses that no one owns; funds sent to these addresses are considered inaccessible. */
export const BURN_ADDRESSES: string[] = [];

/** A list of addresses owned by the core team (banano team, or nano foundation) used to fuel ecosystem ambitions. */
export const DEVELOPER_FUNDS: string[] = [];

/** Minimum amount of weight a representative needs before we start tracking their uptime percentages. */
export const UPTIME_TRACKING_MIN_WEIGHT = useBananoConfig()
    ? BAN.UPTIME_TRACKING_MIN_WEIGHT
    : NANO.UPTIME_TRACKING_MIN_WEIGHT;

export const KNOWN_ACCOUNTS_FILES = useBananoConfig() ? BAN.KNOWN_ACCOUNTS_FILES : NANO.KNOWN_ACCOUNTS_FILES;

const loadKnownAccountFile = (file: string): void => {
    const type = file.split('/')[3].replace('.json', '');
    LOG_INFO(`Loaded local known-account: ${type}`);
    const accounts = readFileContents(file);

    // Basic transform.
    accounts.forEach((account) => {
        account.hasLore = Boolean(account.lore);
        account.type = type;
    });
    if (type === 'burn') {
        BURN_ADDRESSES.push(...accounts.map((account) => account.address));
    }
    if (type === 'distribution') {
        DEVELOPER_FUNDS.push(...accounts.map((account) => account.address));
    }
    AppCache.knownAccounts.push(...accounts);
};

export const readLocalConfig = async (): Promise<void> => {
    LOG_INFO('Reading Local Known Accounts');
    KNOWN_ACCOUNTS_FILES.map((file) => {
        loadKnownAccountFile(`database/${PROFILE}/known-accounts/${file}.json`);
    });
    KNOWN_VANITIES.push(...readFileContents(`database/${PROFILE}/known-accounts/vanity.json`));
    MANUAL_PEER_MONITOR_URLS.push(...readFileContents(`database/${PROFILE}/monitored-representative.json`));
};

export const BNS_TLDS: Record<string, `ban_${string}`> = {
    mictest: 'ban_1dzpfrgi8t4byzmdeidh57p14h5jwbursf1t3ztbmeqnqqdcbpgp9x8j3cw6',
    jtv: 'ban_3gipeswotbnyemcc1dejyhy5a1zfgj35kw356dommbx4rdochiteajcsay56',
    ban: 'ban_1fdo6b4bqm6pp1w55duuqw5ebz455975o4qcp8of85fjcdw9qhuzxsd3tjb9',
};
