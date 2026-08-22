import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        try {
          await dbConnect();
        } catch (dbErr) {
          if (dbErr.message.includes('bad auth') || dbErr.message.includes('authentication failed')) {
            throw new Error('Database Auth Error: Invalid MongoDB credentials in .env.local (MONGODB_URI)');
          }
          throw dbErr;
        }

        const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
        if (!user || !user.password) {
          throw new Error('Invalid email or password.');
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          organizationDetails: user.organizationDetails,
          vehicleCapacity: user.vehicleCapacity,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.organizationDetails = user.organizationDetails;
        token.vehicleCapacity = user.vehicleCapacity;
      }

      if (trigger === 'update' && session) {
        if (session.isVerified !== undefined) token.isVerified = session.isVerified;
        if (session.organizationDetails) token.organizationDetails = session.organizationDetails;
        if (session.vehicleCapacity !== undefined) token.vehicleCapacity = session.vehicleCapacity;
        if (session.name) token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isVerified = token.isVerified;
        session.user.organizationDetails = token.organizationDetails;
        session.user.vehicleCapacity = token.vehicleCapacity;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
};
