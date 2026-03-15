<template>
  <a :href="href" target="_blank" class="source-code-btn" title="View Source Code">
    <span class="icon">&lt;/&gt;</span>
    <span class="label">code</span>
  </a>
</template>

<script setup>
const props = defineProps({
  href: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
/* Source Code Button Styling */
.source-code-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: #4a4a4a;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.9);
}

.source-code-btn .icon {
  font-family: 'Fira Code', monospace;
  font-weight: 700;
  color: #155bd4;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.source-code-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  border-color: #155bd4;
  color: #155bd4;
}

.source-code-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  background-color: #f5f7fa;
}
</style>
