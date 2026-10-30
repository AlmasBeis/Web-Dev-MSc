// Express 4 не ловит отклонённые промисы: передаём их в next(err) сами.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
