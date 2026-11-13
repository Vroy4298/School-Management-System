const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Fee Structures
router.get('/structures', authorize('ADMIN'), feeController.getFeeStructures);
router.post('/structures', authorize('ADMIN'), feeController.createFeeStructure);

// Invoices
router.post('/invoices/generate', authorize('ADMIN'), feeController.generateInvoices);
router.get('/invoices', authorize('ADMIN'), feeController.getInvoices);
router.get('/invoices/:id', authorize('ADMIN', 'GUARDIAN'), feeController.getInvoiceById);

// Payments (Simulated)
router.post('/invoices/:id/pay', authorize('ADMIN', 'GUARDIAN'), feeController.recordPayment);

// Ledger Reconciliation
router.get('/ledger/reconciliation', authorize('ADMIN'), feeController.getLedgerReconciliation);

module.exports = router;
