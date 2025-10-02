// server.js (dentro de la carpeta config/)

const express = require('express');
const session = require('express-session');
const app = express();
const db = require('./db'); // 🟢 CORRECCIÓN 1: Ahora busca 'db' en la misma carpeta ('./db')
const path = require('path');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

// Crear un servidor HTTP para manejar WebSockets
const server = http.createServer(app);

// Configurar socket.io (Se exporta globalmente para usar en controllers)
const io = socketIo(server);
global.io = io; 

// Importar todos los modelos para que Sequelize los sincronice
// Estas rutas estaban correctas, acceden a ../app/models desde config/
require('../app/models/userModel');
require('../app/models/petModel');
require('../app/models/profileModel');
require('../app/models/itemModel');
require('../app/models/inventoryItem');
require('../app/models/postModel');
require('../app/models/chatModel');
// Comentamos el modelo de chatbot ya que no lo estamos usando por ahora
// require('../app/models/chatbotModel');
require('../app/models/taskModel');
require('../app/models/transactionModel');
require('../app/models/coinOfferModel');
// Si tienes CoinOfferModel, también debes importarlo aquí
// require('../app/models/coinOfferModel'); 

// Socket.io: Escuchar nuevas conexiones
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Escuchar por un mensaje (ejemplo básico, la lógica de chat debe estar en chatController)
    socket.on('sendMessage', (data) => {
        console.log('Mensaje recibido:', data);
        // Implementación de envío de mensaje por Socket.io
        io.to(data.receiverId).emit('receiveMessage', data);
    });

    // Manejo de desconexión
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi_clave_secreta', // Usar variable de entorno
    resave: false,
    saveUninitialized: true
}));

// Static para servir imágenes subidas (Multer)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // 🟢 CORRECCIÓN 2: Sube un nivel (..) para encontrar 'uploads' en la raíz.

// Rutas (Estas rutas estaban correctas, acceden a ../app/routes/ desde config/)
app.use('/auth', require('../app/routes/authRoutes'));
app.use('/pet', require('../app/routes/petRoutes'));
app.use('/profile', require('../app/routes/profileRoutes')); 
app.use('/inventory', require('../app/routes/inventoryRoutes')); 
app.use('/store', require('../app/routes/storeRoutes'));
app.use('/community', require('../app/routes/communityRoutes'));
app.use('/chat', require('../app/routes/chatRoutes'));
app.use('/chatbot', require('../app/routes/chatbotRoutes')); 
app.use('/tasks', require('../app/routes/taskRoutes')); 

// Conexión DB y arranque del servidor
db.sync({ alter: true }) // Usar { alter: true } para actualizar la estructura sin perder datos
    .then(() => {
        const PORT = process.env.PORT || 8082;
        server.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('❌ Error al sincronizar DB:', err));