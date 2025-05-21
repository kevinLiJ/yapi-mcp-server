export const getCliParams = (): Record<string, string> => {
  const args = process.argv.slice(2);
  const params = Object.fromEntries(
    args.reduce<Array<[string, string]>>((pre, item) => {
      if (item.startsWith("--")) {
        return [...pre, item.slice(2).split("=") as [string, string]];
      }
      return pre;
    }, [])
  );
  return params;
};
