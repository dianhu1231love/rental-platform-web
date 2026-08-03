export type TreeNode<T> = T & { children: TreeNode<T>[] }

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
