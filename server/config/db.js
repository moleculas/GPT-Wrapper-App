const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error al conectar a MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;