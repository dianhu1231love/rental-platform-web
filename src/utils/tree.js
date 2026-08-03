export function buildTree(list, parentId = 0) {
  const map = new Map(list.map((item) => [item.id, { ...item, children: [] }]))
  const roots = []
  for (const item of map.values()) {
    if (item.parentId === parentId || !map.has(item.parentId)) {
      roots.push(item)
    } else {
      map.get(item.parentId).children.push(item)
    }
  }
  const sortRec = (arr) => {
    arr.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    arr.forEach((c) => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}
