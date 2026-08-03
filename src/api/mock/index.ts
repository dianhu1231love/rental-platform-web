/**
 * Mock 数据适配器
 * 在无后端时模拟 HTTP 接口：数据持久化在浏览器 localStorage，
 * 首次访问使用 seed 种子数据，登录态通过 mock_ 前缀 Token 模拟
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  seedDashboard,
  seedMenus,
  seedRoles,
  seedTenants,
  seedTodos,
  seedUsers,
  type SeedUser,
} from './seed'
import type { Menu, Role, Tenant, TodoItem } from '@/types'

const PREFIX = '/api'

/** localStorage 存储键名 */
const KEYS = {
  menus: 'rp_mock_menus',
  roles: 'rp_mock_roles',
  users: 'rp_mock_users',
  tenants: 'rp_mock_tenants',
  todos: 'rp_mock_todos',
}

/** 读取 localStorage，不存在或损坏时回退到种子数据 */
function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : JSON.parse(JSON.stringify(seed))
  } catch {
    return JSON.parse(JSON.stringify(seed))
  }
}

/** 写入 localStorage */
function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** 模拟数据库：读写时即时持久化 */
interface MockDb {
  menus: Menu[]
  roles: Role[]
  users: SeedUser[]
  tenants: Tenant[]
  todos: TodoItem[]
}

const db: MockDb = {
  get menus() {
    return load(KEYS.menus, seedMenus)
  },
  set menus(v) {
    save(KEYS.menus, v)
  },
  get roles() {
    return load(KEYS.roles, seedRoles)
  },
  set roles(v) {
    save(KEYS.roles, v)
  },
  get users() {
    return load(KEYS.users, seedUsers)
  },
  set users(v) {
    save(KEYS.users, v)
  },
  get tenants() {
    return load(KEYS.tenants, seedTenants)
  },
  set tenants(v) {
    save(KEYS.tenants, v)
  },
  get todos() {
    return load(KEYS.todos, seedTodos)
  },
  set todos(v) {
    save(KEYS.todos, v)
  },
}

interface MockResult {
  code: number
  data: unknown
  message: string
}

interface MockConfig {
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, unknown>
}

interface MockRoute {
  method: 'get' | 'post' | 'put' | 'delete'
  pattern: RegExp
  auth?: boolean
  handler: (
    _config: MockConfig,
    _match: RegExpMatchArray,
    _ctx: MockConfig,
  ) => MockResult | Promise<MockResult>
}

/** 生成模拟 Token：mock_用户名_时间戳 */
function createToken(user: SeedUser): string {
  return `mock_${user.username}_${Date.now()}`
}

/** 从 Token 中解析用户名 */
function parseToken(token: string): string | null {
  if (!token || !token.startsWith('mock_')) return null
  const parts = token.split('_')
  return parts.length >= 2 ? parts[1] : null
}

/** 从请求头中解析当前登录用户 */
function currentUser(config: MockConfig): SeedUser | null {
  const header = config.headers?.Authorization
  const token = String(header ?? '').replace('Bearer ', '')
  const username = parseToken(token)
  if (!username) return null
  return db.users.find((u) => u.username === username) || null
}

type MenuNode = Menu & { children: MenuNode[] }

/** 将扁平菜单列表构建为树 */
function buildTree(list: Menu[]): MenuNode[] {
  const map = new Map<number, MenuNode>()
  list.forEach((m) => map.set(m.id, { ...m, children: [] }))
  const roots: MenuNode[] = []
  for (const m of map.values()) {
    if (m.parentId === 0 || !map.has(m.parentId)) roots.push(m)
    else map.get(m.parentId)!.children.push(m)
  }
  const sortRec = (arr: MenuNode[]): void => {
    arr.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    arr.forEach((c) => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}

/** 按角色可见菜单 id 裁剪菜单树（目录下无可见子项时剔除） */
function pruneTree(nodes: MenuNode[], ids: number[]): MenuNode[] {
  const result: MenuNode[] = []
  for (const node of nodes) {
    if (!ids.includes(node.id)) continue
    const children = pruneTree(node.children || [], ids)
    if (node.type === 'button') continue
    if (node.type === 'directory' && children.length === 0) continue
    result.push({ ...node, children })
  }
  return result
}

/** 汇总角色权限：管理员返回通配权限 */
function collectPerms(role: Role): string[] {
  if (role.perms.includes('*:*:*')) return ['*:*:*']
  // 非管理员角色：权限以角色上保存的权限集为准（菜单控制可见性，权限控制按钮操作）
  return role.perms || []
}

/** 获取角色可见的菜单树 */
function userMenus(role: Role): MenuNode[] {
  return pruneTree(buildTree(db.menus), role.menuIds)
}

function ok(data: unknown, message = 'success'): MockResult {
  return { code: 200, data, message }
}

function fail(code: number, message: string): MockResult {
  return { code, data: null, message }
}

/** 模拟网络延迟，让交互更接近真实接口 */
function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250))
}

/** 生成自增 id */
function nextId(list: Array<{ id: number }>): number {
  return list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1
}

/** 当前时间格式化（YYYY-MM-DD HH:mm:ss） */
function formatNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

/** 接口路由表：按 method + pattern 匹配请求 */
const routes: MockRoute[] = [
  {
    method: 'post',
    pattern: /^\/auth\/login$/,
    handler: async ({ data }) => {
      const { username, password } = (data || {}) as { username?: string; password?: string }
      const user = db.users.find((u) => u.username === username && u.password === password)
      if (!user) return fail(500, '用户名或密码错误')
      return ok({ token: createToken(user) })
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/sso$/,
    handler: async ({ data }) => {
      const username = ((data || {}) as { username?: string }).username || 'admin'
      const user = db.users.find((u) => u.username === username)
      if (!user) return fail(500, 'SSO 票据无效或已过期')
      return ok({ token: createToken(user) })
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/logout$/,
    handler: async () => ok(null),
  },
  {
    method: 'post',
    pattern: /^\/auth\/forgot$/,
    handler: async ({ data }) => {
      const { account, code } = (data || {}) as { account?: string; code?: string }
      if (code !== '123456') return fail(500, '验证码错误（演示环境请使用 123456）')
      const matched = db.users.filter(
        (u) => u.username === account || (u.phone && u.phone === account),
      )
      if (matched.length === 0) return fail(500, '未找到关联账户，请核对后重试')
      return ok(
        matched.map((u) => ({
          username: u.username.slice(0, 1) + '***' + u.username.slice(-1),
          name: u.name,
        })),
      )
    },
  },
  {
    method: 'get',
    pattern: /^\/auth\/userinfo$/,
    auth: true,
    handler: async (config) => {
      const user = currentUser(config)
      if (!user) return fail(401, '登录状态已失效，请重新登录')
      const role = db.roles.find((r) => r.id === user.roleId)
      if (!role) return fail(500, '角色不存在')
      return ok({
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        roles: [role.code],
        perms: collectPerms(role),
        roleId: role.id,
        menus: userMenus(role),
      })
    },
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/stats$/,
    auth: true,
    handler: async () => ok(seedDashboard.stats),
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/trend$/,
    auth: true,
    handler: async () => ok(seedDashboard.trend),
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/equipment$/,
    auth: true,
    handler: async () => ok(seedDashboard.equipment),
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/hours$/,
    auth: true,
    handler: async () => ok(seedDashboard.hours),
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/todos$/,
    auth: true,
    handler: async () => ok(db.todos),
  },
  {
    method: 'put',
    pattern: /^\/dashboard\/todos\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const action = (data as { action?: string } | undefined)?.action
      const todos = db.todos
      const index = todos.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '待办事项不存在')
      todos.splice(index, 1)
      db.todos = todos
      return ok({ id, action })
    },
  },
  {
    method: 'get',
    pattern: /^\/system\/roles$/,
    auth: true,
    handler: async () => ok(db.roles),
  },
  {
    method: 'post',
    pattern: /^\/system\/roles$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const roles = db.roles
      const role = {
        ...(data as Partial<Role>),
        id: nextId(roles),
        createdAt: formatNow(),
      } as Role
      roles.push(role)
      db.roles = roles
      return ok(role)
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/roles\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const roles = db.roles
      const index = roles.findIndex((r) => r.id === id)
      if (index === -1) return fail(500, '角色不存在')
      roles[index] = { ...roles[index], ...(data as Partial<Role>), id }
      db.roles = roles
      return ok(roles[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/system\/roles\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const roles = db.roles
      const next = roles.filter((r) => r.id !== id)
      if (next.length === roles.length) return fail(500, '角色不存在')
      db.roles = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/system\/menus$/,
    auth: true,
    handler: async () => ok(db.menus),
  },
  {
    method: 'post',
    pattern: /^\/system\/menus$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const menus = db.menus
      const menu = { ...(data as Partial<Menu>), id: nextId(menus) } as Menu
      menus.push(menu)
      db.menus = menus
      return ok(menu)
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/menus\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const menus = db.menus
      const index = menus.findIndex((m) => m.id === id)
      if (index === -1) return fail(500, '菜单不存在')
      menus[index] = { ...menus[index], ...(data as Partial<Menu>), id }
      db.menus = menus
      return ok(menus[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/system\/menus\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const menus = db.menus
      if (menus.some((m) => m.parentId === id)) return fail(500, '请先删除该菜单下的子菜单')
      const next = menus.filter((m) => m.id !== id)
      if (next.length === menus.length) return fail(500, '菜单不存在')
      db.menus = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/system\/tenants$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const params = (config.params || {}) as {
        page?: string | number
        pageSize?: string | number
        keyword?: string
        status?: string | number | null
      }
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.tenants
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(kw) ||
            t.code.toLowerCase().includes(kw) ||
            t.contact.toLowerCase().includes(kw),
        )
      }
      if (params.status !== undefined && params.status !== '' && params.status !== null) {
        list = list.filter((t) => t.status === Number(params.status))
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    },
  },
  {
    method: 'post',
    pattern: /^\/system\/tenants$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const tenants = db.tenants
      const tenant = {
        ...(data as Partial<Tenant>),
        id: nextId(tenants),
        createdAt: formatNow(),
      } as Tenant
      tenants.unshift(tenant)
      db.tenants = tenants
      return ok(tenant)
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/tenants\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const index = tenants.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '租户不存在')
      tenants[index] = { ...tenants[index], ...(data as Partial<Tenant>), id }
      db.tenants = tenants
      return ok(tenants[index])
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/tenants\/(\d+)\/status$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const index = tenants.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '租户不存在')
      tenants[index].status = (data as { status?: number } | undefined)?.status ? 1 : 0
      db.tenants = tenants
      return ok(tenants[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/system\/tenants\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const next = tenants.filter((t) => t.id !== id)
      if (next.length === tenants.length) return fail(500, '租户不存在')
      db.tenants = next
      return ok(null)
    },
  },
]

export function createMockAdapter() {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method || 'get').toLowerCase()
    const rawUrl = config.url || ''
    const url = rawUrl.startsWith(PREFIX) ? rawUrl.slice(PREFIX.length) : rawUrl

    for (const route of routes) {
      const match = url.match(route.pattern)
      if (route.method !== method || !match) continue
      if (route.auth) {
        const user = currentUser(config as unknown as MockConfig)
        if (!user) {
          await delay()
          return {
            data: fail(401, '登录状态已失效，请重新登录'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          }
        }
      }
      await delay()
      const result = await route.handler(
        config as unknown as MockConfig,
        match,
        config as unknown as MockConfig,
      )
      return {
        data: result,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    return {
      data: fail(404, `接口不存在: ${method.toUpperCase()} ${url}`),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
}
