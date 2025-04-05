import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  // Get the headers as a plain object
  const headerObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headerObj[key] = value;
  });

  // Extract the Svix headers
  const svix_id = headerObj['svix-id'];
  const svix_timestamp = headerObj['svix-timestamp'];
  const svix_signature = headerObj['svix-signature'];

  // If there are no headers, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response('Missing webhook secret', { status: 500 });
  }

  // Create a new Webhook instance with the secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID: ${id} and type: ${eventType}`);
  console.log('Webhook body:', body);

  // Handle the different event types
  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

// Handle user created event
async function handleUserCreated(data: any) {
  // Extract the relevant data from the webhook
  const { id, email_addresses, first_name, last_name } = data;
  
  if (!id || !email_addresses || !email_addresses[0]) {
    throw new Error('Missing required user data');
  }

  const primaryEmail = email_addresses[0].email_address;
  const name = `${first_name || ''} ${last_name || ''}`.trim() || null;

  // Create the user in the database
  await prisma.user.create({
    data: {
      clerkId: id,
      email: primaryEmail,
      name,
    },
  });

  console.log(`User created: ${id}`);
}

// Handle user updated event
async function handleUserUpdated(data: any) {
  // Extract the relevant data from the webhook
  const { id, email_addresses, first_name, last_name } = data;
  
  if (!id) {
    throw new Error('Missing required user data');
  }

  // Find the user in the database
  const user = await prisma.user.findUnique({
    where: {
      clerkId: id,
    },
  });

  // If the user doesn't exist, create them
  if (!user) {
    return handleUserCreated(data);
  }

  // Update the user in the database
  const primaryEmail = email_addresses && email_addresses[0] ? email_addresses[0].email_address : undefined;
  const name = first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : undefined;

  await prisma.user.update({
    where: {
      clerkId: id,
    },
    data: {
      ...(primaryEmail && { email: primaryEmail }),
      ...(name && { name }),
    },
  });

  console.log(`User updated: ${id}`);
}

// Handle user deleted event
async function handleUserDeleted(data: any) {
  // Extract the relevant data from the webhook
  const { id } = data;
  
  if (!id) {
    throw new Error('Missing required user data');
  }

  // Delete the user from the database
  await prisma.user.delete({
    where: {
      clerkId: id,
    },
  });

  console.log(`User deleted: ${id}`);
}
