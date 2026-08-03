import {
  seedMenus,
  seedRoles,
  seedUsers,
  seedTenants,
  seedDashboard,
  seedTodos
} from './seed.js'

const PREFIX = '/api'

const KEYS = {
  menus: 'rp_mock_menus',
  roles: 'rp_mock_roles',
  users: 'rp_mock_users',
  tenants: 'rp_mock_tenants',
  todos: 'rp_mock_todos'
}

function load(key, seed) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seed))
  } catch {
    return JSON.parse(JSON.stringify(seed))
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const db = {
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
  }
}

function createToken(user) {
  return `mock_${user.username}_${Date.now()}`
}

function parseToken(token) {
  if (!token || !token.startsWith('mock_')) return null
  const parts = token.split('_')
  return parts.length >= 2 ? parts[1] : null
}

function currentUser(config) {
  const token = config.headers?.Authorization?.replace('Bearer ', '')
  const username = parseToken(token)
  if (!username) return null
  return db.users.find((u) => u.username === username) || null
}

function buildTree(list) {
  const map = new Map(list.map((m) => [m.id, { ...m, children: [] }]))
  const roots = []
  for (const m of map.values()) {
    if (m.parentId === 0 || !map.has(m.parentId)) roots.push(m)
    else map.get(m.parentId).children.push(m)
  }
  const sortRec = (arr) => {
    arr.sort((a, b) => a.sort - b.sort)
    arr.forEach((c) => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}

function pruneTree(nodes, ids) {
  const result = []
  for (const node of nodes) {
    if (!ids.includes(node.id)) continue
    const children = pruneTree(node.children || [], ids)
    if (node.type === 'button') continue
    if (node.type === 'directory' && children.length === 0) continue
    result.push({ ...node, children })
  }
  return result
}

function collectPerms(role) {
  if (role.perms.includes('*:*:*')) return ['*:*:*']
  // 非管理员角色：权限以角色上保存的权限集为准（菜单控制可见性，权限控制按钮操作）
  return role.perms || []
}

function userMenus(role) {
  return pruneTree(buildTree(db.menus), role.menuIds)
}

function ok(data, message = 'success') {
  return { code: 200, data, message }
}

function fail(code, message) {
  return { code, data: null, message }
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250))
}

function nextId(list) {
  return list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1
}

const routes = [
  {
    method: 'post',
    pattern: /^\/auth\/login$/,
    handler: async ({ data }) => {
      const { username, password } = data || {}
      const user = db.users.find((u) => u.username === username && u.password === password)
      if (!user) return fail(500, '用户名或密码错误')
      return ok({ token: createToken(user) })
    }
  },
  {
    method: 'post',
    pattern: /^\/auth\/sso$/,
    handler: async ({ data }) => {
      const username = data?.username || 'admin'
      const user = db.users.find((u) => u.username === username)
      if (!user) return fail(500, 'SSO 票据无效或已过期')
      return ok({ token: createToken(user) })
    }
  },
  {
    method: 'post',
    pattern: /^\/auth\/logout$/,
    handler: async () => ok(null)
  },
  {
    method: 'post',
    pattern: /^\/auth\/forgot$/,
    handler: async ({ data }) => {
      const { account, code } = data || {}
      if (code !== '123456') return fail(500, '验证码错误（演示环境请使用 123456）')
      const matched = db.users.filter(
        (u) => u.username === account || (u.phone && u.phone === account)
      )
      if (matched.length === 0) return fail(500, '未找到关联账户，请核对后重试')
      return ok(
        matched.map((u) => ({
          username: u.username.slice(0, 1) + '***' + u.username.slice(-1),
          name: u.name
        }))
      )
    }
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
        menus: userMenus(role)
      })
    }
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/stats$/,
    auth: true,
    handler: async () => ok(seedDashboard.stats)
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/trend$/,
    auth: true,
    handler: async () => ok(seedDashboard.trend)
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/equipment$/,
    auth: true,
    handler: async () => ok(seedDashboard.equipment)
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/hours$/,
    auth: true,
    handler: async () => ok(seedDashboard.hours)
  },
  {
    method: 'get',
    pattern: /^\/dashboard\/todos$/,
    auth: true,
    handler: async () => ok(db.todos)
  },
  {
    method: 'put',
    pattern: /^\/dashboard\/todos\/(\d+)$/,
    auth: true,
    handler: async (_config, match, { data }) => {
      const id = Number(match[1])
      const action = data?.action
      const todos = db.todos
      const index = todos.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '待办事项不存在')
      todos.splice(index, 1)
      db.todos = todos
      return ok({ id, action })
    }
  },
  {
    method: 'get',
    pattern: /^\/system\/roles$/,
    auth: true,
    handler: async () => ok(db.roles)
  },
  {
    method: 'post',
    pattern: /^\/system\/roles$/,
    auth: true,
    handler: async (_c, _m, { data }) => {
      const roles = db.roles
      const role = { ...data, id: nextId(roles), createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
      roles.push(role)
      db.roles = roles
      return ok(role)
    }
  },
  {
    method: 'put',
    pattern: /^\/system\/roles\/(\d+)$/,
    auth: true,
    handler: async (_c, match, { data }) => {
      const id = Number(match[1])
      const roles = db.roles
      const index = roles.findIndex((r) => r.id === id)
      if (index === -1) return fail(500, '角色不存在')
      roles[index] = { ...roles[index], ...data, id }
      db.roles = roles
      return ok(roles[index])
    }
  },
  {
    method: 'delete',
    pattern: /^\/system\/roles\/(\d+)$/,
    auth: true,
    handler: async (_c, match) => {
      const id = Number(match[1])
      const roles = db.roles
      const next = roles.filter((r) => r.id !== id)
      if (next.length === roles.length) return fail(500, '角色不存在')
      db.roles = next
      return ok(null)
    }
  },
  {
    method: 'get',
    pattern: /^\/system\/menus$/,
    auth: true,
    handler: async () => ok(db.menus)
  },
  {
    method: 'post',
    pattern: /^\/system\/menus$/,
    auth: true,
    handler: async (_c, _m, { data }) => {
      const menus = db.menus
      const menu = { ...data, id: nextId(menus) }
      menus.push(menu)
      db.menus = menus
      return ok(menu)
    }
  },
  {
    method: 'put',
    pattern: /^\/system\/menus\/(\d+)$/,
    auth: true,
    handler: async (_c, match, { data }) => {
      const id = Number(match[1])
      const menus = db.menus
      const index = menus.findIndex((m) => m.id === id)
      if (index === -1) return fail(500, '菜单不存在')
      menus[index] = { ...menus[index], ...data, id }
      db.menus = menus
      return ok(menus[index])
    }
  },
  {
    method: 'delete',
    pattern: /^\/system\/menus\/(\d+)$/,
    auth: true,
    handler: async (_c, match) => {
      const id = Number(match[1])
      const menus = db.menus
      if (menus.some((m) => m.parentId === id)) return fail(500, '请先删除该菜单下的子菜单')
      const next = menus.filter((m) => m.id !== id)
      if (next.length === menus.length) return fail(500, '菜单不存在')
      db.menus = next
      return ok(null)
    }
  },
  {
    method: 'get',
    pattern: /^\/system\/tenants$/,
    auth: true,
    handler: async (_c, _m, config) => {
      const params = config.params || {}
      const page = Number(params.page) || 1
      const pageSize = Number(params.pageSize) || 10
      let list = db.tenants
      if (params.keyword) {
        const kw = String(params.keyword).toLowerCase()
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(kw) ||
            t.code.toLowerCase().includes(kw) ||
            t.contact.toLowerCase().includes(kw)
        )
      }
      if (params.status !== undefined && params.status !== '' && params.status !== null) {
        list = list.filter((t) => t.status === Number(params.status))
      }
      const total = list.length
      const start = (page - 1) * pageSize
      return ok({ list: list.slice(start, start + pageSize), total })
    }
  },
  {
    method: 'post',
    pattern: /^\/system\/tenants$/,
    auth: true,
    handler: async (_c, _m, { data }) => {
      const tenants = db.tenants
      const tenant = {
        ...data,
        id: nextId(tenants),
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      tenants.unshift(tenant)
      db.tenants = tenants
      return ok(tenant)
    }
  },
  {
    method: 'put',
    pattern: /^\/system\/tenants\/(\d+)$/,
    auth: true,
    handler: async (_c, match, { data }) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const index = tenants.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '租户不存在')
      tenants[index] = { ...tenants[index], ...data, id }
      db.tenants = tenants
      return ok(tenants[index])
    }
  },
  {
    method: 'put',
    pattern: /^\/system\/tenants\/(\d+)\/status$/,
    auth: true,
    handler: async (_c, match, { data }) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const index = tenants.findIndex((t) => t.id === id)
      if (index === -1) return fail(500, '租户不存在')
      tenants[index].status = data?.status ? 1 : 0
      db.tenants = tenants
      return ok(tenants[index])
    }
  },
  {
    method: 'delete',
    pattern: /^\/system\/tenants\/(\d+)$/,
    auth: true,
    handler: async (_c, match) => {
      const id = Number(match[1])
      const tenants = db.tenants
      const next = tenants.filter((t) => t.id !== id)
      if (next.length === tenants.length) return fail(500, '租户不存在')
      db.tenants = next
      return ok(null)
    }
  }
]

export function createMockAdapter() {
  return async (config) => {
    const method = (config.method || 'get').toLowerCase()
    const rawUrl = config.url || ''
    const url = rawUrl.startsWith(PREFIX) ? rawUrl.slice(PREFIX.length) : rawUrl

    for (const route of routes) {
      const match = url.match(route.pattern)
      if (route.method !== method || !match) continue
      if (route.auth) {
        const user = currentUser(config)
        if (!user) {
          await delay()
          return {
            data: fail(401, '登录状态已失效，请重新登录'),
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          }
        }
      }
      await delay()
      const result = await route.handler(config, match, config)
      return {
        data: result,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    return {
      data: fail(404, `接口不存在: ${method.toUpperCase()} ${url}`),
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    }
  }
}
