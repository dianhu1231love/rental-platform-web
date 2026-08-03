/**
 * v-permission 按钮级权限指令
 * 用法：v-permission="['system:role:add']"，无权限时从 DOM 中移除元素
 */
import type { Directive } from 'vue'
import { useUserStore } from '@/store'

const permissionDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const perms = userStore.perms || []
    if (value && Array.isArray(value) && value.length > 0) {
      const allowed = value.some((p) => perms.includes('*:*:*') || perms.includes(p))
      if (!allowed) {
        if (el.parentNode) {
          el.parentNode.removeChild(el)
        }
      }
    }
  },
}

export default permissionDirective
