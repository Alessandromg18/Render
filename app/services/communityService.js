const Post = require('../models/postModel');
const User = require('../models/userModel');

// Crear post con recompensa
const createPost = async (userId, contenido, tipoUsuario, imagenUrl) => {
    const tipo = ['usuario', 'psicologo'].includes(tipoUsuario) ? tipoUsuario : 'usuario';

    const post = await Post.create({
        userId,
        contenido,
        tipoUsuario: tipo,
        imagen: imagenUrl
    });

    const user = await User.findByPk(userId);
    if (user) {
        user.monedas += 10;
        await user.save();
    }

    return post;
};

// Obtener posts con usuario
const getPosts = async (offset, limit) => {
    return await Post.findAll({
        include: [{
            model: User,
            attributes: ['id', 'nombre', 'rol', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
};

// Dar like con recompensa
const likePost = async (postId, userId) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post no encontrado');

    const user = await User.findByPk(userId);
    if (!user) throw new Error('Usuario no encontrado');

    post.likes += 1;
    await post.save();

    user.monedas += 5;
    await user.save();

    return post;
};

// Eliminar post
const deletePost = async (postId) => {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post no encontrado');

    await post.destroy();
};

module.exports = {
    createPost,
    getPosts,
    likePost,
    deletePost
};
