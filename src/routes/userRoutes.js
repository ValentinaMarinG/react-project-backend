const express = require("express");
const user_model = require("../models/userModel");
const routes = express.Router();

/* VALIDACIONES */

/* Validación del Email */
function validateEmail(email) {
    const emaildomain= /@(gmail|outlook)\.com$/;
    return emaildomain.test(email);
}

/* CRUD USUARIOS */
/* Crear un usuario - Registrar */
routes.post("/",(req,res) =>{
    const new_user = user_model(req.body);

    if (!validateEmail(new_user.email)) {
        return res.status(400).json({ message: "El correo electrónico no es válido" });
    }

    new_user.save()
            .then((data) => res.status(201).json(data))
            .catch((err) => res.json({ message:err }));
});

/* Listar todos los usuarios */
routes.get("/",(req,res) => {
    user_model.find()
    .then((data) => res.status(200).json(data))
    .catch((err) => res.json({ message:err }));
});

/* Consultar un usuario especifico por su id */
routes.get("/:userId",(req,res) => {
    const { userId } = req.params;
    user_model.find({_id:userId})
    .then((data) => res.status(200).json(data))
    .catch((err) => res.json({ message:err }));
});

/* Editar un usuario */
routes.put("/:userId",(req,res) => {
    const userId = req.params.userId;
    const query = {_id:userId};
    const update = {$set:req.body};
    user_model.updateOne(query,update)
              .then((data) => res.status(200).json(data))
              .catch((err) => res.json({ message:err }));
});

/* Eliminar uno de los usuarios por su id */
routes.delete("/:userId",(req,res) => {
    const { userId } = req.params;
    user_model.deleteOne({_id:userId})
              .then((data) => res.status(200).json(data))
              .catch((err) => res.json({ message:err }));
});

module.exports = routes;