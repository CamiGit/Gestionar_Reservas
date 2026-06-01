// Objeto principal que contiene todos los datos del dashboard organizados por período de tiempo
const datos = {
    '7d': {
        // Etiquetas del eje X del gráfico: un punto por cada día de la semana
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        ingresos: [320000, 410000, 280000, 490000, 560000, 720000, 480000],
        reservas: [8, 11, 7, 14, 17, 22, 15],

        // Valores que se muestran en las tarjetas resumen del dashboard
        metricas: {
            ingresos:   '$2.600.000',
            reservas:   '94',
            clientes:   '61',
            canceladas: '4.3%'
        },

        // Variación porcentual respecto al mismo período anterior
        deltas: {
            ingresos:   '+15.4%',
            reservas:   '+12.1%',
            clientes:   '+8.3%',
            canceladas: '-0.5%'
        },

        // Color que se aplica a cada delta
        colores: {
            ingresos:   'verde',
            reservas:   'verde',
            clientes:   'verde',
            canceladas: 'rojo'
        },

        // Reservas por servicio para el gráfico de torta
        serviciosPie: [32, 20, 12, 22, 8],

        // Tendencia diaria para los sparklines de cada tarjeta
        sparklines: {
            ingresos:   [320000, 410000, 280000, 490000, 560000, 720000, 480000],
            reservas:   [8, 11, 7, 14, 17, 22, 15],
            clientes:   [5, 7, 4, 9, 11, 14, 11],
            canceladas: [5, 3, 6, 4, 5, 3, 4]
        }
    },

    '30d': {
        // Etiquetas del eje X: una por cada semana del mes
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        ingresos: [1200000, 1540000, 1380000, 1820000],
        reservas: [32, 44, 39, 51],

        // Valores que se muestran en las tarjetas resumen del dashboard
        metricas: {
            ingresos:   '$5.940.000',
            reservas:   '166',
            clientes:   '98',
            canceladas: '3.8%'
        },

        // Variación porcentual respecto al mismo período anterior
        deltas: {
            ingresos:   '+15.4%',
            reservas:   '+12.1%',
            clientes:   '+8.3%',
            canceladas: '-0.5%'
        },

        // Color que se aplica a cada delta
        colores: {
            ingresos:   'verde',
            reservas:   'verde',
            clientes:   'verde',
            canceladas: 'verde'
        },

        // Reservas por servicio para el gráfico de torta
        serviciosPie: [58, 38, 22, 36, 12],

        // Tendencia semanal para los sparklines de cada tarjeta
        sparklines: {
            ingresos:   [1200000, 1540000, 1380000, 1820000],
            reservas:   [32, 44, 39, 51],
            clientes:   [20, 28, 24, 26],
            canceladas: [4, 4, 3, 4]
        }
    },

    '90d': {
        // Etiquetas del eje X: un punto por cada mes del trimestre
        labels: ['Enero', 'Febrero', 'Marzo'],
        ingresos: [4200000, 5100000, 6800000],
        reservas: [112, 138, 184],

        // Valores que se muestran en las tarjetas resumen del dashboard
        metricas: {
            ingresos:   '$16.100.000',
            reservas:   '434',
            clientes:   '210',
            canceladas: '3.1%'
        },

        // Variación porcentual respecto al mismo período anterior
        deltas: {
            ingresos:   '+22.7%',
            reservas:   '+18.4%',
            clientes:   '+14.2%',
            canceladas: '-1.3%'
        },

        // Color que se aplica a cada delta
        colores: {
            ingresos:   'verde',
            reservas:   'verde',
            clientes:   'verde',
            canceladas: 'verde'
        },

        // Reservas por servicio para el gráfico de torta
        serviciosPie: [142, 87, 54, 98, 23],

        // Tendencia mensual para los sparklines de cada tarjeta
        sparklines: {
            ingresos:   [4200000, 5100000, 6800000],
            reservas:   [112, 138, 184],
            clientes:   [62, 78, 70],
            canceladas: [4, 3, 2]
        }
    }
};

// Tabla de servicios
// Array con cada servicio que ofrece la peluquería y sus métricas asociadas
const servicios = [
    { nombre: 'Corte de cabello',     reservas: 142, ingresos: '$2.130.000', estado: 'activo'  },
    { nombre: 'Tinte y coloración',   reservas: 87,  ingresos: '$3.915.000', estado: 'activo'  },
    { nombre: 'Tratamiento keratina', reservas: 54,  ingresos: '$4.320.000', estado: 'pausado' }, // Sin insumos disponibles
    { nombre: 'Barba y afeitado',     reservas: 98,  ingresos: '$980.000',   estado: 'activo'  },
    { nombre: 'Peinado para eventos', reservas: 23,  ingresos: '$1.150.000', estado: 'pausado' }, // Temporada baja
];


//Grafico con chart.js

// Variables globales para las instancias activas de cada gráfico
let grafico;
let graficoPie;

// Construye el gráfico de líneas para el rango de tiempo indicado
function construirGrafico(rango) {

    // Obtiene el bloque de datos correspondiente al rango recibido
    const d = datos[rango];
    // Si ya existe un gráfico previo, lo destruye antes de crear uno nuevo
    if (grafico) grafico.destroy();

    // Crea una nueva instancia del gráfico apuntando al elemento del HTML
    grafico = new Chart(document.getElementById('grafico-principal'), {
        // Tipo de gráfico: líneas
        type: 'line',

        data: {
            // Etiquetas del eje X según el rango seleccionado
            labels: d.labels,

            datasets: [
                {
                    label: 'Ingresos',               // Nombre de esta serie para el tooltip
                    data: d.ingresos,                // Array de valores de ingresos del rango
                    borderColor: '#522676',
                    backgroundColor: 'rgba(90, 37, 235, 0.08)',
                    fill: true,                      // Activa el área rellena bajo la línea
                    tension: 0.3,
                    yAxisID: 'y'                     // Asocia esta serie al eje Y izquierdo
                },
                {
                    label: 'Reservas',               // Nombre de esta serie para el tooltip
                    data: d.reservas,                // Array de valores de reservas del rango
                    borderColor: '#AE8D3E',
                    borderDash: [5, 4],              // Línea discontinua: 5px trazo, 4px espacio
                    fill: false,                     // Sin relleno bajo esta línea
                    tension: 0.3,
                    yAxisID: 'y2'                    // Asocia esta serie al eje Y derecho
                }
            ]
        },

        options: {
            responsive: true,           // El gráfico se adapta al tamaño de su contenedor
            maintainAspectRatio: false, // Permite definir altura personalizada sin distorsionar

            plugins: {
                legend: { display: false } // Oculta la leyenda automática de Chart.js
            },

            scales: {
                // Eje Y izquierdo: muestra los ingresos formateados como moneda colombiana
                y: {
                    position: 'left',
                    ticks: {
                        // Transforma el número puro en formato "$1.200.000"
                        callback: v => '$' + v.toLocaleString('es-CO')
                    }
                },
                // Eje Y derecho: muestra el número de reservas sin formato especial
                y2: {
                    position: 'right',
                    grid: { display: false } // Oculta las líneas de cuadrícula del eje derecho para no saturar el gráfico
                }
            }
        }
    });
}


// Construye el gráfico de torta con la distribución de reservas por servicio para el rango dado
function construirGraficoPie(rango) {
    if (graficoPie) graficoPie.destroy();

    const colores = [
        '#522676',
        '#AE8D3E',
        '#7B3FA8',
        '#D4A84B',
        '#9B6AC0',
    ];

    graficoPie = new Chart(document.getElementById('grafico-torta'), {
        type: 'doughnut',
        data: {
            labels: servicios.map(s => s.nombre),
            datasets: [{
                data: datos[rango].serviciosPie,
                backgroundColor: colores,
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11 },
                        boxWidth: 12,
                        padding: 10,
                        color: '#444'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed} reservas`
                    }
                }
            }
        }
    });
}

// Renderiza un sparkline en el canvas indicado
function crearSparkline(id, valores, color) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: valores.map((_, i) => i),
            datasets: [{
                data: valores,
                borderColor: color,
                borderWidth: 1.5,
                pointRadius: 0,
                fill: true,
                backgroundColor: color + '18',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false, grace: '20%' }
            },
            animation: { duration: 500 }
        }
    });
}

// Construye los cuatro sparklines según el rango activo
function construirSparklines(rango) {
    const sp = datos[rango].sparklines;
    crearSparkline('spark-ingresos',   sp.ingresos,   '#522676');
    crearSparkline('spark-reservas',   sp.reservas,   '#AE8D3E');
    crearSparkline('spark-clientes',   sp.clientes,   '#7B3FA8');
    crearSparkline('spark-canceladas', sp.canceladas, '#dc3545');
}

// Cambio del grafico con el rango
// Recibe el rango seleccionado y el elemento que fue clickeado
function cambiarRango(rango, boton) {

    // Recorre todos los botones de filtro y quita la clase activo de cada uno
    document.querySelectorAll('.filtros button').forEach(b => b.classList.remove('activo'));

    // Agrega la clase activo únicamente al botón que fue clickeado
    boton.classList.add('activo');

    // Obtiene el bloque de datos del nuevo rango seleccionado
    const d = datos[rango];

    // Itera sobre las 4 claves de métricas para actualizar cada tarjeta del dashboard
    ['ingresos', 'reservas', 'clientes', 'canceladas'].forEach(k => {

        // Actualiza el valor principal de la tarjeta
        document.getElementById('m-' + k).textContent = d.metricas[k];
        // Selecciona el elemento que muestra la variación porcentual (ej: "+12.1%")
        const delta = document.getElementById('d-' + k);
        // Actualiza el texto del delta con el porcentaje del nuevo rango
        delta.textContent = d.deltas[k];
        // Reemplaza la clase CSS del delta para cambiar su color ('verde' o 'rojo')
        delta.className = d.colores[k];
    });

    // Destruye los gráficos actuales y construye nuevos con los datos del rango elegido
    construirGrafico(rango);
    construirGraficoPie(rango);
    construirSparklines(rango);
}

function initMetricas(){

    // Saludo dinámico según la hora del día
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    const saludoEl = document.getElementById('saludo-header');
    if (saludoEl) saludoEl.textContent = `${saludo}, Admin`;

    // Fecha actual formateada
    const fechaEl = document.getElementById('fecha-header');
    if (fechaEl) {
        fechaEl.textContent = new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    const tbody = document.getElementById('tabla-body');
    tbody.innerHTML = "";
    servicios.forEach((s, index) => {
        const etiqueta = s.estado === 'activo'  ? 'Activo'
                        : s.estado === 'pausado' ? 'Pausado'
                        : 'Eliminado';

        tbody.innerHTML += `
            <tr>
                <td class="ranking">#${index + 1}</td>
                <td>${s.nombre}</td>
                <td>${s.reservas}</td>
                <td>${s.ingresos}</td>
                <td><span class="badge ${s.estado}">${etiqueta}</span></td>
            </tr>
        `;
    });

    construirGrafico('7d');
    construirGraficoPie('7d');
    construirSparklines('7d');
}