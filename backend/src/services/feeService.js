const prisma = require('../config/prisma');
const { logAudit } = require('./auditService');

// ==========================================
// FEE STRUCTURES
// ==========================================

const getAllFeeStructures = async ({ classId, academicYear }) => {
  const where = {};
  if (classId) where.classId = classId;
  if (academicYear) where.academicYear = academicYear;

  return await prisma.feeStructure.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      class: true,
      _count: {
        select: { invoices: true },
      },
    },
  });
};

const createFeeStructure = async ({ title, classId, academicYear = '2026-2027', amount, dueDate, description }, reqUser, ipAddress) => {
  const structure = await prisma.feeStructure.create({
    data: {
      title,
      classId,
      academicYear,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      description,
    },
    include: { class: true },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_FEE_STRUCTURE',
    entity: 'FeeStructure',
    entityId: structure.id,
    details: { title, classId, amount },
    ipAddress,
  });

  return structure;
};

// ==========================================
// INVOICES & GENERATION
// ==========================================

const generateInvoices = async ({ classId, studentId, feeStructureId, title, amount, dueDate }, reqUser, ipAddress) => {
  let targetStudents = [];

  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }
    targetStudents.push(student);
  } else if (classId) {
    targetStudents = await prisma.student.findMany({ where: { classId } });
  } else {
    const error = new Error('Either classId or studentId must be provided to generate invoices');
    error.statusCode = 400;
    throw error;
  }

  if (targetStudents.length === 0) {
    const error = new Error('No students found to generate invoices for');
    error.statusCode = 400;
    throw error;
  }

  const generatedInvoices = await prisma.$transaction(
    targetStudents.map((st) => {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
      return prisma.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: st.id,
          feeStructureId: feeStructureId || null,
          title: title || 'Academic Fee Invoice',
          amount: Number(amount),
          dueDate: new Date(dueDate),
          status: 'PENDING',
        },
      });
    })
  );

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'GENERATE_FEE_INVOICES',
    entity: 'FeeInvoice',
    entityId: generatedInvoices[0]?.id,
    details: { totalGenerated: generatedInvoices.length, classId, studentId, amount },
    ipAddress,
  });

  return {
    count: generatedInvoices.length,
    invoices: generatedInvoices,
  };
};

const getAllInvoices = async ({ classId, studentId, status, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (classId) {
    where.student = { classId };
  }

  const [invoices, total] = await Promise.all([
    prisma.feeInvoice.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            class: true,
            section: true,
          },
        },
        feeStructure: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    }),
    prisma.feeInvoice.count({ where }),
  ]);

  // Compute total paid and outstanding balance for each invoice
  const enriched = invoices.map((inv) => {
    const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, inv.amount - totalPaid);
    return {
      ...inv,
      totalPaid: Number(totalPaid.toFixed(2)),
      outstandingBalance: Number(balance.toFixed(2)),
    };
  });

  return {
    invoices: enriched,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

const getInvoiceById = async (id) => {
  const invoice = await prisma.feeInvoice.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          class: true,
          section: true,
          guardian: true,
        },
      },
      feeStructure: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingBalance = Math.max(0, invoice.amount - totalPaid);

  return {
    ...invoice,
    totalPaid: Number(totalPaid.toFixed(2)),
    outstandingBalance: Number(outstandingBalance.toFixed(2)),
  };
};

// ==========================================
// SIMULATED PAYMENTS & LEDGER
// ==========================================

const recordPayment = async (
  invoiceId,
  { amount, paymentMethod = 'ONLINE_SIMULATED', transactionRef, notes },
  reqUser,
  ipAddress
) => {
  const paymentAmount = Number(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    const error = new Error('Payment amount must be a positive number greater than zero.');
    error.statusCode = 400;
    throw error;
  }

  // Use interactive transaction to guarantee ledger consistency
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        student: true,
      },
    });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    const currentlyPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = Math.max(0, Number((invoice.amount - currentlyPaid).toFixed(2)));

    // CRITICAL BUSINESS RULE: Payment cannot exceed outstanding balance
    if (paymentAmount > outstandingBalance) {
      const error = new Error(
        `Payment rejected: Amount of $${paymentAmount.toFixed(2)} exceeds the remaining outstanding balance of $${outstandingBalance.toFixed(2)}.`
      );
      error.statusCode = 400;
      throw error;
    }

    const finalTxnRef =
      transactionRef ||
      `TXN-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const payment = await tx.feePayment.create({
      data: {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount: paymentAmount,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: finalTxnRef,
        recordedById: reqUser?.id || null,
        notes: notes || null,
      },
    });

    const newTotalPaid = Number((currentlyPaid + paymentAmount).toFixed(2));
    const newOutstandingBalance = Math.max(0, Number((invoice.amount - newTotalPaid).toFixed(2)));

    let newStatus = 'PENDING';
    if (newOutstandingBalance === 0) {
      newStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const updatedInvoice = await tx.feeInvoice.update({
      where: { id: invoice.id },
      data: { status: newStatus },
    });

    await logAudit({
      userId: reqUser?.id,
      userRole: reqUser?.role,
      action: 'RECORD_FEE_PAYMENT',
      entity: 'FeePayment',
      entityId: payment.id,
      details: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentAmount,
        transactionRef: finalTxnRef,
        previousStatus: invoice.status,
        newStatus,
        outstandingBalance: newOutstandingBalance,
      },
      ipAddress,
    });

    return {
      paymentReceipt: {
        paymentId: payment.id,
        transactionRef: payment.transactionRef,
        paymentDate: payment.paymentDate,
        amountPaid: payment.amount,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
      },
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        totalInvoiceAmount: updatedInvoice.amount,
        totalAmountPaid: newTotalPaid,
        outstandingBalance: newOutstandingBalance,
        status: newStatus,
      },
    };
  });
};

const getLedgerReconciliation = async () => {
  const [invoices, payments] = await Promise.all([
    prisma.feeInvoice.findMany({ select: { id: true, amount: true, status: true } }),
    prisma.feePayment.findMany({ select: { id: true, amount: true, invoiceId: true } }),
  ]);

  const totalInvoiced = Number(invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2));
  const totalCollected = Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  const totalOutstanding = Number(Math.max(0, totalInvoiced - totalCollected).toFixed(2));

  const countPaid = invoices.filter((i) => i.status === 'PAID').length;
  const countPartial = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
  const countPending = invoices.filter((i) => i.status === 'PENDING').length;

  return {
    summary: {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      isReconciled: Math.abs(totalInvoiced - (totalCollected + totalOutstanding)) < 0.01,
      invoiceCounts: {
        total: invoices.length,
        paid: countPaid,
        partiallyPaid: countPartial,
        pending: countPending,
      },
      totalPaymentsRecorded: payments.length,
    },
  };
};

module.exports = {
  getAllFeeStructures,
  createFeeStructure,
  generateInvoices,
  getAllInvoices,
  getInvoiceById,
  recordPayment,
  getLedgerReconciliation,
};
