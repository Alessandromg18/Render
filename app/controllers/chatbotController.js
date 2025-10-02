const { Pet } = require('../models/petModel');
const { Task } = require('../models/taskModel');
const { Chat } = require('../models/chatModel');
const { io } = require('../../config/server');  // Importamos el servidor de socket.io

// Obtener respuesta del chatbot dependiendo del estado emocional de la mascota
const getChatbotResponse = async (userMessage, userId) => {
    // Buscar el estado de la mascota (Pet) del usuario
    const pet = await Pet.findOne({ where: { userId } });

    if (!pet) {
        return "Parece que no tengo información sobre tu mascota. ¿Te gustaría crear una?";
    }

    const { estadoEmocional, hambre, energia, felicidad, ambiente } = pet;

    // Generar respuestas dinámicas dependiendo del estado emocional de la mascota
    if (estadoEmocional === 'feliz') {
        return `¡Hola! 😊 Tu mascota está muy feliz hoy. ¿Qué te gustaría hacer? ¿Jugar o crear una nueva tarea?`;
    } else if (estadoEmocional === 'triste') {
        return `Oh no, tu mascota está triste... 😔 ¿Te gustaría darle caricias o hablar sobre tus tareas?`;
    } else if (estadoEmocional === 'enojado') {
        return `¡Uy! Tu mascota está un poco molesta... 😠 ¿Te gustaría calmarla o tal vez hacer una tarea tranquila?`;
    } else if (estadoEmocional === 'emocionado') {
        return `¡Tu mascota está super emocionada! 🎉 ¿Qué tal si creamos algo divertido o haces algo especial hoy?`;
    } else if (estadoEmocional === 'calmado') {
        return `Tu mascota está tranquila y calmada. 😌 ¿Te gustaría que te ayude con alguna tarea?`;
    } else if (hambre > 70) {
        return `¡Tu mascota tiene mucha hambre! 🐾 ¿Quieres darle algo de comida?`;
    } else if (energia < 30) {
        return `Tu mascota está muy cansada... 😓 Mejor crea una tarea ligera o solo charlemos un poco.`;
    } else if (felicidad < 40) {
        return `Parece que tu mascota no está muy feliz hoy. 😕 ¿Por qué no la consientes un poco o le hablas sobre tus tareas?`;
    } else {
        return `¡Hola! 😐 Tu mascota está en un estado neutral. ¿Te gustaría crear una tarea o hablar sobre algo más?`;
    }
};

// Enviar un mensaje del chatbot (mascota)
exports.sendMessage = async (req, res) => {
    const { userId } = req.session;  // ID del usuario que está interactuando con el chatbot
    const { message } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        // Generamos la respuesta del chatbot según el estado emocional de la mascota
        const chatbotResponse = await getChatbotResponse(message, userId);

        // Guardamos el mensaje en la base de datos
        const newMessage = await Chat.create({
            senderId: 0,  // Chatbot tiene ID 0
            receiverId: userId,
            message: chatbotResponse,
            messageType: 'text',
            status: 'unread',
            timestamp: new Date()
        });

        // Emitimos el mensaje a través de socket.io
        io.to(userId).emit('receiveMessage', {
            senderId: 0,
            receiverId: userId,
            message: newMessage.message,
            messageType: newMessage.messageType,
            timestamp: newMessage.timestamp
        });

        res.json({ message: 'Mensaje enviado con éxito', newMessage });
    } catch (err) {
        res.status(500).json({ error: 'Error al enviar el mensaje', details: err });
    }
};

// Crear tarea a través del Chatbot (solo si la mascota está en un estado emocional adecuado)
exports.createTask = async (req, res) => {
    const { userId } = req.session;
    const { title, description, dueDate, type, category, isHabit, repeatWeekly } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        // Obtener el estado emocional de la mascota
        const pet = await Pet.findOne({ where: { userId } });

        if (!pet) {
            return res.status(400).json({ message: "No se encontró la mascota registrada para este usuario." });
        }

        const { estadoEmocional, energia } = pet;

        // Si la mascota está cansada o triste, no puede crear tareas
        if (estadoEmocional === 'triste' || estadoEmocional === 'enojado' || energia < 30) {
            return res.json({
                message: `Tu mascota no está en el mejor estado para crear tareas. ¿Qué tal si la consientes primero?`
            });
        }

        // Crear la tarea
        const newTask = await Task.create({
            userId,
            title,
            description,
            dueDate,
            type,
            category,
            isHabit,
            repeatWeekly,
            status: 'pending',
        });

        // Respuesta del chatbot
        const chatbotResponse = `¡He creado la tarea "${title}" con éxito! 📝`;

        // Guardamos el mensaje de la conversación
        const newMessage = await Chat.create({
            senderId: 0,  // El chatbot tiene ID 0
            receiverId: userId,
            message: chatbotResponse,
            messageType: 'text',
            status: 'unread',
            timestamp: new Date()
        });

        // Emitimos el mensaje a través de socket.io
        io.to(userId).emit('receiveMessage', {
            senderId: 0,
            receiverId: userId,
            message: newMessage.message,
            messageType: newMessage.messageType,
            timestamp: newMessage.timestamp
        });

        res.json({ message: 'Tarea creada con éxito', newTask });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la tarea', details: err });
    }
};

// Obtener historial de mensajes entre el usuario y el chatbot
exports.getChatHistory = async (req, res) => {
    const { userId } = req.session;  // ID del usuario

    try {
        const messages = await Chat.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }],
                senderId: 0  // Solo mensajes del chatbot
            },
            order: [['timestamp', 'ASC']], // Ordenar los mensajes por fecha ascendente
        });

        if (messages.length === 0) {
            return res.status(200).json({ message: 'No hay mensajes en el historial', messages: [] });
        }

        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el historial de mensajes', details: err });
    }
};

// Actualizar el estado emocional de la mascota (Pet)
exports.updatePetMood = async (req, res) => {
    const { userId } = req.session;
    const { estadoEmocional } = req.body;  // Nuevo estado emocional (feliz, triste, etc.)

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        // Actualizamos el estado emocional de la mascota
        await Pet.upsert({ userId, estadoEmocional });  // Si ya existe, actualizamos; si no, creamos el estado
        res.json({ message: `El estado emocional de tu mascota ha sido actualizado a ${estadoEmocional}.` });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el estado emocional', details: err });
    }
};

