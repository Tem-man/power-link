<script setup lang="ts">
  import { ref } from "vue";
  import ConnectorExample from "./example/ConnectorExample.vue";
  import PluginExample from "./example/PluginExample.vue";

  const activeTab = ref<"basic" | "plugin">("plugin");
</script>

<template>
  <div class="app">
    <nav class="tabs">
      <button
        :class="{ active: activeTab === 'basic' }"
        @click="activeTab = 'basic'"
      >
        📦 基础示例
      </button>
      <button
        :class="{ active: activeTab === 'plugin' }"
        @click="activeTab = 'plugin'"
      >
        🔌 插件示例
      </button>
    </nav>

    <main class="content">
      <ConnectorExample v-if="activeTab === 'basic'" />
      <PluginExample v-if="activeTab === 'plugin'" />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f0f2f5;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.tabs button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #f0f0f0;
  color: #666;
}

.tabs button:hover {
  background: #e0e0e0;
}

.tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.content {
  padding: 20px;
}
</style>
