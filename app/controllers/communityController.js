const communityService = require('../services/communityService');
const Post = require('../models/postModel');

// Crear post
exports.createPost = async (req, res) => {
    const userId = req.session?.userId || req.body.userId;
    const { contenido, tipoUsuario } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!contenido || contenido.trim() === '') {
        return res.status(400).json({ error: 'El contenido no puede estar vacío' });
    }

    let imagenUrl = null;
    if (req.file) {
        imagenUrl = `/uploads/posts/${req.file.filename}`;
    }

    try {
        const post = await communityService.createPost(userId, contenido, tipoUsuario, imagenUrl);
        res.status(201).json({ message: 'Post creado exitosamente', post });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear post', details: err.message });
    }
};

// Obtener todos los posts (paginados)
exports.getPosts = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const posts = await communityService.getPosts(offset, parseInt(limit));
        const totalPosts = await Post.count();
        const totalPages = Math.ceil(totalPosts / limit);

        res.json({
            posts,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            totalPosts
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener posts', details: err.message });
    }
};

// Dar like a un post
exports.likePost = async (req, res) => {
    const userId = req.session?.userId || req.body.userId;
    const postId = parseInt(req.params.id, 10);

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (isNaN(postId)) {
        return res.status(400).json({ error: 'ID de post inválido' });
    }

    try {
        const post = await communityService.likePost(postId, userId);
        res.status(200).json({ message: 'Post likeado', likes: post.likes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Eliminar post (solo admin)
exports.deletePost = async (req, res) => {
    const userRole = req.session?.rol;
    const postId = req.params.id;

    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden eliminar posts' });
    }

    try {
        await communityService.deletePost(postId);
        res.json({ message: 'Post eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar post', details: err.message });
    }
};
