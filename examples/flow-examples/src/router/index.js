import { createWebHashHistory, createRouter } from 'vue-router'

import AddFlowNode from '../view/AddFlowNode/index.vue'
import ConnectorView from '../view/ConnectorView/index.vue'

const routes = [
    { path: '/', component: AddFlowNode },
    { path: '/connector', component: ConnectorView },

]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})
export default router