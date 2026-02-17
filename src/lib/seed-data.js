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
    const docRef = doc(firestore, "commissions", commission.id);
    commissionsBatch.set(docRef, commission);
  });
  await commissionsBatch.commit();
  console.log("Commissions data seeded successfully!");

  // Seed Payments
  const paymentsBatch = writeBatch(firestore);
  mockPayments.forEach((payment) => {
    const docRef = doc(firestore, "payments", payment.id);
    paymentsBatch.set(docRef, payment);
  });
  await paymentsBatch.commit();
  console.log("Payments data seeded successfully!");

  // Seed Example Rule
  const rulesBatch = writeBatch(firestore);
  const exampleRule = {
    id: 'rule-example-001',
    name: 'Política de Transparencia y Prevención de Fraude v1.2',
    type: 'anti_fraud',
    description: 'Marco normativo para la protección de la integridad financiera del ecosistema SaaS.',
    content: `1. El partner se compromete a no utilizar técnicas de "cookie stuffing" o redirecciones automáticas.
2. Las ventas deben ser validadas por el cliente final mediante el pago efectivo de la primera suscripción.
3. El uso de marcas registradas del SaaS en dominios externos está estrictamente prohibido sin autorización previa por escrito.
4. La violación de estas normas conlleva la revocación inmediata de las comisiones del periodo vigente.`
  };
  const ruleRef = doc(firestore, "rules", exampleRule.id);
  rulesBatch.set(ruleRef, exampleRule);
  await rulesBatch.commit();
  console.log("Example rule seeded successfully!");
}
