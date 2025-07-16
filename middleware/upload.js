const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images, documents, and other common file types
    const allowedExtensions = /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF|doc|DOC|docx|DOCX|txt|TXT|zip|ZIP|rar|RAR)$/;
    if (!file.originalname.match(allowedExtensions)) {
        req.fileValidationError = 'Only image, document, and archive files are allowed!';
        return cb(new Error('Only image, document, and archive files are allowed!'), false);
    }
    cb(null, true);
};

// Configure upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload; 