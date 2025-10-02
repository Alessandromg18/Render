const User = require('../models/userModel');
const Profile = require('../models/profileModel');
const Chat = require('../models/chatModel');
const Chatbot = require('../models/chatbotModel');
const Pet = require('../models/petModel');
const { io } = require('../../config/server');


// Función para registro de usuario sin encriptar la contraseña
exports.register = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        // Verificar si el email ya está registrado
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El correo ya está registrado.' });
        }

        // Crear el usuario sin encriptar la contraseña
        const user = await User.create({
            nombre,
            email,
            password,  // No se encripta la contraseña
            rol: rol || 'user',  // Si no se especifica rol, por defecto será 'user'
        });

        // Crear la mascota del usuario (inicialmente con valores predeterminados)
        const pet = await Pet.create({
            userId: user.id,
            nombre: 'MiPou',  // Nombre predeterminado para la mascota
            imagenBase: 'default.png',
            estadoEmocional: 'feliz',
            hambre: 50,
            felicidad: 50,
            accesorios: []
        });

        res.status(201).json({ message: 'Usuario registrado correctamente', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};

// Función para login de usuario sin verificar la contraseña encriptada
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
        }

        // Comparar las contraseñas sin encriptación
        if (user.password !== password) {
            return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
        }

        // Crear sesión del usuario
        req.session.userId = user.id;
        req.session.rol = user.rol;

        // Verificar si ya recibió un saludo antes
        const existingMessage = await Chat.findOne({
            where: {
                receiverId: user.id,
                senderId: 0 // Chatbot
            }
        });

        if (!existingMessage) {
            const pet = await Pet.findOne({ where: { userId: user.id } });

            const saludo = `¡Hola ${user.nombre}! 🐾 Soy ${pet?.nombre || 'tu mascota'}, y estoy feliz de verte de nuevo. ¿Listo para comenzar tu día?`;

            // Guardar el mensaje en base de datos
            await Chat.create({
                senderId: 0,
                receiverId: user.id,
                message: saludo,
                messageType: 'text',
                status: 'unread',
                timestamp: new Date()
            });

            // Emitir el mensaje por socket.io
            io.to(user.id).emit('receiveMessage', {
                senderId: 0,
                receiverId: user.id,
                message: saludo,
                messageType: 'text',
                timestamp: new Date()
            });

            // También podrías guardar un registro en el modelo Chatbot (opcional)
            const chatbotEntry = await Chatbot.findOne({ where: { userId: user.id } });

            if (!chatbotEntry && pet) {
                await Chatbot.create({
                    userId: user.id,
                    petId: pet.id,
                    nombre: pet.nombre,
                    estadoEmocional: pet.estadoEmocional || 'feliz',
                    lastMessageTime: new Date()
                });
            }
        }

        res.json({ message: 'Login exitoso', user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al realizar el login' });
    }
};

// Función para cerrar sesión
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada correctamente' });
    });
};

// Función para actualizar el perfil del usuario
exports.updateUserProfile = async (req, res) => {
    const userId = req.session.userId;
    const { nombre, email } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar si el nuevo email ya está en uso
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Este correo ya está en uso' });
            }
        }

        // Actualizar el usuario
        user.nombre = nombre || user.nombre;
        user.email = email || user.email;
        await user.save();

        // Actualizar o crear el perfil si no existe
        const profile = await Profile.findOne({ where: { userId } });

        if (profile) {
            profile.nombreUsuario = nombre || profile.nombreUsuario;
            await profile.save();
        } else {
            // Si no hay perfil, lo creamos
            await Profile.create({
                userId,
                nombreUsuario: nombre,
                petName: 'MiPou', // Valor por defecto, puedes ajustarlo
                petEmotion: 'neutral',
                petImage: 'default.png'
            });
        }

        res.json({ message: 'Perfil actualizado correctamente', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el perfil', details: err });
    }
};
