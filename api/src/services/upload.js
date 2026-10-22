import multer from "multer";

const storage = multer.memoryStorage(); // salva no buffer
const upload = multer({ storage });

export default upload;