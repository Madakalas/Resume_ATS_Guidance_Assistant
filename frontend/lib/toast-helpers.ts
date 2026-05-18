import { toast } from 'sonner';

export function toastSaved(message: string = 'Changes saved successfully') {
  toast.success(message, {
    duration: 3000,
  });
}

export function toastReordered(message: string = 'Sections reordered') {
  toast.success(message, {
    duration: 2500,
  });
}

export function toastSectionAdded(sectionTitle: string) {
  toast.success(`${sectionTitle} section added`, {
    duration: 2500,
  });
}

export function toastSectionDeleted(sectionTitle: string) {
  toast.success(`${sectionTitle} section deleted`, {
    duration: 2500,
  });
}

export function toastSettingsUpdated(message: string = 'Settings updated') {
  toast.success(message, {
    duration: 2500,
  });
}

export function toastError(message: string = 'Something went wrong') {
  toast.error(message, {
    duration: 3000,
  });
}

export function toastInfo(message: string) {
  toast.info(message, {
    duration: 2500,
  });
}

export function toastFileAttached(fileName: string) {
  toast.success(`${fileName} attached`, {
    duration: 2500,
  });
}
