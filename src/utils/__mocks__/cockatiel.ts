export const retry = jest.fn((policy, options) => ({
  execute: jest.fn(async (fn) => {
    let result;
    const context = { attempt: 0 };
    while (context.attempt < options?.maxAttempts) {
      try {
        // eslint-disable-next-line no-await-in-loop
        result = await fn(context);
        return result;
      } catch (error) {
        // eslint-disable-next-line no-plusplus
        context.attempt++;
        if (context.attempt >= options?.maxAttempts) {
          throw error;
        }
      }
    }
    return result;
  }),
}));

export const handleAll = jest.fn();
export const ExponentialBackoff = jest.fn();
