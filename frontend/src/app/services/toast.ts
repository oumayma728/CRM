/**
 * Thin react-toastify-compatible facade over react-hot-toast (the app's toaster),
 * used by the pages that came from feature/zied1.
 */
import hotToast from 'react-hot-toast';

type Msg = Parameters<typeof hotToast>[0];

export const toast = Object.assign((msg: Msg) => hotToast(msg), {
  success: (msg: Msg) => hotToast.success(msg),
  error: (msg: Msg) => hotToast.error(msg),
  info: (msg: Msg) => hotToast(msg, { icon: 'ℹ️' }),
  warn: (msg: Msg) => hotToast(msg, { icon: '⚠️' }),
  warning: (msg: Msg) => hotToast(msg, { icon: '⚠️' }),
  dismiss: hotToast.dismiss,
});

export default toast;
