import { useAppStore } from '../store/appStore'

interface ConfirmOptions {
    title: string
    message: string
    requireCheckbox?: boolean
    checkboxLabel?: string
}

export function useConfirm() {
    const showConfirmStore = useAppStore(s => s.showConfirm)

    const showConfirm = (opts: ConfirmOptions): Promise<boolean> => {
        return showConfirmStore(opts)
    }

    return { showConfirm }
}
