const pLimit = () => jest.fn(async (fn) => fn());
export default pLimit;
