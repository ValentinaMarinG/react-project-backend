const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const image = require("../utils/image");
const jwt = require("../utils/jwt");

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

const register = async (req, res) => {
  const { firstname, lastname, country, department, municipality, state, document_type, document, 
          email, password, avatar, active } = req.body;

  try {

    /* VALIDACIONES DE LOS CAMPOS DEL FORMULARIO DE USUARIO*/
    /* Validación tipo de documento */
    if (!validateDocumentType(document_type)) {
        return res.status(400).json({ message: "Tipo de documento inválido" });
      }
    /* Validación del país */
    const locationValidation = validateLocationFields(country, department, municipality, state);
    if (!locationValidation.valid) {
      return res.status(400).json({ message: locationValidation.message });
    }
    /* Validación del email */
    if (!email) {
      return res.status(400).send({ msg: "El email es requerido" });
    }else if (!validateEmail(email)) {
        return res.status(400).json({ message: "El dominio de correo electrónico no es válido" });
    }
    /* Validación de contraseña */
    if (!password) {
      return res.status(400).send({ msg: "La contraseña es requerida" });
    }

    /* Generar el hash de la contraseña */
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    /* Crear un nuevo usuario con los datos del request body del API */
    const newUser = new User({
      firstname,
      lastname,
      country,
      department,
      municipality,
      state,
      document_type,
      document,
      email: email.toLowerCase(),
      password: hashPassword,
      role:"user",
      active,
      avatar
    });

    if (avatar) {
        const imagePath = image.getFilePath(avatar);
        newUser.avatar = imagePath;
    } else { 
          /* Establecer el avatar por defecto - perfil desconocido */
          newUser.avatar = "uploads/user/avatar/avatar3.jpg";
    }

    /* Guardar el usuario en la bd */
    const userStorage = await newUser.save();
    res.status(201).send(userStorage);
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(400).send({ msg: "Error al crear el usuario" });
  }
};

/* Función para iniciar sesión */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
        return res.status(400).send({ msg: "El email y la contraseña son obligatorios" });
    }
    const emailLowerCase = email.toLowerCase();
    const userStore = await User.findOne({ email: emailLowerCase }).exec();
    if (!userStore) {
        return res.status(404).send({ msg: "El usuario no existe" });
    }
    const check = await bcrypt.compare(password, userStore.password);
    if (!check) {
        return res.status(400).send({ msg: "Contraseña incorrecta" });
    }
    if (!userStore.active) {
        return res.status(401).send({ msg: "Usuario no autorizado o no activo" });
    }
    res.status(200).send({
      access: jwt.createAccessToken(userStore),
      refresh: jwt.createRefreshToken(userStore),
    });
  } catch (error) {
    console.error("Error del servidor:", error);
    return res.status(500).send({ msg: "Error del servidor" });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).send({ msg: "Token requerido" });
    }
    const { user_id } = jwt.decoded(token);
    const userStorage = await User.findOne({ _id: user_id });
    /* Generar nuevo token de acceso */
    const accessToken = jwt.createAccessToken(userStorage);
    return res.status(200).send({ accessToken });
  } catch (error) {
    console.error("Error del servidor:", error);
    return res.status(500).send({ msg: "Error del servidor" });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
};