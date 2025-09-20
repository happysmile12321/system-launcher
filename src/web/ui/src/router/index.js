import { createRouter, createWebHistory } from 'vue-router';
import WorkflowsPage from '../components/WorkflowsPage.vue';
import ComponentsPage from '../components/ComponentsPage.vue';
import TriggersPage from '../components/TriggersPage.vue';
import BackupManagementPage from '../components/BackupManagementPage.vue';
import ContainerManagement from '../components/ContainerManagement.vue';
import SystemServicesPage from '../components/SystemServicesPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/workflows'
  },
  {
    path: '/workflows',
    name: 'Workflows',
    component: WorkflowsPage,
    meta: {
      title: '工作流',
      icon: 'workflow'
    }
  },
  {
    path: '/components',
    name: 'Components',
    component: ComponentsPage,
    meta: {
      title: '组件',
      icon: 'component'
    }
  },
  {
    path: '/triggers',
    name: 'Triggers',
    component: TriggersPage,
    meta: {
      title: '触发器',
      icon: 'trigger'
    }
  },
  {
    path: '/backup',
    name: 'BackupManagement',
    component: BackupManagementPage,
    meta: {
      title: '备份管理',
      icon: 'backup'
    }
  },
  {
    path: '/containers',
    name: 'ContainerManagement',
    component: ContainerManagement,
    meta: {
      title: '容器管理',
      icon: 'container'
    }
  },
  {
    path: '/services',
    name: 'SystemServices',
    component: SystemServicesPage,
    meta: {
      title: '系统服务',
      icon: 'service'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
