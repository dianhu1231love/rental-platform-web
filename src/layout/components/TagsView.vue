<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, HOME_PATH } from '@/store/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const visitedViews = computed(() => appStore.visitedViews)

function isHomeView(view) {
  return view && view.path === HOME_PATH
}

function isActive(path) {
  return route.path === path
}

function tagLabel(view) {
  if (view.i18nKey) return view.i18nKey
  return view.title
}

// 右键菜单状态
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuView = ref(null)

// 拖拽状态
const dragView = ref(null)
const dropActive = ref(false)

const isFirst = computed(
  () => menuView.value && visitedViews.value[0]?.path === menuView.value.path
)
const isLast = computed(
  () =>
    menuView.value &&
    visitedViews.value[visitedViews.value.length - 1]?.path === menuView.value.path
)
const onlyOne = computed(() => visitedViews.value.length <= 1)
const homeMenu = computed(() => isHomeView(menuView.value))

function handleClick(view) {
  if (isActive(view.path)) return
  router.push(view.path)
}

function handleClose(view) {
  if (isHomeView(view)) return
  appStore.delVisitedView(view.path)
  if (isActive(view.path)) {
    const last = appStore.visitedViews[appStore.visitedViews.length - 1]
    router.push(last ? last.path : HOME_PATH)
  }
}

function openContextMenu(view, event) {
  event.preventDefault()
  menuView.value = view
  const menuWidth = 190
  const menuHeight = 236
  menuX.value = Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8))
  menuY.value = Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8))
  menuVisible.value = true
}

function closeContextMenu() {
  menuVisible.value = false
  menuView.value = null
}

function refreshView(view) {
  if (isActive(view.path)) {
    router.replace(`/redirect${view.fullPath}`)
  } else {
    router.push(view.path)
  }
  closeContextMenu()
}

function closeCurrent(view) {
  if (onlyOne.value || isHomeView(view)) {
    closeContextMenu()
    return
  }
  handleClose(view)
  closeContextMenu()
}

function closeLeft(view) {
  appStore.delViewsLeft(view)
  if (!visitedViews.value.some((v) => v.path === route.path)) {
    router.push(view.path)
  }
  closeContextMenu()
}

function closeRight(view) {
  appStore.delViewsRight(view)
  if (!visitedViews.value.some((v) => v.path === route.path)) {
    router.push(view.path)
  }
  closeContextMenu()
}

function closeOthers(view) {
  appStore.delOtherViews(view)
  if (!visitedViews.value.some((v) => v.path === route.path)) {
    router.push(view.path)
  }
  closeContextMenu()
}

function closeAll() {
  appStore.delAllViews()
  if (!isActive(HOME_PATH)) router.push(HOME_PATH)
  closeContextMenu()
}

// 拖拽排序
function onDragStart(view, event) {
  if (isHomeView(view)) {
    event.preventDefault()
    return
  }
  dragView.value = view
  dropActive.value = false
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragOver(view) {
  if (!dragView.value || isHomeView(view)) return
  const from = visitedViews.value.findIndex((v) => v.path === dragView.value.path)
  const to = visitedViews.value.findIndex((v) => v.path === view.path)
  if (from > 0 && to > 0 && from !== to) {
    appStore.moveVisitedView(from, to)
  }
}

function onDropZoneDragOver() {
  dropActive.value = true
}

function onDropZoneDragLeave() {
  dropActive.value = false
}

function onDropClose() {
  if (dragView.value && !isHomeView(dragView.value)) {
    handleClose(dragView.value)
  }
  endDrag()
}

function endDrag() {
  dragView.value = null
  dropActive.value = false
}

// 点击页面其他位置 / 右键其他位置 / 按 Esc 时关闭菜单
function onDocumentClick() {
  closeContextMenu()
}

function onDocumentContextMenu(event) {
  if (!event.target.closest('.tags-item') && !event.target.closest('.context-menu')) {
    closeContextMenu()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') closeContextMenu()
}

watch(menuVisible, (visible) => {
  if (visible) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('contextmenu', onDocumentContextMenu)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('contextmenu', onDocumentContextMenu)
    document.removeEventListener('keydown', onKeydown)
  }
})

watch(
  () => route.fullPath,
  () => {
    closeContextMenu()
    if (route.meta?.hidden) return
    appStore.addVisitedView(route)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('contextmenu', onDocumentContextMenu)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="tags-view">
    <el-scrollbar>
      <div class="tags-wrap">
        <span
          v-for="view in visitedViews"
          :key="view.path"
          class="tags-item"
          :class="{ active: isActive(view.path), dragging: dragView?.path === view.path }"
          :draggable="!isHomeView(view)"
          @click="handleClick(view)"
          @contextmenu.prevent.stop="openContextMenu(view, $event)"
          @dragstart="onDragStart(view, $event)"
          @dragover.prevent="onDragOver(view)"
          @dragend="endDrag"
        >
          <el-icon
            v-if="isHomeView(view)"
            class="tag-home"
            :size="12"
            :title="$t('tagsView.homePinned')"
          >
            <HomeFilled />
          </el-icon>
          <span class="tag-title">{{ $t(tagLabel(view)) }}</span>
          <el-icon
            v-if="!isHomeView(view)"
            class="tag-close"
            :size="12"
            @click.stop="handleClose(view)"
          >
            <Close />
          </el-icon>
        </span>
      </div>
    </el-scrollbar>

    <!-- 拖拽时的顶部悬浮关闭框 -->
    <transition name="context-fade">
      <div
        v-show="dragView"
        class="drop-close"
        :class="{ active: dropActive }"
        @dragenter.prevent="onDropZoneDragOver"
        @dragover.prevent="onDropZoneDragOver"
        @dragleave="onDropZoneDragLeave"
        @drop.prevent.stop="onDropClose"
      >
        <el-icon :size="16"><Close /></el-icon>
        <span>{{ $t('tagsView.dropCloseTip') }}</span>
      </div>
    </transition>

    <transition name="context-fade">
      <ul
        v-show="menuVisible"
        class="context-menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
        @contextmenu.prevent.stop
      >
        <li class="context-item" @click="refreshView(menuView)">
          <el-icon><Refresh /></el-icon>
          <span>{{ $t('tagsView.refresh') }}</span>
        </li>
        <li
          class="context-item"
          :class="{ disabled: onlyOne || homeMenu }"
          @click="closeCurrent(menuView)"
        >
          <el-icon><Close /></el-icon>
          <span>{{ $t('tagsView.close') }}</span>
        </li>
        <li class="context-divider" />
        <li class="context-item" :class="{ disabled: isFirst }" @click="closeLeft(menuView)">
          <el-icon><DArrowLeft /></el-icon>
          <span>{{ $t('tagsView.closeLeft') }}</span>
        </li>
        <li class="context-item" :class="{ disabled: isLast }" @click="closeRight(menuView)">
          <el-icon><DArrowRight /></el-icon>
          <span>{{ $t('tagsView.closeRight') }}</span>
        </li>
        <li
          class="context-item"
          :class="{ disabled: onlyOne }"
          @click="closeOthers(menuView)"
        >
          <el-icon><CircleClose /></el-icon>
          <span>{{ $t('tagsView.closeOthers') }}</span>
        </li>
        <li class="context-divider" />
        <li class="context-item" @click="closeAll">
          <el-icon><CloseBold /></el-icon>
          <span>{{ $t('tagsView.closeAll') }}</span>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.tags-view {
  height: 34px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}

.tags-wrap {
  display: flex;
  align-items: center;
  height: 34px;
  padding: 0 8px;
  gap: 6px;
  white-space: nowrap;
}

.tags-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  font-size: 13px;
  color: #495060;
  background: #fff;
  border: 1px solid #d9e5f5;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;

  &.active {
    color: #fff;
    background: linear-gradient(90deg, #4b9bff 0%, #2f7bfe 100%);
    border-color: transparent;
    box-shadow: 0 2px 6px rgba(47, 123, 254, 0.35);
  }

  .tag-close:hover {
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.2);
  }

  &.dragging {
    opacity: 0.55;
    border-style: dashed;
  }

  .tag-home {
    opacity: 0.75;
  }
}

/* 拖拽时的顶部悬浮关闭框 */
.drop-close {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3200;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(90deg, #4b9bff 0%, #2f7bfe 100%);
  border-radius: 24px;
  box-shadow: 0 6px 20px rgba(47, 123, 254, 0.35);
  cursor: pointer;

  &.active {
    background: linear-gradient(90deg, #ff6b6b 0%, #ef4444 100%);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    transform: translateX(-50%) scale(1.08);
  }
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  z-index: 3000;
  width: 190px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #fff;
  border: 1px solid #e6eefb;
  border-radius: 10px;
  box-shadow: 0 10px 32px rgba(31, 60, 120, 0.18);
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  font-size: 14px;
  color: #303133;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;

  .el-icon {
    font-size: 15px;
    color: #5f6c84;
  }

  &:hover:not(.disabled) {
    background: #eaf2ff;
    color: #2f7bfe;

    .el-icon {
      color: #2f7bfe;
    }
  }

  &.disabled {
    color: #c0c4cc;
    cursor: not-allowed;

    .el-icon {
      color: #c0c4cc;
    }
  }
}

.context-divider {
  height: 1px;
  margin: 5px 8px;
  background: #eef3fb;
}

.context-fade-enter-active,
.context-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.context-fade-enter-from,
.context-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
