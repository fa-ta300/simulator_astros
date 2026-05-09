// VARIABLES INICIALES Y CONFIGURACIÓN DEL CANVAS
const canvas = document.getElementById('canvassimulador');
const limite_universo = 1050;
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const g = 0.6;

// ESTADO DE LA CÁMARA
const camara = {
    x: 0,
    y: 0,
    zoom: 1
}

// CLASE PRINCIPAL: ASTROS
class astros {
    constructor(x, y, vx, vy, masa) {
        this.x = x;
        this.y = y;
        this.masa = masa;
        this.radio = Math.sqrt(this.masa) * 2;
        this.vx = vx;
        this.vy = vy;
        this.viva = true;
    }

    // Determina el color basado en la masa actual
    color() {
        if (this.masa >= 250) return 'cyan';
        if (this.masa >= 200) return 'blue';
        if (this.masa >= 100) return 'white';
        if (this.masa >= 20) return 'yellow';
        return 'red';
    }

    // Dibuja el círculo en el contexto 2D
    dibujar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = this.color();
        ctx.fill();
        ctx.closePath();
    }

    // Calcula y aplica la fuerza de gravedad entre dos cuerpos
    atraer(otra) {
        const dx = otra.x - this.x;
        const dy = otra.y - this.y;
        const distanciaSq = dx * dx + dy * dy;
        const distancia = Math.sqrt(distanciaSq);

        if (distancia < 5) return;

        const fuerza = (g * this.masa * otra.masa) / distanciaSq;

        this.vx += (fuerza * dx / distancia) / this.masa;
        this.vy += (fuerza * dy / distancia) / this.masa;
    }

    // Actualiza posición y redibuja el astro
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.radio = Math.sqrt(this.masa) * 2;
        this.dibujar();
    }
}

// CLASE HIJA: PARTICULAS (EFECTOS VISUALES)
class particula extends astros {
    constructor(x, y, vx, vy, color) {
        super(x, y, vx, vy, 0.1);
        this.color_particula = color;
        this.vida = 1.0;
        this.desgaste = Math.random() * 0.02 + 0.01;
    }

    // Dibuja la partícula con transparencia gradual
    dibujar() {
        ctx.save();
        ctx.globalAlpha = this.vida;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color_particula;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    // Reduce la vida y actualiza posición
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= this.desgaste;
        if (this.vida <= 0) this.viva = false;
        this.dibujar();
    }
}

// GESTIÓN DE OBJETOS Y COLECCIONES
let lista_particulas = [];
let lista_estrellas = [];
let cantidad_ideal = 40;
const listaColores = ['blue', 'red', 'green', 'purple', 'orange', 'cyan'];

// Función para generar explosiones de partículas
function particulas_colocar(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() - 0.5) * 2;
        lista_particulas.push(new particula(x, y, vx, vy, color));
    }
}

// Función auxiliar para rangos aleatorios
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// FUNCIÓN PRINCIPAL: BUCLE DE ANIMACIÓN
function animar() {
    const rojas = lista_estrellas.filter(a => a.color() === 'red').length;
    const amarillas = lista_estrellas.filter(a => a.color() === 'yellow').length;
    const blancas = lista_estrellas.filter(a => a.color() === 'white').length;
    const cian = lista_estrellas.filter(a => a.color() === 'cyan').length;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Aplicación de transformaciones de cámara
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camara.zoom, camara.zoom);
    ctx.translate(-canvas.width / 2 + camara.x, -canvas.height / 2 + camara.y);

    // Dibujo del límite visual del universo
    ctx.beginPath();
    ctx.arc(0, 0, limite_universo, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.closePath();
    ctx.setLineDash([]);

    // Cálculo de colisiones y física de gravedad
    for (let i = 0; i < lista_estrellas.length; i++) {
        let astroA = lista_estrellas[i];
        for (let j = i + 1; j < lista_estrellas.length; j++) {
            let astroB = lista_estrellas[j];
            const dx = astroB.x - astroA.x;
            const dy = astroB.y - astroA.y;
            const distanciaSq = dx * dx + dy * dy;
            const distancia = Math.sqrt(distanciaSq);

            if (distancia < astroA.radio + astroB.radio) {
                let ganador = (astroA.masa >= astroB.masa) ? astroA : astroB;
                let perdedor = (ganador === astroA) ? astroB : astroA;

                const masaEfectiva = perdedor.masa * 0.75;
                ganador.masa += masaEfectiva;
                ganador.vx *= 0.95;
                ganador.vy *= 0.95;
                perdedor.viva = false;

                particulas_colocar(perdedor.x, perdedor.y, perdedor.color(), 15);

                if (ganador.masa >= 500) {
                    ganador.viva = false;
                    particulas_colocar(ganador.x, ganador.y, 'white', 30);
                }
            } else {
                astroA.atraer(astroB);
                astroB.atraer(astroA);
            }
        }
    }

    // Actualización de posiciones y rebote en los límites
    for (let e = lista_estrellas.length - 1; e >= 0; e--) {
        let astro = lista_estrellas[e];
        if (astro.viva) {
            astro.actualizar();
        } else {
            lista_estrellas.splice(e, 1);
        }

        const distancia_astro = Math.sqrt(astro.x ** 2 + astro.y ** 2);
        if (distancia_astro > limite_universo) {
            astro.vx = -astro.vx;
            astro.vy = -astro.vy;
            astro.x *= 0.99;
            astro.y *= 0.99;
            astro.vy *= 0.50;
            astro.vx *= 0.50;
        }
    }

    // Ciclo de vida de las partículas
    for (let i = lista_particulas.length - 1; i >= 0; i--) {
        let p = lista_particulas[i];
        p.actualizar();
        if (!p.viva) lista_particulas.splice(i, 1);
    }

    // Generación de nuevos astros para mantener la población
    if (lista_estrellas.length < cantidad_ideal) {
        const angulo = Math.random() * Math.PI * 2;
        const radio_nacimiento = Math.sqrt(Math.random()) * limite_universo;
        const spawnX = Math.cos(angulo) * radio_nacimiento;
        const spawnY = Math.sin(angulo) * radio_nacimiento;

        lista_estrellas.push(new astros(
            spawnX,
            spawnY,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            random(5, 10)
        ));
    }
    ctx.restore();
    // Actualización de la Interfaz de Usuario (HUD)
    const interfaz = document.getElementById('stats_simulador');
    interfaz.innerHTML = `
        ASTROS: ${lista_estrellas.length} <br>
        ZOOM: ${camara.zoom.toFixed(2)} <br>
        🔴 Rojas: ${rojas}<br>
        🟡 Amarillas: ${amarillas}<br>
        ⚪ Blancas: ${blancas}<br>
        🔵 Cian: ${cian}<br>
    `;

    
    requestAnimationFrame(animar);
}

// CONTROL DE ENTRADA (TECLADO)
window.addEventListener('keydown', (e) => {
    const paso = 20 / camara.zoom;
    if (e.key === 'ArrowUp') camara.y += paso;
    if (e.key === 'ArrowDown') camara.y -= paso;
    if (e.key === 'ArrowLeft') camara.x += paso;
    if (e.key === 'ArrowRight') camara.x -= paso;
    if (e.key === 'q') camara.zoom *= 1.1;
    if (e.key === 'e') camara.zoom /= 1.1;
});


// VARIABLES PARA EL CONTROL TÁCTIL
let tocando = false;
let toqueX = 0;
let toqueY = 0;

// EVENTOS TÁCTILES: INICIO, MOVIMIENTO Y FIN
window.addEventListener('touchstart', (e) => {
    tocando = true;
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
}, { passive: false });
//eventos tactles
window.addEventListener('touchmove', (e) => {
    if (!tocando) return;

    // Calculamos el desplazamiento del dedo
    const dx = e.touches[0].clientX - toqueX;
    const dy = e.touches[0].clientY - toqueY;

    // Movemos la cámara según el zoom actual de PC
    camara.x += dx / camara.zoom;
    camara.y += dy / camara.zoom;

    // Actualizamos posición para el siguiente movimiento
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;

    // Bloqueamos el scroll del navegador
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
    tocando = false;
});



// INICIO DEL SIMULADOR
animar();