/**
 * MockSession - A utility class for mocking Next Auth sessions in tests
 */
export class MockSession {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  
  expires: string;

  constructor(
    userId: string, 
    userName: string | null, 
    userEmail: string, 
    userImage?: string | null
  ) {
    this.user = {
      id: userId,
      name: userName,
      email: userEmail,
      image: userImage || null,
    };
    
    // Set expiry to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    this.expires = date.toISOString();
  }
} 