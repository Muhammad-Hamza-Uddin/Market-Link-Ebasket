const express = require('express');
const {
  getProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  archiveProduct,
} = require('../controllers/productController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const approvedFarmer = require('../middleware/approvedFarmer');
const productImageUpload = require('../middleware/productImageUpload');

const router = express.Router();

router.get('/', getProducts);
router.get('/mine', protect, authorize('farmer'), approvedFarmer, getMyProducts);
router.post('/', protect, authorize('farmer'), approvedFarmer, createProduct);
router.post('/:id/image', protect, authorize('farmer'), approvedFarmer, productImageUpload.single('image'), uploadProductImage);
router.delete('/:id/image', protect, authorize('farmer'), approvedFarmer, deleteProductImage);
router.patch('/:id', protect, authorize('farmer'), approvedFarmer, updateProduct);
router.delete('/:id', protect, authorize('farmer'), approvedFarmer, archiveProduct);
router.get('/:id', getProduct);

module.exports = router;

