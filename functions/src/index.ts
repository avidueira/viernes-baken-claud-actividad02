import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

export const onReportCreate = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (reportSnap, context) => {
    // For debugging purposes we will log the report data
    const reportData = reportSnap.data(); // would be a good idea to cast as Report
    console.log('New report created:', reportData);
    // Report was created, so now we will add same extra data
    await reportSnap.ref.update({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

export const onExpenseCreate = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (expenseSnap, context) => {
    // For debugging purposes we will log the expense data
    const expenseData = expenseSnap.data(); // would be a good idea to cast as Expense
    console.log('New expense created:', expenseData);
    // Expense was created, so now we will add same extra data
    await expenseSnap.ref.update({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // But also we need to update report's total and update time
    // We know that each expense is associated with a reportId, let's find it and update it
    // First we check that a reportId was provided
    if (!expenseData.reportId) {
      console.warn('No reportId was provided!!11!!!');
      return;
    }

    const db = admin.firestore();
    const reportRef = db.collection('reports').doc(expenseData.reportId); // this is only the reference, it could exist or not D:
    const reportSnap = await reportRef.get();
    // We can check if there it is a report by reportId
    if (!reportSnap.exists) {
      console.warn(`No report found with reportId ${expenseData.reportId}`);
      return;
    }

    // It's all good, we can now "safely" update the report
    const reportData = reportSnap.data() || {}; // would be a good idea to cast as Report
    await reportRef.update({
      total: reportData.total + expenseData.amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
