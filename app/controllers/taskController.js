const Task = require('../models/taskModel');
const User = require('../models/userModel');

// Crear una nueva tarea
exports.createTask = async (req, res) => {
    const { userId } = req.session;
    const { title, description, dueDate, type, frequency, category, duration } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const newTask = await Task.create({
            userId,
            title,
            description,
            dueDate,
            type,
            frequency,
            category,
            duration
        });

        res.json({ message: 'Tarea creada con éxito', task: newTask });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la tarea', details: err });
    }
};

// Actualizar una tarea
exports.updateTask = async (req, res) => {
    const { userId } = req.session;
    const { taskId, title, description, dueDate, type, frequency, category, duration } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const task = await Task.findOne({ where: { id: taskId, userId } });
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.dueDate = dueDate || task.dueDate;
        task.type = type || task.type;
        task.frequency = frequency || task.frequency;
        task.category = category || task.category;
        task.duration = duration || task.duration;

        await task.save();

        res.json({ message: 'Tarea actualizada con éxito', task });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar la tarea', details: err });
    }
};

// Eliminar una tarea
exports.deleteTask = async (req, res) => {
    const { userId } = req.session;
    const { taskId } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const task = await Task.findOne({ where: { id: taskId, userId } });
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        await task.destroy();

        res.json({ message: 'Tarea eliminada con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar la tarea', details: err });
    }
};

// Marcar una tarea como completada
exports.completeTask = async (req, res) => {
    const { userId } = req.session;
    const { taskId } = req.params;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        const task = await Task.findOne({ where: { id: taskId, userId } });
        if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        task.status = 'completed';
        task.completedAt = new Date();

        // Aumentar monedas por completar la tarea
        const user = await User.findByPk(userId);
        user.monedas += 10;
        await user.save();

        await task.save();

        res.json({ message: 'Tarea completada con éxito', task });
    } catch (err) {
        res.status(500).json({ error: 'Error al completar la tarea', details: err });
    }
};

// Obtener todas las tareas del usuario
exports.getTasks = async (req, res) => {
    const { userId } = req.session;  // Usamos el ID del usuario de la sesión
    const { status, type, category, dueDate } = req.query;  // Parámetros opcionales de filtrado

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    try {
        // Filtrar las tareas según los parámetros proporcionados
        const where = {
            userId,
            ...(status && { status }),  // Filtrar por estado (pendiente, completada)
            ...(type && { type }),  // Filtrar por tipo (tarea, hábito, rutina)
            ...(category && { category }),  // Filtrar por categoría (facultad, personal, etc.)
            ...(dueDate && { dueDate: { [Op.lte]: new Date(dueDate) } }),  // Filtrar por fecha límite
        };

        // Obtener las tareas con los filtros aplicados
        const tasks = await Task.findAll({
            where,
            order: [['dueDate', 'ASC']],  // Ordenar por fecha de vencimiento (opcional)
        });

        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener las tareas', details: err });
    }
};