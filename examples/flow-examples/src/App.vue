<template>
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">PowerLink</span>
      </div>
      <div class="nav-group">
        <div 
          class="nav-item" 
          :class="{ active: currentPath === '/' }"
          @click="goToView('/')"
        >
          <span class="icon">🏠</span>
          <span class="label">AddFlowNode</span>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentPath === '/connector' }"
          @click="goToView('/connector')"
        >
          <span class="icon">🔗</span>
          <span class="label">Connector</span>
        </div>
      </div>
    </nav>
    <main class="content-area">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { goToView } from './router/utils/goToView'

const route = useRoute()
const currentPath = computed(() => route.path)
</script>

<style scoped>
  .layout {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: #f8f9fa;
  }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    background: white;
    border-right: 1px solid #eaecf0;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px 24px 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid #eaecf0;
  }

  .logo-icon {
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 10px;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.02em;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #4b5563;
    font-weight: 500;
    font-size: 14px;
    user-select: none;
  }

  .nav-item:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  .nav-item.active {
    background-color: #eff6ff;
    color: #2563eb;
  }

  .nav-item .icon {
    font-size: 18px;
    opacity: 0.8;
  }

  .nav-item.active .icon {
    opacity: 1;
  }

  .content-area {
    flex: 1;
    padding: 0; /* Let child views handle padding */
    overflow: auto;
    position: relative;
  }
</style>