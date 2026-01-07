import { writeBatch, doc } from 'firebase/firestore';
import { partners } from './data';
import { mockCommissions } from './commission-data';
import { mockPayments } from './payment-data';

export async function seedAllData(firestore) {
  if (!firestore) return;

  console.log("Starting to seed data...");

  // Seed Partners
  const partnersBatch = writeBatch(firestore);
  partners.forEach((partner) => {
    const docRef = doc(firestore, "partners", partner.id);
    partnersBatch.set(docRef, partner);
  });
  await partnersBatch.commit();
  console.log("Partners data seeded successfully!");

  // Seed Commissions
  const commissionsBatch = writeBatch(firestore);
  mockCommissions.forEach((commission) => {
    // Usamos el ID de la comisión como ID del documento para evitar duplicados.
    const docRef = doc(firestore, "commissions", commission.id);
    commissionsBatch.set(docRef, commission);
  });
  await commissionsBatch.commit();
  console.log("Commissions data seeded successfully!");

  // Seed Payments
  const paymentsBatch = writeBatch(firestore);
  mockPayments.forEach((payment) => {
    // Usamos el ID del pago como ID del documento.
    const docRef = doc(firestore, "payments", payment.id);
    paymentsBatch.set(docRef, payment);
  });
  await paymentsBatch.commit();
  console.log("Payments data seeded successfully!");
}
