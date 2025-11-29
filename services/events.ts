
export type ToastType = 'success' | 'error' | 'info';

export const notify = (message: string, type: ToastType = 'info') => {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};
