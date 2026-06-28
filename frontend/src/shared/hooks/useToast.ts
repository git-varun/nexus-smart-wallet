import { useGlobalToast } from '@/app/providers/Toast';

export const useToast = () => {
    const { toasts, toast, dismissToast } = useGlobalToast();
    return {
        toasts,
        toast,
        dismissToast
    };
};
