/* ========================================
   BEAUTY STORE - LÓGICA PRINCIPAL (v10+)
   Base de Datos: Firebase Realtime Database
   ======================================== */

import { 
    auth, 
    database, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    ref,
    push,
    set,
    onValue,
    query,
    orderByChild,
    equalTo,
    remove
} from './config.js';

/* ========================================
   VARIABLES GLOBALES
   ======================================== */

let usuarioActual = null;
let productosActuales = [];
let esAdmin = false;

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Aplicación iniciada');
    
    verificarUsuarioLogueado();
    configurarEventListeners();
    cargarProductos();
});

// ========================================
// AUTENTICACIÓN
// ========================================

import { verificarSiEsAdmin, hacerAdmin } from './config.js';

function verificarUsuarioLogueado() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            usuarioActual = user;
            
            // Verificar si es admin
            esAdmin = await verificarSiEsAdmin(user.email);
            
            // Mostrar/ocultar botón admin basado en permisos
            const adminBtn = document.getElementById('adminBtn');
            if (esAdmin) {
                adminBtn.style.display = 'inline-flex';
                adminBtn.innerHTML = '<i class="fas fa-crown"></i> Admin';
                adminBtn.style.color = '#fbbf24';
                adminBtn.title = 'Eres Administrador';
            } else {
                adminBtn.style.display = 'none';
            }
            
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'inline-flex';
            document.getElementById('logoutBtn').innerHTML = `<i class="fas fa-sign-out-alt"></i> ${user.email}`;
            
            console.log('✅ Usuario logueado:', user.email);
            console.log('🔐 ¿Es Admin?:', esAdmin);
        } else {
            usuarioActual = null;
            esAdmin = false;
            document.getElementById('loginBtn').style.display = 'inline-flex';
            document.getElementById('logoutBtn').style.display = 'none';
            document.getElementById('adminBtn').style.display = 'none';
            console.log('❌ Usuario no logueado');
        }
    });
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            mostrarNotificacion('¡Bienvenido! Sesión iniciada correctamente', 'success');
            cerrarModal('loginModal');
            usuarioActual = userCredential.user;
            esAdmin = await verificarSiEsAdmin(userCredential.user.email);
            cargarProductos();
        })
        .catch((error) => {
            mostrarNotificacion('Error: ' + error.message, 'error');
        });
});

// Signup
document.getElementById('signupForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    
    if (password !== confirm) {
        mostrarNotificacion('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            mostrarNotificacion('¡Cuenta creada! Ahora inicia sesión', 'success');
            toggleForm();
            document.getElementById('signupForm').reset();
        })
        .catch((error) => {
            mostrarNotificacion('Error: ' + error.message, 'error');
        });
});

// Toggle entre Login y Signup
document.getElementById('toggleSignup')?.addEventListener('click', function(e) {
    e.preventDefault();
    toggleForm();
});

document.getElementById('toggleLogin')?.addEventListener('click', function(e) {
    e.preventDefault();
    toggleForm();
});

function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleLogin = document.getElementById('toggleLogin');
    const toggleSignup = document.getElementById('toggleSignup');
    
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
    toggleLogin.style.display = toggleLogin.style.display === 'none' ? 'block' : 'none';
    toggleSignup.style.display = toggleSignup.style.display === 'none' ? 'block' : 'none';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    signOut(auth).then(() => {
        mostrarNotificacion('Sesión cerrada', 'info');
        usuarioActual = null;
        esAdmin = false;
        cambiarSeccion('tiendaSection', 'tiendaBtn');
        document.getElementById('loginBtn').style.display = 'inline-flex';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('adminBtn').style.display = 'none';
    });
});

// ========================================
// NAVEGACIÓN
// ========================================

function configurarEventListeners() {
    document.getElementById('tiendaBtn').addEventListener('click', () => {
        cambiarSeccion('tiendaSection', 'tiendaBtn');
    });
    
    document.getElementById('adminBtn').addEventListener('click', () => {
        if (!usuarioActual) {
            abrirModal('loginModal');
            return;
        }
        if (!esAdmin) {
            mostrarNotificacion('❌ No tienes permisos de administrador', 'error');
            return;
        }
        cambiarSeccion('adminSection', 'adminBtn');
        cargarProductosAdmin();
    });
    
    document.getElementById('loginBtn').addEventListener('click', () => {
        abrirModal('loginModal');
    });
    
    document.getElementById('formProducto').addEventListener('submit', agregarProducto);
    document.getElementById('searchInput').addEventListener('input', filtrarProductos);
    document.getElementById('categoryFilter').addEventListener('change', filtrarProductos);
    
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

function cambiarSeccion(seccionId, botonId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('active'));
    document.getElementById(seccionId).classList.add('active');
    document.getElementById(botonId).classList.add('active');
}

// ========================================
// MODALES
// ========================================

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// ========================================
// GESTIÓN DE PRODUCTOS (SOLO ADMIN)
// ========================================

async function agregarProducto(e) {
    e.preventDefault();
    
    if (!usuarioActual) {
        mostrarNotificacion('Debes iniciar sesión primero', 'error');
        return;
    }
    
    if (!esAdmin) {
        mostrarNotificacion('❌ Solo los administradores pueden agregar productos', 'error');
        return;
    }
    
    const producto = {
        nombre: document.getElementById('nombre').value,
        categoria: document.getElementById('categoria').value,
        precio: parseFloat(document.getElementById('precio').value),
        descripcion: document.getElementById('descripcion').value,
        imagen: document.getElementById('imagen').value,
        linkCompra: document.getElementById('linkCompra').value,
        usuarioId: usuarioActual.uid,
        email: usuarioActual.email,
        fechaCreacion: new Date().toISOString()
    };
    
    try {
        const productosRef = ref(database, 'productos');
        const nuevoProductoRef = push(productosRef);
        await set(nuevoProductoRef, producto);
        
        mostrarNotificacion('✅ Producto agregado exitosamente', 'success');
        document.getElementById('formProducto').reset();
        cargarProductosAdmin();
        cargarProductos();
    } catch (error) {
        mostrarNotificacion('Error al agregar producto: ' + error.message, 'error');
    }
}

function cargarProductos() {
    const productosGrid = document.getElementById('productosGrid');
    
    productosGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando productos...</p>
        </div>
    `;
    
    const productosRef = ref(database, 'productos');
    onValue(productosRef, (snapshot) => {
        productosActuales = [];
        const data = snapshot.val();
        
        if (data) {
            Object.entries(data).forEach(([key, producto]) => {
                producto.id = key;
                productosActuales.push(producto);
            });
        }
        
        mostrarProductos(productosActuales);
    }, (error) => {
        console.error('Error cargando productos:', error);
        productosGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Error al cargar productos</p>';
    });
}

function mostrarProductos(productos) {
    const productosGrid = document.getElementById('productosGrid');
    const sinProductos = document.getElementById('sinProductos');
    
    if (productos.length === 0) {
        productosGrid.innerHTML = '';
        sinProductos.style.display = 'flex';
        return;
    }
    
    sinProductos.style.display = 'none';
    
    productosGrid.innerHTML = productos.map(producto => `
        <div class="producto-card">
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen" onerror="this.src='https://via.placeholder.com/400x300?text=${producto.nombre}'">
            <div class="producto-contenido">
                <span class="producto-categoria">${producto.categoria}</span>
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <p class="producto-precio">$${producto.precio.toFixed(2)}</p>
                <div class="producto-botones">
                    <button class="btn-detalles" onclick="abrirDetalleProducto('${producto.id}')">
                        <i class="fas fa-info-circle"></i> Detalles
                    </button>
                    <a href="${producto.linkCompra}" target="_blank" class="btn-comprar">
                        <i class="fas fa-shopping-bag"></i> Comprar
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function abrirDetalleProducto(productoId) {
    const producto = productosActuales.find(p => p.id === productoId);
    
    if (!producto) return;
    
    document.getElementById('detalleImagen').src = producto.imagen;
    document.getElementById('detalleNombre').textContent = producto.nombre;
    document.getElementById('detalleCategoria').textContent = producto.categoria;
    document.getElementById('detallePrecio').textContent = `$${producto.precio.toFixed(2)}`;
    document.getElementById('detalleDescripcion').textContent = producto.descripcion;
    
    const linkBtn = document.getElementById('linkCompraBtn');
    linkBtn.href = producto.linkCompra;
    linkBtn.target = '_blank';
    
    abrirModal('detalleModal');
}

function filtrarProductos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const productosFiltrados = productosActuales.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(searchTerm);
        const coincideCategoria = categoryFilter === '' || producto.categoria === categoryFilter;
        return coincideNombre && coincideCategoria;
    });
    
    mostrarProductos(productosFiltrados);
}

// ========================================
// PANEL ADMIN
// ========================================

function cargarProductosAdmin() {
    const productosAdmin = document.getElementById('productosAdmin');
    
    if (!usuarioActual) {
        productosAdmin.innerHTML = '<p>Debes iniciar sesión</p>';
        return;
    }
    
    productosAdmin.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando tus productos...</p>
        </div>
    `;
    
    const productosRef = ref(database, 'productos');
    const productosQuery = query(productosRef, orderByChild('usuarioId'), equalTo(usuarioActual.uid));
    
    onValue(productosQuery, (snapshot) => {
        const productos = [];
        const data = snapshot.val();
        
        if (data) {
            Object.entries(data).forEach(([key, producto]) => {
                producto.id = key;
                productos.push(producto);
            });
        }
        
        if (productos.length === 0) {
            productosAdmin.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No has agregado productos aún</p>
                </div>
            `;
            return;
        }
        
        productosAdmin.innerHTML = productos.map(producto => `
            <div class="admin-producto-item">
                <div class="admin-producto-info">
                    <h3>${producto.nombre}</h3>
                    <p><strong>Categoría:</strong> ${producto.categoria}</p>
                    <p><strong>Precio:</strong> $${producto.precio.toFixed(2)}</p>
                    <p><strong>Link:</strong> <a href="${producto.linkCompra}" target="_blank" style="color: #d946a6;">Ver link</a></p>
                </div>
                <div class="admin-producto-actions">
                    <button class="btn-edit" onclick="editarProducto('${producto.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-danger" onclick="eliminarProducto('${producto.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function editarProducto(productoId) {
    const productoRef = ref(database, `productos/${productoId}`);
    onValue(productoRef, (snapshot) => {
        const producto = snapshot.val();
        
        if (!producto) return;
        
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('categoria').value = producto.categoria;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('descripcion').value = producto.descripcion;
        document.getElementById('imagen').value = producto.imagen;
        document.getElementById('linkCompra').value = producto.linkCompra;
        
        const form = document.getElementById('formProducto');
        const botonSubmit = form.querySelector('button[type="submit"]');
        
        botonSubmit.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const productoActualizado = {
                nombre: document.getElementById('nombre').value,
                categoria: document.getElementById('categoria').value,
                precio: parseFloat(document.getElementById('precio').value),
                descripcion: document.getElementById('descripcion').value,
                imagen: document.getElementById('imagen').value,
                linkCompra: document.getElementById('linkCompra').value,
                usuarioId: usuarioActual.uid,
                email: usuarioActual.email,
                fechaCreacion: producto.fechaCreacion
            };
            
            try {
                await set(ref(database, `productos/${productoId}`), productoActualizado);
                mostrarNotificacion('✅ Producto actualizado correctamente', 'success');
                form.reset();
                botonSubmit.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
                form.onsubmit = agregarProducto;
                cargarProductosAdmin();
                cargarProductos();
            } catch (error) {
                mostrarNotificacion('Error al actualizar: ' + error.message, 'error');
            }
        };
    }, { once: true });
}

function eliminarProducto(productoId) {
    if (confirm('¿Estás seguro que deseas eliminar este producto?')) {
        remove(ref(database, `productos/${productoId}`))
            .then(() => {
                mostrarNotificacion('✅ Producto eliminado', 'success');
                cargarProductosAdmin();
                cargarProductos();
            })
            .catch((error) => {
                mostrarNotificacion('Error al eliminar: ' + error.message, 'error');
            });
    }
}

// ========================================
// NOTIFICACIONES
// ========================================

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.getElementById('notificacion');
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo} show`;
    
    setTimeout(() => {
        notificacion.classList.remove('show');
    }, 3000);
}

console.log('✅ Script cargado correctamente');
