import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Enemigo {
  id: number;
  x: number;
  y: number;
  vx: number;
  tamano: number;
}

interface Laser {
  id: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  juegoGanado = false;
  desbloqueandoGafete = false;
  estadoJuego: 'idle' | 'playing' | 'won' | 'lost' = 'idle';
  tiempoRestante = 30;
  puntaje = 0;
  objetivoPuntos = 180;
  enemigos: Enemigo[] = [];
  lasers: Laser[] = [];
  playerX = 50;
  mensajeJuego = 'Pilota y destruye naves enemigas';
  ultimoDisparo = 0;
  private intervaloTiempo: number | null = null;
  private gameLoop: number | null = null;
  private timeoutDesbloqueo: number | null = null;
  private idEnemigo = 0;
  private idLaser = 0;

  mostrarInfo = false;
  modoOscuro = false;
  panelActivo: 'sobre-mi' | 'proyectos' | 'contacto' = 'sobre-mi';
  copiado = false;
  private tiltX = 0;
  private tiltY = 0;
  isDragging = false;
  pullX = 0;
  pullY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private bounceFrame: number | null = null;

  nombre = 'Hugo Fernandez Audante';
  rol = 'Frontend Developer';
  frase = 'Desarrollador web enfocado en experiencias modernas.';

  metricas = [
    { etiqueta: 'Proyectos', valor: '12+' },
    { etiqueta: 'Tecnologias', valor: '8' },
    { etiqueta: 'Anos de estudio', valor: '3' }
  ];

  habilidades = [
    'HTML',
    'CSS',
    'TypeScript',
    'Angular',
    'MySQL'
  ];

  frases = [
    'Desarrollador web enfocado en experiencias modernas.',
    'Construyendo interfaces claras, rapidas y escalables.',
    'Apasionado por Angular y buenas practicas de diseno.'
  ];

  iniciarJuego() {
    this.juegoGanado = false;
    this.desbloqueandoGafete = false;
    this.estadoJuego = 'playing';
    this.tiempoRestante = 30;
    this.puntaje = 0;
    this.playerX = 50;
    this.enemigos = [];
    this.lasers = [];
    this.mensajeJuego = 'Derriba naves para desbloquear';

    this.detenerTimersJuego();
    this.cancelarDesbloqueoPendiente();
    this.generarOleadaEnemiga();

    this.intervaloTiempo = window.setInterval(() => {
      if (this.estadoJuego !== 'playing') {
        return;
      }

      this.tiempoRestante -= 1;

      if (this.tiempoRestante <= 0) {
        this.finalizarJuego(this.puntaje >= this.objetivoPuntos);
      }
    }, 1000);

    this.gameLoop = window.setInterval(() => {
      if (this.estadoJuego === 'playing') {
        this.actualizarJuego();
      }
    }, 40);
  }

  moverNave(event: MouseEvent) {
    if (this.estadoJuego !== 'playing') {
      return;
    }

    const area = event.currentTarget as HTMLElement;
    const rect = area.getBoundingClientRect();
    const relativo = ((event.clientX - rect.left) / rect.width) * 100;
    this.playerX = Math.max(6, Math.min(94, relativo));
  }

  disparar() {
    if (this.estadoJuego !== 'playing') {
      return;
    }

    const ahora = Date.now();
    if (ahora - this.ultimoDisparo < 180) {
      return;
    }

    this.ultimoDisparo = ahora;
    this.idLaser += 1;
    this.lasers.push({ id: this.idLaser, x: this.playerX, y: 88 });
  }

  dispararEnPosicion(event: MouseEvent) {
    this.moverNave(event);
    this.disparar();
  }

  private actualizarJuego() {
    this.lasers = this.lasers
      .map((laser) => ({ ...laser, y: laser.y - 2.8 }))
      .filter((laser) => laser.y > -4);

    this.enemigos = this.enemigos
      .map((enemigo) => ({
        ...enemigo,
        x: enemigo.x + enemigo.vx,
        y: enemigo.y + 0.25
      }))
      .map((enemigo) => {
        if (enemigo.x < 6 || enemigo.x > 94) {
          return { ...enemigo, vx: enemigo.vx * -1 };
        }
        return enemigo;
      });

    const lasersEliminar = new Set<number>();
    const enemigosEliminar = new Set<number>();

    for (const laser of this.lasers) {
      for (const enemigo of this.enemigos) {
        const dx = laser.x - enemigo.x;
        const dy = laser.y - enemigo.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < enemigo.tamano * 0.45) {
          lasersEliminar.add(laser.id);
          enemigosEliminar.add(enemigo.id);
          this.puntaje += 16;
          this.mensajeJuego = 'Impacto confirmado';
          break;
        }
      }
    }

    this.lasers = this.lasers.filter((laser) => !lasersEliminar.has(laser.id));
    this.enemigos = this.enemigos.filter((enemigo) => !enemigosEliminar.has(enemigo.id));

    const enemigoEscapo = this.enemigos.some((enemigo) => enemigo.y > 92);
    if (enemigoEscapo) {
      this.finalizarJuego(false);
      return;
    }

    if (this.enemigos.length < 3) {
      this.generarOleadaEnemiga();
    }

    if (this.puntaje >= this.objetivoPuntos) {
      this.finalizarJuego(true);
    }
  }

  reiniciarJuego() {
    this.iniciarJuego();
  }

  private finalizarJuego(gano: boolean) {
    this.detenerTimersJuego();
    this.estadoJuego = gano ? 'won' : 'lost';
    this.juegoGanado = false;
    this.desbloqueandoGafete = false;

    if (gano) {
      this.mensajeJuego = 'Acceso concedido';
      this.desbloqueandoGafete = true;
      this.timeoutDesbloqueo = window.setTimeout(() => {
        this.desbloqueandoGafete = false;
        this.juegoGanado = true;
        this.timeoutDesbloqueo = null;
      }, 1400);
    } else {
      this.mensajeJuego = 'Tiempo agotado. Intentalo otra vez';
    }
  }

  private detenerTimersJuego() {
    if (this.intervaloTiempo !== null) {
      clearInterval(this.intervaloTiempo);
      this.intervaloTiempo = null;
    }

    if (this.gameLoop !== null) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  private cancelarDesbloqueoPendiente() {
    if (this.timeoutDesbloqueo !== null) {
      clearTimeout(this.timeoutDesbloqueo);
      this.timeoutDesbloqueo = null;
    }
  }

  private generarOleadaEnemiga() {
    const cantidad = 4;
    for (let i = 0; i < cantidad; i += 1) {
      this.idEnemigo += 1;
      this.enemigos.push({
        id: this.idEnemigo,
        x: Math.floor(Math.random() * 78) + 10,
        y: Math.floor(Math.random() * 18) + 6,
        vx: (Math.random() * 0.6 + 0.3) * (Math.random() > 0.5 ? 1 : -1),
        tamano: 28
      });
    }
  }

  get cardTransform(): string {
    return `perspective(1100px) rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg)`;
  }

  cambiarFrase() {
    if (this.frases.length < 2) {
      return;
    }

    let random = Math.floor(Math.random() * this.frases.length);
    while (this.frases[random] === this.frase) {
      random = Math.floor(Math.random() * this.frases.length);
    }

    this.frase = this.frases[random];
  }

  toggleInfo() {
    this.mostrarInfo = !this.mostrarInfo;
  }

  toggleModo() {
    this.modoOscuro = !this.modoOscuro;
  }

  cambiarPanel(panel: 'sobre-mi' | 'proyectos' | 'contacto') {
    this.panelActivo = panel;
  }

  onCardMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.tiltY = ((x - centerX) / centerX) * 5;
    this.tiltX = ((centerY - y) / centerY) * 5;
  }

  resetCardTilt() {
    this.tiltX = 0;
    this.tiltY = 0;
  }

  async copiarEmail() {
    try {
      await navigator.clipboard.writeText('hugo.fernandez@vallegrande.edu.pe');
      this.copiado = true;
      setTimeout(() => {
        this.copiado = false;
      }, 1800);
    } catch {
      this.copiado = false;
    }
  }

  iniciarEstiron(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }

    const objetivo = event.target as HTMLElement;
    if (objetivo.closest('button, a')) {
      return;
    }

    this.isDragging = true;
    this.detenerRebote();
    this.dragStartX = event.clientX - this.pullX;
    this.dragStartY = event.clientY - this.pullY;

    const objetivoArrastre = event.currentTarget as HTMLElement;
    objetivoArrastre.setPointerCapture(event.pointerId);
  }

  @HostListener('window:pointermove', ['$event'])
  alEstirar(event: PointerEvent) {
    if (!this.isDragging) {
      return;
    }

    const nuevoX = event.clientX - this.dragStartX;
    const nuevoY = event.clientY - this.dragStartY;

    this.pullX = Math.max(-52, Math.min(52, nuevoX));
    this.pullY = Math.max(-16, Math.min(210, nuevoY));
  }

  @HostListener('window:pointerup')
  soltarGafete() {
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.iniciarReboteFisico();
  }

  @HostListener('window:pointercancel')
  cancelarEstiron() {
    if (this.isDragging) {
      this.isDragging = false;
      this.iniciarReboteFisico();
    }
  }

  private iniciarReboteFisico() {
    this.detenerRebote();

    const rigidez = 0.12;
    const amortiguacion = 0.86;

    const frame = () => {
      const fuerzaX = -this.pullX * rigidez;
      const fuerzaY = -this.pullY * rigidez;

      this.velocityX = (this.velocityX + fuerzaX) * amortiguacion;
      this.velocityY = (this.velocityY + fuerzaY) * amortiguacion;

      this.pullX += this.velocityX;
      this.pullY += this.velocityY;

      const casiQuieto =
        Math.abs(this.pullX) < 0.15 &&
        Math.abs(this.pullY) < 0.15 &&
        Math.abs(this.velocityX) < 0.15 &&
        Math.abs(this.velocityY) < 0.15;

      if (casiQuieto) {
        this.pullX = 0;
        this.pullY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.detenerRebote();
        return;
      }

      this.bounceFrame = requestAnimationFrame(frame);
    };

    this.bounceFrame = requestAnimationFrame(frame);
  }

  private detenerRebote() {
    if (this.bounceFrame !== null) {
      cancelAnimationFrame(this.bounceFrame);
      this.bounceFrame = null;
    }
  }
}