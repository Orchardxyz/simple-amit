import { toast, type ExternalToast } from "svelte-sonner";

type ToastMessage = string;
type ToastId = string | number;

function withDefaultDuration(options?: ExternalToast): ExternalToast | undefined {
  if (options?.duration !== undefined) {
    return options;
  }

  return options === undefined ? undefined : { ...options, duration: 3200 };
}

export const notify = {
  success(message: ToastMessage, options?: ExternalToast): ToastId {
    return toast.success(message, withDefaultDuration(options));
  },
  error(message: ToastMessage, options?: ExternalToast): ToastId {
    return toast.error(message, withDefaultDuration({ duration: 5000, ...options }));
  },
  info(message: ToastMessage, options?: ExternalToast): ToastId {
    return toast.info(message, withDefaultDuration(options));
  },
  warning(message: ToastMessage, options?: ExternalToast): ToastId {
    return toast.warning(message, withDefaultDuration({ duration: 4500, ...options }));
  },
  loading(message: ToastMessage, options?: ExternalToast): ToastId {
    return toast.loading(message, {
      duration: Number.POSITIVE_INFINITY,
      ...options
    });
  },
  dismiss(toastId?: ToastId) {
    toast.dismiss(toastId);
  }
};
