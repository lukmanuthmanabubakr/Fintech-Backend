function format(level, message, meta) {
  const base = { level, time: new Date().toISOString(), pid: process.pid, message };
  if (meta && typeof meta === 'object') base.meta = meta;
  return JSON.stringify(base);
}

export const logger = {
  info: (message, meta) => console.log(format('info', message, meta)),
  warn: (message, meta) => console.warn(format('warn', message, meta)),
  error: (message, meta) => console.error(format('error', message, meta)),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') console.debug(format('debug', message, meta));
  },
};

export default logger;
