
import { getConfig } from '../configService.js';
import FeishuDriveDriver from './drivers/feishuDrive.js';
import { incrementCounter } from '../../services/metricsService.js';
import eventBus from '../../services/eventBus.js';
// import LocalFileDriver from './drivers/localFile.js'; // Future use
// import S3Driver from './drivers/s3.js'; // Future use

let storageDriver;

function getDriver() {
    if (storageDriver) {
        return storageDriver;
    }

    const config = getConfig();
    const driverType = config.storage?.driver || 'local'; // Default to local

    switch (driverType) {
        case 'feishu':
            storageDriver = new FeishuDriveDriver(config.storage.feishu);
            break;
        // case 's3':
        //     storageDriver = new S3Driver(config.storage.s3);
        //     break;
        case 'local':
        default:
            // storageDriver = new LocalFileDriver(config.storage.local);
            throw new Error(`Storage driver '${driverType}' is not yet implemented.`);
    }

    return storageDriver;
}

async function upload(filePath, destination) {
    const result = await getDriver().upload(filePath, destination);
    incrementCounter('orchestrator_pro_storage_operations_total', { operation: 'upload', driver: 'feishu' }, 1);
    eventBus.emit('file.uploaded', { filePath, destination, driver: 'feishu', result });
    return result;
}

async function download(filePath, destination) {
    const result = await getDriver().download(filePath, destination);
    incrementCounter('orchestrator_pro_storage_operations_total', { operation: 'download', driver: 'feishu' }, 1);
    eventBus.emit('file.downloaded', { filePath, destination, driver: 'feishu', result });
    return result;
}

async function del(filePath) {
    const result = await getDriver().delete(filePath);
    incrementCounter('orchestrator_pro_storage_operations_total', { operation: 'delete', driver: 'feishu' }, 1);
    eventBus.emit('file.deleted', { filePath, driver: 'feishu', result });
    return result;
}

const StorageService = {
    upload,
    download,
    delete: del,
};

export default StorageService;
