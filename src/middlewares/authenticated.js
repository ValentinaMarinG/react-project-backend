const jwt = require("../utils/jwt");

const ensureAuth = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer")) {
    return res
      .status(401)
      .send({ msg: "No autorizado. La petición no tiene la cabecera de autenticación" });
  }
  const token = authorization.split(" ")[1];
  try {
    const payload = jwt.decoded(token);
    const { expiration_date } = payload;
    const currentTime = Date.now();

    if (expiration_date <= currentTime) {
      return res.status(401).send({ msg: "No autorizado. El token de autenticación ha expirado" });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).send({ msg: "No autorizado. Token de autenticación inválido" });
  }
};

module.exports = {
  ensureAuth
};