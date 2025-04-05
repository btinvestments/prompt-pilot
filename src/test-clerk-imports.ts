// This file is just to test Clerk imports
import * as ClerkNamespace from '@clerk/nextjs';
import * as ClerkServerNamespace from '@clerk/nextjs/server';

console.log('Clerk namespace exports:', Object.keys(ClerkNamespace));
console.log('Clerk server namespace exports:', Object.keys(ClerkServerNamespace));
