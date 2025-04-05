import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Function to get or create a user in the database based on Clerk authentication
export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error('Not authenticated');
  }

  // Check if user exists in database
  let dbUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  // If user doesn't exist, create a new one
  if (!dbUser) {
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new Error('User does not have a primary email address');
    }

    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: primaryEmail.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
      },
    });
  }

  return dbUser;
}

// Function to get the current user from the database
export async function getCurrentUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  return dbUser;
}
