export function toast(message: string) {
  if (typeof window === "undefined") return;
  // Basit, stabil toast: istersen sonra UI toast component'e bağlarız
  try {
    window.dispatchEvent(new CustomEvent("evlumba:toast", { detail: { message } }));
  } catch {
    // fallback
    alert(message);
  }
}

export default toast;
