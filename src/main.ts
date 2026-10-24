import './styles/main.css';
import { SessionService } from './services/auth/session';
import { store } from './services/store/appStore';
import { CountdownComponent } from './components/countdown';
import { PlayerComponent } from './components/player';
import { PolaroidsComponent } from './components/polaroids';
import { DedicatoriasComponent } from './components/dedicatorias';
import { NavigationComponent } from './components/navigation';
import { AdminModalComponent } from './components/adminModal';
import { AuthModalComponent } from './components/authModal';

// Inicializar la sesión y validación de tokens
SessionService.init();

// Inicializar modales de autenticación y administración
const adminModal = new AdminModalComponent(() => {
  navigation.render();
  // Forzar actualización de componentes al cambiar permisos de admin
  store.setFiltro(store.getState().filtroCategoria);
});

const authModal = new AuthModalComponent(() => {
  navigation.render();
});
authModal.evaluarAcceso();

// Inicializar componentes visuales
const navigation = new NavigationComponent('main-header', 'bottom-nav', () => {
  adminModal.abrir();
});

new CountdownComponent('section-countdown');
new PlayerComponent('section-player');
new PolaroidsComponent('section-polaroids');
new DedicatoriasComponent('section-dedicatorias');

console.log('✨ Celebración de Mariana “Nita” iniciada correctamente');
