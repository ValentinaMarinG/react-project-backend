const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const image = require("../utils/image");

/* VALIDACIONES */

/* Validación del Email */
const validateEmail = (email) => {
    const emailDomain = /@(gmail|outlook)\.com$/;
    return emailDomain.test(email);
};

/* Validación del Tipo de Documento */
const validateDocumentType = (documentType) => {
    const allowedDocumentTypes = ["Cédula de ciudadanía", "Cédula extranjera", "Tarjeta de identidad", "Pasaporte"];
    return allowedDocumentTypes.includes(documentType);
};

/* Validación de país.
   Validación de departamento y municipio si el país es Colombia
   Validación del state si es un país diferente a Colombia */
const validateLocationFields = (country, department, municipality, state) => {
    if (country === "Colombia") {
      if (!department || !municipality) {
        return { valid: false, message: "Campos de departamento, municipio o estado inválidos para Colombia" };
      } else if (state !== "") {
        return { valid: false, message: "El campo de State no es requerido para Colombia" };
      }
    } else {
      if (department || municipality) {
        return { valid: false, message: "Campos de departamento, municipio no son inválidos para otro país" };
      } else if (!state) {
        return { valid: false, message: "El campo de State es requerido para otro país diferente a Colombia" };
      }
    }
    return { valid: true };
};

/* GET información del usuario en sesión */
const getMe = async (req, res) => {
  try {
    const { user_id } = req.user;
    const response = await User.findById(user_id);
    if (!response) {
      return res.status(400).send({ msg: "No se ha encontrado usuario" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
};

/* GET información de un usuario por su id - Leer */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await User.findById(id);
    if (!response) {
      return res.status(400).send({ msg: "No se ha encontrado usuario" });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
};

/* GET todos los usuarios registrados en la bd - Leer */
const getUsers = async (req, res) => {
  try {
    const { active } = req.query;
    let response = null;

    if (active === undefined) {
      response = await User.find();
    } else {
      response = await User.find({ active });
    }
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ msg: "Error del servidor" });
  }
};

/* POST usuario en la bd - Crear */
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const user = new User({ ...userData});

    /* VALIDACIONES DE LOS CAMPOS DEL FORMULARIO DE USUARIO*/
    /* Validación tipo de documento */
    if (!validateDocumentType(user.document_type)) {
        return res.status(400).json({ message: "Tipo de documento inválido" });
      }
    /* Validación del país */
    const locationValidation = validateLocationFields(user.country, user.department, user.municipality, user.state);
    if (!locationValidation.valid) {
      return res.status(400).json({ message: locationValidation.message });
    }
    /* Validación del email */
    if (!user.email) {
      return res.status(400).send({ msg: "El email es requerido" });
    }else if (!validateEmail(user.email)) {
        return res.status(400).json({ message: "El correo electrónico no es válido" });
    }
    /* Validación de contraseña */
    if (!user.password) {
      return res.status(400).send({ msg: "La contraseña es requerida" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    user.password = hashedPassword;

    if (user.avatar) {
      const imagePath = image.getFilePath(user.avatar);
      user.avatar = imagePath;
    } else { 
        /* Establecer el avatar por defecto - perfil desconocido */
        user.avatar = "uploads/user/avatar/avatar3.jpg";
    }

    const userStored = await user.save();
    res.status(201).send(userStored);
  } catch (error) {
    res.status(400).send({ msg: "Error al crear el usuario"});
  }
};

/* PUT/PATCH usuarios por su id - Editar */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (userData.password) {
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(userData.password, salt);
      userData.password = hashPassword;
    } else {
      delete userData.password;
    }

    if (req.files && req.files.avatar) {
      const imagePath = image.getFilePath(req.files.avatar);
      userData.avatar = imagePath;
    }

    await User.findByIdAndUpdate({ _id: id }, userData);

    res.status(200).send({ msg: "Actualización correcta" });
  } catch (error) {
    res.status(400).send({ msg: "Error al actualizar el usuario" });
  }
};

/* DELETE usuario por su id - Eliminar */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).send({ msg: "Usuario eliminado" });
  } catch (error) {
    res.status(400).send({ msg: "Error al eliminar el usuario" });
  }
};

module.exports = {
  getMe,
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};