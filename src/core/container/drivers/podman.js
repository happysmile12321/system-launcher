
import { error, info } from '../../../utils/logger.js';
import ProxyService from '../../../services/proxyService.js';
import { runShellCommand } from '../../scriptRunner.js';
import { incrementCounter } from '../../../services/metricsService.js';

class PodmanDriver {
    constructor(config) {
        this.config = config;
    }

    async start(service) {
        const proxyEnv = ProxyService.getProxyEnv();
        const envVars = { ...proxyEnv, ...service.environment };

        let envString = '';
        for (const key in envVars) {
            envString += ` -e ${key}=${envVars[key]}`;
        }

        const command = `podman run -d --name ${service.name}${envString} ${service.image}`;

        info(`Starting container ${service.name} with command: ${command}`)
        const result = await runShellCommand(command);
        incrementCounter('orchestrator_pro_container_operations_total', { operation: 'start', driver: 'podman', service: service.name }, 1);
        return result;
    }

    async stop(serviceName) {
        const command = `podman stop ${serviceName}`;
        info(`Stopping container ${serviceName} with command: ${command}`)
        const result = await runShellCommand(command);
        incrementCounter('orchestrator_pro_container_operations_total', { operation: 'stop', driver: 'podman', service: serviceName }, 1);
        return result;
    }

    async list() {
        const command = `podman ps -a --format '{{json .}}'`;
        info(`Listing containers with command: ${command}`)
        const result = await runShellCommand(command);
        if (result.error) {
            return [];
        }
        const parsed = result.stdout.split('\n').filter(Boolean).map(JSON.parse);
        incrementCounter('orchestrator_pro_container_operations_total', { operation: 'list', driver: 'podman' }, 1);
        return parsed;
    }

    async getLogs(serviceName) {
        const command = `podman logs ${serviceName}`;
        info(`Getting logs for container ${serviceName} with command: ${command}`)
        const result = await runShellCommand(command);
        incrementCounter('orchestrator_pro_container_operations_total', { operation: 'logs', driver: 'podman', service: serviceName }, 1);
        return result;
    }
}

export default PodmanDriver;
