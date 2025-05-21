export const getCliParams = (): Record<string, string> => {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  args.forEach((item) => {
    if (item.startsWith("--")) {
      const [key, value] = item.slice(2).split("=");
      if (key && value !== undefined) {
        params[key] = value;
      } else {
        console.warn(`参数格式不正确: ${item}，应为 --key=value`);
      }
    }
  });
  return params;
};

export function checkRequiredParams(
  params: Record<string, string>,
  required: string[]
): string[] {
  return required.filter((key) => !params[key]);
}

/**
 * 通用异步重试工具
 * @param fn 需要重试的异步函数
 * @param retry 重试次数，默认2
 * @param delayMs 每次重试的延迟，默认500ms
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  retry = 2,
  delayMs = 500
): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i <= retry; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retry) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
