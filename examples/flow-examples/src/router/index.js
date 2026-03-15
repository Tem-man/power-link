import { createWebHashHistory, createRouter } from 'vue-router'

import AddFlowNode from '../view/AddFlowNode/index.vue'
import ConnectorView from '../view/ConnectorView/index.vue'
import ImportAndExport from '../view/ImportAndExport/index.vue'
import DeleteAndSelect from '../view/DeleteAndSelect/index.vue'
import ToolBar from '../view/ToolBar/index.vue'
const routes = [
    { path: '/', component: AddFlowNode },
    { path: '/connector', component: ConnectorView },
    { path: '/importAndExport', component: ImportAndExport },
    { path: '/deleteAndSelect', component: DeleteAndSelect },
    { path: '/toolBar', component: ToolBar },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
export default router