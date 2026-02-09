const fs = require('fs');
const express = require('express');
const leerProductos = () => {
  const data = fs.readFileSync('productos.json', 'utf-8');
  return JSON.parse(data);
};

const leerVentas = () => {
  const data = fs.readFileSync('ventas.json', 'utf-8');
  return JSON.parse(data);
};

const guardarVentas = (ventas) => {
  fs.writeFileSync('ventas.json', JSON.stringify(ventas, null, 2));
};


const guardarProductos = (productos) => {
  fs.writeFileSync('productos.json', JSON.stringify(productos, null, 2));
};

const app = express(); // 👈 primero se crea app

/*
-----Esta app.get es para identificar ventas por "id", se reemplazó
     por identificación por fecha----------------------------------

app.get('/ventas', (req, res) => {
  try {
    const ventas = leerVentas();
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer las ventas' });
  }
});
*/


app.use(express.json()); // 👈 después se usa
/*
app.get('/', (req, res) => {
  res.send('Servidor del sistema de inventario funcionando');
});
*/
app.get('/productos', (req, res) => {
  const productos = leerProductos();

  productos.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );

  res.json(productos);
});

app.get('/ventas', (req, res) => {
  const { fecha, limit = 5, offset = 0 } = req.query;
  let ventas = leerVentas();

  if (fecha) {
    ventas = ventas.filter(v => v.fecha.startsWith(fecha));
  }

  // ordenar: más recientes primero
  ventas.sort((a, b) => {
  const diffFecha = new Date(b.fecha) - new Date(a.fecha);
  if (diffFecha !== 0) return diffFecha;
  return b.id - a.id;
});


  //const limite = parseInt(limit) || ventas.length;
  const start = parseInt(offset);
  const end = parseInt(limit);

  const ventasPaginadas = ventas.slice(start, end);
  res.json(ventasPaginadas);


  /*if (desde && hasta) {
    const d = new Date(desde);
    const h = new Date(hasta);

    ventas = ventas.filter(v => {
      const fv = new Date(v.fecha);
      return fv >= d && fv <= h;
    });
  }

  res.json(ventas);*/
});

app.get('/ventas/resumen', (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: 'Fecha requerida (YYYY-MM-DD)' });
  }

  const ventas = leerVentas();

  const ventasDelDia = ventas.filter(v =>
    !v.anulada &&
    v.fecha.startsWith(fecha)
  );
    const totalDia = ventasDelDia.reduce((acc, v) => acc + v.total, 0);

  res.json({
    fecha,
    cantidadVentas: ventasDelDia.length,
    totalDia
  });
});

/*
app.get('/ventas/resumen', (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: 'Debe indicar una fecha' });
  }

  const ventas = leerVentas().filter(v =>
    v.fecha.startsWith(fecha)
  );

  const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);

  res.json({
    fecha,
    cantidadVentas: ventas.length,
    totalVendido
  });
});
*/

app.post('/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  if (typeof precio !== 'number' || precio < 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: 'Stock inválido' });
  }

  const productos = leerProductos();

  const nuevoProducto = {
    id: productos.length + 1,
    nombre,
    precio,
    stock,
    activo:true
  };

  productos.push(nuevoProducto);
  guardarProductos(productos);

  res.status(201).json(nuevoProducto);
});


/*
----Este era el primer POST creado, que no tenía validación----

app.post('/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;

  const nuevoProducto = {
    id: productos.length + 1,
    nombre,
    precio,
    stock
  };

  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});
*/

app.get('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productos = leerProductos();

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(producto);
});
 
app.put('/productos/:id/estado', (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  const productos = leerProductos();
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  if (activo !== undefined) {
    producto.activo = activo;
  }
  

  guardarProductos(productos);

  res.json({
    mensaje: `Producto ${activo ? 'activado' : 'desactivado'}`,
    producto
  });
});

app.put('/productos/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nombre, precio, stock } = req.body;

  const productos = leerProductos();
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (nombre !== undefined && nombre === '') {
    return res.status(400).json({ error: 'Nombre inválido' });
  }

  if (precio !== undefined && (typeof precio !== 'number' || precio < 0)) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    return res.status(400).json({ error: 'Stock inválido' });
  }

  if (nombre !== undefined) producto.nombre = nombre;
  if (precio !== undefined) producto.precio = precio;
  if (stock !== undefined) producto.stock = stock;

  guardarProductos(productos);

  res.json(producto);
});


/*
----PUT que no contaba con validación de datos----

app.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, precio, stock } = req.body;

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  if (nombre !== undefined) producto.nombre = nombre;
  if (precio !== undefined) producto.precio = precio;
  if (stock !== undefined) producto.stock = stock;

  res.json(producto);
});
*/
app.delete('/productos/:id', (req, res) => {
  const id = Number(req.params.id);

  const productos = leerProductos();
  const ventas = leerVentas();

  // ¿el producto aparece en alguna venta NO anulada?
  const productoVendido = ventas.some(v =>
    !v.anulada && v.items.some(item => item.productoId === id)
  );

  if (productoVendido) {
    return res.status(400).json({
      error: 'No se puede eliminar el producto porque tiene ventas asociadas'
    });
  }

  const index = productos.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const productoEliminado = productos.splice(index, 1)[0];

  guardarProductos(productos);

  res.json({
    mensaje: 'Producto eliminado',
    producto: productoEliminado
  });
});



app.post('/ventas', (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener items' });
  }

  const productos = leerProductos();
  const ventas = leerVentas();

  let total = 0;
  const itemsVenta = [];

  for (const item of items) {
    const producto = productos.find(p => p.id === item.productoId);

    if (!producto) {
      return res.status(404).json({ error: `Producto ${item.productoId} no existe` });
    }

    if (!producto.activo) {
      return res.status(400).json({
      error: `El producto ${producto.nombre} está inactivo`
      });
    }


    if (producto.stock < item.cantidad) {
      return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
    }

    const subtotal = producto.precio * item.cantidad;

    itemsVenta.push({
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: item.cantidad,
      subtotal
    });

    producto.stock -= item.cantidad;
    total += subtotal;
  }

  const nuevaVenta = {
    id: ventas.length ? ventas[ventas.length - 1].id + 1 : 1,
    fecha: new Date().toISOString(),
    items: itemsVenta,
    total,
    anulada: false
  };

  ventas.push(nuevaVenta);

  guardarVentas(ventas);
  guardarProductos(productos);

  res.status(201).json(nuevaVenta);
});

/*
app.get('/ventas', (req, res) => {

  const { fecha } = req.query;

  let ventas = leerVentas();

  if (fecha) {
    ventas = ventas.filter(v => v.fecha.startsWith(fecha));
  }

  res.json(ventas);
});
*/
app.put('/ventas/:id/anular', (req, res) => {
  const ventas = leerVentas();
  const productos = leerProductos();

  const venta = ventas.find(v => v.id == req.params.id);

  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  if (venta.anulada) {
    return res.status(400).json({ error: 'La venta ya está anulada' });
  }

  // devolver stock
  venta.items.forEach(item => {
    const producto = productos.find(p => p.id == item.productoId);
    if (producto) {
      producto.stock += item.cantidad;
    }
  });

  venta.anulada = true;

  guardarVentas(ventas);
  guardarProductos(productos);

  res.json({ mensaje: 'Venta anulada correctamente', venta });
});

app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

