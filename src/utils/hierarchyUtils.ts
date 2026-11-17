export function arrayToTree<T>(
    flatArray: T[],
    idKey: keyof T,
    parentIdKey: keyof T
): Array<T & { children: any[] }> {
    const nodeMap = new Map<any, T & { children: any[] }>();
    const result: Array<T & { children: any[] }> = [];

    for (const item of flatArray) {
        nodeMap.set(item[idKey], { ...item, children: [] });
    }

    for (const item of flatArray) {
        const node = nodeMap.get(item[idKey])!;
        const parentId = item[parentIdKey];
        if (parentId != null && nodeMap.has(parentId)) {
            nodeMap.get(parentId)!.children.push(node);
        } else {
            result.push(node);
        }
    }

    return result;
}