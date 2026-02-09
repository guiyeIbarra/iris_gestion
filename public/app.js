const productosUl = document.getElementById('lista-productos');
const ventasUl = document.getElementById('lista-ventas');
const resumenDiv = document.getElementById('resumen');

const inputId = document.getElementById('producto-id');
const inputNombre = document.getElementById('nombre');
const inputPrecio = document.getElementById('precio');
const inputStock = document.getElementById('stock');
const btnGuardar = document.getElementById('btn-guardar');
const mensajeProducto = document.getElementById('mensaje-producto');

let productos = [];
async function cargarProductos() {
  const res = await fetch('/productos');
  productos = await res.json();
  renderProductos();
}

// fecha de hoy en formato YYYY-MM-DD
const hoy = new Date().toISOString().split('T')[0];


btnGuardar.addEventListener('click', (e) => {
  e.preventDefault();
  const nombre = inputNombre.value.trim();
  const precio = Number(inputPrecio.value);
  const stock = Number(inputStock.value);

  
  if (!nombre || precio <= 0 || stock < 0) {
    mensajeProducto.textContent = 'Datos inválidos';
    return;
  }
  
  const producto = { nombre, precio, stock, };
  
  // EDITAR
  if (inputId.value) {
    fetch(`/productos/${inputId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    })
      .then(res => res.json())
      .then(() => {
        mensajeProducto.textContent = 'Producto actualizado';
        limpiarFormulario();
        cargarProductos();
      });

  // CREAR
  } else {
    fetch('/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    })

      .then(res => res.json())
      .then(() => {
        mensajeProducto.textContent = 'Producto creado';
        limpiarFormulario();
        cargarProductos();
      });
  }
              function limpiarFormulario() {
  inputId.value = '';
  inputNombre.value = '';
  inputPrecio.value = '';
  inputStock.value = '';
}
});

// cargar productos
function cargarProductos() {
  fetch('/productos')
    .then(res => res.json())
    .then(productos => {
      productosUl.innerHTML = '';

      productos.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.nombre} - $${p.precio} (stock: ${p.stock}) ${p.activo ? '' : '[INACTIVO]'}`;

        if (!p.activo) {
  li.style.opacity = '0.5';
  li.style.textDecoration = 'line-through';
}


        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.style.marginLeft = '10px';

        btnEditar.addEventListener('click', () => {
          inputId.value = p.id;
          inputNombre.value = p.nombre;
          inputPrecio.value = p.precio;
          inputStock.value = p.stock;

          mensajeProducto.textContent = `Editando producto ID ${p.id}`;
        });

        const btnEstado = document.createElement('button');
btnEstado.textContent = p.activo ? 'Desactivar' : 'Activar';

btnEstado.addEventListener('click', () => {
  fetch(`/productos/${p.id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo: !p.activo })
  })
  .then(res => res.json())
  .then(() => cargarProductos())
  .catch(err => alert(err.message));
});

        const btnEliminar = document.createElement('button');
btnEliminar.textContent = 'Eliminar';
btnEliminar.style.marginLeft = '5px';
btnEliminar.type = 'button';

btnEliminar.addEventListener('click', () => {
  if (!confirm(`Eliminar el producto "${p.nombre}"?`)) return;

 fetch(`/productos/${p.id}`, { method: 'DELETE' })
  .then(res => {
    if (!res.ok) {
      return res.text().then(text => {
        throw new Error(text || 'No se pudo eliminar el producto');
      });
    }
    return res.json();
  })
  .then(() => {
    cargarProductos();
  })
  .catch(err => {
    alert(err.message);
    console.error(err.message);
  });
  
});

li.appendChild(btnEditar);
//li.appendChild(btnEliminar);
li.appendChild(btnEstado);

productosUl.appendChild(li);

      });
    });
}
cargarProductos();

// resumen diario
fetch(`/ventas/resumen?fecha=${hoy}`)
  .then(res => res.json())
  .then(r => {
    resumenDiv.textContent =
      `Ventas: ${r.cantidadVentas} | Total vendido: $${r.totalVendido}`;
  });


const btnBuscarVentas = document.getElementById('btnBuscarVentas');
const btnVerMas = document.getElementById('btnVerMas');
const fechaVentas = document.getElementById('fechaVentas');
const listaVentas = document.getElementById('listaVentas');


const selectProducto = document.getElementById('producto-select');
const cantidadInput = document.getElementById('cantidad');
const btnVender = document.getElementById('btn-vender');
const mensaje = document.getElementById('mensaje');

const carritoUl = document.getElementById('carrito');
const btnAgregar = document.getElementById('btn-agregar');
const btnConfirmar = document.getElementById('btn-confirmar');

let carrito = [];

let productosCache = [];

// cargar productos en el select
fetch('/productos')
  .then(res => res.json())
  .then(productos => {
    productosCache = productos;
    
    productos
    .filter(p => p.activo)
    .forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.nombre} ($${p.precio})`;
      selectProducto.appendChild(option);
    });
  });

// agregar producto al carrito
btnAgregar.addEventListener('click', () => {
  const productoId = parseInt(selectProducto.value);
  const cantidad = parseInt(cantidadInput.value);

  if (!cantidad || cantidad <= 0) {
    mensaje.textContent = 'Cantidad inválida';
    return;
  }

  const existente = carrito.find(i => i.productoId === productoId);
  
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ productoId, cantidad });
  }
  

// render del carrito
  renderCarrito();
  mensaje.textContent = '';
  cantidadInput.value = '';
});
const totalSpan = document.getElementById('total-carrito');

function renderCarrito() {
  carritoUl.innerHTML = '';
  let total = 0;

  carrito.forEach((item, index) => {
    const producto = productosCache.find(p => p.id === item.productoId);
    const subtotal = producto.precio * item.cantidad;
    total += subtotal;

    const li = document.createElement('li');
    li.textContent = `${producto.nombre} - $${producto.precio} x ${item.cantidad} = $${subtotal}`;

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '❌';
    btnEliminar.style.marginLeft = '10px';

    btnEliminar.addEventListener('click', () => {
      carrito.splice(index, 1); // elimina ese item
      renderCarrito();
    });

    li.appendChild(btnEliminar);
    carritoUl.appendChild(li);
  });

  totalSpan.textContent = total;
}

//vaciar carrito
const btnVaciar = document.getElementById('btn-vaciar');

btnVaciar.addEventListener('click', () => {
  carrito = [];
  renderCarrito();
  mensaje.textContent = 'Carrito vaciado';
});


// confirmar venta
btnConfirmar.addEventListener('click', () => {
  if (carrito.length === 0) {
    mensaje.textContent = 'El carrito está vacío';
    return;
  }

  fetch('/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: carrito })
  })
    .then(res => res.json())
    .then(() => {
      mensaje.textContent = 'Venta registrada correctamente';
      carrito = [];
      renderCarrito();
      location.reload();
    })
    .catch(() => {
      mensaje.textContent = 'Error al registrar la venta';
    });
});

function renderVentas(ventas) {
  const lista = document.getElementById('listaVentas');
  lista.innerHTML = '';

  ventas.forEach(v => {
    const li = document.createElement('li');

    li.textContent = `Venta #${v.id} - Total: $${v.total}`;

    if (v.anulada) {
      li.style.color = 'red';
      li.style.textDecoration = 'line-through';
      li.textContent += ' (ANULADA)';
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Anular';
      btn.addEventListener('click', () => anularVenta(v.id));
      li.appendChild(btn);
    }

    lista.appendChild(li);
  });
}

document.getElementById('btnResumen').addEventListener('click', () => {
  const fecha = document.getElementById('fechaResumen').value;
  if (!fecha) return alert('Seleccione una fecha');

  fetch(`/ventas/resumen?fecha=${fecha}`)
    .then(res => res.json())
    .then(data => {
      let html = `
        <p>Ventas: ${data.cantidadVentas}</p>
        <p>Total del día: $${data.totalDia}</p>
        <ul>
      `;

      //resumen diario

      for (const id in data.productos) {
  let nombre = `Producto ID ${id}`;

  if (Array.isArray(productos) && productos.length > 0) {
    const prod = productos.find(p => p.id === parseInt(id));
    if (prod) nombre = prod.nombre;
  }

  html += `<li>${nombre}: ${data.productos[id]} unidades</li>`;
}
      html += '</ul>';

      document.getElementById('resultadoResumen').innerHTML = html;
    });
});

/*
function anularVenta(id) {
  fetch(`/ventas/${id}/anular`, { method: 'PUT' })
    .then(res => res.json())
    .then(() => {
      cargarVentas(); // vuelve a pedir ventas y re-renderiza

      li.className = v.anulada ? 'venta-anulada' : 'venta-normal';
    });
}

  /*fetch(`/ventas?fecha=${fecha}&limit=5`)
    .then(res => res.json())
    .then(ventas => {
      listaVentas.innerHTML = '';

      if (ventas.length === 0) {
        listaVentas.innerHTML = '<li>No hay ventas</li>';
        return;
      }

      ventas.forEach(v => {
        const li = document.createElement('li');
        li.textContent = `#${v.id} - $${v.total} - ${new Date(v.fecha).toLocaleTimeString()}`;
        listaVentas.appendChild(li);
      });
    });*/

let offsetVentas = 0;
const LIMITE = 5;
let fechaActual = null;

btnBuscarVentas.addEventListener('click', () => {
  fechaActual = fechaVentas.value;
  if (!fechaActual) return alert('Seleccione una fecha');
  cargarVentas({ reset: true });
});

btnVerMas.addEventListener('click', () => {
  cargarVentas();
});


function cargarVentas({ reset = false } = {}) {
  if (!fechaActual) return;

  if (reset) {
    offsetVentas = 0;
    listaVentas.innerHTML = '';
  }

  fetch(`/ventas?fecha=${fechaActual}&offset=${offsetVentas}&limit=${LIMITE}`)
    .then(res => res.json())
    .then(ventas => {

      if (!Array.isArray(ventas)) {
        console.error('Respuesta inesperada:', ventas);
        return;
      }

      if (ventas.length === 0 && offsetVentas === 0) {
        listaVentas.innerHTML = '<li>No hay ventas</li>';
        btnVerMas.style.display = 'none';
        return;
      }

      ventas.forEach(v => {
        const li = document.createElement('li');
        li.textContent = `#${v.id} - $${v.total} - ${new Date(v.fecha).toLocaleTimeString()}`;
        listaVentas.appendChild(li);
      });

      offsetVentas += ventas.length;

      btnVerMas.style.display =
        ventas.length < LIMITE ? 'none' : 'inline';
    })
    .catch(err => console.error(err));
}



cargarProductos();



 
