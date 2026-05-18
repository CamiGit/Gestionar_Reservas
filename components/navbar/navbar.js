// const enlaces = document.querySelectorAll('.nav-link');
//     // 1. Obtenemos el nombre del archivo actual (ej: "servicios.html")
//     // Si estamos en la raíz, window.location.pathname devolverá "/" o "index.html"
//     let rutaActual = window.location.pathname.split("/").pop();
//     if (rutaActual === "" || rutaActual === "/") {
//         rutaActual = "index.html";
//     }
//     enlaces.forEach(enlace => {
//         // 2. Obtenemos el nombre del archivo del href del enlace
//         let rutaEnlace = enlace.getAttribute('href').split("/").pop();
        
//         console.log("Comparando:", rutaEnlace, "con", rutaActual);
//         if(rutaEnlace == rutaActual){
//             enlace.classList.add('activo');
//         }else {
//             enlace.classList.remove('activo');
//         }

//     });