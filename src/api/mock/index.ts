/**
 * Mock 数据适配器
 * 在无后端时模拟 HTTP 接口：数据持久化在浏览器 localStorage，
 * 首次访问使用 seed 种子数据，登录态通过 mock_ 前缀 Token 模拟
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  seedCustomers,
  seedDashboard,
  seedDicts,
  seedEquipment,
  seedGroups,
  seedMenus,
  seedModels,
  seedRoles,
  seedBrands,
  seedTenants,
  seedTodos,
  seedTranslationDict,
  seedUsers,
  seedVisits,
  type SeedUser,
} from './seed'
import type {
  Customer,
  DictItem,
  EquipmentBrand,
  EquipmentGroup,
  EquipmentItem,
  EquipmentModel,
  Menu,
  Role,
  Tenant,
  TodoItem,
  VisitAttachment,
  VisitRecord,
  VisitType,
} from '@/types'

const PREFIX = '/api'

/** localStorage 存储键名 */
const KEYS = {
  menus: 'rp_mock_menus',
  roles: 'rp_mock_roles',
  users: 'rp_mock_users',
  tenants: 'rp_mock_tenants',
  customers: 'rp_mock_customers',
  visits: 'rp_mock_visits',
  todos: 'rp_mock_todos',
  equipment: 'rp_mock_equipment',
  brands: 'rp_mock_brands',
  groups: 'rp_mock_groups',
  models: 'rp_mock_models',
  dicts: 'rp_mock_dicts',
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

/**
 * 菜单数据迁移：历史 localStorage 中可能缺少新增的种子菜单，
 * 按 id 补齐，并同步种子菜单的排序（菜单结构调整时历史数据跟随最新顺序）
 */
function migrateMenus(): Menu[] {
  const stored = load(KEYS.menus, seedMenus)
  let changed = false
  const updated = stored.map((menu) => {
    const seed = seedMenus.find((sm) => sm.id === menu.id)
    if (!seed || seed.sort === undefined || menu.sort === seed.sort) return menu
    changed = true
    return { ...menu, sort: seed.sort }
  })
  const missing = seedMenus.filter((sm) => !updated.some((m) => m.id === sm.id))
  if (missing.length > 0) {
    changed = true
    updated.push(...missing)
  }
  if (changed) save(KEYS.menus, updated)
  return updated
}

/**
 * 角色数据迁移：为已存在的角色补齐新增菜单的可见权限（管理员全量）
 */
function migrateRoles(): Role[] {
  const stored = load(KEYS.roles, seedRoles)
  let changed = false
  const updated = stored.map((role) => {
    const seed = seedRoles.find((s) => s.id === role.id)
    if (!seed) return role
    const missingIds = seed.menuIds.filter((id) => !role.menuIds.includes(id))
    if (missingIds.length === 0) return role
    changed = true
    return { ...role, menuIds: [...role.menuIds, ...missingIds] }
  })
  if (changed) save(KEYS.roles, updated)
  return updated
}

/**
 * 字典数据迁移：历史 localStorage 中可能缺少新增的种子字典项，
 * 按 id 或 type+label 补齐，保证升级后新字典（如设备是否完好）自动出现
 */
function migrateDicts(): DictItem[] {
  const stored = load(KEYS.dicts, seedDicts)
  const missing = seedDicts.filter(
    (sd) => !stored.some((d) => d.id === sd.id || (d.type === sd.type && d.label === sd.label)),
  )
  if (missing.length === 0) return stored
  const merged = [...stored, ...missing]
  save(KEYS.dicts, merged)
  return merged
}

/**
 * 设备数据迁移：历史 localStorage 中的设备缺少“设备是否完好”字段时，
 * 默认补齐为“完好”，保证新列与详情正常展示
 */
function migrateEquipment(): EquipmentItem[] {
  const stored = load(KEYS.equipment, seedEquipment)
  let changed = false
  const updated = stored.map((item) => {
    if (item.intact) return item
    changed = true
    return { ...item, intact: '完好' }
  })
  if (changed) save(KEYS.equipment, updated)
  return updated
}

/**
 * 用户数据迁移：历史 localStorage 中的用户缺少新字段（租户/状态/备注等）时补齐默认值
 */
function migrateUsers(): SeedUser[] {
  const stored = load(KEYS.users, seedUsers)
  let changed = false
  const updated = stored.map((user) => {
    const next: SeedUser = { ...user }
    if (next.email === undefined) {
      next.email = ''
      changed = true
    }
    if (next.tenantId === undefined) {
      next.tenantId = null
      changed = true
    }
    if (next.status === undefined) {
      next.status = 1
      changed = true
    }
    if (next.remark === undefined) {
      next.remark = ''
      changed = true
    }
    if (next.createdAt === undefined) {
      next.createdAt = formatNow()
      changed = true
    }
    return next
  })
  if (changed) save(KEYS.users, updated)
  return updated
}

/** 模拟数据库：读写时即时持久化 */
interface MockDb {
  menus: Menu[]
  roles: Role[]
  users: SeedUser[]
  tenants: Tenant[]
  customers: Customer[]
  visits: VisitRecord[]
  todos: TodoItem[]
  equipment: EquipmentItem[]
  brands: EquipmentBrand[]
  groups: EquipmentGroup[]
  models: EquipmentModel[]
  dicts: DictItem[]
}

const db: MockDb = {
  get menus() {
    return migrateMenus()
  },
  set menus(v) {
    save(KEYS.menus, v)
  },
  get roles() {
    return migrateRoles()
  },
  set roles(v) {
    save(KEYS.roles, v)
  },
  get users() {
    return migrateUsers()
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
  get customers() {
    return load(KEYS.customers, seedCustomers)
  },
  set customers(v) {
    save(KEYS.customers, v)
  },
  get visits() {
    return load(KEYS.visits, seedVisits)
  },
  set visits(v) {
    save(KEYS.visits, v)
  },
  get todos() {
    return load(KEYS.todos, seedTodos)
  },
  set todos(v) {
    save(KEYS.todos, v)
  },
  get equipment() {
    return migrateEquipment()
  },
  set equipment(v) {
    save(KEYS.equipment, v)
  },
  get brands() {
    return load(KEYS.brands, seedBrands)
  },
  set brands(v) {
    save(KEYS.brands, v)
  },
  get groups() {
    return load(KEYS.groups, seedGroups)
  },
  set groups(v) {
    save(KEYS.groups, v)
  },
  get models() {
    return load(KEYS.models, seedModels)
  },
  set models(v) {
    save(KEYS.models, v)
  },
  get dicts() {
    return migrateDicts()
  },
  set dicts(v) {
    save(KEYS.dicts, v)
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

/** 用户联系方式：兼容历史 localStorage 中缺少手机号/邮箱的数据 */
function userContact(user: SeedUser): { phone: string; email: string } {
  return {
    phone: user.phone || `1380000${String(user.id).padStart(4, '0')}`,
    email: user.email || `${user.username}@example.com`,
  }
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

/** 生成客户编码：KH-年份-4 位流水号，全局唯一 */
function nextCustomerCode(list: Customer[]): string {
  const year = new Date().getFullYear()
  const prefix = `KH-${year}-`
  const max = list.reduce((m, c) => {
    if (!c.code.startsWith(prefix)) return m
    const num = Number(c.code.slice(prefix.length)) || 0
    return Math.max(m, num)
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

/** 接口路由表：按 method + pattern 匹配请求 */
const routes: MockRoute[] = [
  {
    method: 'post',
    pattern: /^\/auth\/login$/,
    handler: async ({ data }) => {
      const { username, password } = (data || {}) as { username?: string; password?: string }
      const user = db.users.find((u) => u.username === username && u.password === password)
      if (!user) return fail(500, 'auth.loginError')
      // 停用用户不允许登录
      if (user.status === 0) return fail(500, 'auth.userDisabled')
      return ok({ token: createToken(user) })
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/sso$/,
    handler: async ({ data }) => {
      const username = ((data || {}) as { username?: string }).username || 'admin'
      const user = db.users.find((u) => u.username === username)
      if (!user) return fail(500, 'auth.ssoError')
      // 停用用户不允许 SSO 登录
      if (user.status === 0) return fail(500, 'auth.userDisabled')
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
      if (code !== '123456') return fail(500, 'auth.verifyCodeError')
      const matched = db.users.filter(
        (u) => u.username === account || (u.phone && u.phone === account),
      )
      if (matched.length === 0) return fail(500, 'auth.accountNotFound')
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
      if (!user) return fail(401, 'common.sessionExpired')
      const role = db.roles.find((r) => r.id === user.roleId)
      if (!role) return fail(500, 'auth.roleNotFound')
      const { phone, email } = userContact(user)
      return ok({
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        phone,
        email,
        roles: [role.code],
        perms: collectPerms(role),
        roleId: role.id,
        menus: userMenus(role),
      })
    },
  },
  {
    method: 'get',
    pattern: /^\/auth\/profile$/,
    auth: true,
    handler: async (config) => {
      const user = currentUser(config)
      if (!user) return fail(401, 'common.sessionExpired')
      const { phone, email } = userContact(user)
      return ok({
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        phone,
        email,
      })
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/send-code$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const target = ((data || {}) as { target?: string }).target || ''
      // 演示环境不真正发送短信/邮件，验证码固定为 123456
      return ok({ sent: true, target })
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/profile\/update$/,
    auth: true,
    handler: async (config, _match, { data }) => {
      const user = currentUser(config)
      if (!user) return fail(401, 'common.sessionExpired')
      const { code, phoneCode, emailCode, name, avatar, phone, email } = (data || {}) as {
        code?: string
        phoneCode?: string
        emailCode?: string
        name?: string
        avatar?: string
        phone?: string
        email?: string
      }
      const users = db.users
      const index = users.findIndex((u) => u.id === user.id)
      if (index === -1) return fail(500, 'auth.userNotFound')
      const current = users[index]
      // 手机号/邮箱有变更时，分别校验对应渠道的验证码；仅改名称/头像时校验通用验证码
      const phoneChanged = phone !== undefined && phone !== current.phone
      const emailChanged = email !== undefined && email !== current.email
      if (phoneChanged && phoneCode !== '123456') return fail(500, 'auth.verifyCodeError')
      if (emailChanged && emailCode !== '123456') return fail(500, 'auth.verifyCodeError')
      if (!phoneChanged && !emailChanged && code !== '123456')
        return fail(500, 'auth.verifyCodeError')
      if (name !== undefined) users[index].name = name
      if (avatar !== undefined) users[index].avatar = avatar
      if (phone !== undefined) users[index].phone = phone
      if (email !== undefined) users[index].email = email
      db.users = users
      const updated = users[index]
      const contact = userContact(updated)
      return ok({
        name: updated.name,
        username: updated.username,
        avatar: updated.avatar,
        phone: contact.phone,
        email: contact.email,
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
      if (index === -1) return fail(500, 'dashboard.todoNotFound')
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
      if (index === -1) return fail(500, 'system.roleNotFound')
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
      if (next.length === roles.length) return fail(500, 'system.roleNotFound')
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
      if (index === -1) return fail(500, 'system.menuNotFound')
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
      if (menus.some((m) => m.parentId === id)) return fail(500, 'system.deleteChildFirst')
      const next = menus.filter((m) => m.id !== id)
      if (next.length === menus.length) return fail(500, 'system.menuNotFound')
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
      if (index === -1) return fail(500, 'system.tenantNotFound')
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
      if (index === -1) return fail(500, 'system.tenantNotFound')
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
      if (next.length === tenants.length) return fail(500, 'system.tenantNotFound')
      db.tenants = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/system\/users$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const params = (config.params || {}) as {
        page?: string | number
        pageSize?: string | number
        keyword?: string
        roleId?: string | number
        tenantId?: string | number
        status?: string | number | null
      }
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.users
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter(
          (u) =>
            u.username.toLowerCase().includes(kw) ||
            u.name.toLowerCase().includes(kw) ||
            (u.phone || '').toLowerCase().includes(kw) ||
            (u.email || '').toLowerCase().includes(kw),
        )
      }
      if (params.roleId !== undefined && params.roleId !== '') {
        list = list.filter((u) => u.roleId === Number(params.roleId))
      }
      if (params.tenantId !== undefined && params.tenantId !== '') {
        list = list.filter((u) => u.tenantId === Number(params.tenantId))
      }
      if (params.status !== undefined && params.status !== '' && params.status !== null) {
        list = list.filter((u) => u.status === Number(params.status))
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    },
  },
  {
    method: 'post',
    pattern: /^\/system\/users$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const users = db.users
      const input = (data || {}) as Partial<SeedUser>
      if (!input.username || !input.name) return fail(500, 'system.userRequired')
      if (users.some((u) => u.username === input.username)) return fail(500, 'system.userExists')
      const user: SeedUser = {
        id: nextId(users),
        username: input.username,
        password: input.password || '123456',
        name: input.name,
        roleId: Number(input.roleId) || 1,
        avatar: input.avatar || '',
        phone: input.phone || '',
        email: input.email || '',
        tenantId: input.tenantId ?? null,
        status: input.status === 0 ? 0 : 1,
        remark: input.remark || '',
        createdAt: formatNow(),
      }
      users.push(user)
      db.users = users
      return ok(user)
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/users\/(\d+)\/status$/,
    auth: true,
    handler: async (_config, match, config) => {
      const id = Number(match[1])
      const data = (config.data || {}) as { status?: number }
      const status = data.status ? 1 : 0
      const users = db.users
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return fail(500, 'system.userNotFound')
      // 停用保护：内置管理员与当前登录用户不可停用
      if (status === 0) {
        if (id === 1) return fail(500, 'system.userBuiltinDisableProtected')
        const current = currentUser(config)
        if (current && current.id === id) return fail(500, 'system.userSelfDisableProtected')
      }
      users[index].status = status
      db.users = users
      return ok(users[index])
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/users\/(\d+)\/role$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const roleId = Number((data as { roleId?: number } | undefined)?.roleId)
      const users = db.users
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return fail(500, 'system.userNotFound')
      if (!db.roles.some((r) => r.id === roleId)) return fail(500, 'system.roleNotFound')
      users[index].roleId = roleId
      db.users = users
      return ok({ id, roleId })
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/users\/(\d+)\/tenant$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const tenantId = (data as { tenantId?: number | null } | undefined)?.tenantId ?? null
      const users = db.users
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return fail(500, 'system.userNotFound')
      users[index].tenantId = tenantId === null ? null : Number(tenantId)
      db.users = users
      return ok({ id, tenantId: users[index].tenantId })
    },
  },
  {
    method: 'put',
    pattern: /^\/system\/users\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const users = db.users
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return fail(500, 'system.userNotFound')
      const input = (data || {}) as Partial<SeedUser>
      if (input.username && users.some((u) => u.username === input.username && u.id !== id)) {
        return fail(500, 'system.userExists')
      }
      const prev = users[index]
      users[index] = {
        ...prev,
        ...input,
        id,
        // 密码留空时不覆盖原密码
        password: input.password ? input.password : prev.password,
      }
      db.users = users
      return ok(users[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/system\/users\/(\d+)$/,
    auth: true,
    handler: async (_config, match, config) => {
      const id = Number(match[1])
      if (id === 1) return fail(500, 'system.userBuiltinProtected')
      const current = currentUser(config)
      if (current && current.id === id) return fail(500, 'system.userSelfProtected')
      const users = db.users
      const next = users.filter((u) => u.id !== id)
      if (next.length === users.length) return fail(500, 'system.userNotFound')
      db.users = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/market\/customers\/options$/,
    auth: true,
    handler: async () =>
      ok(
        db.customers
          .filter((c) => c.status === 1)
          .map((c) => ({ id: c.id, name: c.name, contact: c.contact, phone: c.phone })),
      ),
  },
  {
    method: 'get',
    pattern: /^\/market\/customers$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const params = (config.params || {}) as {
        page?: string | number
        pageSize?: string | number
        keyword?: string
        type?: string
        status?: string | number | null
        blacklisted?: string | number | null
      }
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.customers
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter(
          (c) =>
            c.code.toLowerCase().includes(kw) ||
            c.name.toLowerCase().includes(kw) ||
            c.contact.toLowerCase().includes(kw) ||
            c.phone.toLowerCase().includes(kw),
        )
      }
      if (params.type) list = list.filter((c) => c.type === params.type)
      if (params.status !== undefined && params.status !== '' && params.status !== null) {
        list = list.filter((c) => c.status === Number(params.status))
      }
      if (
        params.blacklisted !== undefined &&
        params.blacklisted !== '' &&
        params.blacklisted !== null
      ) {
        list = list.filter((c) => c.blacklisted === Number(params.blacklisted))
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    },
  },
  {
    method: 'post',
    pattern: /^\/market\/customers$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const customers = db.customers
      const input = (config.data || {}) as Partial<Customer>
      if (!input.name) return fail(500, 'market.customerRequired')
      const current = currentUser(config)
      const customer: Customer = {
        id: nextId(customers),
        code: nextCustomerCode(customers),
        name: input.name,
        type: input.type || 'enterprise',
        idNumber: input.idNumber || '',
        sapCode: input.sapCode || '',
        level: input.level || 'normal',
        industry: input.industry || '',
        source: input.source || 'self',
        contact: input.contact || '',
        phone: input.phone || '',
        email: input.email || '',
        address: input.address || '',
        bank: input.bank || '',
        bankAccount: input.bankAccount || '',
        invoiceTitle: input.invoiceTitle || '',
        status: input.status === 0 ? 0 : 1,
        blacklisted: input.blacklisted === 1 ? 1 : 0,
        creator: current?.name || '',
        createdAt: formatNow(),
      }
      customers.unshift(customer)
      db.customers = customers
      return ok(customer)
    },
  },
  {
    method: 'put',
    pattern: /^\/market\/customers\/(\d+)\/status$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const customers = db.customers
      const index = customers.findIndex((c) => c.id === id)
      if (index === -1) return fail(500, 'market.customerNotFound')
      customers[index].status = (data as { status?: number } | undefined)?.status ? 1 : 0
      db.customers = customers
      return ok(customers[index])
    },
  },
  {
    method: 'put',
    pattern: /^\/market\/customers\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const customers = db.customers
      const index = customers.findIndex((c) => c.id === id)
      if (index === -1) return fail(500, 'market.customerNotFound')
      customers[index] = { ...customers[index], ...(data as Partial<Customer>), id }
      db.customers = customers
      return ok(customers[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/market\/customers\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const customers = db.customers
      const next = customers.filter((c) => c.id !== id)
      if (next.length === customers.length) return fail(500, 'market.customerNotFound')
      db.customers = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/market\/visits$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const params = (config.params || {}) as {
        page?: string | number
        pageSize?: string | number
        keyword?: string
        visitType?: string
        visitTimeStart?: string
        visitTimeEnd?: string
      }
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.visits
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter((v) =>
          [
            v.opportunityCode,
            v.customerName,
            v.contact,
            v.phone,
            v.visitAddress,
            v.workPoints,
            v.visitResult,
          ].some((field) =>
            String(field || '')
              .toLowerCase()
              .includes(kw),
          ),
        )
      }
      if (params.visitType) list = list.filter((v) => v.visitType === params.visitType)
      if (params.visitTimeStart) {
        const start = String(params.visitTimeStart)
        list = list.filter((v) => v.visitTime.slice(0, 10) >= start)
      }
      if (params.visitTimeEnd) {
        const end = String(params.visitTimeEnd)
        list = list.filter((v) => v.visitTime.slice(0, 10) <= end)
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    },
  },
  {
    method: 'post',
    pattern: /^\/market\/visits$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const visits = db.visits
      const input = (config.data || {}) as Partial<VisitRecord>
      if (!input.customerName || !input.visitType || !input.visitTime) {
        return fail(500, 'market.visitRequired')
      }
      const current = currentUser(config)
      const visit: VisitRecord = {
        id: nextId(visits),
        opportunityCode: input.opportunityCode || '',
        customerId: input.customerId || 0,
        customerName: input.customerName,
        visitType: input.visitType as VisitType,
        visitTime: input.visitTime,
        visitAddress: input.visitAddress || '',
        contact: input.contact || '',
        phone: input.phone || '',
        workPoints: input.workPoints || '',
        visitResult: input.visitResult || '',
        attachments: input.attachments || [],
        creator: current?.name || '',
        createdAt: formatNow(),
      }
      visits.unshift(visit)
      db.visits = visits
      return ok(visit)
    },
  },
  {
    method: 'put',
    pattern: /^\/market\/visits\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const visits = db.visits
      const index = visits.findIndex((v) => v.id === id)
      if (index === -1) return fail(500, 'market.visitNotFound')
      const input = (data || {}) as { visitResult?: string; attachments?: VisitAttachment[] }
      // 编辑仅允许修改拜访结果与附件
      if (input.visitResult !== undefined) visits[index].visitResult = input.visitResult
      if (input.attachments !== undefined) visits[index].attachments = input.attachments
      db.visits = visits
      return ok(visits[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/market\/visits\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const visits = db.visits
      const next = visits.filter((v) => v.id !== id)
      if (next.length === visits.length) return fail(500, 'market.visitNotFound')
      db.visits = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/system\/dicts$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const type = String((config.params || {}).type || '')
      const list = db.dicts
      return ok(type ? list.filter((d) => d.type === type) : list)
    },
  },
  {
    method: 'post',
    pattern: /^\/system\/dicts$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const dicts = db.dicts
      const { type, label } = (data || {}) as { type?: string; label?: string }
      if (!type || !label) return fail(500, 'system.dictRequired')
      const exists = dicts.find((d) => d.type === type && d.label === label)
      if (exists) return ok(exists)
      const item: DictItem = { id: nextId(dicts), type, label }
      dicts.push(item)
      db.dicts = dicts
      return ok(item)
    },
  },
  {
    method: 'post',
    pattern: /^\/system\/translate$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const { text, targets } = (data || {}) as { text?: string; targets?: string[] }
      const translations: Record<string, string> = {}
      ;(targets || []).forEach((target) => {
        if (target === 'en-US') {
          translations[target] = seedTranslationDict[text || ''] || text || ''
        } else {
          translations[target] = text || ''
        }
      })
      return ok({ text, translations })
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/list$/,
    auth: true,
    handler: async (_config, _match, config) => {
      const params = (config.params || {}) as {
        page?: string | number
        pageSize?: string | number
        keyword?: string
        brandId?: string | number
        status?: string
      }
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.equipment
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter(
          (e) =>
            e.code.toLowerCase().includes(kw) ||
            e.owner.toLowerCase().includes(kw) ||
            e.remark.toLowerCase().includes(kw),
        )
      }
      if (params.brandId !== undefined && params.brandId !== '') {
        list = list.filter((e) => e.brandId === Number(params.brandId))
      }
      if (params.status) {
        list = list.filter((e) => e.status === params.status)
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    },
  },
  {
    method: 'post',
    pattern: /^\/equipment\/list$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const equipment = db.equipment
      const item = {
        ...(data as Partial<EquipmentItem>),
        id: nextId(equipment),
        createdAt: formatNow(),
      } as EquipmentItem
      equipment.unshift(item)
      db.equipment = equipment
      return ok(item)
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/list\/(\d+)\/location$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      // 模拟外部设备定位接口；接入真实定位服务时替换该地址
      return ok({
        lng: Number((121.4737 + (id % 7) * 0.03).toFixed(4)),
        lat: Number((31.2304 + (id % 5) * 0.02).toFixed(4)),
        address: `上海市浦东新区示例路${id}号`,
      })
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/list\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const item = db.equipment.find((e) => e.id === id)
      if (!item) return fail(500, 'equipment.notFound')
      return ok(item)
    },
  },
  {
    method: 'put',
    pattern: /^\/equipment\/list\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const equipment = db.equipment
      const index = equipment.findIndex((e) => e.id === id)
      if (index === -1) return fail(500, 'equipment.notFound')
      equipment[index] = { ...equipment[index], ...(data as Partial<EquipmentItem>), id }
      db.equipment = equipment
      return ok(equipment[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/equipment\/list\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const equipment = db.equipment
      const next = equipment.filter((e) => e.id !== id)
      if (next.length === equipment.length) return fail(500, 'equipment.notFound')
      db.equipment = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/brands$/,
    auth: true,
    handler: async () => ok(db.brands),
  },
  {
    method: 'post',
    pattern: /^\/equipment\/brands$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const list = db.brands
      const item = {
        ...(data as Partial<EquipmentBrand>),
        id: nextId(list),
        createdAt: formatNow(),
      } as EquipmentBrand
      list.push(item)
      db.brands = list
      return ok(item)
    },
  },
  {
    method: 'put',
    pattern: /^\/equipment\/brands\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const list = db.brands
      const index = list.findIndex((b) => b.id === id)
      if (index === -1) return fail(500, 'equipment.brandNotFound')
      list[index] = { ...list[index], ...(data as Partial<EquipmentBrand>), id }
      db.brands = list
      return ok(list[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/equipment\/brands\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const list = db.brands
      const next = list.filter((b) => b.id !== id)
      if (next.length === list.length) return fail(500, 'equipment.brandNotFound')
      db.brands = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/groups$/,
    auth: true,
    handler: async () => ok(db.groups),
  },
  {
    method: 'post',
    pattern: /^\/equipment\/groups$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const list = db.groups
      const item = {
        ...(data as Partial<EquipmentGroup>),
        id: nextId(list),
        createdAt: formatNow(),
      } as EquipmentGroup
      list.push(item)
      db.groups = list
      return ok(item)
    },
  },
  {
    method: 'put',
    pattern: /^\/equipment\/groups\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const list = db.groups
      const index = list.findIndex((g) => g.id === id)
      if (index === -1) return fail(500, 'equipment.groupNotFound')
      list[index] = { ...list[index], ...(data as Partial<EquipmentGroup>), id }
      db.groups = list
      return ok(list[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/equipment\/groups\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const list = db.groups
      const next = list.filter((g) => g.id !== id)
      if (next.length === list.length) return fail(500, 'equipment.groupNotFound')
      db.groups = next
      return ok(null)
    },
  },
  {
    method: 'get',
    pattern: /^\/equipment\/models$/,
    auth: true,
    handler: async () => ok(db.models),
  },
  {
    method: 'post',
    pattern: /^\/equipment\/models$/,
    auth: true,
    handler: async (_config, _match, { data }) => {
      const list = db.models
      const item = {
        ...(data as Partial<EquipmentModel>),
        id: nextId(list),
        createdAt: formatNow(),
      } as EquipmentModel
      list.push(item)
      db.models = list
      return ok(item)
    },
  },
  {
    method: 'put',
    pattern: /^\/equipment\/models\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const list = db.models
      const index = list.findIndex((m) => m.id === id)
      if (index === -1) return fail(500, 'equipment.modelNotFound')
      list[index] = { ...list[index], ...(data as Partial<EquipmentModel>), id }
      db.models = list
      return ok(list[index])
    },
  },
  {
    method: 'delete',
    pattern: /^\/equipment\/models\/(\d+)$/,
    auth: true,
    handler: async (_config, match) => {
      const id = Number(match[1])
      const list = db.models
      const next = list.filter((m) => m.id !== id)
      if (next.length === list.length) return fail(500, 'equipment.modelNotFound')
      db.models = next
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
            data: fail(401, 'common.sessionExpired'),
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
