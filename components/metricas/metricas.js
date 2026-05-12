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

// Variable global para guardar la instancia activa del gráfico
let grafico;

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

    // Destruye el gráfico actual y construye uno nuevo con los datos del rango elegido
    construirGrafico(rango);
}

function initMetricas(){

    // Selecciona el <tbody> del HTML donde se van a insertar las filas dinámicamente
const tbody = document.getElementById('tabla-body');
// Recorre cada servicio del array para generar una fila HTML por cada uno
 // limpiar tabla
    tbody.innerHTML = "";
servicios.forEach(s => {
    // Convierte el valor interno del estado en texto legible para el usuario
    // Si no es activo ni pausado, cae en el caso por defecto: 'Eliminado'
    const etiqueta = s.estado === 'activo'  ? 'Activo'
                    : s.estado === 'pausado' ? 'Pausado'
                    : 'Eliminado';

    // Agrega una nueva fila al final del tbody usando template literals
    // La clase del <span> usa s.estado para aplicar el color correcto desde CSS
    tbody.innerHTML += `
        <tr>
            <td>${s.nombre}</td>
            <td>${s.reservas}</td>
            <td>${s.ingresos}</td>
            <td><span class="badge ${s.estado}">${etiqueta}</span></td>
        </tr>
    `;
});

// Llama a construirGrafico al cargar la página con '7d' como rango por defecto
construirGrafico('7d');
}