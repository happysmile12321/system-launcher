import { ref, onMounted } from 'vue';

/**
 * 备份管理相关的状态和逻辑
 */
export function useBackupManagement() {
    // 飞书相关状态
    const feishuFiles = ref([]);
    const feishuFilesLoading = ref(false);
    const feishuConfigStatus = ref({ configured: false });
    const feishuAuthStatus = ref({ authenticated: false });
    const feishuWebSocketStatus = ref({ connected: false });
    const feishuWebSocketLoading = ref(false);

    // 备份计划相关状态
    const backupPlans = ref([]);
    const backupPlansLoading = ref(false);
    const containers = ref([]);

    // 对话框状态
    const showBackupDialog = ref(false);
    const showCronHelper = ref(false);
    const showFeishuConfigDialog = ref(false);

    // 备份表单
    const backupForm = ref({
        containerId: '',
        cronExpression: '0 2 * * *',
        backupPath: '/tmp/backups',
        includeVolumes: true,
        includeConfig: true,
        compress: true,
        uploadToFeishu: true
    });

    // 获取飞书文件列表
    async function refreshFeishuFiles() {
        feishuFilesLoading.value = true;
        try {
            const response = await fetch('/api/feishu/files');
            const data = await response.json();

            if (data.success) {
                feishuFiles.value = data.data || [];
            }
        } catch (error) {
            console.error('获取飞书文件失败:', error);
        } finally {
            feishuFilesLoading.value = false;
        }
    }

    // 获取备份计划列表
    async function refreshBackupPlans() {
        backupPlansLoading.value = true;
        try {
            const response = await fetch('/api/backup-management/workflows');
            const data = await response.json();

            if (data.success) {
                backupPlans.value = data.data || [];
            }
        } catch (error) {
            console.error('获取备份计划失败:', error);
        } finally {
            backupPlansLoading.value = false;
        }
    }

    // 获取容器列表
    async function fetchContainers() {
        try {
            const response = await fetch('/api/backup-management/containers');
            const data = await response.json();

            if (data.success) {
                containers.value = data.data || [];
            }
        } catch (error) {
            console.error('获取容器列表失败:', error);
        }
    }

    // 检查飞书配置状态
    async function checkFeishuConfig() {
        try {
            const response = await fetch('/api/feishu/config');
            const data = await response.json();

            if (data.success) {
                feishuConfigStatus.value = data.data;
            }
        } catch (error) {
            console.error('检查飞书配置失败:', error);
        }
    }

    // 检查飞书认证状态
    async function checkFeishuAuth() {
        try {
            const response = await fetch('/api/feishu/auth/status');
            const data = await response.json();

            if (data.success) {
                feishuAuthStatus.value = data.data;
            }
        } catch (error) {
            console.error('检查飞书认证失败:', error);
        }
    }

    // 检查WebSocket状态
    async function checkWebSocketStatus() {
        try {
            const response = await fetch('/api/feishu/websocket/status');
            const data = await response.json();

            if (data.success) {
                feishuWebSocketStatus.value = data.data;
            }
        } catch (error) {
            console.error('检查WebSocket状态失败:', error);
        }
    }

    // 启动飞书WebSocket
    async function startFeishuWebSocket() {
        feishuWebSocketLoading.value = true;
        try {
            const response = await fetch('/api/feishu/websocket/start', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                await checkWebSocketStatus();
            }
        } catch (error) {
            console.error('启动WebSocket失败:', error);
        } finally {
            feishuWebSocketLoading.value = false;
        }
    }

    // 停止飞书WebSocket
    async function stopFeishuWebSocket() {
        feishuWebSocketLoading.value = true;
        try {
            const response = await fetch('/api/feishu/websocket/stop', {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                await checkWebSocketStatus();
            }
        } catch (error) {
            console.error('停止WebSocket失败:', error);
        } finally {
            feishuWebSocketLoading.value = false;
        }
    }

    // 创建备份工作流
    async function createBackupWorkflow() {
        try {
            const response = await fetch('/api/backup-management/workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backupForm.value)
            });

            const data = await response.json();

            if (data.success) {
                showBackupDialog.value = false;
                await refreshBackupPlans();
                // 重置表单
                backupForm.value = {
                    containerId: '',
                    cronExpression: '0 2 * * *',
                    backupPath: '/tmp/backups',
                    includeVolumes: true,
                    includeConfig: true,
                    compress: true,
                    uploadToFeishu: true
                };
                return true;
            }
            return false;
        } catch (error) {
            console.error('创建备份工作流失败:', error);
            return false;
        }
    }

    // 删除备份计划
    async function deleteBackupPlan(plan) {
        try {
            const response = await fetch(`/api/backup-management/workflows/${plan.id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await refreshBackupPlans();
                return true;
            }
            return false;
        } catch (error) {
            console.error('删除备份计划失败:', error);
            return false;
        }
    }

    // 下载文件
    async function downloadFile(file) {
        try {
            const response = await fetch(`/api/feishu/files/${file.token}/download`);
            const data = await response.json();

            if (data.success && data.data.downloadUrl) {
                window.open(data.data.downloadUrl, '_blank');
                return true;
            }
            return false;
        } catch (error) {
            console.error('下载文件失败:', error);
            return false;
        }
    }

    // 删除文件
    async function deleteFile(file) {
        try {
            const response = await fetch(`/api/feishu/files/${file.token}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await refreshFeishuFiles();
                return true;
            }
            return false;
        } catch (error) {
            console.error('删除文件失败:', error);
            return false;
        }
    }

    // 初始化数据
    async function initializeData() {
        await Promise.all([
            checkFeishuConfig(),
            checkFeishuAuth(),
            checkWebSocketStatus(),
            fetchContainers()
        ]);

        if (feishuConfigStatus.value.configured) {
            await refreshFeishuFiles();
        }

        await refreshBackupPlans();
    }

    return {
        // 状态
        feishuFiles,
        feishuFilesLoading,
        feishuConfigStatus,
        feishuAuthStatus,
        feishuWebSocketStatus,
        feishuWebSocketLoading,
        backupPlans,
        backupPlansLoading,
        containers,
        showBackupDialog,
        showCronHelper,
        showFeishuConfigDialog,
        backupForm,

        // 方法
        refreshFeishuFiles,
        refreshBackupPlans,
        fetchContainers,
        checkFeishuConfig,
        checkFeishuAuth,
        checkWebSocketStatus,
        startFeishuWebSocket,
        stopFeishuWebSocket,
        createBackupWorkflow,
        deleteBackupPlan,
        downloadFile,
        deleteFile,
        initializeData
    };
}
