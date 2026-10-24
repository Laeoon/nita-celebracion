export function showToast(mensaje: string, tipo: 'info' | 'exito' | 'alerta' = 'info'): void {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none px-4 w-full max-w-sm';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const borderClass = tipo === 'exito' 
    ? 'border-emerald-500/40 text-emerald-200' 
    : tipo === 'alerta' 
      ? 'border-amber-500/40 text-amber-200' 
      : 'border-champagne-400/40 text-champagne-200';

  toast.className = `glass-panel-elevated border ${borderClass} px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2.5 transition-all duration-300 opacity-0 translate-y-3 pointer-events-auto`;
  
  toast.innerHTML = `
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    <span class="flex-1">${mensaje}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-3');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  // Salida automática a los 3.5 segundos
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-3');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
