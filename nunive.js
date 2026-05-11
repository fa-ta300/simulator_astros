// VARIABLES INICIALES Y CONFIGURACIÓN DEL CANVAS
const canvas = document.getElementById('canvassimulador');
const limite_universo = 1500;
const ctx = canvas.getContext('2d');
let supernovas_total=0;
let tipo_hover = '';
let pausado = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let mouseX = 0
let mouseY = 0
let astroHover = null;
window.addEventListener('mousemove', (e) =>{
    mouseX = e.clientX;
    mouseY = e.clientY
});
const g = 0.6;

// ESTADO DE LA CÁMARA
const camara = {
    x: 0,
    y: 0,
    zoom: 1
}

const btnPausa = document.getElementById('pausa');

btnPausa.addEventListener('click', () => {
    pausado = !pausado; 
    if (pausado) {
        btnPausa.innerText = "Reanudar";
        btnPausa.style.backgroundColor = "#ff4444";
    } else {
        btnPausa.innerText = "Pausar";
        btnPausa.style.backgroundColor = "#44ff44";
    }
});

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
        this.tipo = 'astros';
    }

    color() {
        if (this.masa >= 250) return 'cyan';
        if (this.masa >= 200) return 'blue';
        if (this.masa >= 100) return 'white';
        if (this.masa >= 20) return 'yellow';
        return 'red';
    }

    dibujar() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = this.color();
        ctx.fill();
        ctx.closePath();
    }

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

    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.radio = Math.sqrt(this.masa) * 2;
        this.dibujar();
    }
}

// CLASE AGUJERO NEGRO
class agujero_negro extends astros {
    constructor(x, y, vx, vy, masa) {
        super(x, y, vx, vy, masa);
        this.radio = Math.sqrt(this.masa) * 1.2;
        this.vida = masa * 250;
        this.tipo = 'agujero_negro';
    }

    dibujar() {
        const extensionDistorcion = this.radio * 3; 
        const grad = ctx.createRadialGradient(this.x, this.y, this.radio, this.x, this.y, extensionDistorcion);



        grad.addColorStop(0, 'rgba(150, 100, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, extensionDistorcion, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();

        
        

    }
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
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= 1;
        if (this.vida < 0.1) {
            this.viva = false; 
            particulas_colocar(this.x, this.y, 'purple', 100);
        }

        this.radio = Math.sqrt(this.masa) * 1.2;
        this.dibujar();
    }
}

// CLASE PARTICULA
class particula extends astros {
    constructor(x, y, vx, vy, color) {
        super(x, y, vx, vy, 0.1);
        this.color_particula = color;
        this.vida = 1.0;
        this.desgaste = Math.random() * 0.02 + 0.01;
    }

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

    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= this.desgaste;
        if (this.vida <= 0) this.viva = false;
        this.dibujar();
    }
}
class estrella_neutrones extends astros {
    constructor(x, y, vx, vy, masa) {
        super(x, y, vx, vy, masa);
        this.radio = 10 + Math.log(this.masa);
        this.vida = masa * 300;
        this.tipo = 'neutrones';
    }

    dibujar() {
        const extensionDistorcion = this.radio * 4; 
        const grad = ctx.createRadialGradient(this.x, this.y, this.radio, this.x, this.y, extensionDistorcion);
        grad.addColorStop(0, 'rgba(0, 213, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(this.x, this.y, extensionDistorcion, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fillStyle = 'cyan';
        ctx.fill();
        ctx.closePath();
    }
    atraer(otra) {
        const dx = otra.x - this.x;
        const dy = otra.y - this.y;
        const distanciaSq = dx * dx + dy * dy;
        const distancia = Math.sqrt(distanciaSq);
        if (distancia < 5) return;
        const fuerza = (g * this.masa * otra.masa) / distanciaSq;
        this.vx += (fuerza * dx / distancia) / this.masa;
        this.vy += (fuerza * dy / distancia) / this.masa;
        if (distancia < this.radio*4){
            otra.masa-=0.01;
            this.masa+=0.01;
            particulas_colocar(otra.x,otra.y,otra.color,1);
            if (this.masa>=1000){
                
                    
                particula_espefisica(this.x,this.y,'cyan',150,-(this.vx),-(this.vy));
                this.viva=false
                setTimeout(() => {
                    lista_estrellas.push(new agujero_negro(this.x,this.y,this.vx,this.vy,50));
                }, 500); // 500 ms
                

            }
            
            if (otra.masa<0.1){
                otra.viva=false
            }

        }
    }
    actualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= 1;
        this.radio = 10 + Math.log(this.masa);
        if (this.vida < 0.1) {
            this.viva = false; 
            particulas_colocar(this.x, this.y, 'white', 100);
        }
        if (this.masa>=1000){
        
            
            particula_espefisica(this.x,this.y,'cyan',150,-(this.vx),-(this.vy));
            this.viva=false
            setTimeout(() => {
                lista_estrellas.push(new agujero_negro(this.x,this.y,this.vx,this.vy,50));
            }, 500); // 500 ms
        

        }
        this.dibujar();
    }
}
class pulsar extends estrella_neutrones {
    constructor(x, y, vx, vy, masa) {
        super(x, y, vx, vy, masa);
        this.radio = 10 + Math.log(this.masa);
        this.angulo = 0; // Ángulo inicial
        this.velocidadRotacion = 0.01; // Qué tan rápido gira
        this.tipo = 'pulsar'
        

    }

    dibujar() {
        // 1. Dibujamos el resplandor y el núcleo (lo que ya tenías)
        super.dibujar();

        // 2. hazes
        const largoHaz = this.radio * 8; // Qué tan larga es la línea de luz
        
        // Calculamos la punta del haz A y el haz B 
        const xFinal = this.x + Math.cos(this.angulo) * largoHaz;
        const yFinal = this.y + Math.sin(this.angulo) * largoHaz;
        
        const xFinalOpuesto = this.x - Math.cos(this.angulo) * largoHaz;
        const yFinalOpuesto = this.y - Math.sin(this.angulo) * largoHaz;

        ctx.beginPath();
        ctx.moveTo(xFinalOpuesto, yFinalOpuesto);
        ctx.lineTo(xFinal, yFinal);
        
        // Estilo del rayo gamma
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15; // Efecto de brillo (ojo: consume recursos)
        ctx.shadowColor = 'cyan';
        ctx.stroke();
        
        ctx.shadowBlur = 0; // Limpiamos el shadow para no ralentizar el resto
        ctx.closePath();
    }

    atraer(otra) {
        // 1. Llamamos a la gravedad normal primero
        super.atraer(otra);

        // 2. Lógica de repulsión del Haz (Jet)
        const dx = otra.x - this.x;
        const dy = otra.y - this.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        // Solo si está en el rango del haz de luz (por ejemplo, 8 veces el radio)
        if (distancia < this.radio * 8) {
            
            // Calculamos el ángulo relativo entre el púlsar y la otra estrella
            const anguloAstro = Math.atan2(dy, dx);
            
            // Comparamos con el ángulo actual de rotación del haz
            // Usamos Math.cos para ver si el astro está alineado con el haz (o su opuesto)
            const diferenciaAngulo = Math.abs(Math.cos(anguloAstro - this.angulo));

            // Si diferenciaAngulo está cerca de 1, significa que está sobre la línea
            if (diferenciaAngulo > 0.98) { // 0.98 es el "ancho" del rayo
                const fuerzaRepulsion = 0.6; // Ajusta esto para que sea más o menos violento
                
                // Empujamos al astro hacia afuera en la dirección del rayo
                otra.vx += (dx / distancia) * fuerzaRepulsion;
                otra.vy += (dy / distancia) * fuerzaRepulsion;

                if (Math.random() > 0.5) {
                    particulas_colocar(otra.x, otra.y, 'cyan', 1);
                }
            }
        }
    }
    actualizar() {
        if (!pausado) {
            this.angulo += this.velocidadRotacion; // Hace que la línea gire
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vida -= 1;
        this.radio = 10 + Math.log(this.masa);
        if (this.vida < 0.1) {
            this.viva = false; 
            particulas_colocar(this.x, this.y, 'white', 100);
        }
        this.dibujar();
    }
}
const  ESCALA_KM = 100; // 1 unidad de velocidad  = 100 km/s
let lista_particulas = [];
let lista_estrellas = [];
let cantidad_ideal = 50;

function particulas_colocar(x, y, color, cantidad) {
    for (let i = 0; i < cantidad; i++) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = (Math.random() - 0.5) * 4;
        lista_particulas.push(new particula(x, y, vx, vy, color));
    }
}
function particula_espefisica(x, y, color, cantidad,vx,vy) {
    for (let i = 0; i < cantidad; i++) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = (Math.random() - 0.5) * 4;
        lista_particulas.push(new particula(x, y, vx, vy, color));
    }
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function animar() {
    //SISTEMA HOVER
    const mundoMouseX = (mouseX - canvas.width / 2) / camara.zoom + canvas.width / 2 - camara.x;
    const mundoMouseY = (mouseY - canvas.height / 2) / camara.zoom + canvas.height / 2 - camara.y;

    astroHover = null; // Resetear en cada frame

    for (let astro of lista_estrellas) {
        const dx = mundoMouseX - astro.x;
        const dy = mundoMouseY - astro.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        // Si el mouse está sobre el radio del astro (ajustado por zoom para facilidad)
        if (distancia < astro.radio + 20 / camara.zoom) {
            astroHover = astro;
            break; // Encontramos uno, paramos de buscar
        }
    }
    // Conteos para el HUD
    const rojas = lista_estrellas.filter(a => a.tipo === 'astros' && a.color() === 'red').length;
    const amarillas = lista_estrellas.filter(a => a.tipo === 'astros' && a.color() === 'yellow').length;
    const blancas = lista_estrellas.filter(a => a.tipo === 'astros' && a.color() === 'white').length;
    const cian = lista_estrellas.filter(a => a.tipo === 'astros' && a.color() === 'cyan').length;
    const n_agujeros = lista_estrellas.filter(a => a.tipo === 'agujero_negro').length;
    const azul = lista_estrellas.filter(a => a.tipo === 'astros' && a.color() === 'blue').length;
    const n_neutrones = lista_estrellas.filter(a => a.tipo === 'neutrones').length;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camara.zoom, camara.zoom);
    ctx.translate(-canvas.width / 2 + camara.x, -canvas.height / 2 + camara.y);

    // Límite universo
    ctx.beginPath();
    ctx.arc(0, 0, limite_universo, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.closePath();
    ctx.setLineDash([]);

    if (!pausado) {
        for (let i = 0; i < lista_estrellas.length; i++) {
            let astroA = lista_estrellas[i];
            for (let j = i + 1; j < lista_estrellas.length; j++) {
                let astroB = lista_estrellas[j];
                const dx = astroB.x - astroA.x;
                const dy = astroB.y - astroA.y;
                const distanciaSq = dx * dx + dy * dy;
                const distancia = Math.sqrt(distanciaSq);

                // Efecto de distorsión (lensing)
                if (astroA instanceof agujero_negro || astroB instanceof agujero_negro) {
                    let bh = (astroA instanceof agujero_negro) ? astroA : astroB;
                    let est = (bh === astroA) ? astroB : astroA;
                    if (distancia < bh.radio * 3 && est.tipo === 'astros') {
                        est.vx *= 1.02;
                        est.vy *= 1.02;
                        if (Math.random() > 0.8) particulas_colocar(est.x, est.y, 'white', 1);
                    }
                }

                // COLISIONES
                if (distancia < astroA.radio + astroB.radio) {
                    let ganador = (astroA.masa >= astroB.masa) ? astroA : astroB;
                    let perdedor = (ganador === astroA) ? astroB : astroA;
                    const masaEfectiva = perdedor.masa * 0.75;

                    // 1. Fusión de agujeros negros 
                    if (astroA instanceof agujero_negro && astroB instanceof agujero_negro) {
                        ganador.masa += perdedor.masa;
                        ganador.vx *= 0.50;
                        ganador.vy *= 0.50;
                        perdedor.viva = false;
                        particulas_colocar(ganador.x, ganador.y, 'purple', 50);
                    } 
                    // 2. Agujero come estrella
                    else if (ganador instanceof agujero_negro) {
                        ganador.masa += masaEfectiva;
                        ganador.vx *= 0.85;
                        ganador.vy *= 0.85;
                        perdedor.viva = false;
                    }else if(perdedor instanceof agujero_negro){
                        perdedor.masa += masaEfectiva;
                        perdedor.vx *= 0.85;
                        perdedor.vy *= 0.85;
                        ganador.viva = false;
                    }
                    else if (ganador instanceof estrella_neutrones) {
                        ganador.masa += perdedor.masa;
                        ganador.vx *= 0.76;
                        ganador.vy *= 0.76;
                        perdedor.viva = false;
                        particulas_colocar(ganador.x, ganador.y,perdedor.color, 50);
                    } 
                    // 3. Choque de estrellas
                    else {
                        ganador.masa += masaEfectiva;
                        ganador.vx *= 0.95;
                        ganador.vy *= 0.95;
                        perdedor.viva = false;
                        particulas_colocar(perdedor.x, perdedor.y, perdedor.color(), 15);

                        // Probabilidades especiales
                        let r = Math.random();
                        if (r <= 0.01) { // Crear Agujero Negro
                            ganador.viva = false;
                            particulas_colocar(ganador.x, ganador.y, 'white', 70);
                            lista_estrellas.push(new agujero_negro(ganador.x, ganador.y, ganador.vx, ganador.vy, (ganador.masa + perdedor.masa)));
                        } else if (Math.random() <= 0.03) { // Supernova
                            supernovas_total++;
                            ganador.viva = false;
                            particulas_colocar(ganador.x, ganador.y, 'white', 20);
                        }else if(Math.random <=0.02 && perdedor.masa <=6){//crear neutrones
                            ganador.viva = false;
                            particulas_colocar(ganador.x, ganador.y, 'white', 70);
                            lista_estrellas.push(new estrella_neutrones(ganador.x, ganador.y, ganador.vx, ganador.vy, (ganador.masa + perdedor.masa)));
                        }else if(Math.random <=0.015 && perdedor.masa <=6){//crear pulsar
                            ganador.viva = false;
                            particulas_colocar(ganador.x, ganador.y, 'white', 70);
                            lista_estrellas.push(new pulsar(ganador.x, ganador.y, ganador.vx, ganador.vy, (ganador.masa + perdedor.masa)));
                        }

                        if (ganador.masa >= 500 && ganador.tipo === 'astros') {
                            ganador.viva = false;
                            supernovas_total++;
                            particulas_colocar(ganador.x, ganador.y, 'white', 30);
                        }
                    }
                }
                else {
                    // GRAVEDAD MUTUA
                    astroA.atraer(astroB);
                    astroB.atraer(astroA);
                }
            }
        }
    }
    for (let p of lista_particulas) {
        for (let a of lista_estrellas) {
            p.atraer(a); // La partícula siente la gravedad, pero no atrae a la estrella
        }
        p.actualizar();
    }
    // Actualización y Dibujo
    for (let e = lista_estrellas.length - 1; e >= 0; e--) {
        let astro = lista_estrellas[e];
        if (!pausado) {
            if (astro.viva) {

                astro.actualizar();
                // Límites del universo
                const dist_centro = Math.sqrt(astro.x ** 2 + astro.y ** 2);
                if (dist_centro > limite_universo) {
                    astro.vx *= -0.5;
                    astro.vy *= -0.5;
                    astro.x *= 0.99;
                    astro.y *= 0.99;
                }
            } else {
                lista_estrellas.splice(e, 1);
            }
        } else {
            astro.dibujar();
        }
    }

    // Partículas (se detienen en pausa)
    for (let i = lista_particulas.length - 1; i >= 0; i--) {
        let p = lista_particulas[i];
        if (!pausado) p.actualizar();
        else p.dibujar();
        if (!p.viva) lista_particulas.splice(i, 1);
    }

    // Spawner
    const n_astros = lista_estrellas.filter(a => a.tipo === 'astros').length;
    if (!pausado && n_astros < cantidad_ideal) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * (limite_universo * 0.8);
        lista_estrellas.push(new astros(
            Math.cos(ang) * dist,
            Math.sin(ang) * dist,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            random(5, 12)
        ));
    }
    if (astroHover) {
        // 1. Dibujamos el anillo blanco y la línea de velocidad
        // Como estamos antes del restore(), las coordenadas astroHover.x/y funcionan perfecto
        ctx.beginPath();
        ctx.arc(astroHover.x, astroHover.y, astroHover.radio + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 / camara.zoom; // Compensamos el grosor para que no se vea gigante con zoom
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(astroHover.x, astroHover.y);
        ctx.lineTo(astroHover.x + astroHover.vx * 30, astroHover.y + astroHover.vy * 30);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
    }
    ctx.restore();
    // --- DIBUJAR hover ---
    
    if (astroHover) {
        if(astroHover.color() ==='red' && astroHover.tipo ==='astros'){
            tipo_hover = 'estrella roja';
        }else if (astroHover.color()==='yellow' && astroHover.tipo === 'astros'){
            tipo_hover = 'estrella amarrila';
        }else if (astroHover.color()==='white' && astroHover.tipo === 'astros'){
            tipo_hover = 'estrella blanca';
        }else if (astroHover.color()==='blue' && astroHover.tipo === 'astros'){
            tipo_hover = 'estrella azul';
        }else if (astroHover.color()==='cyan' && astroHover.tipo === 'astros'){
            tipo_hover = 'estrella cyan(mas grande)';
        }else if  ( astroHover.tipo === 'agujero_negro'){
            tipo_hover = 'agujero negro';
        }else if (astroHover.tipo === 'neutrones'){
            tipo_hover = 'estrella de neutrones';
        }

        const padding = 10;
        const ancho = 350;
        const alto = 105;
        const x = mouseX + 20;
        const y = mouseY - 20;
        const velocidadTotal = Math.sqrt(astroHover.vx ** 2 + astroHover.vy ** 2);
        const velocidadEnKm = velocidadTotal * ESCALA_KM;
        const masa_hover_u= astroHover.masa /5
        // Fondo del recuadro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = 'cyan'
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, ancho, alto);
        ctx.strokeRect(x, y, ancho, alto);
        ctx.beginPath();




        // Texto de información

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Tipo: ${tipo_hover.toUpperCase()}`, x + padding, y + 40);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(` 5 de masa = 1UeR(masa minima para ser estrella)`, x + padding, y + 20);

        ctx.font = '12px Arial';
        ctx.fillText(`Masa: ${masa_hover_u.toFixed(2)} UeR`, x + padding, y + 60);
        ctx.fillStyle = 'white';
        ctx.fillText(`Velocidad: ${velocidadEnKm.toFixed(1)} km/s`, x + padding, y + 80);
        
        // Si es un agujero negro o estrella de neutrones, mostrar su "vida"
        if (astroHover.vida) {
            ctx.fillStyle = 'white';
            ctx.fillText(`Estabilidad: ${Math.floor(astroHover.vida / 3600)} min : ${Math.floor((astroHover.vida % 3600) / 60)} seg`, x + padding, y + 95);

        }
    }
    // HUD
    document.getElementById('stats_simulador').innerHTML = `
        super novas hasta ahora: ${supernovas_total}<br>
        ASTROS: ${lista_estrellas.length} <br>
        ZOOM: ${camara.zoom.toFixed(2)} <br>
        🔴 Rojas: ${rojas} | 🟡 Amarillas: ${amarillas}<br>
        ⚪ Blancas: ${blancas} | 🔵 Cian: ${cian}<br>
        azul: ${azul} | 🎆 Agujeros Negros: ${n_agujeros} <br>
        neutrones: ${n_neutrones}<br>
        
    `;
    
    requestAnimationFrame(animar);
}

// TECLADO
window.addEventListener('keydown', (e) => {
    const paso = 30 / camara.zoom;
    if (e.key === 'ArrowUp') camara.y += paso;
    if (e.key === 'ArrowDown') camara.y -= paso;
    if (e.key === 'ArrowLeft') camara.x += paso;
    if (e.key === 'ArrowRight') camara.x -= paso;
    if (e.key === 'q') camara.zoom *= 1.1;
    if (e.key === 'e') camara.zoom /= 1.1;
    if (e.key === 'w') cantidad_ideal++;
    if (e.key === 's') cantidad_ideal--;
    if (e.code === 'Space') { e.preventDefault(); btnPausa.click(); }
    if (e.key === 'a') {
        lista_estrellas.push(new agujero_negro((Math.random()-0.5)*200, (Math.random()-0.5)*200, 0, 0, 400));
    }
    if(e.key === 'd'){
        lista_estrellas.push(new pulsar((Math.random()-0.5)*200, (Math.random()-0.5)*200, 1, 1, 900));
    }
});

// TÁCTIL (Simplificado)
let tocando = false, toqueX = 0, toqueY = 0;
window.addEventListener('touchstart', (e) => { 
    tocando = true; toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY; 
}, {passive:false});
window.addEventListener('touchmove', (e) => {
    if (!tocando) return;
    camara.x += (e.touches[0].clientX - toqueX) / camara.zoom;
    camara.y += (e.touches[0].clientY - toqueY) / camara.zoom;
    toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY;
    e.preventDefault();
}, {passive:false});
window.addEventListener('touchend', () => tocando = false);

animar();
//mucha matematica😫😪😪😪
