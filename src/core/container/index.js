
import { getConfig } from '../../services/configService.js';
import PodmanDriver from './drivers/podman.js';
import DockerDriver from './drivers/docker.js';

let containerDriver;

function getDriver() {
    if (containerDriver) {
        return containerDriver;
    }

    const config = getConfig();
    const driverType = config.container?.driver || 'docker'; // Default to docker

    switch (driverType) {
        case 'podman':
            containerDriver = new PodmanDriver(config.container.podman);
            break;
        case 'docker':
        default:
            containerDriver = new DockerDriver(config.container.docker);
            break;
    }

    return containerDriver;
}

async function start(service) {
    return getDriver().start(service);
}

async function stop(serviceName) {
    return getDriver().stop(serviceName);
}

async function list() {
    return getDriver().list();
}

async function getLogs(serviceName) {
    return getDriver().getLogs(serviceName);
}

const ContainerService = {
    start,
    stop,
    list,
    getLogs,
};

export default ContainerService;
