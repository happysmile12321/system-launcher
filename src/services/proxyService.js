import { getConfig } from './configService.js';

function getProxyConfig() {
    const config = getConfig();
    return config.proxy || {};
}

function getProxyEnv() {
    const proxyConfig = getProxyConfig();
    if (!proxyConfig.enabled) {
        return {};
    }

    const env = {};
    if (proxyConfig.http) {
        env.HTTP_PROXY = proxyConfig.http;
    }
    if (proxyConfig.https) {
        env.HTTPS_PROXY = proxyConfig.https;
    }
    if (proxyConfig.noProxy) {
        env.NO_PROXY = proxyConfig.noProxy;
    }

    return env;
}

const ProxyService = {
    getProxyConfig,
    getProxyEnv,
};

export default ProxyService;