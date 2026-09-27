const express = require('express');
const {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  getFarmerDashboard,
  getOrder,
  cancelMyOrder,
  modifyMyOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const approvedFarmer = require('../middleware/approvedFarmer');

const router = express.Router();

router.use(protect);

router.post('/', authorize('customer'), createOrder);
router.get('/my-orders', authorize('customer'), getMyOrders);
router.get('/farmer', authorize('farmer'), approvedFarmer, getFarmerOrders);
router.get('/farmer/dashboard', authorize('farmer'), approvedFarmer, getFarmerDashboard);
router.patch('/:id/cancel', authorize('customer'), cancelMyOrder);
router.patch('/:id', authorize('customer'), modifyMyOrder);
router.patch(
  '/:id/status',
  authorize('farmer'),
  approvedFarmer,
  updateOrderStatus
);
router.get('/:id', getOrder);

module.exports = router;

