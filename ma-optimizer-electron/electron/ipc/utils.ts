export const escapePS = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.replace(/'/g, "''");
};
