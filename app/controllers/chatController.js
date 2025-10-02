const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const { io } = require('../../config/server');  // Importamos el servidor de socket.io
const { Op } = require('sequelize');
exports.sendMessage = async (req, res) => {
    const { receiverId, message, messageType = 'text' } = req.body;

    // Para pruebas desde Postman: permitir senderId en el body si no hay sesión
    const senderId = req.session?.userId || req.body.senderId;

    // Validar que el usuario esté autenticado
    if (!senderId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Validar que receiverId sea válido
    if (!receiverId || typeof receiverId !== 'number') {
        return res.status(400).json({ error: 'ID del receptor inválido' });
    }

    // Validar que el mensaje no esté vacío
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    // Validar tipo de mensaje permitido
    const tiposPermitidos = ['text', 'image', 'audio'];
    if (!tiposPermitidos.includes(messageType)) {
        return res.status(400).json({ error: 'Tipo de mensaje inválido' });
    }

    // Evitar que un usuario se envíe mensajes a sí mismo
    if (senderId === receiverId) {
        return res.status(400).json({ error: 'No puedes enviarte mensajes a ti mismo' });
    }

    try {
        const sender = await User.findByPk(senderId);
        const receiver = await User.findByPk(receiverId);

        // Validar existencia de ambos usuarios
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Validar que el chat sea entre 'user' y 'psicologo' en cualquier dirección
        const esChatValido =
            (sender.rol === 'user' && receiver.rol === 'psicologo') ||
            (sender.rol === 'psicologo' && receiver.rol === 'user');

        if (!esChatValido) {
            return res.status(403).json({ error: 'Solo se permite chat entre usuario y psicólogo' });
        }

        // Crear mensaje
        const newMessage = await Chat.create({
            senderId,
            receiverId,
            message: message.trim(),
            messageType,
            status: 'unread',
            timestamp: new Date()
        });

        // Emitir mensaje vía socket.io si está disponible
        if (req.io) {
            req.io.to(String(receiverId)).emit('receiveMessage', {
                senderId,
                receiverId,
                message: newMessage.message,
                messageType: newMessage.messageType,
                timestamp: newMessage.timestamp
            });
        }

        return res.status(200).json({ message: 'Mensaje enviado con éxito', newMessage });
    } catch (err) {
        console.error('Error al enviar el mensaje:', err);
        return res.status(500).json({ error: 'Error interno al enviar el mensaje' });
    }
};

// Obtener el historial de mensajes entre usuario y psicólogo
exports.getChatHistory = async (req, res) => {
  const sessionUserId = req.session?.userId || req.body.userId; // Soporte para pruebas sin sesión
  const { receiverId } = req.query;

  // Validaciones básicas
  if (!sessionUserId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  if (!receiverId || isNaN(receiverId)) {
    return res.status(400).json({ error: 'ID del receptor inválido' });
  }

  try {
    // Debugging: Verificar que los valores son correctos
    console.log('sessionUserId:', sessionUserId);
    console.log('receiverId:', receiverId);

    const user = await User.findByPk(sessionUserId);
    const receiver = await User.findByPk(receiverId);

    // Validar existencia de ambos usuarios
    if (!user || !receiver) {
      return res.status(404).json({ error: 'Uno de los usuarios no existe' });
    }

    // Validar que el chat sea entre user y psicólogo (en cualquier dirección)
    const esChatValido = (
      (user.rol === 'user' && receiver.rol === 'psicologo') ||
      (user.rol === 'psicologo' && receiver.rol === 'user')
    );

    if (!esChatValido) {
      return res.status(403).json({ error: 'Solo se permite ver historial entre usuario y psicólogo' });
    }

    // Buscar mensajes entre ambos
    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          { senderId: sessionUserId, receiverId: receiverId },
          { senderId: receiverId, receiverId: sessionUserId }
        ]
      },
      order: [['timestamp', 'ASC']]
    });

    // Si no hay mensajes
    if (!messages.length) {
      return res.status(200).json({ message: 'No hay mensajes en el historial', messages: [] });
    }

    // Marcar como leídos los mensajes recibidos por el usuario que consulta
    await Chat.update({ status: 'read' }, {
      where: {
        senderId: receiverId,
        receiverId: sessionUserId,
        status: 'unread'
      }
    });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('Error en getChatHistory:', err);
    return res.status(500).json({ error: 'Error al obtener el historial de mensajes', details: err.message });
  }
};

exports.markAsRead = async (req, res) => {
    const userId = req.session?.userId || req.body.userId; // Para pruebas con Postman
    const messageId = parseInt(req.params.messageId, 10);

    // Validaciones
    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (isNaN(messageId)) {
        return res.status(400).json({ error: 'ID de mensaje inválido' });
    }

    try {
        // Buscar mensaje
        const message = await Chat.findByPk(messageId);

        if (!message) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }

        // Verificar que el usuario es el receptor del mensaje
        if (message.receiverId !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para marcar este mensaje como leído' });
        }

        // Actualizar estado
        message.status = 'read';
        await message.save();

        return res.json({
            message: 'Mensaje marcado como leído',
            data: {
                id: message.id,
                status: message.status,
                timestamp: message.timestamp
            }
        });
    } catch (err) {
        console.error('Error al marcar mensaje como leído:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};