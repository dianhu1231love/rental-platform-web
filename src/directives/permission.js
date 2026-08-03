import { useUserStore } from '@/store'

export default {
  mounted(el, binding) {
    const { value } = binding
    const userStore = useUserStore()
    const perms = userStore.perms || []
    if (value && Array.isArray(value) && value.length > 0) {
      const allowed = value.some((p) => perms.includes('*:*:*') || perms.includes(p))
      if (!allowed) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  },
}
