import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {
  const contacts = [
    { firstName: 'Alice', lastName: 'Smith', phoneNumber: '123-456-7890', email: 'alice.smith@example.com' },
    { firstName: 'Bob', lastName: 'Johnson', phoneNumber: '234-567-8901', email: 'bob.johnson@example.com' },
    { firstName: 'Carol', lastName: 'Williams', phoneNumber: '345-678-9012', email: 'carol.williams@example.com' },
    { firstName: 'David', lastName: 'Brown', phoneNumber: '456-789-0123', email: 'david.brown@example.com' },
    { firstName: 'Eve', lastName: 'Jones', phoneNumber: '567-890-1234', email: 'eve.jones@example.com' },
    { firstName: 'Frank', lastName: 'Garcia', phoneNumber: '678-901-2345', email: 'frank.garcia@example.com' },
    { firstName: 'Grace', lastName: 'Miller', phoneNumber: '789-012-3456', email: 'grace.miller@example.com' },
    { firstName: 'Henry', lastName: 'Davis', phoneNumber: '890-123-4567', email: 'henry.davis@example.com' },
    { firstName: 'Ivy', lastName: 'Rodriguez', phoneNumber: '901-234-5678', email: 'ivy.rodriguez@example.com' },
    { firstName: 'Jack', lastName: 'Martinez', phoneNumber: '012-345-6789', email: 'jack.martinez@example.com' },
    { firstName: 'Kate', lastName: 'Hernandez', phoneNumber: '111-222-3333', email: 'kate.hernandez@example.com' },
    { firstName: 'Leo', lastName: 'Lopez', phoneNumber: '222-333-4444', email: 'leo.lopez@example.com' },
    { firstName: 'Mia', lastName: 'Gonzalez', phoneNumber: '333-444-5555', email: 'mia.gonzalez@example.com' },
    { firstName: 'Noah', lastName: 'Wilson', phoneNumber: '444-555-6666', email: 'noah.wilson@example.com' },
    { firstName: 'Olivia', lastName: 'Anderson', phoneNumber: '555-666-7777', email: 'olivia.anderson@example.com' },
    { firstName: 'Paul', lastName: 'Thomas', phoneNumber: '666-777-8888', email: 'paul.thomas@example.com' },
    { firstName: 'Quinn', lastName: 'Taylor', phoneNumber: '777-888-9999', email: 'quinn.taylor@example.com' },
    { firstName: 'Ruby', lastName: 'Moore', phoneNumber: '888-999-0000', email: 'ruby.moore@example.com' },
    { firstName: 'Sam', lastName: 'Jackson', phoneNumber: '999-000-1111', email: 'sam.jackson@example.com' },
    { firstName: 'Tina', lastName: 'Martin', phoneNumber: '000-111-2222', email: 'tina.martin@example.com' }
  ]

  await prisma.contact.createMany({ data: contacts, skipDuplicates: true })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

