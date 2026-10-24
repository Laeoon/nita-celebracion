import './styles/main.css';
import { SessionService } from './services/auth/session';
import { store } from './services/store/appStore';
import { CountdownComponent } from './components/countdown';
import { PlayerComponent } from './components/player';
import { PolaroidsComponent } from './components/polaroids';
import { DedicatoriasComponent } from './components/dedicatorias';
import { ClosingComponent } from './components/closing';
import { NavigationComponent } from './components/navigation';
import { AdminModalComponent } from './components/adminModal';
import { AuthModalComponent } from './components/authModal';

// Inicializar la sesión y validación de tokens
SessionService.init();

// Inicializar componentes
const navigation = new NavigationComponent('main-header', () => {
  adminModal.abrir();
});

new CountdownComponent('section-countdown');
const player = new PlayerComponent('section-player');
const polaroids = new PolaroidsComponent('section-polaroids');
const dedicatorias = new DedicatoriasComponent('section-dedicatorias');
new ClosingComponent('section-closing');

// Modales de autenticación y administración
const adminModal = new AdminModalComponent(() => {
  navigation.render();
  player.render();
  polaroids.render();
  dedicatorias.render();
  store.setFiltro(store.getState().filtroCategoria);
});

const authModal = new AuthModalComponent(() => {
  navigation.render();
  polaroids.render();
  dedicatorias.render();
});

authModal.evaluarAcceso();

console.log('✨ Celebración de Mariana “Nita” iniciada correctamente');
