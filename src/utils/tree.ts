/**
 * 树结构工具
 */

/** 树节点：在原数据基础上附加 children 字段 */
export type TreeNode<T> = T & { children: TreeNode<T>[] }

/**
 * 将扁平的父子列表构建为树
 * @param list 含 id / parentId / 可选 sort 的扁平数据
 * @param parentId 根节点所属的父级 id
 * @returns 按 sort 排序后的树形结构
 */
export function buildTree<T extends { id: number; parentId: number; sort?: number }>(
  list: T[],
  parentId = 0,
): TreeNode<T>[] {
  const map = new Map<number, TreeNode<T>>()
  list.forEach((item) => map.set(item.id, { ...item, children: [] }))
  const roots: TreeNode<T>[] = []
  for (const item of map.values()) {
    if (item.parentId === parentId || !map.has(item.parentId)) {
      roots.push(item)
    } else {
      map.get(item.parentId)!.children.push(item)
    }
  }
  const sortRec = (arr: TreeNode<T>[]): void => {
    arr.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    arr.forEach((c) => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}
